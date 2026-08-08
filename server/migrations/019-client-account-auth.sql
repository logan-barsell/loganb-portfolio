-- Move portal authentication from projects to clients.
ALTER TABLE clients ADD COLUMN portal_password_hash TEXT;
ALTER TABLE clients ADD COLUMN portal_password_set_at TEXT;

CREATE TABLE IF NOT EXISTS client_auth_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  project_id TEXT,
  purpose TEXT NOT NULL CHECK (purpose IN ('setup', 'password_reset')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_client_purpose
  ON client_auth_tokens (client_id, purpose);
CREATE INDEX IF NOT EXISTS idx_client_auth_tokens_expires_at
  ON client_auth_tokens (expires_at);

-- Keep each client's most recently set project password.
UPDATE clients
SET
  portal_password_hash = (
    SELECT p.portal_password_hash
    FROM projects p
    WHERE p.client_id = clients.id
      AND p.portal_password_hash IS NOT NULL
    ORDER BY
      CASE WHEN p.portal_password_set_at IS NULL THEN 1 ELSE 0 END,
      p.portal_password_set_at DESC,
      p.updated_at DESC,
      p.id DESC
    LIMIT 1
  ),
  portal_password_set_at = (
    SELECT p.portal_password_set_at
    FROM projects p
    WHERE p.client_id = clients.id
      AND p.portal_password_hash IS NOT NULL
    ORDER BY
      CASE WHEN p.portal_password_set_at IS NULL THEN 1 ELSE 0 END,
      p.portal_password_set_at DESC,
      p.updated_at DESC,
      p.id DESC
    LIMIT 1
  );

-- Preserve unexpired setup links only when the client still needs initial setup.
INSERT OR IGNORE INTO client_auth_tokens (
  token_hash,
  client_id,
  project_id,
  purpose,
  created_at,
  expires_at
)
SELECT
  p.portal_setup_token_hash,
  p.client_id,
  p.id,
  'setup',
  datetime('now'),
  p.portal_setup_expires_at
FROM projects p
WHERE p.client_id IS NOT NULL
  AND p.portal_setup_token_hash IS NOT NULL
  AND p.portal_setup_expires_at IS NOT NULL
  AND (
    SELECT c.portal_password_hash
    FROM clients c
    WHERE c.id = p.client_id
  ) IS NULL
  AND datetime(p.portal_setup_expires_at) > datetime('now');

UPDATE projects
SET
  portal_password_hash = NULL,
  portal_password_set_at = NULL,
  portal_setup_token_hash = NULL,
  portal_setup_expires_at = NULL;

-- Existing sessions are project-scoped and cannot be safely promoted.
DROP TABLE client_sessions;

CREATE TABLE client_sessions (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

CREATE INDEX idx_client_sessions_client_id ON client_sessions (client_id);
CREATE INDEX idx_client_sessions_expires_at ON client_sessions (expires_at);
