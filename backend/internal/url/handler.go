package url

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/v1/shorten", h.CreateShortLink)
	r.GET("/:code", h.RedirectURL)
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

	originalURL, err := h.service.GetOriginalURL(c.Request.Context(), code)

	if err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "short link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve original url"})
		return
	}

	c.Redirect(http.StatusFound, originalURL)
}
