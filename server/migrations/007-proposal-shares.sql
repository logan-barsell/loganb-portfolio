CREATE TABLE IF NOT EXISTS proposal_shares (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (proposal_id) REFERENCES proposals (id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_shares_proposal_id ON proposal_shares (proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_shares_expires_at ON proposal_shares (expires_at);
