-- 1:1 site provision state per project (nginx/TLS on the hosting droplet).
-- Independent of Stripe hosting_status and ownership domain_status.

CREATE TABLE IF NOT EXISTS project_sites (
  project_id TEXT PRIMARY KEY,
  provision_status TEXT NOT NULL DEFAULT 'none'
    CHECK (provision_status IN ('none', 'dns_waiting', 'provisioning', 'live', 'failed')),
  last_error TEXT,
  nginx_site TEXT,
  www_root TEXT,
  provisioned_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE INDEX IF NOT EXISTS idx_project_sites_status ON project_sites (provision_status);
