package analytics

import (
	"context"
	"smurl/internal/subscription"
	"strings"
	"time"
)

type Service interface {
	TrackClick(ctx context.Context, urlID int64, ipAddress string, userAgent string) error
	GetStats(ctx context.Context, urlID int64, userID int64) (*URLStats, error)
	GetUrlTimeline(ctx context.Context, urlID int64, days int, userID int64, userPlan string) ([]*URLTimelineItem, error)
	GetUrlDevices(ctx context.Context, urlID int64, userID int64, userPlan string) ([]*URLDeviceItem, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) TrackClick(ctx context.Context, urlID int64, ipAddress string, userAgent string) error {
	device := "desktop"
	uaLower := strings.ToLower(userAgent)
	if strings.Contains(uaLower, "mobi") || strings.Contains(uaLower, "android") || strings.Contains(uaLower, "iphone") {
		device = "mobile"
	} else if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") {
		device = "tablet"
	}

	analytics := &ClickAnalytics{
		URLID:     urlID,
		ClickedAt: time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Device:    device,
	}
	return s.repo.LogClick(ctx, analytics)
}

func (s *service) GetStats(ctx context.Context, urlID int64, userID int64) (*URLStats, error) {
	clicks, err := s.repo.GetClicksByURLID(ctx, urlID, userID)
	if err != nil {
		return nil, err
	}

	stats := URLStats{URLID: urlID}
	now := time.Now()
	for _, a := range clicks {
		stats.TotalClicks++
		if a.ClickedAt.Year() == now.Year() && a.ClickedAt.YearDay() == now.YearDay() {
			stats.DailyClicks++
		}
	}

	return &stats, nil
}

func (s *service) GetUrlTimeline(ctx context.Context, urlID int64, days int, userID int64, userPlan string) ([]*URLTimelineItem, error) {
	if !subscription.CanViewAdvancedAnalytics(userPlan) {
		return nil, subscription.ErrPremiumRequired
	}
	return s.repo.GetUrlTimeline(ctx, urlID, days, userID)
}

func (s *service) GetUrlDevices(ctx context.Context, urlID int64, userID int64, userPlan string) ([]*URLDeviceItem, error) {
	if !subscription.CanViewAdvancedAnalytics(userPlan) {
		return nil, subscription.ErrPremiumRequired
	}
	return s.repo.GetUrlDevices(ctx, urlID, userID)
}
