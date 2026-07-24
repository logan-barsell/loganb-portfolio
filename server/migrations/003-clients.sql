CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  business_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email ON clients (email);

ALTER TABLE inquiries ADD COLUMN client_id TEXT REFERENCES clients (id);

CREATE INDEX IF NOT EXISTS idx_inquiries_client_id ON inquiries (client_id);
