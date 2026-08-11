const dns = require('dns').promises;
const fs = require('fs');
const { spawn } = require('child_process');
const { config } = require('../config');
const { getDb } = require('../db');
const { getProjectById } = require('../db/projects');
const { upsertProjectSite } = require('../db/projectSites');
const { resolveHostingPlan } = require('../config/constants');
const { createHttpError } = require('../utils/normalize');

const RESERVED_HOSTS = new Set(['loganbarsell.com', 'www.loganbarsell.com']);
const HOSTNAME_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const SSH_TIMEOUT_MS = 90_000;
const MAX_ERROR_LEN = 2000;
const inflight = new Set();

function hostingTargetConfigured() {
  const { sshHost, publicIp } = config.clientHosting;
  return Boolean(sshHost && publicIp);
}

function normalizeHostname(raw) {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  s = s.replace(/[/].*$/, '');
  s = s.replace(/:\d+$/, '');
  s = s.replace(/\.$/, '');
  if (s.startsWith('www.')) s = s.slice(4);
  if (!s || !HOSTNAME_RE.test(s) || s.length > 255) return null;
  return s;
}

function truncateError(text) {
  const s = String(text || '').trim();
  if (!s) return 'Provisioning failed.';
  if (s.length <= MAX_ERROR_LEN) return s;
  return `${s.slice(0, MAX_ERROR_LEN - 1)}…`;
}

async function resolveHostIps(hostname) {
  const ips = [];
  try {
    ips.push(...(await dns.resolve4(hostname)));
  } catch (err) {
    if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND' && err.code !== 'ESERVFAIL') {
      throw err;
    }
  }
  try {
    ips.push(...(await dns.resolve6(hostname)));
  } catch (err) {
    if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND' && err.code !== 'ESERVFAIL') {
      throw err;
    }
  }
  return ips;
}

async function dnsPointsAtHosting(hostname, publicIp) {
  const ips = await resolveHostIps(hostname);
  return ips.includes(publicIp);
}

function runProvisionSsh(hostname) {
  const { sshHost, sshUser, sshKeyPath, sshPort, knownHostsPath } = config.clientHosting;

  return new Promise((resolve) => {
    const args = [
      '-i',
      sshKeyPath,
      '-p',
      String(sshPort),
      '-o',
      'BatchMode=yes',
      '-o',
      'IdentitiesOnly=yes',
      '-o',
      `UserKnownHostsFile=${knownHostsPath}`,
      '-o',
      'StrictHostKeyChecking=yes',
      '-o',
      'ConnectTimeout=15',
      `${sshUser}@${sshHost}`,
      'sudo',
      '/usr/local/sbin/provision-client-site',
      hostname,
    ];

    const child = spawn('ssh', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, SSH_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr: err.message || String(err),
        timedOut: false,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        code,
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

async function provisionProjectSite(projectId) {
  if (!hostingTargetConfigured()) {
    throw createHttpError(
      503,
      'Hosting target is not configured on this server.',
      'HOSTING_TARGET_NOT_CONFIGURED'
    );
  }

  const database = getDb();
  const project = getProjectById(projectId, database);
  if (!project) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }
  if (project.status === 'cancelled') {
    throw createHttpError(400, 'Cancelled projects cannot be provisioned.', 'PROJECT_CANCELLED');
  }

  const proposal = project.proposal_id
    ? database.prepare(`SELECT hosting_plan FROM proposals WHERE id = ?`).get(project.proposal_id)
    : null;
  const plan = resolveHostingPlan(proposal?.hosting_plan);
  if (plan.key === 'none') {
    throw createHttpError(
      400,
      'Provision Site is available for managed hosting plans.',
      'HOSTING_PLAN_REQUIRED'
    );
  }

  const hostname = normalizeHostname(project.domain_name);
  if (!hostname) {
    throw createHttpError(
      400,
      'Enter a valid domain name before provisioning (e.g. example.com).',
      'INVALID_DOMAIN'
    );
  }
  if (RESERVED_HOSTS.has(hostname)) {
    throw createHttpError(400, 'That hostname is reserved.', 'RESERVED_DOMAIN');
  }

  if (inflight.has(projectId)) {
    throw createHttpError(409, 'Provisioning is already in progress.', 'PROVISION_IN_PROGRESS');
  }
  inflight.add(projectId);

  try {
    if (hostname !== project.domain_name) {
      database
        .prepare(`UPDATE projects SET domain_name = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(hostname, projectId);
    }

    const publicIp = config.clientHosting.publicIp;
    let pointsHere = false;
    try {
      pointsHere = await dnsPointsAtHosting(hostname, publicIp);
    } catch (err) {
      upsertProjectSite(
        projectId,
        {
          provisionStatus: 'failed',
          lastError: truncateError(`DNS lookup failed: ${err.message || err}`),
        },
        database
      );
      return { status: 'failed' };
    }

    if (!pointsHere) {
      upsertProjectSite(
        projectId,
        {
          provisionStatus: 'dns_waiting',
          lastError: `Point the domain’s A record at ${publicIp}, then retry.`,
        },
        database
      );
      return { status: 'dns_waiting' };
    }

    upsertProjectSite(
      projectId,
      { provisionStatus: 'provisioning', lastError: null },
      database
    );

    const keyPath = config.clientHosting.sshKeyPath;
    if (!fs.existsSync(keyPath)) {
      upsertProjectSite(
        projectId,
        {
          provisionStatus: 'failed',
          lastError: `SSH key not found at ${keyPath}.`,
        },
        database
      );
      return { status: 'failed' };
    }

    const result = await runProvisionSsh(hostname);
    if (!result.ok) {
      const detail = result.timedOut
        ? 'Provisioning timed out waiting for the hosting droplet.'
        : result.stderr || result.stdout || `SSH exited with code ${result.code}.`;
      upsertProjectSite(
        projectId,
        { provisionStatus: 'failed', lastError: truncateError(detail) },
        database
      );
      return { status: 'failed' };
    }

    const provisionedAt = database.prepare(`SELECT datetime('now') AS t`).get().t;
    upsertProjectSite(
      projectId,
      {
        provisionStatus: 'live',
        lastError: null,
        nginxSite: hostname,
        wwwRoot: `/var/www/${hostname}/current`,
        provisionedAt,
      },
      database
    );
    database
      .prepare(
        `UPDATE projects SET domain_status = 'connected', updated_at = datetime('now') WHERE id = ?`
      )
      .run(projectId);

    return { status: 'live' };
  } finally {
    inflight.delete(projectId);
  }
}

module.exports = {
  hostingTargetConfigured,
  normalizeHostname,
  provisionProjectSite,
};
