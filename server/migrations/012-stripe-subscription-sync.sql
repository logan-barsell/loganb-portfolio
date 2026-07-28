-- Stripe subscription mirror fields + webhook idempotency

ALTER TABLE projects ADD COLUMN stripe_hosting_price_id TEXT;
ALTER TABLE projects ADD COLUMN hosting_cancel_at_period_end INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN hosting_current_period_end TEXT;
ALTER TABLE projects ADD COLUMN hosting_canceled_at TEXT;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_stripe_subscription_id
  ON projects (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
