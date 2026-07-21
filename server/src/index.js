const { createApp } = require('./app');
const { config, assertProductionConfig } = require('./config');
const { getDb, runMigrations, closeDb } = require('./db');
const { ensureUploadDir } = require('./utils/uploads');

assertProductionConfig();
ensureUploadDir();
runMigrations(getDb());

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  console.log(`loganb-api listening on http://${config.host}:${config.port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
