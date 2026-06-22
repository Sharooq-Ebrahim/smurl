package analytics

import (
	"context"
	"database/sql"
	"time"
)

type Repository interface {
	LogClick(ctx context.Context, analytics *ClickAnalytics) error
	GetClicksByURLID(ctx context.Context, urlID int64, userID int64) ([]*ClickAnalytics, error)
	GetUrlTimeline(ctx context.Context, urlID int64, days int, userID int64) ([]*URLTimelineItem, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) LogClick(ctx context.Context, analytics *ClickAnalytics) error {
	query := `
		INSERT INTO click_analytics (url_id, clicked_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	if analytics.ClickedAt.IsZero() {
		analytics.ClickedAt = time.Now()
	}
	err := r.db.QueryRowContext(
		ctx,
		query,
		analytics.URLID,
		analytics.ClickedAt,
		analytics.IPAddress,
		analytics.UserAgent,
	).Scan(&analytics.ID)

	return err
}

func (r *repository) GetClicksByURLID(ctx context.Context, urlID int64, userID int64) ([]*ClickAnalytics, error) {
	query := `
		SELECT c.id, c.url_id, c.clicked_at, c.ip_address, c.user_agent
		FROM click_analytics c
		JOIN short_links s ON c.url_id = s.id
		WHERE c.url_id = $1 AND s.user_id = $2
		ORDER BY c.clicked_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, urlID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var analytics []*ClickAnalytics
	for rows.Next() {
		a := &ClickAnalytics{}
		err := rows.Scan(
			&a.ID,
			&a.URLID,
			&a.ClickedAt,
			&a.IPAddress,
			&a.UserAgent,
		)
		if err != nil {
			return nil, err
		}
		analytics = append(analytics, a)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return analytics, nil
}

func (r *repository) GetUrlTimeline(ctx context.Context, urlID int64, days int, userID int64) ([]*URLTimelineItem, error) {
	query := `
		SELECT TO_CHAR(c.clicked_at, 'YYYY-MM-DD') as date, COUNT(c.id) as clicks
		FROM click_analytics c
		JOIN short_links s ON c.url_id = s.id
		WHERE c.url_id = $1 AND s.user_id = $2 AND c.clicked_at >= $3
		GROUP BY date
		ORDER BY date ASC
	`
	rows, err := r.db.QueryContext(ctx, query, urlID, userID, time.Now().AddDate(0, 0, -days))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var timeline []*URLTimelineItem
	for rows.Next() {
		t := &URLTimelineItem{URLID: urlID}
		err := rows.Scan(&t.Date, &t.Clicks)
		if err != nil {
			return nil, err
		}
		timeline = append(timeline, t)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return timeline, nil
}
