const { getDb } = require('../../db');
const { maybeActivateProject } = require('./invoices');

let lastTickUtcDay = null;

/**
 * Lightweight daily tick: activate on_hold projects whose kickoff date has arrived
 * (and payment rules already pass). Safe to call on every request — runs at most
 * once per UTC calendar day.
 */
function runActivationTickIfNeeded(database = getDb()) {
  const today = new Date().toISOString().slice(0, 10);
  if (lastTickUtcDay === today) return;
  lastTickUtcDay = today;

  const rows = database
    .prepare(
      `SELECT id FROM projects
       WHERE status = 'on_hold'
         AND (started_by IS NULL OR started_by != 'admin')`
    )
    .all();

  for (const row of rows) {
    try {
      maybeActivateProject(row.id, database);
    } catch (err) {
      console.error('Activation tick failed for project', row.id, err);
    }
  }
}

function startActivationTickInterval() {
  runActivationTickIfNeeded();
  // Check hourly; internal guard ensures work runs once per UTC day.
  const handle = setInterval(() => runActivationTickIfNeeded(), 60 * 60 * 1000);
  if (typeof handle.unref === 'function') handle.unref();
  return handle;
}

module.exports = { runActivationTickIfNeeded, startActivationTickInterval };
