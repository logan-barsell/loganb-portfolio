# SPA routing + inquiry API (nginx)

This CRA app uses client-side routes (`/services`, `/pricing`, `/work`, etc.) and an Express API under `/api`.

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

Do **not** put the Resend key in GitHub secrets or the React app.

### 2. Service user and data directories

```bash
sudo useradd --system --home /var/lib/loganb-api --shell /usr/sbin/nologin loganb-api || true

sudo install -d -o loganb-api -g loganb-api -m 750 /var/lib/loganb-api
sudo install -d -o loganb-api -g loganb-api -m 750 /var/lib/loganb-api/uploads
sudo install -d -o root -g root -m 700 /var/backups/loganb-api
```

### 3. Environment file

Create `/etc/loganb-api.env`:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3001

DATABASE_PATH=/var/lib/loganb-api/inquiries.sqlite
UPLOAD_PATH=/var/lib/loganb-api/uploads

RESEND_API_KEY=re_your_private_key
RESEND_FROM="Logan Barsell Web Services <website@mail.loganbarsell.com>"
INQUIRY_NOTIFY_TO=contact@loganbarsell.com

TRUST_PROXY=1

# Admin portal (never put these in GitHub secrets or React env)
ADMIN_EMAIL=contact@loganbarsell.com
ADMIN_PASSWORD_HASH=scrypt$16384$8$1$...from_hash_password_script...
ADMIN_SESSION_SECRET=long_random_string_at_least_32_chars
ADMIN_SESSION_TTL_SECONDS=43200
ADMIN_SESSION_COOKIE_NAME=lb_admin_session
ALLOWED_ORIGIN=https://loganbarsell.com
```

Generate the password hash on any machine with the server dependencies installed (do not commit the plaintext password):

```bash
cd /var/www/loganbarsell.com/server   # or your local server/ checkout
npm run hash-password
# copy only the printed ADMIN_PASSWORD_HASH=... line into /etc/loganb-api.env
```

Create a long session secret, for example:

```bash
openssl rand -hex 32
```

Lock the env file down:

```bash
sudo chown root:root /etc/loganb-api.env
sudo chmod 600 /etc/loganb-api.env
```

Restart the API after editing credentials so the new hash/secret load and the `admin_sessions` migration applies:

```bash
sudo systemctl restart loganb-api
```

Changing `ADMIN_PASSWORD_HASH` invalidates every existing admin session (credential fingerprint mismatch). Changing `ADMIN_SESSION_SECRET` also invalidates sessions because cookie tokens are HMAC’d with that secret.

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

GitHub Actions SSHs to the droplet, pulls, builds the CRA app, installs server production dependencies, restarts `loganb-api` when the systemd unit exists (migrations run on API startup), checks `/api/health`, and reloads nginx.


## Admin portal

The React admin UI lives at `/login` and `/admin/*`. It is **not** linked from public navigation or the footer—open `/login` directly. React route guards improve UX; every admin API and attachment download is still authorized by Express session cookies.

- Session cookie: `HttpOnly`, `SameSite=Strict`, `Secure` in production, 12-hour TTL by default
- Login rate limit: 5 attempts per 15 minutes
- Auth POSTs require a matching `Origin` (`ALLOWED_ORIGIN` in production)
- `robots.txt` disallows `/login` and `/admin/` (indexing guidance only, not access control)
- Admin pages set `noindex, nofollow` in the document head

### First login / password rotation

1. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `ALLOWED_ORIGIN` in the API env file.
2. Restart `loganb-api`.
3. Visit `https://loganbarsell.com/login` (or `http://localhost:3000/login` locally).
4. To rotate the password, run `npm run hash-password`, replace `ADMIN_PASSWORD_HASH`, restart the service—old sessions drop automatically.

Protected placeholders:

- `/admin/inquiries` — read-only Contact + Project list/detail + attachment download
- `/admin/projects` — accepted proposals will land here later
- `/admin/invoices` — billing later

## Local development

```bash
# terminal 1
cp server/.env.example server/.env
# edit RESEND_API_KEY (optional locally; submissions still save if email fails)
# set ADMIN_EMAIL, ADMIN_PASSWORD_HASH (npm run hash-password), ADMIN_SESSION_SECRET, ALLOWED_ORIGIN=http://localhost:3000
cd server && npm install && npm run migrate && npm run dev

# terminal 2
npm start
```

CRA proxies `/api` to `http://127.0.0.1:3001` via `src/setupProxy.js` in development.

On macOS/zsh, `HOST` is often preset to your machine hostname and can confuse older CRA tooling. If `npm start` fails with an `allowedHosts` error, run:

```bash
env -u HOST npm start
```

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
| Too many login attempts | Wait 15 minutes; login limiter is 5 / 15 minutes |
| API won’t start in production | Missing required admin env vars—see `assertProductionConfig` |
