package url

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"smurl/internal/analytics"
	"smurl/internal/middleware"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
)

type Handler struct {
	service          Service
	analyticsService analytics.Service
	redis            *redis.Client
	kafkaProducer    *kafka.Writer
}

func NewHandler(service Service, redis *redis.Client, producer *kafka.Writer) *Handler {
	return &Handler{service: service, redis: redis, kafkaProducer: producer}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/:code", h.RedirectURL)
	r.GET("/api/v1/qr/:code", h.GetQRCode)

	urlGroup := r.Group("/api/v1")
	urlGroup.Use(middleware.JWTAuth())
	{
		urlGroup.POST("/shorten", h.CreateShortLink)
		urlGroup.GET("/shorten", h.GetAllURLs)
		urlGroup.PUT("/shorten/:code", h.UpdateShortLink)
		urlGroup.DELETE("/shorten/:code", h.DeleteShortLink)
	}
}

func (h *Handler) CreateShortLink(c *gin.Context) {
	var req CreateShortLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if userID, exists := c.Get("user_id"); exists {
		req.UserID = userID.(int64)
	}

	resp, err := h.service.CreateShortLink(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *Handler) RedirectURL(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "short code is required"})
		return
	}

	key := "url:v1:" + code
	ctx := c.Request.Context()
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	cachedURL, err := h.redis.Get(ctx, key).Result()
	if err == nil && cachedURL != "" {
		var cachedData CachedLink
		if err := json.Unmarshal([]byte(cachedURL), &cachedData); err != nil {
			log.Printf("Failed to unmarshal cache data: %v", err)
		}

		event := map[string]interface{}{
			"short_code": code,
			"url_id":     cachedData.ID,
			"user_id":    cachedData.UserID,
			"ip":         ip,
			"user_agent": ua,
			"timestamp":  time.Now().UTC().Format(time.RFC3339),
		}
		eventBytes, _ := json.Marshal(event)

		if pErr := h.kafkaProducer.WriteMessages(context.Background(), kafka.Message{
			Key:   []byte(code),
			Value: eventBytes,
		}); pErr != nil {
			log.Printf("Failed to produce click event for %s: %v", code, pErr)
		}

		c.Redirect(http.StatusFound, cachedData.OriginalURL)
		return
	}

	link, err := h.service.GetShortLink(ctx, code)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve original url"})
		return
	}

	cacheData := CachedLink{
		ID:          link.ID,
		UserID:      link.UserID,
		OriginalURL: link.OriginalURL,
	}

	log.Printf("Cache Data: %v", cacheData)
	cacheJSON, err := json.Marshal(cacheData)
	if err != nil {
		log.Printf("Failed to marshal cache data: %v", err)
	}

	if err = h.redis.Set(ctx, key, cacheJSON, 0).Err(); err != nil {
		log.Printf("Failed to set cache for %s: %v", key, err)
	}

	event := map[string]interface{}{
		"short_code": code,
		"url_id":     link.ID,
		"user_id":    link.UserID,
		"ip":         ip,
		"user_agent": ua,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	}
	eventBytes, _ := json.Marshal(event)

	if pErr := h.kafkaProducer.WriteMessages(context.Background(), kafka.Message{
		Key:   []byte(code),
		Value: eventBytes,
	}); pErr != nil {
		log.Printf("Failed to produce click event for %s: %v", code, pErr)
	}
	c.Redirect(http.StatusFound, link.OriginalURL)
}

func (h *Handler) GetAllURLs(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	links, err := h.service.GetAllURLs(c.Request.Context(), userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve all urls"})
		return
	}
	c.JSON(http.StatusOK, links)
}

func (h *Handler) UpdateShortLink(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "short code is required"})
		return
	}

	var req UpdateShortLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err := h.service.UpdateShortLink(c.Request.Context(), code, req, userID.(int64))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found or unauthorized"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update short link"})
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	c.JSON(http.StatusOK, gin.H{"message": "short link updated successfully"})
}

func (h *Handler) DeleteShortLink(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "short code is required"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err := h.service.DeleteShortLink(c.Request.Context(), code, userID.(int64))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found or unauthorized"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete short link"})
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	c.JSON(http.StatusOK, gin.H{"message": "short link deleted successfully"})
}

func (h *Handler) GetQRCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "short code is required"})
		return
	}

	qrCode, err := h.service.GetQRCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve qr code"})
		return
	}

	c.Data(http.StatusOK, "image/png", qrCode)
}
