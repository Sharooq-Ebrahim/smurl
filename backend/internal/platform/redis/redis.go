package redis

import (
	"context"
	"log"
	"smurl/internal/config"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg *config.Config) (*redis.Client, error) {
	r := redis.NewClient(&redis.Options{
		Addr:     cfg.REDIS_ADDR,
		Username: cfg.REDIS_USER,
		Password: cfg.REDIS_PASSWORD,
		DB:       cfg.REDIS_DB,
	})

	err := r.Ping(context.Background()).Err()
	if err != nil {
		return nil, err
	}
	log.Println("Redis connected")
	return r, nil
}
