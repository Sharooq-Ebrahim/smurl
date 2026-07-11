package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"smurl/internal/analytics"
	"smurl/internal/auth"
	"smurl/internal/config"
	"smurl/internal/health"
	"smurl/internal/middleware"
	"smurl/internal/platform/db"
	"smurl/internal/platform/kafka"
	"smurl/internal/platform/migration"
	"smurl/internal/platform/redis"
	"smurl/internal/url"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	err := kafka.PingKafka(cfg)
	if err != nil {
		log.Fatalf("Connection to Kafka failed: %v", err)
	}

	producer := kafka.NewProducer(cfg.KAFKA_BROKERS, cfg.KAFKA_TOPIC)
	defer producer.Close()

	consumer := kafka.NewConsumer(cfg.KAFKA_BROKERS, cfg.KAFKA_TOPIC, cfg.KAFKA_GROUP_ID)
	defer consumer.Close()

	dbConn, err := db.ConnectToDB(cfg)
	if err != nil {
		log.Fatalf("Connection to DB failed: %v", err)
	}
	defer dbConn.Close()

	redisClient, err := redis.NewRedisClient(cfg)
	if err != nil {
		log.Fatalf("Connection to Redis failed: %v", err)
	}
	defer redisClient.Close()

	log.Println("Allowed origins: ", cfg.ALLOWED_ORIGINS)

	// err = redisClient.FlushAll(context.Background()).Err()
	// if err != nil {
	// 	log.Fatalf("Failed to flush Redis: %v", err)
	// } else {
	// 	log.Println("Redis flushed successfully")
	// }

	migration.Run(cfg)

	baseURL := cfg.BASE_URL

	analyticsRepo := analytics.NewRepository(dbConn)
	analyticsService := analytics.NewService(analyticsRepo)

	analyticsWorker := analytics.NewConsumerWorker(consumer, analyticsService)
	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()
	analyticsWorker.Start(workerCtx)

	analyticsHandler := analytics.NewHandler(analyticsService)

	urlRepo := url.NewRepository(dbConn)
	urlService := url.NewService(urlRepo, baseURL)
	urlHandler := url.NewHandler(urlService, redisClient, producer)

	authRepo := auth.NewRepository(dbConn)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	healthHandler := health.NewHandler()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.ALLOWED_ORIGINS,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	rateLimiter := middleware.NewRateLimiter(redisClient)
	r.Use(rateLimiter.Middleware())

	urlHandler.RegisterRoutes(r)
	analyticsHandler.RegisterRoutes(r)
	authHandler.RegisterRoutes(r)
	healthHandler.RegisterRoutes(r)

	// r.Run(":" + cfg.SERVER_PORT)

	server := &http.Server{
		Addr:    ":" + cfg.SERVER_PORT,
		Handler: r,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed: ", err)
		}
	}()

	log.Println("Server started on port " + cfg.SERVER_PORT)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	<-stop

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Println("Server forced to shutdown:", err)
	}
	log.Println("Server exited")

}
