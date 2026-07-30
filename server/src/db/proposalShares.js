const { randomUUID, createHash, randomBytes } = require('crypto');
const { config } = require('../config');
const { getDb } = require('./client');
const { getProposalById } = require('./proposals');

function hashShareToken(rawToken) {
  return createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateShareToken() {
  return randomBytes(32).toString('base64url');
}

function sqliteExpiryFromNow(days) {
  const ms = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function deleteSharesForProposal(proposalId, database = getDb()) {
  database.prepare(`DELETE FROM proposal_shares WHERE proposal_id = ?`).run(proposalId);
}

/**
 * Invalidate prior shares and create a new one. Returns { id, rawToken, expiresAt }.
 * Pass precomputed rawToken/expiresAt to send email before persisting.
 */
function createProposalShare(proposalId, options = {}, database = getDb()) {
  const rawToken = options.rawToken || generateShareToken();
  const tokenHash = hashShareToken(rawToken);
  const id = randomUUID();
  const expiresAt = options.expiresAt || sqliteExpiryFromNow(config.proposalShareTtlDays);

  const run = database.transaction(() => {
    deleteSharesForProposal(proposalId, database);
    database
      .prepare(
        `INSERT INTO proposal_shares (id, proposal_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(id, proposalId, tokenHash, expiresAt);
  });
  run();

  return { id, rawToken, expiresAt };
}

function prepareProposalShareToken() {
  return {
    rawToken: generateShareToken(),
    expiresAt: sqliteExpiryFromNow(config.proposalShareTtlDays),
  };
}

function getProposalShareByRawToken(rawToken, database = getDb()) {
  const tokenHash = hashShareToken(rawToken);
  const share = database
    .prepare(`SELECT * FROM proposal_shares WHERE token_hash = ?`)
    .get(tokenHash);
  if (!share) return null;

  const expiresMs = Date.parse(
    /Z$|[+-]\d{2}:?\d{2}$/.test(share.expires_at)
      ? share.expires_at
      : `${String(share.expires_at).replace(' ', 'T')}Z`
  );
  if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) {
    return { expired: true, share };
  }

  const proposal = getProposalById(share.proposal_id, database);
  if (!proposal) return null;

  return { expired: false, share, proposal };
}

module.exports = {
  hashShareToken,
  createProposalShare,
  prepareProposalShareToken,
  deleteSharesForProposal,
  getProposalShareByRawToken,
};
