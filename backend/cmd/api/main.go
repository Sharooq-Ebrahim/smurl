package main

import (
	"log"
	"net/http"

	"smurl/internal/config"
	"smurl/internal/platform/db"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	dbConn, err := db.ConnectToDB(cfg)
	if err != nil {
		log.Fatalf("Connection to DB failed: %v", err)
	}
	defer dbConn.Close()

	r := gin.Default()
	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})
	r.Run(":" + cfg.SERVER_PORT)

	log.Println("Server started on port " + cfg.SERVER_PORT)
}
