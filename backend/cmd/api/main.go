package main

import (
	"log"

	"smurl/internal/config"
	"smurl/internal/platform/db"
)

func main() {
	cfg := config.LoadConfig()

	dbConn, err := db.ConnectToDB(cfg)
	if err != nil {
		log.Fatalf("Connection to DB failed: %v", err)
	}
	defer dbConn.Close()

	log.Println("Successfully connected to the database")
}
