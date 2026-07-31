# Logan Barsell Web Services

Public portfolio site (React / CRA) plus an Express API for inquiries, admin, proposals, client project portal, billing (Stripe), and transactional email (Resend).

## Repo layout

| Path | Purpose |
|------|---------|
| [`src/`](src/) | CRA frontend (marketing site, `/admin`, `/project/:id` portal) |
| [`server/`](server/) | Express API (`/api`), SQLite, migrations, email/billing |
| [`DEPLOY.md`](DEPLOY.md) | Production nginx, systemd, env, backups, DB reset |
| [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md) | Project stages and which emails fire when |
| [`server/.env.example`](server/.env.example) | API env template |

## Lifecycle (short)

```text
Inquiry → Proposal → Accept (on hold) → Start → Complete → Ready for Launch → Hosting
```

Details, admin actions, and email matrix: [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md).

## Local development

Two processes: API on `:3001`, CRA on `:3000` (CRA proxies `/api` via `src/setupProxy.js`).

```bash
# API
cp server/.env.example server/.env
# Edit server/.env — at least ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET,
# CLIENT_SESSION_SECRET, PUBLIC_APP_URL, ALLOWED_ORIGIN
cd server
npm install
npm run hash-password   # paste hash into ADMIN_PASSWORD_HASH
npm run migrate
npm run dev

# Frontend (repo root, second terminal)
npm install
npm start
# If macOS/zsh HOST breaks CRA: env -u HOST npm start
```

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
Health: [http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health)

Resend and Stripe are optional locally. Submissions still save if email fails; Checkout returns 503 until Stripe is configured.

## Server commands

Run from `server/` (or use root wrappers below).

| Command | What it does |
|---------|----------------|
| `npm run migrate` | Apply SQL migrations |
| `npm run db:reset` | Cancel Stripe subs + delete customers from DB IDs, wipe SQLite/uploads, re-migrate |
| `npm run db:reset -- --skip-stripe` | Wipe SQLite/uploads only |
| `npm run seed:inquiry` | Insert a randomized test inquiry (no email by default; uses `INQUIRY_NOTIFY_TO` +plus tags for Resend) |
| `npm run seed:inquiry -- --count 5 --type project` | Seed several project inquiries |
| `npm run seed:inquiry -- --email` | Seed and send Resend notify + confirmation |
| `npm run hash-password` | Generate `ADMIN_PASSWORD_HASH` |
| `npm run dev` | API with `--watch` |
| `npm start` | API without watch |

**Stop the API before `db:reset`.** The script refuses to wipe if another process still has the SQLite file open (otherwise the running API keeps the old data).

Production reset (stop `loganb-api` first):

```bash
CONFIRM_DB_RESET=YES npm run db:reset -- --i-know-what-im-doing
# Live Stripe key (sk_live_…):
CONFIRM_DB_RESET=YES CONFIRM_STRIPE_RESET=YES npm run db:reset -- --i-know-what-im-doing
```

Reset does **not** delete Stripe Prices, Products, or webhook endpoints. Full notes: [`DEPLOY.md`](DEPLOY.md#resetting-the-database).

### Root shortcuts

```bash
npm run server:dev       # server npm run dev
npm run server:migrate   # server npm run migrate
npm run server:db:reset  # server npm run db:reset (pass flags after --)
npm run server:seed:inquiry
```

## Production

See [`DEPLOY.md`](DEPLOY.md) for nginx, systemd, `/etc/loganb-api.env`, Resend, Stripe webhooks, backups, and troubleshooting.
