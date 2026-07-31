#!/usr/bin/env node
/**
 * Insert one or more randomized test inquiries (no HTTP, no honeypot).
 *
 * Usage:
 *   npm run seed:inquiry
 *   npm run seed:inquiry -- --type project
 *   npm run seed:inquiry -- --type contact
 *   npm run seed:inquiry -- --count 5
 *   npm run seed:inquiry -- --email          # also send Resend notify + confirmation
 *
 * Seed emails use INQUIRY_NOTIFY_TO / ADMIN_EMAIL with +plus tags (Resend-safe),
 * e.g. contact+seed.alex.rivera.1234@loganbarsell.com
 *
 * Refuses in production unless:
 *   CONFIRM_SEED=YES npm run seed:inquiry -- --i-know-what-im-doing
 */

const { randomUUID } = require('crypto');
const {
  PACKAGE_SLUGS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
} = require('../src/config/constants');
const { config } = require('../src/config');
const {
  insertInquiry,
  resolveClientForInquiry,
  setInquiryClientId,
  closeDb,
} = require('../src/db');

const FIRST_NAMES = [
  'Alex',
  'Jordan',
  'Sam',
  'Taylor',
  'Casey',
  'Riley',
  'Morgan',
  'Quinn',
  'Avery',
  'Jamie',
];
const LAST_NAMES = [
  'Rivera',
  'Nguyen',
  'Patel',
  'Brooks',
  'Okoye',
  'Chen',
  'Garcia',
  'Singh',
  'Walsh',
  'Kim',
];
const BUSINESS_WORDS = [
  'Studio',
  'Collective',
  'Workshop',
  'Lab',
  'Co',
  'Partners',
  'Supply',
  'Kitchen',
  'Clinic',
  'Agency',
];
const GOAL_SNIPPETS = [
  'Need a clean marketing site that loads fast on mobile.',
  'Want online booking and a clearer services page.',
  'Replacing an outdated WordPress theme with something simpler.',
  'Launching a new brand and need a one-pager plus contact form.',
  'Looking for a custom app to manage client requests.',
];
const MESSAGE_SNIPPETS = [
  'Saw your pricing page and wanted to start a conversation.',
  'We are ready to kick off in the next month if timelines work.',
  'Curious about hosting options after the site launches.',
  'Happy to share brand assets once we have a proposal.',
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--') && !a.includes('=')));
  const get = (name, fallback = null) => {
    const idx = args.indexOf(name);
    if (idx === -1) return fallback;
    return args[idx + 1] ?? fallback;
  };
  return {
    type: get('--type', 'auto'), // auto | contact | project
    count: Math.max(1, Math.min(50, Number(get('--count', '1')) || 1)),
    sendEmail: flags.has('--email'),
    force: flags.has('--i-know-what-im-doing'),
  };
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickKey(map) {
  return pick(Object.keys(map));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function assertAllowed(force) {
  if (config.env !== 'production') return;
  if (force && process.env.CONFIRM_SEED === 'YES') return;
  console.error('Production seed refused.');
  console.error('  CONFIRM_SEED=YES npm run seed:inquiry -- --i-know-what-im-doing');
  process.exit(1);
}

/**
 * Resend test/sandbox mode rejects @example.com. Use INQUIRY_NOTIFY_TO / ADMIN_EMAIL
 * with plus-addressing so each seed is unique but deliverable.
 * contact@loganbarsell.com → contact+seed.casey.7871@loganbarsell.com
 */
function seedDeliverableEmail({ first, last, n }) {
  const base = (config.notifyTo || config.adminEmail || '').trim().toLowerCase();
  if (!base || !base.includes('@')) {
    throw new Error(
      'Set INQUIRY_NOTIFY_TO or ADMIN_EMAIL in server/.env so seed emails are Resend-deliverable.'
    );
  }
  const [local, domain] = base.split('@');
  const tag = `seed.${slugify(first)}.${slugify(last)}.${n}`;
  return `${local}+${tag}@${domain}`;
}

function buildContact() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const n = Math.floor(Math.random() * 9000) + 1000;
  return {
    type: 'contact',
    name,
    email: seedDeliverableEmail({ first, last, n }),
    message: `${pick(MESSAGE_SNIPPETS)} (seed ${n})`,
  };
}

function buildProject() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const businessName = `${last} ${pick(BUSINESS_WORDS)}`;
  const n = Math.floor(Math.random() * 9000) + 1000;
  const packageSlug = pick(PACKAGE_SLUGS.filter((s) => s !== 'hosting'));
  return {
    type: 'project',
    name,
    email: seedDeliverableEmail({ first, last, n }),
    businessName,
    packageSlug,
    websiteGoals: `${pick(GOAL_SNIPPETS)} (seed ${n})`,
    phone: `555-01${String(n).slice(0, 2)}-${String(n).slice(2)}`,
    currentWebsite: Math.random() > 0.5 ? `https://example.com/${slugify(last)}` : null,
    requestedFeatures: pick([
      'Contact form, gallery, basic SEO',
      'Online booking and FAQ',
      'Client portal and file uploads',
      null,
    ]),
    inspirationLinks: Math.random() > 0.6 ? 'https://example.com/inspo' : null,
    domainInfo: pick(['I already own a domain', 'Need help choosing a domain', null]),
    domainName: Math.random() > 0.5 ? `${slugify(last)}example.com` : null,
    brandingNotes: Math.random() > 0.5 ? 'Have a logo; need color guidance.' : null,
    contentReadiness: pickKey(CONTENT_READINESS_LABELS),
    timeline: pickKey(TIMELINE_LABELS),
    budget: pickKey(BUDGET_LABELS),
    message: pick(MESSAGE_SNIPPETS),
  };
}

