package utils

import (
	"github.com/gin-gonic/gin"
)

func Success(c *gin.Context, status int, message string, data any) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
	})
}

func RenderHTML(c *gin.Context, status int, page []byte) {
	c.Data(status, "text/html; charset=utf-8", page)
}
