package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.GET("/health", h.HealthCheck)
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.String(http.StatusOK, "OK")
}
