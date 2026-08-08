const { randomUUID } = require('crypto');
const { getDb } = require('./client');
const { escapeLike } = require('./helpers');

function normalizeClientEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function findClientByEmail(email, database = getDb()) {
  const normalized = normalizeClientEmail(email);
  if (!normalized) return null;
  return database.prepare('SELECT * FROM clients WHERE email = ?').get(normalized);
}

function createClient({ id, name, email, phone, businessName }, database = getDb()) {
  const clientId = id || randomUUID();
  const normalizedEmail = normalizeClientEmail(email);
  database
    .prepare(
      `INSERT INTO clients (id, name, email, phone, business_name)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(clientId, name, normalizedEmail, phone ?? null, businessName);
  return database.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
}

function setInquiryClientId(inquiryId, clientId, database = getDb()) {
  database.prepare('UPDATE inquiries SET client_id = ? WHERE id = ?').run(clientId, inquiryId);
}

/**
 * Project: find-or-create client, return id.
 * Contact: return existing client id or null (orphan).
 * Never overwrites existing client fields.
 */
function resolveClientForInquiry({ type, name, email, phone, businessName }, database = getDb()) {
  const existing = findClientByEmail(email, database);
  if (existing) return existing.id;

  if (type !== 'project') return null;

  const client = createClient(
    {
      name,
      email,
      phone,
      businessName,
    },
    database
  );
  return client.id;
}

function backfillClients(database = getDb()) {
  const hasClientColumn = database
    .prepare(`PRAGMA table_info(inquiries)`)
    .all()
    .some((col) => col.name === 'client_id');
  if (!hasClientColumn) return;

  const projects = database
    .prepare(
      `SELECT id, name, email, phone, business_name
       FROM inquiries
       WHERE type = 'project' AND client_id IS NULL
       ORDER BY created_at ASC, id ASC`
    )
    .all();

  const attachProject = database.transaction((rows) => {
    for (const row of rows) {
      const email = normalizeClientEmail(row.email);
      if (!email || !row.name || !row.business_name) continue;

      let client = findClientByEmail(email, database);
      if (!client) {
        client = createClient(
          {
            name: row.name,
            email,
            phone: row.phone,
            businessName: row.business_name,
          },
          database
        );
      }
      setInquiryClientId(row.id, client.id, database);
    }
  });
  attachProject(projects);

  const contacts = database
    .prepare(
      `SELECT id, email
       FROM inquiries
       WHERE type = 'contact' AND client_id IS NULL
       ORDER BY created_at ASC, id ASC`
    )
    .all();

  const attachContacts = database.transaction((rows) => {
    for (const row of rows) {
      const client = findClientByEmail(row.email, database);
      if (!client) continue;
      setInquiryClientId(row.id, client.id, database);
    }
  });
  attachContacts(contacts);
}

const CLIENT_SORT_COLUMNS = {
  name: 'c.name',
  email: 'c.email',
  business_name: 'c.business_name',
};

function listAdminClients({
  search = '',
  sort = 'name',
  dir = 'asc',
  page = 1,
  pageSize = 20,
} = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  const q = String(search || '').trim();
  if (q) {
    where.push(
      `(c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = CLIENT_SORT_COLUMNS[sort] || CLIENT_SORT_COLUMNS.name;
  const sortDir = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(`SELECT COUNT(*) AS count FROM clients c ${whereSql}`)
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.phone,
         c.business_name,
         (
           SELECT i.stage
           FROM inquiries i
           WHERE i.client_id = c.id
           ORDER BY i.created_at DESC, i.id DESC
           LIMIT 1
         ) AS latest_stage
       FROM clients c
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}, c.id ${sortDir}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: safePageSize, offset });

  return {
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

function getAdminClientById(id) {
  const database = getDb();
  const client = database.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) return null;

  const inquiries = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, created_at
       FROM inquiries
       WHERE client_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(id);

  const proposals = database
    .prepare(
      `SELECT
         p.id, p.inquiry_id, p.status, p.design_amount_cents, p.hosting_monthly_cents,
         p.currency, p.package_slug, p.sent_at, p.accepted_at, p.declined_at,
         p.created_at, p.updated_at,
         i.business_name AS inquiry_business_name,
         i.name AS inquiry_name,
         proj.status AS project_status
       FROM proposals p
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       LEFT JOIN projects proj ON proj.proposal_id = p.id
       WHERE p.client_id = ?
       ORDER BY p.created_at DESC, p.id DESC`
    )
    .all(id);

  const projects = database
    .prepare(
      `SELECT
         p.id, p.name, p.status, p.proposal_id, p.inquiry_id, p.created_at, p.updated_at,
         pr.package_slug AS proposal_package_slug,
         pr.kickoff_date AS proposal_kickoff_date,
         i.business_name AS inquiry_business_name,
         c.name AS client_name,
         c.business_name AS client_business_name
       FROM projects p
       LEFT JOIN proposals pr ON pr.id = p.proposal_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.client_id = ?
       ORDER BY p.created_at DESC, p.id DESC`
    )
    .all(id);

  return { ...client, inquiries, proposals, projects };
}

module.exports = {
  normalizeClientEmail,
  findClientByEmail,
  createClient,
  setInquiryClientId,
  resolveClientForInquiry,
  backfillClients,
  listAdminClients,
  getAdminClientById,
};
