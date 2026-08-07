# SPA routing + inquiry API (nginx)

This CRA app uses client-side routes (`/services`, `/pricing`, `/work`, etc.) and an Express API under `/api`.

Local setup and commands: [`README.md`](README.md).  
Project stages and emails: [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md).

## nginx

Proxy `/api/` to the local Node service **before** the SPA fallback:

```nginx
client_max_body_size 20m;

location /api/ {
  proxy_pass http://127.0.0.1:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
  try_files $uri $uri/ /index.html;
}
```

See `deploy/nginx/loganbarsell.com.conf` for a fuller example. Without the SPA fallback, refreshing a deep link returns 404.

## One-time production setup

### 1. Resend

1. Create a Resend account and verify a sending domain (recommended: `mail.loganbarsell.com`).
2. Add the DNS records Resend provides and wait for verification.
3. Create an API key.
4. Prefer a sender like: `Logan Barsell Web Services <website@mail.loganbarsell.com>`
5. Notifications go to `contact@loganbarsell.com` with the visitor as Reply-To.
6. Client-facing emails (proposal share) use Reply-To `INQUIRY_NOTIFY_TO` (typically `contact@loganbarsell.com`) so replies reach your inbox.

Do **not** put the Resend key in GitHub secrets or the React app.

### 2. Service user and data directories

```bash
sudo useradd --system --home /var/lib/loganb-api --shell /usr/sbin/nologin loganb-api || true

sudo install -d -o loganb-api -g loganb-api -m 750 /var/lib/loganb-api
sudo install -d -o loganb-api -g loganb-api -m 750 /var/lib/loganb-api/uploads
sudo install -d -o root -g root -m 700 /var/backups/loganb-api
```

### 3. Environment file (GitHub Actions secrets)

Production env is written to `/etc/loganb-api.env` on every deploy from **individual GitHub Actions secrets**. Do not commit production secrets. Local development still uses `server/.env`.

#### Required repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Notes |
|--------|--------|
| `SSH_HOST` | Droplet IP or hostname (existing) |
| `SSH_KEY` | Deploy private key (existing) |
| `SSH_USERNAME` | SSH user (existing; often `root`) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | e.g. `Logan Barsell Web Services <website@mail.loganbarsell.com>` |
| `INQUIRY_NOTIFY_TO` | Inbox for inquiry notifications |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | From `npm run hash-password` (value only, not the `ADMIN_PASSWORD_HASH=` prefix) |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |
| `CLIENT_SESSION_SECRET` | Separate `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | Live `sk_live_…` for production |
| `STRIPE_WEBHOOK_SECRET` | Live webhook signing secret |
| `STRIPE_HOSTING_PRICE_ID_39` | Live Price ID |
| `STRIPE_HOSTING_PRICE_ID_25` | Live Price ID |
| `STRIPE_HOSTING_PRICE_ID_10` | Live Price ID |

#### Optional

| Secret | Notes |
|--------|--------|
| `EMAIL_LOGO_URL` | Absolute logo URL for emails; omit to use `PUBLIC_APP_URL/email-logo.png` |

#### Hardcoded on deploy (not secrets)

These are written into `/etc/loganb-api.env` by the workflow:

- `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=3001`
- `DATABASE_PATH=/var/lib/loganb-api/inquiries.sqlite`, `UPLOAD_PATH=/var/lib/loganb-api/uploads`
- `TRUST_PROXY=1`
- `ALLOWED_ORIGIN=https://loganbarsell.com`, `PUBLIC_APP_URL=https://loganbarsell.com`
- Admin/client cookie names and TTLs

#### Generate hash / secrets

```bash
cd server && npm run hash-password
# copy only the hash value into the ADMIN_PASSWORD_HASH secret

openssl rand -hex 32   # ADMIN_SESSION_SECRET
openssl rand -hex 32   # CLIENT_SESSION_SECRET (different value)
```

