package config

import (
	"log"
	"os"
	"strconv"

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

	REDIS_ADDR     string
	REDIS_USER     string
	REDIS_PASSWORD string
	REDIS_DB       int

	JWT_SECRET string
}

func LoadConfig() *Config {
	err := godotenv.Load("./../.env")

	if err != nil {
		log.Println("Error loading .env file")
	}

	redisDB, err := strconv.Atoi(os.Getenv("REDIS_DB"))
	if err != nil {
		log.Println("Invalid REDIS_DB, defaulting to 0")
		redisDB = 0
	}

	return &Config{
		DB_HOST:        os.Getenv("DB_HOST"),
		DB_PORT:        os.Getenv("DB_PORT"),
		DB_USER:        os.Getenv("DB_USER"),
		DB_PASSWORD:    os.Getenv("DB_PASSWORD"),
		DB_NAME:        os.Getenv("DB_NAME"),
		DB_SSLMODE:     os.Getenv("DB_SSLMODE"),
		SERVER_PORT:    os.Getenv("SERVER_PORT"),
		REDIS_ADDR:     os.Getenv("REDIS_ADDR"),
		REDIS_USER:     os.Getenv("REDIS_USER"),
		REDIS_PASSWORD: os.Getenv("REDIS_PASSWORD"),
		REDIS_DB:       redisDB,
		JWT_SECRET:     os.Getenv("JWT_SECRET"),
	}
}
