-- Expand proposal statuses for accept / revise / decline; store revision requests.
CREATE TABLE proposals_new (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  inquiry_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'revision_requested', 'accepted', 'declined')),
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
  decline_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries (id)
);

INSERT INTO proposals_new (
  id, client_id, inquiry_id, status,
  summary, scope, deliverables, exclusions, timeline_summary,
  payment_terms, revision_limit, design_amount_cents, hosting_monthly_cents,
  currency, sent_at, created_at, updated_at
)
SELECT
  id, client_id, inquiry_id, status,
  summary, scope, deliverables, exclusions, timeline_summary,
  payment_terms, revision_limit, design_amount_cents, hosting_monthly_cents,
  currency, sent_at, created_at, updated_at
FROM proposals;

DROP TABLE proposals;
ALTER TABLE proposals_new RENAME TO proposals;

CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals (client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_inquiry_id ON proposals (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals (created_at DESC);

CREATE TABLE IF NOT EXISTS proposal_revision_requests (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (proposal_id) REFERENCES proposals (id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_revision_requests_proposal_id
  ON proposal_revision_requests (proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_revision_requests_created_at
  ON proposal_revision_requests (created_at DESC);
