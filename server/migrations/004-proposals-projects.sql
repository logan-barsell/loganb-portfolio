CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  inquiry_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent')),
  summary TEXT,
  scope TEXT,
  deliverables TEXT,
  exclusions TEXT,
  timeline_summary TEXT,
  payment_terms TEXT,
  revision_limit TEXT,
  design_amount_cents INTEGER NOT NULL,
  hosting_monthly_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'usd',
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries (id),
  UNIQUE (inquiry_id, version)
);

CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals (client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_inquiry_id ON proposals (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals (created_at DESC);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  proposal_id TEXT NOT NULL UNIQUE,
  inquiry_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (proposal_id) REFERENCES proposals (id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries (id)
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
