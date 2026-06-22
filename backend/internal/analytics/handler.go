package analytics

import (
	"net/http"
	"strconv"

	"smurl/internal/middleware"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/v1/analytics", h.TrackClick)

	analyticsGroup := r.Group("/api/v1/analytics")
	analyticsGroup.Use(middleware.JWTAuth())
	{
		analyticsGroup.GET("/:url_id", h.GetStats)
		analyticsGroup.GET("/:url_id/timeline", h.GetUrlTimeline)
		analyticsGroup.GET("/:url_id/devices", h.GetUrlDevices)
	}
}

func (h *Handler) GetStats(c *gin.Context) {
	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id format"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	stats, err := h.service.GetStats(c.Request.Context(), urlID, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve analytics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *Handler) TrackClick(c *gin.Context) {
	var req TrackClickRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.TrackClick(c.Request.Context(), req.URLID, req.IPAddress, req.UserAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to track click"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "click tracked successfully"})
}

func (h *Handler) GetUrlTimeline(c *gin.Context) {

	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id format"})
		return
	}

	days := c.Query("days")

	if days == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "days is required"})
		return
	}

	parsedDays, err := strconv.Atoi(days)
	if err != nil || parsedDays <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or negative days format"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	timeline, err := h.service.GetUrlTimeline(c.Request.Context(), urlID, parsedDays, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve url timeline"})
		return
	}

	c.JSON(http.StatusOK, timeline)
}

func (h *Handler) GetUrlDevices(c *gin.Context) {

	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id format"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	devices, err := h.service.GetUrlDevices(c.Request.Context(), urlID, userID.(int64))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve url devices"})
		return
	}

	c.JSON(http.StatusOK, devices)

}
