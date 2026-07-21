-- Add business stage for inquiries (read-only in admin UI for this phase)
ALTER TABLE inquiries ADD COLUMN stage TEXT NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_inquiries_stage ON inquiries (stage);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  credential_fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);