Changing `ADMIN_PASSWORD_HASH` invalidates every existing admin session. Changing `ADMIN_SESSION_SECRET` or `CLIENT_SESSION_SECRET` also invalidates sessions.

If you ever write the file by hand for bootstrap:

```bash
sudo chown root:root /etc/loganb-api.env
sudo chmod 600 /etc/loganb-api.env
sudo systemctl restart loganb-api
```

`PUBLIC_APP_URL` must be the live site origin. Missing required secrets will fail the deploy before restart.

### 4. Install systemd units

```bash
sudo cp /var/www/loganbarsell.com/deploy/systemd/loganb-api.service /etc/systemd/system/
sudo cp /var/www/loganbarsell.com/deploy/systemd/loganb-api-backup.service /etc/systemd/system/
sudo cp /var/www/loganbarsell.com/deploy/systemd/loganb-api-backup.timer /etc/systemd/system/
sudo chmod +x /var/www/loganbarsell.com/deploy/scripts/backup-sqlite.sh
sudo systemctl daemon-reload
sudo systemctl enable --now loganb-api
sudo systemctl enable --now loganb-api-backup.timer
```

Optional helper for inspecting the DB:

```bash
sudo apt install sqlite3
```

### 5. nginx

Merge the `/api/` location into the existing `loganbarsell.com` site config (do not change other client sites), then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Deploy flow

GitHub Actions SSHs to the droplet, writes `/etc/loganb-api.env` from repository secrets, pulls, builds the CRA app, installs server production dependencies, restarts `loganb-api` when the systemd unit exists (migrations run on API startup), checks `/api/health`, and reloads nginx.

Never put API secrets in `REACT_APP_*` or any frontend env — only in GitHub Actions secrets → `/etc/loganb-api.env`.


## Admin portal

The React admin UI lives at `/login` and `/admin/*`. It is **not** linked from public navigation or the footer—open `/login` directly. React route guards improve UX; every admin API and attachment download is still authorized by Express session cookies.

- Session cookie: `HttpOnly`, `SameSite=Strict`, `Secure` in production, 12-hour TTL by default
- Login rate limit: 5 attempts per 15 minutes
- Auth POSTs require a matching `Origin` (`ALLOWED_ORIGIN` in production)
- `robots.txt` disallows `/login` and `/admin/` (indexing guidance only, not access control)
- Admin pages set `noindex, nofollow` in the document head

### First login / password rotation

1. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `CLIENT_SESSION_SECRET` as GitHub Actions secrets (deploy writes them into `/etc/loganb-api.env`).
2. Deploy (or restart `loganb-api` if you edited the file by hand).
3. Visit `https://loganbarsell.com/login` (or `http://localhost:3000/login` locally).
4. To rotate the password, run `npm run hash-password`, update the `ADMIN_PASSWORD_HASH` secret, push/redeploy (or restart after a manual edit)—old sessions drop automatically.

Protected placeholders:

- `/admin/inquiries` — read-only Contact + Project list/detail + attachment download
- `/admin/projects` — accepted proposals will land here later
- `/admin/invoices` — list/filter invoices; project detail has Mark as Started + domain; Stripe Checkout/webhooks when configured

## Local development

```bash
# terminal 1 — API
cp server/.env.example server/.env
# edit RESEND_API_KEY (optional locally; submissions still save if email fails)
# set ADMIN_EMAIL, ADMIN_PASSWORD_HASH (npm run hash-password), ADMIN_SESSION_SECRET,
# CLIENT_SESSION_SECRET, PUBLIC_APP_URL=http://localhost:3000, ALLOWED_ORIGIN=http://localhost:3000
cd server && npm install && npm run migrate && npm run dev

# terminal 2 — CRA (repo root)
npm start
```

CRA proxies `/api` to `http://127.0.0.1:3001` via `src/setupProxy.js` in development.

On macOS/zsh, `HOST` is often preset to your machine hostname and can confuse older CRA tooling. If `npm start` fails with an `allowedHosts` error, run:

