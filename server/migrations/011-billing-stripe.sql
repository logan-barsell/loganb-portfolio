-- Billing: Stripe customers, invoices, project domain + payment caches, hosting_plan on proposals, domain_name on inquiries

ALTER TABLE clients ADD COLUMN stripe_customer_id TEXT;

ALTER TABLE inquiries ADD COLUMN domain_name TEXT;

ALTER TABLE proposals ADD COLUMN hosting_plan TEXT NOT NULL DEFAULT 'hosting_39';

ALTER TABLE projects ADD COLUMN domain_name TEXT;
ALTER TABLE projects ADD COLUMN domain_status TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE projects ADD COLUMN design_payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE projects ADD COLUMN hosting_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE projects ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE projects ADD COLUMN started_at TEXT;
ALTER TABLE projects ADD COLUMN started_by TEXT;

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  proposal_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('deposit', 'balance', 'full', 'hosting')),
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'paid', 'void')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  label TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_price_id TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (proposal_id) REFERENCES proposals (id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices (project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_kind ON invoices (kind);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_stripe_customer_id
  ON clients (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Backfill hosting_plan from existing cents
UPDATE proposals SET hosting_plan = CASE
  WHEN hosting_monthly_cents IS NULL THEN 'none'
  WHEN hosting_monthly_cents <= 1000 THEN 'hosting_10'
  WHEN hosting_monthly_cents <= 2500 THEN 'hosting_25'
  ELSE 'hosting_39'
END;
