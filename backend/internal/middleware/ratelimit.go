package middleware

import (
	"context"
	"net/http"
	"smurl/internal/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type RateLimiter struct {
	rdb *redis.Client
}

func NewRateLimiter(rdb *redis.Client) *RateLimiter {
	return &RateLimiter{
		rdb: rdb,
	}
}

func (r *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()

		ip := c.ClientIP()
		key := "rate_limit:" + ip

		count, err := r.rdb.Incr(ctx, key).Result()
		if err != nil {
			utils.Error(c, http.StatusInternalServerError, "rate limiter unavailable")
			c.Abort()
			return
		}

		if count == 1 {
			r.rdb.Expire(ctx, key, 30*time.Second)
		}

		if count > 5 {
			utils.Error(c, http.StatusTooManyRequests, "too many requests")
			c.Abort()
			return
		}

		c.Next()
	}
}
