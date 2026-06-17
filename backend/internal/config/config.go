package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBURL string
}

func LoadConfig() *Config {
	err := godotenv.Load("./../.env")
	if err != nil {
		log.Println("Error loading .env file")
	}

	return &Config{
		DBURL: os.Getenv("DATABASE_URL"),
	}
}
