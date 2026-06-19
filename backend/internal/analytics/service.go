package analytics

import (
	"context"
	"time"
)

type Service interface {
	TrackClick(ctx context.Context, urlID int64, ipAddress string, userAgent string) error
	GetAnalytics(ctx context.Context, urlID int64) ([]*ClickAnalytics, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) TrackClick(ctx context.Context, urlID int64, ipAddress string, userAgent string) error {
	analytics := &ClickAnalytics{
		URLID:     urlID,
		ClickedAt: time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}
	return s.repo.LogClick(ctx, analytics)
}

func (s *service) GetAnalytics(ctx context.Context, urlID int64) ([]*ClickAnalytics, error) {
	return s.repo.GetAnalyticsByURLID(ctx, urlID)
}
