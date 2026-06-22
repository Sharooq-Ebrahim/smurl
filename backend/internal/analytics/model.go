package analytics

import "time"

type ClickAnalytics struct {
	ID        int64     `json:"id"`
	URLID     int64     `json:"url_id"`
	ClickedAt time.Time `json:"clicked_at"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
}

type TrackClickRequest struct {
	URLID     int64  `json:"url_id"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
}

type URLStats struct {
	URLID       int64 `json:"url_id"`
	TotalClicks int64 `json:"total_clicks"`
	DailyClicks int64 `json:"daily_clicks"`
}

type URLTimelineItem struct {
	URLID  int64  `json:"url_id"`
	Date   string `json:"date"`
	Clicks int64  `json:"clicks"`
}
