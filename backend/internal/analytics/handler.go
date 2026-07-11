package analytics

import (
	"errors"
	"net/http"
	"smurl/internal/subscription"
	"smurl/internal/utils"
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
		utils.Error(c, http.StatusBadRequest, "invalid url id format")
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	stats, err := h.service.GetStats(c.Request.Context(), urlID, userID.(int64))
	if err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve analytics")
		return
	}

	utils.Success(c, http.StatusOK, "Analytics retrieved successfully", stats)
}

func (h *Handler) TrackClick(c *gin.Context) {
	var req TrackClickRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.TrackClick(c.Request.Context(), req.URLID, req.IPAddress, req.UserAgent); err != nil {
		utils.Error(c, http.StatusInternalServerError, "failed to track click")
		return
	}

	utils.Success(c, http.StatusCreated, "click tracked successfully", nil)
}

func (h *Handler) GetUrlTimeline(c *gin.Context) {

	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid url id format")
		return
	}

	days := c.Query("days")

	if days == "" {
		utils.Error(c, http.StatusBadRequest, "days is required")
		return
	}

	parsedDays, err := strconv.Atoi(days)
	if err != nil || parsedDays <= 0 {
		utils.Error(c, http.StatusBadRequest, "invalid or negative days format")
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

	timeline, err := h.service.GetUrlTimeline(c.Request.Context(), urlID, parsedDays, userID.(int64), userPlan)
	if err != nil {
		if errors.Is(err, subscription.ErrPremiumRequired) {
			utils.Error(c, http.StatusForbidden, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve url timeline")
		return
	}

	utils.Success(c, http.StatusOK, "Timeline retrieved successfully", timeline)
}

func (h *Handler) GetUrlDevices(c *gin.Context) {

	urlIDStr := c.Param("url_id")
	urlID, err := strconv.ParseInt(urlIDStr, 10, 64)
	if err != nil {
		utils.Error(c, http.StatusBadRequest, "invalid url id format")
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

	devices, err := h.service.GetUrlDevices(c.Request.Context(), urlID, userID.(int64), userPlan)

	if err != nil {
		if errors.Is(err, subscription.ErrPremiumRequired) {
			utils.Error(c, http.StatusForbidden, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to retrieve url devices")
		return
	}

	utils.Success(c, http.StatusOK, "Devices retrieved successfully", devices)

}
