ALTER TABLE attachments ADD COLUMN uploaded_by TEXT NOT NULL DEFAULT 'client';
ALTER TABLE attachments ADD COLUMN client_visible INTEGER NOT NULL DEFAULT 1;
