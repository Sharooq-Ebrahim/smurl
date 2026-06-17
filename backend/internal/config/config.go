package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DB_HOST     string
	DB_PORT     string
	DB_USER     string
	DB_PASSWORD string
	DB_NAME     string
	DB_SSLMODE  string

	SERVER_PORT string
}

func LoadConfig() *Config {
	err := godotenv.Load("./../.env")
	if err != nil {
		log.Println("Error loading .env file")
	}

	return &Config{
		DB_HOST:     os.Getenv("DB_HOST"),
		DB_PORT:     os.Getenv("DB_PORT"),
		DB_USER:     os.Getenv("DB_USER"),
		DB_PASSWORD: os.Getenv("DB_PASSWORD"),
		DB_NAME:     os.Getenv("DB_NAME"),
		DB_SSLMODE:  os.Getenv("DB_SSLMODE"),
		SERVER_PORT: os.Getenv("SERVER_PORT"),
	}
}
