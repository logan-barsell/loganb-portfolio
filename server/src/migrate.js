const { getDb, runMigrations, closeDb } = require('./db');

try {
  runMigrations(getDb());
  console.log('Migrations applied successfully.');
  closeDb();
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  closeDb();
  process.exit(1);
}
