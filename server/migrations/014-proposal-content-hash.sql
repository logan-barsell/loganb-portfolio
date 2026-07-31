-- Fingerprint of commercial proposal fields at last send (revise vs plain resend).
ALTER TABLE proposals ADD COLUMN last_sent_content_hash TEXT;
