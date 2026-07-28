-- Admin unlock for client hosting checkout (site ready to launch)

ALTER TABLE projects ADD COLUMN ready_for_launch_at TEXT;
