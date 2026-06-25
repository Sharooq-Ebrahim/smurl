package main

import (
	"context"
	"log"

	"smurl/internal/analytics"
	"smurl/internal/auth"
	"smurl/internal/config"
	"smurl/internal/health"
	"smurl/internal/platform/db"
	"smurl/internal/platform/kafka"
	"smurl/internal/platform/migration"
	"smurl/internal/platform/redis"
	"smurl/internal/url"

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
	analyticsWorker.Start(context.Background())

	analyticsHandler := analytics.NewHandler(analyticsService)

	urlRepo := url.NewRepository(dbConn)
	urlService := url.NewService(urlRepo, baseURL)
	urlHandler := url.NewHandler(urlService, redisClient, producer)

	authRepo := auth.NewRepository(dbConn)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	healthHandler := health.NewHandler()

	r := gin.Default()

	urlHandler.RegisterRoutes(r)
	analyticsHandler.RegisterRoutes(r)
	authHandler.RegisterRoutes(r)
	healthHandler.RegisterRoutes(r)

	r.Run(":" + cfg.SERVER_PORT)

	log.Println("Server started on port " + cfg.SERVER_PORT)
}
