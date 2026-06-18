CREATE TABLE short_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    short_code VARCHAR(50) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_short_links_user_id ON short_links(user_id);
CREATE INDEX idx_short_links_short_code ON short_links(short_code);