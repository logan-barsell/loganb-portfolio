-- Payment schedule enum, kickoff date, integer revision limit.
-- Derive payment terms label from payment_schedule (drop free-text payment_terms).

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
  payment_schedule TEXT NOT NULL DEFAULT 'deposit_50_50'
    CHECK (payment_schedule IN ('deposit_50_50', 'full_upfront', 'full_before_launch')),
  kickoff_date TEXT,
  revision_limit INTEGER,
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
  payment_schedule, kickoff_date, revision_limit,
  design_amount_cents, hosting_monthly_cents,
  currency, sent_at, decline_reason, created_at, updated_at
)
SELECT
  id, client_id, inquiry_id, status,
  summary, scope, deliverables, exclusions, timeline_summary,
  CASE
    WHEN lower(COALESCE(payment_terms, '')) LIKE '%100%'
      AND (
        lower(payment_terms) LIKE '%before start%'
        OR lower(payment_terms) LIKE '%upfront%'
        OR lower(payment_terms) LIKE '%before work%'
      )
      THEN 'full_upfront'
    WHEN lower(COALESCE(payment_terms, '')) LIKE '%100%'
      AND lower(payment_terms) LIKE '%launch%'
      THEN 'full_before_launch'
    ELSE 'deposit_50_50'
  END,
  NULL,
  CASE
    WHEN revision_limit IS NULL OR trim(revision_limit) = '' THEN 2
    WHEN lower(revision_limit) LIKE '%unlimited%' THEN NULL
    WHEN CAST(revision_limit AS INTEGER) > 0 THEN CAST(revision_limit AS INTEGER)
    ELSE 2
  END,
  design_amount_cents, hosting_monthly_cents,
  currency, sent_at, decline_reason, created_at, updated_at
FROM proposals;

DROP TABLE proposals;
ALTER TABLE proposals_new RENAME TO proposals;

CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals (client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_inquiry_id ON proposals (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals (created_at DESC);
