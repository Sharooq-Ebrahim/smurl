package analytics

import "time"

type ClickAnalytics struct {
	ID        int64     `json:"id"`
	URLID     int64     `json:"url_id"`
	ClickedAt time.Time `json:"clicked_at"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
}

type InsertAnalyticsRequest struct {
	URLID     int64  `json:"url_id"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
}
