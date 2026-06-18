package url

import "time"

type ShortLink struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"user_id"`
	ShortCode   string     `json:"short_code"`
	OriginalURL string     `json:"original_url"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"-"`
}

type CreateShortLinkRequest struct {
	UserID      int64  `json:"user_id" `
	OriginalURL string `json:"original_url"`
}

type CreateShortLinkResponse struct {
	ShortCode   string `json:"short_code"`
	OriginalURL string `json:"original_url"`
	ShortURL    string `json:"short_url"`
}
