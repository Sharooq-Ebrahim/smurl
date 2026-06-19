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
	r.GET("/api/v1/analytics/:url_id", h.GetAnalytics)
	r.POST("/api/v1/analytics", h.InsertAnalytics)
}

func (h *Handler) GetAnalytics(c *gin.Context) {
	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id format"})
		return
	}

	analytics, err := h.service.GetAnalytics(c.Request.Context(), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve analytics"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

func (h *Handler) InsertAnalytics(c *gin.Context) {
	var req InsertAnalyticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.TrackClick(c.Request.Context(), req.URLID, req.IPAddress, req.UserAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to insert analytics"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "analytics inserted successfully"})
}
