package url

import (
	"context"
	"database/sql"
	"errors"
)

type Repository interface {
	Create(ctx context.Context, link *ShortLink) error
	GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error)
	GetAll(ctx context.Context, userID int64) ([]*ShortLink, error)
	Update(ctx context.Context, shortCode string, req UpdateShortLinkRequest, userID int64) error
	UpdateStatus(ctx context.Context, shortCode string, isActive bool, userID int64) error
	Delete(ctx context.Context, shortCode string, userID int64) error
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, link *ShortLink) error {
	query := `
		INSERT INTO short_links (user_id, short_code, original_url, expires_at, is_active)
		VALUES ($1, $2, $3, $4, true)
		RETURNING id, created_at, updated_at, is_active
	`
	err := r.db.QueryRowContext(
		ctx,
		query,
		link.UserID,
		link.ShortCode,
		link.OriginalURL,
		link.ExpiresAt,
	).Scan(&link.ID, &link.CreatedAt, &link.UpdatedAt, &link.IsActive)

	return err
}

func (r *repository) GetByShortCode(ctx context.Context, shortCode string) (*ShortLink, error) {

	query := `
		SELECT id, user_id, short_code, original_url, expires_at, created_at, updated_at, is_active
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
		&link.IsActive,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return link, nil
}

func (r *repository) GetAll(ctx context.Context, userID int64) ([]*ShortLink, error) {
	query := `
		SELECT id, user_id, short_code, original_url, expires_at, created_at, updated_at, is_active
		FROM short_links
		WHERE user_id = $1 AND deleted_at IS NULL
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*ShortLink
	for rows.Next() {
		link := &ShortLink{}
		err := rows.Scan(
			&link.ID,
			&link.UserID,
			&link.ShortCode,
			&link.OriginalURL,
			&link.ExpiresAt,
			&link.CreatedAt,
			&link.UpdatedAt,
			&link.IsActive,
		)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return links, nil
}

func (r *repository) Update(ctx context.Context, shortCode string, req UpdateShortLinkRequest, userID int64) error {
	var query string
	var args []interface{}

	if req.IsActive != nil {
		query = `
			UPDATE short_links
			SET original_url = $1, is_active = $2, expires_at = $3, updated_at = NOW()
			WHERE short_code = $4 AND user_id = $5 AND deleted_at IS NULL
		`
		args = []interface{}{req.OriginalURL, *req.IsActive, req.ExpiresAt, shortCode, userID}
	} else {
		query = `
			UPDATE short_links
			SET original_url = $1, expires_at = $2, updated_at = NOW()
			WHERE short_code = $3 AND user_id = $4 AND deleted_at IS NULL
		`
		args = []interface{}{req.OriginalURL, req.ExpiresAt, shortCode, userID}
	}

	res, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *repository) UpdateStatus(ctx context.Context, shortCode string, isActive bool, userID int64) error {
	query := `
		UPDATE short_links
		SET is_active = $1, updated_at = NOW()
		WHERE short_code = $2 AND user_id = $3 AND deleted_at IS NULL
	`
	res, err := r.db.ExecContext(ctx, query, isActive, shortCode, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *repository) Delete(ctx context.Context, shortCode string, userID int64) error {
	query := `
		UPDATE short_links
		SET deleted_at = NOW()
		WHERE short_code = $1 AND user_id = $2 AND deleted_at IS NULL
	`
	res, err := r.db.ExecContext(ctx, query, shortCode, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
