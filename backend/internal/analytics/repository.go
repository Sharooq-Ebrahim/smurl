package analytics

import (
	"context"
	"database/sql"
	"time"
)

type Repository interface {
	LogClick(ctx context.Context, analytics *ClickAnalytics) error
	GetClicksByURLID(ctx context.Context, urlID int64) ([]*ClickAnalytics, error)
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

func (r *repository) GetClicksByURLID(ctx context.Context, urlID int64) ([]*ClickAnalytics, error) {
	query := `
		SELECT id, url_id, clicked_at, ip_address, user_agent
		FROM click_analytics
		WHERE url_id = $1
		ORDER BY clicked_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, urlID)
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
