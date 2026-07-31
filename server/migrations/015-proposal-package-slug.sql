-- Commercial package on the proposal (inquiry.package_slug remains intake-only).
ALTER TABLE proposals ADD COLUMN package_slug TEXT;

UPDATE proposals
SET package_slug = (
  SELECT i.package_slug FROM inquiries i WHERE i.id = proposals.inquiry_id
)
WHERE package_slug IS NULL;
