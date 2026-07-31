#!/usr/bin/env node
/**
 * Wipe local (or deliberately confirmed prod) SQLite + uploads, then re-migrate.
 *
 * Also cancels Stripe subscriptions and deletes Stripe customers referenced in
 * the DB (unless --skip-stripe or Stripe is not configured).
 *
 * Usage (local / development):
 *   npm run db:reset
 *   npm run db:reset -- --skip-stripe
 *
 * Usage (production — stop the API first):
 *   CONFIRM_DB_RESET=YES npm run db:reset -- --i-know-what-im-doing
 *
 * Live Stripe keys also require:
 *   CONFIRM_STRIPE_RESET=YES
 * (or pass --skip-stripe to only wipe SQLite/uploads)
 *
 * Does NOT delete Stripe Prices, Products, or webhook endpoints.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { config } = require('../src/config');
const { getDb, closeDb, runMigrations } = require('../src/db');

const args = new Set(process.argv.slice(2));
const forceFlag = args.has('--i-know-what-im-doing');
const skipStripe = args.has('--skip-stripe');

function assertAllowed() {
  if (config.env !== 'production') return;
  if (forceFlag && process.env.CONFIRM_DB_RESET === 'YES') return;
  console.error('Production database reset refused.');
  console.error('Stop the API, then run:');
  console.error('  CONFIRM_DB_RESET=YES npm run db:reset -- --i-know-what-im-doing');
  console.error('Add CONFIRM_STRIPE_RESET=YES if using a live Stripe secret key.');
  process.exit(1);
}

/**
 * Refuse to wipe while another process (usually `npm run dev` / loganb-api)
 * still has the SQLite file open — otherwise the API keeps serving old data
 * from its open file descriptor.
 */
function assertDbNotInUse(dbPath) {
  const targets = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].filter((p) => fs.existsSync(p));
  if (!targets.length) return;

  let output = '';
  try {
    output = execFileSync('lsof', ['-t', ...targets], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    // lsof exits 1 when nothing matches — that means the files are free.
    if (err.status === 1 || err.status === 0) return;
    console.warn('Could not check whether the database is in use (lsof):', err.message);
    return;
  }

  const pids = [
    ...new Set(
      String(output)
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];
  if (!pids.length) return;

  console.error('Database is still open in another process. Stop the API and retry.');
  console.error(`  Holding PIDs: ${pids.join(', ')}`);
  console.error('  Local: stop `npm run dev` / `npm start` in server/');
  console.error('  Prod:  sudo systemctl stop loganb-api');
  process.exit(1);
}

function listDistinct(database, sql) {
  try {
    return database
      .prepare(sql)
      .all()
      .map((row) => row.id)
      .filter(Boolean);
  } catch (err) {
    console.warn('Could not query Stripe IDs (table/column missing?):', err.message);
    return [];
  }
}

async function cleanupStripe(database) {
  if (skipStripe) {
    console.log('Skipping Stripe cleanup (--skip-stripe).');
    return;
  }
  if (!config.stripeSecretKey || config.stripeSecretKey.startsWith('sk_test_replace')) {
    console.log('Skipping Stripe cleanup (Stripe not configured).');
    return;
  }

  const isLive = config.stripeSecretKey.startsWith('sk_live_');
  if (isLive && process.env.CONFIRM_STRIPE_RESET !== 'YES') {
    throw new Error(
      'Live Stripe key detected. Set CONFIRM_STRIPE_RESET=YES to cancel/delete Stripe objects, or pass --skip-stripe.'
    );
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(config.stripeSecretKey);

  const subscriptionIds = listDistinct(
    database,
    `SELECT DISTINCT stripe_subscription_id AS id
     FROM projects
     WHERE stripe_subscription_id IS NOT NULL AND TRIM(stripe_subscription_id) != ''`
  );
  const customerIds = listDistinct(
    database,
    `SELECT DISTINCT stripe_customer_id AS id
     FROM clients
     WHERE stripe_customer_id IS NOT NULL AND TRIM(stripe_customer_id) != ''`
  );

  console.log(
    `Stripe cleanup (${isLive ? 'live' : 'test'}): ${subscriptionIds.length} subscription(s), ${customerIds.length} customer(s).`
  );

  for (const id of subscriptionIds) {
    try {
      await stripe.subscriptions.cancel(id);
      console.log('  Canceled subscription', id);
    } catch (err) {
      console.warn('  Subscription cancel skipped/failed', id, '—', err.message);
    }
  }

  for (const id of customerIds) {
    try {
      await stripe.customers.del(id);
      console.log('  Deleted customer', id);
    } catch (err) {
      console.warn('  Customer delete skipped/failed', id, '—', err.message);
    }
  }
}

function wipeSqliteFiles(dbPath) {
  for (const p of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (!fs.existsSync(p)) continue;
    fs.unlinkSync(p);
    console.log('Removed', p);
  }
}

function wipeUploads(uploadPath) {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('Created empty uploads dir', uploadPath);
    return;
  }
  for (const name of fs.readdirSync(uploadPath)) {
    fs.rmSync(path.join(uploadPath, name), { recursive: true, force: true });
  }
  console.log('Cleared uploads', uploadPath);
}

async function main() {
  assertAllowed();

  console.log('Resetting database at:', config.databasePath);
  console.log('Resetting uploads at:', config.uploadPath);

  assertDbNotInUse(config.databasePath);

  if (fs.existsSync(config.databasePath)) {
    try {
      const database = getDb();
      await cleanupStripe(database);
    } finally {
      closeDb();
    }
  } else {
    console.log('No database file yet; skipping Stripe cleanup.');
  }

  // Re-check after closing our own handle (API may have started meanwhile).
  assertDbNotInUse(config.databasePath);

  wipeSqliteFiles(config.databasePath);
  wipeUploads(config.uploadPath);

  runMigrations(getDb());
  console.log('Migrations applied successfully.');
  closeDb();
  console.log('Database reset complete.');
  console.log('Restart the API when you are ready (npm run dev).');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Database reset failed:', error.message || error);
    try {
      closeDb();
    } catch {
      // ignore
    }
    process.exit(1);
  });
}

module.exports = { main };