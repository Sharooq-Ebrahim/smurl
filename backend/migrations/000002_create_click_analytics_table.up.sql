CREATE TABLE click_analytics (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL
);

CREATE INDEX idx_click_analytics_url_id ON click_analytics(url_id);
