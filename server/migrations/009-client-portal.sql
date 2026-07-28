-- Client project portal: password + one-time setup token + sessions
ALTER TABLE projects ADD COLUMN portal_password_hash TEXT;
ALTER TABLE projects ADD COLUMN portal_setup_token_hash TEXT;
ALTER TABLE projects ADD COLUMN portal_setup_expires_at TEXT;
ALTER TABLE projects ADD COLUMN portal_password_set_at TEXT;

CREATE TABLE IF NOT EXISTS client_sessions (
  token_hash TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_project_id ON client_sessions (project_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_at ON client_sessions (expires_at);
