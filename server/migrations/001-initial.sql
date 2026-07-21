CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('contact', 'project')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  phone TEXT,
  business_name TEXT,
  package_slug TEXT,
  website_goals TEXT,
  current_website TEXT,
  requested_features TEXT,
  inspiration_links TEXT,
  domain_info TEXT,
  branding_notes TEXT,
  content_readiness TEXT,
  timeline TEXT,
  budget TEXT,
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sent', 'failed')),
  notification_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries (type);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries (email);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_inquiry_id ON attachments (inquiry_id);
