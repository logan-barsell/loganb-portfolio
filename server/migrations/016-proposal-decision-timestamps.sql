-- Track when a proposal was accepted or declined for admin card dates.
ALTER TABLE proposals ADD COLUMN accepted_at TEXT;
ALTER TABLE proposals ADD COLUMN declined_at TEXT;

-- Best-effort backfill for existing rows.
UPDATE proposals
SET accepted_at = COALESCE(sent_at, updated_at, created_at)
WHERE status = 'accepted' AND accepted_at IS NULL;

UPDATE proposals
SET declined_at = COALESCE(updated_at, sent_at, created_at)
WHERE status = 'declined' AND declined_at IS NULL;
