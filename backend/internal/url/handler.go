package url

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"smurl/internal/analytics"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	service          Service
	analyticsService analytics.Service
	redis            *redis.Client
}

func NewHandler(service Service, analyticsService analytics.Service, redis *redis.Client) *Handler {
	return &Handler{service: service, analyticsService: analyticsService, redis: redis}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/v1/shorten", h.CreateShortLink)
	r.PUT("/api/v1/shorten/:code", h.UpdateShortLink)
	r.DELETE("/api/v1/shorten/:code", h.DeleteShortLink)
	r.GET("/:code", h.RedirectURL)
	r.GET("/api/v1/all", h.GetAllURLs)
}

func (h *Handler) CreateShortLink(c *gin.Context) {
	var req CreateShortLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
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

		if err := h.analyticsService.TrackClick(context.Background(), cachedData.ID, ip, ua); err != nil {
			log.Printf("Failed to track click for %s: %v", key, err)
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

	if err := h.analyticsService.TrackClick(context.Background(), link.ID, ip, ua); err != nil {
		log.Printf("Failed to track click for %s: %v", key, err)
	}

	c.Redirect(http.StatusFound, link.OriginalURL)
}

func (h *Handler) GetAllURLs(c *gin.Context) {
	links, err := h.service.GetAllURLs(c.Request.Context())
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

	err := h.service.UpdateShortLink(c.Request.Context(), code, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
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

	err := h.service.DeleteShortLink(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete short link"})
		return
	}

	key := "url:v1:" + code
	h.redis.Del(c.Request.Context(), key)

	c.JSON(http.StatusOK, gin.H{"message": "short link deleted successfully"})
}
