package url

import (
	"context"
	"database/sql"
	"errors"
)

type Repository interface {
	Create(ctx context.Context, link *ShortLink) error
	GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, link *ShortLink) error {
	query := `
		INSERT INTO short_links (user_id, short_code, original_url, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(
		ctx,
		query,
		link.UserID,
		link.ShortCode,
		link.OriginalURL,
		link.ExpiresAt,
	).Scan(&link.ID, &link.CreatedAt, &link.UpdatedAt)

	return err
}

func (r *repository) GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error) {

	query := `
		SELECT id, user_id, short_code, original_url, expires_at, created_at, updated_at
		FROM short_links
		WHERE short_code = $1 AND deleted_at IS NULL
	`
	link := &ShortLink{}

	err := r.db.QueryRowContext(ctx, query, shortCode).Scan(
		&link.ID,
		&link.UserID,
		&link.ShortCode,
		&link.OriginalURL,
		&link.ExpiresAt,
		&link.CreatedAt,
		&link.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Or a specific ErrNotFound
		}
		return nil, err
	}

	return link, nil
}
