package url

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"smurl/internal/analytics"
	"smurl/internal/middleware"
	"smurl/internal/subscription"
	"smurl/internal/utils"
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

//go:embed templates/disabled.html
var disabledURLHTML []byte

//go:embed templates/expired.html
var expiredURLHTML []byte

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
		urlGroup.PATCH("/shorten/:code/status", h.UpdateShortLinkStatus)
		urlGroup.DELETE("/shorten/:code", h.DeleteShortLink)
	}
}

func (h *Handler) CreateShortLink(c *gin.Context) {
	var req CreateShortLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if userID, exists := c.Get("user_id"); exists {
		req.UserID = userID.(int64)
	}

	userPlan := ""
	if plan, exists := c.Get("user_plan"); exists {
		userPlan = plan.(string)
	}

	resp, err := h.service.CreateShortLink(c.Request.Context(), req, userPlan)
	if err != nil {
		if errors.Is(err, subscription.ErrPremiumRequired) {
			utils.Error(c, http.StatusForbidden, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Short link created successfully", resp)
}

func (h *Handler) RedirectURL(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		utils.Error(c, http.StatusBadRequest, "short code is required")
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

		if !cachedData.IsActive {
			utils.RenderHTML(c, http.StatusForbidden, disabledURLHTML)
			return
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

	link, err := h.service.GetShortLinkForRedirect(ctx, code)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			utils.Error(c, http.StatusNotFound, "short link not found")
			return
		}
		if errors.Is(err, ErrExpired) {
			utils.RenderHTML(c, http.StatusGone, expiredURLHTML)
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve original url")
		return
	}

	cacheData := CachedLink{
		ID:          link.ID,
		UserID:      link.UserID,
		OriginalURL: link.OriginalURL,
		IsActive:    link.IsActive,
	}

	log.Printf("Cache Data: %v", cacheData)
	cacheJSON, err := json.Marshal(cacheData)
	if err != nil {
		log.Printf("Failed to marshal cache data: %v", err)
	}

	var cacheTTL time.Duration
	if link.ExpiresAt != nil {
		cacheTTL = time.Until(*link.ExpiresAt)
		if cacheTTL <= 0 {
			cacheTTL = 1 * time.Millisecond
		}
	}

	if err = h.redis.Set(ctx, key, cacheJSON, cacheTTL).Err(); err != nil {
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

	if !link.IsActive {
		utils.RenderHTML(c, http.StatusForbidden, disabledURLHTML)
		return
	}

	c.Redirect(http.StatusFound, link.OriginalURL)
}

func (h *Handler) GetAllURLs(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	links, err := h.service.GetAllURLs(c.Request.Context(), userID.(int64))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve all urls")
		return
	}
	utils.Success(c, http.StatusOK, "URLs retrieved successfully", links)
}

func (h *Handler) UpdateShortLink(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		utils.Error(c, http.StatusBadRequest, "short code is required")
		return
	}

	var req UpdateShortLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	userPlan := ""
	if plan, exists := c.Get("user_plan"); exists {
		userPlan = plan.(string)
	}

	err := h.service.UpdateShortLink(c.Request.Context(), code, req, userID.(int64), userPlan)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			utils.Error(c, http.StatusNotFound, "short link not found or unauthorized")
			return
		}
		if errors.Is(err, subscription.ErrPremiumRequired) {
			utils.Error(c, http.StatusForbidden, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to update short link")
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	utils.Success(c, http.StatusOK, "short link updated successfully", nil)
}

func (h *Handler) DeleteShortLink(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		utils.Error(c, http.StatusBadRequest, "short code is required")
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	err := h.service.DeleteShortLink(c.Request.Context(), code, userID.(int64))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			utils.Error(c, http.StatusNotFound, "short link not found or unauthorized")
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to delete short link")
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	utils.Success(c, http.StatusOK, "short link deleted successfully", nil)
}

func (h *Handler) UpdateShortLinkStatus(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		utils.Error(c, http.StatusBadRequest, "short code is required")
		return
	}

	var req UpdateShortLinkStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	err := h.service.UpdateShortLinkStatus(c.Request.Context(), code, req.IsActive, userID.(int64))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			utils.Error(c, http.StatusNotFound, "short link not found")
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to update url status")
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	utils.Success(c, http.StatusOK, "URL status updated successfully.", gin.H{"is_active": req.IsActive})
}

func (h *Handler) GetQRCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		utils.Error(c, http.StatusBadRequest, "short code is required")
		return
	}

	userPlan := ""
	if plan, exists := c.Get("user_plan"); exists {
		userPlan = plan.(string)
	}

	qrCode, err := h.service.GetQRCode(c.Request.Context(), code, userPlan)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			utils.Error(c, http.StatusNotFound, "short link not found")
			return
		}
		if errors.Is(err, subscription.ErrPremiumRequired) {
			utils.Error(c, http.StatusForbidden, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve qr code")
		return
	}

	c.Data(http.StatusOK, "image/png", qrCode)
}
