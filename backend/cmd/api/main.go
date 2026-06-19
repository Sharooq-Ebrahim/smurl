package main

import (
	"log"
	"net/http"

	"smurl/internal/analytics"
	"smurl/internal/config"
	"smurl/internal/platform/db"
	"smurl/internal/platform/migration"
	"smurl/internal/url"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	dbConn, err := db.ConnectToDB(cfg)
	if err != nil {
		log.Fatalf("Connection to DB failed: %v", err)
	}
	defer dbConn.Close()

	migration.Run(cfg)

	baseURL := "http://localhost:" + cfg.SERVER_PORT

	analyticsRepo := analytics.NewRepository(dbConn)
	analyticsService := analytics.NewService(analyticsRepo)

	urlRepo := url.NewRepository(dbConn)
	urlService := url.NewService(urlRepo, baseURL)
	urlHandler := url.NewHandler(urlService, analyticsService)

	analyticsHandler := analytics.NewHandler(analyticsService)

	r := gin.Default()

	urlHandler.RegisterRoutes(r)
	analyticsHandler.RegisterRoutes(r)

	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})
	r.Run(":" + cfg.SERVER_PORT)

	log.Println("Server started on port " + cfg.SERVER_PORT)
}
