package auth

import (
	"errors"
	"net/http"
	"smurl/internal/utils"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", h.Register)
		authGroup.POST("/login", h.Login)
		authGroup.POST("/logout", h.Logout)
	}
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrEmailExists) {
			utils.Error(c, http.StatusConflict, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to register user")
		return
	}

	utils.Success(c, http.StatusCreated, "User registered successfully", resp)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCred) {
			utils.Error(c, http.StatusUnauthorized, err.Error())
			return
		}
		utils.Error(c, http.StatusInternalServerError, "failed to login")
		return
	}

	utils.Success(c, http.StatusOK, "Login successful", resp)
}

func (h *Handler) Logout(c *gin.Context) {
	utils.Success(c, http.StatusOK, "logged out successfully", nil)
}