```bash
env -u HOST npm start
```

Product overview and command index: [`README.md`](README.md).  
Project stages and emails: [`docs/LIFECYCLE.md`](docs/LIFECYCLE.md).

## Ops cheat sheet

| Task | Command / location |
|------|--------------------|
| Env file (prod) | `/etc/loganb-api.env` |
| Data + uploads | `/var/lib/loganb-api/` |
| Service | `sudo systemctl restart loganb-api` |
| Logs | `sudo journalctl -u loganb-api -n 100 --no-pager` |
| Health | `curl -s http://127.0.0.1:3001/api/health` |
| Migrate only | `cd /path/to/repo/server && npm run migrate` |
| Hash admin password | `cd server && npm run hash-password` |

Stop the API before any database reset. `db:reset` refuses to run if another process still has the SQLite file open.

## Resetting the database

Wipes SQLite (+ WAL/SHM) and upload files, then re-applies migrations. By default also **cancels Stripe subscriptions** and **deletes Stripe customers** referenced in the DB.

Does **not** delete Stripe Prices, Products, or webhook endpoints. Objects that exist in Stripe but were never stored in the DB are not removed.

```bash
# Local — stop npm run dev first
cd server && npm run db:reset
cd server && npm run db:reset -- --skip-stripe

# Production (e.g. pre-launch, no real clients) — stop loganb-api first
cd /path/to/repo/server
CONFIRM_DB_RESET=YES npm run db:reset -- --i-know-what-im-doing

# Live Stripe secret (sk_live_…) also requires:
CONFIRM_DB_RESET=YES CONFIRM_STRIPE_RESET=YES npm run db:reset -- --i-know-what-im-doing
```

Script: [`server/scripts/reset-db.js`](server/scripts/reset-db.js).

## Inspecting inquiries over SSH

```bash
sudo sqlite3 /var/lib/loganb-api/inquiries.sqlite \
  "SELECT id, type, name, email, stage, created_at, notification_status FROM inquiries ORDER BY created_at DESC LIMIT 20;"

sudo ls -la /var/lib/loganb-api/uploads
sudo journalctl -u loganb-api -n 100 --no-pager
```

## Backups

Nightly database-only backups go to `/var/backups/loganb-api` and keep the newest 7 copies. Uploaded files are **not** duplicated automatically—download important files periodically and remove old uploads when no longer needed.

The SQLite database now also stores **hashed** admin session tokens. Keep the existing root-only backup permissions (`/var/backups/loganb-api` mode `700`). No change to the seven-copy rotation is required.

Local DB copies protect against accidental corruption/deletion on the same machine. They do **not** protect against total droplet loss.

## Troubleshooting

| Symptom | Check |
|--------|--------|
| Form network error | `systemctl status loganb-api`, nginx `/api/` proxy, `curl -s http://127.0.0.1:3001/api/health` |
| Saved but no email | Resend key/domain, `notification_status` / `notification_error` in SQLite, Resend dashboard |
| 413 on uploads | `client_max_body_size` in nginx |
| Permission errors | ownership of `/var/lib/loganb-api` and `/etc/loganb-api.env` |
| Admin login fails | `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` / `ADMIN_SESSION_SECRET` in `/etc/loganb-api.env`, service restarted, Origin/`ALLOWED_ORIGIN` |
| Admin API 401 | Session expired (12h), password rotated, or cookie blocked (must be same-site HTTPS in production) |
| Client portal setup/login fails | `CLIENT_SESSION_SECRET`, `PUBLIC_APP_URL`, setup link not expired; admin can Resend portal access |
| Too many login attempts | Wait 15 minutes; login limiter is 5 / 15 minutes |
| API won’t start in production | Missing required env (`ADMIN_*`, `CLIENT_SESSION_SECRET`, `PUBLIC_APP_URL`, etc.)—see `assertProductionConfig` |
