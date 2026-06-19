package url

import (
	"errors"
	"net/http"
	"smurl/internal/analytics"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service          Service
	analyticsService analytics.Service
}

func NewHandler(service Service, analyticsService analytics.Service) *Handler {
	return &Handler{service: service, analyticsService: analyticsService}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/v1/shorten", h.CreateShortLink)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create short link"})
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

	link, err := h.service.GetShortLink(c.Request.Context(), code)

	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve original url"})
		return
	}

	err = h.analyticsService.TrackClick(c.Request.Context(),
		link.ID,
		c.ClientIP(),
		c.Request.UserAgent(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to track click"})
		return
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