function createOne(typeChoice, optsSendEmail) {
  const type =
    typeChoice === 'contact' || typeChoice === 'project'
      ? typeChoice
      : Math.random() > 0.35
        ? 'project'
        : 'contact';

  const data = type === 'project' ? buildProject() : buildContact();
  const id = randomUUID();

  insertInquiry({
    id,
    type: data.type,
    name: data.name,
    email: data.email,
    message: data.message ?? null,
    phone: data.phone ?? null,
    businessName: data.businessName ?? null,
    packageSlug: data.packageSlug ?? null,
    websiteGoals: data.websiteGoals ?? null,
    currentWebsite: data.currentWebsite ?? null,
    requestedFeatures: data.requestedFeatures ?? null,
    inspirationLinks: data.inspirationLinks ?? null,
    domainInfo: data.domainInfo ?? null,
    domainName: data.domainName ?? null,
    brandingNotes: data.brandingNotes ?? null,
    contentReadiness: data.contentReadiness ?? null,
    timeline: data.timeline ?? null,
    budget: data.budget ?? null,
    notificationStatus: optsSendEmail ? 'pending' : 'sent',
    stage: 'new',
  });

  const clientId = resolveClientForInquiry({
    type: data.type,
    name: data.name,
    email: data.email,
    phone: data.phone,
    businessName: data.businessName,
  });
  if (clientId) setInquiryClientId(id, clientId);

  return { id, ...data, clientId: clientId || null };
}

async function main() {
  const opts = parseArgs(process.argv);
  assertAllowed(opts.force);

  const created = [];
  for (let i = 0; i < opts.count; i += 1) {
    created.push(createOne(opts.type, opts.sendEmail));
  }

  if (opts.sendEmail) {
    const { notifyAndRespond } = require('../src/services/inquiries');
    for (const row of created) {
      await notifyAndRespond(row.id);
      console.log(`  emailed ${row.id}`);
    }
  }

  for (const row of created) {
    console.log(
      [
        row.id,
        row.type,
        row.name,
        row.email,
        row.businessName || '-',
        row.packageSlug || '-',
        row.clientId ? `client=${row.clientId}` : 'client=none',
      ].join(' | ')
    );
  }
  console.log(`Seeded ${created.length} inquiry(ies). Emails: ${opts.sendEmail ? 'sent' : 'skipped'}.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message || err);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      closeDb();
    } catch {
      // ignore
    }
  });
