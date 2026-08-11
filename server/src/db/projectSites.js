const { getDb } = require('./client');

function getProjectSite(projectId, database = getDb()) {
  return database.prepare(`SELECT * FROM project_sites WHERE project_id = ?`).get(projectId) || null;
}

function upsertProjectSite(
  projectId,
  { provisionStatus, lastError, nginxSite, wwwRoot, provisionedAt } = {},
  database = getDb()
) {
  const existing = getProjectSite(projectId, database);
  const nextStatus = provisionStatus ?? existing?.provision_status ?? 'none';
  const nextError = lastError === undefined ? existing?.last_error ?? null : lastError;
  const nextNginx = nginxSite === undefined ? existing?.nginx_site ?? null : nginxSite;
  const nextRoot = wwwRoot === undefined ? existing?.www_root ?? null : wwwRoot;
  const nextProvisioned =
    provisionedAt === undefined ? existing?.provisioned_at ?? null : provisionedAt;

  database
    .prepare(
      `INSERT INTO project_sites (
         project_id, provision_status, last_error, nginx_site, www_root, provisioned_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(project_id) DO UPDATE SET
         provision_status = excluded.provision_status,
         last_error = excluded.last_error,
         nginx_site = excluded.nginx_site,
         www_root = excluded.www_root,
         provisioned_at = excluded.provisioned_at,
         updated_at = datetime('now')`
    )
    .run(projectId, nextStatus, nextError, nextNginx, nextRoot, nextProvisioned);

  return getProjectSite(projectId, database);
}

module.exports = {
  getProjectSite,
  upsertProjectSite,
};
