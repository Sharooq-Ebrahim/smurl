package analytics

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/v1/analytics/:url_id", h.GetStats)
	r.POST("/api/v1/analytics", h.TrackClick)
}

func (h *Handler) GetStats(c *gin.Context) {
	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id format"})
		return
	}

	stats, err := h.service.GetStats(c.Request.Context(), urlID)
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
