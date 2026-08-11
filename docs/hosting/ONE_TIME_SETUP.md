# One-time setup: personal droplet → hosting droplet

Do this once on the **loganbarsell.com** (API) droplet after the first hosting droplet exists. Repeat the key/`known_hosts` steps if you replace the hosting box (see [NEW_HOSTING_DROPLET.md](NEW_HOSTING_DROPLET.md)).

The API user is `loganb-api` with systemd `ProtectHome=true` and `ReadWritePaths=/var/lib/loganb-api`. It cannot write `~/.ssh` and must not run nginx or Certbot.

## 1. Generate a dedicated deploy key (on the personal droplet)

Do **not** reuse the GitHub Actions `SSH_KEY` that deploys loganbarsell.com (especially if that user is `root`).

```bash
sudo mkdir -p /etc/loganb-api
sudo ssh-keygen -t ed25519 -f /etc/loganb-api/client-host.key -N '' -C 'loganb-api-client-host'
sudo chown loganb-api:loganb-api /etc/loganb-api/client-host.key /etc/loganb-api/client-host.key.pub
sudo chmod 600 /etc/loganb-api/client-host.key
sudo chmod 644 /etc/loganb-api/client-host.key.pub
sudo cat /etc/loganb-api/client-host.key.pub
```

Copy the **public** key into `~site-provision/.ssh/authorized_keys` on the hosting droplet (the new-droplet runbook).

## 2. Pin host keys (`known_hosts`)

`StrictHostKeyChecking=yes` needs a writable known_hosts **under** `/var/lib/loganb-api`:

```bash
# Use the same address you will put in CLIENT_HOSTING_SSH_HOST
# (VPC private IP preferred; otherwise public IP or hostname).
HOSTING_SSH_HOST='10.x.x.x'

sudo mkdir -p /var/lib/loganb-api/ssh
sudo ssh-keyscan -H "$HOSTING_SSH_HOST" | sudo tee /var/lib/loganb-api/ssh/known_hosts
sudo chown -R loganb-api:loganb-api /var/lib/loganb-api/ssh
sudo chmod 700 /var/lib/loganb-api/ssh
sudo chmod 600 /var/lib/loganb-api/ssh/known_hosts
```

If you change the hosting droplet (new host keys), re-run `ssh-keyscan` or SSH will fail.

## 3. DigitalOcean firewall / VPC

On the **hosting** droplet firewall (or a DO Cloud Firewall attached to it):

| Port | Source | Why |
|---|---|---|
| `22` | Personal droplet public IP (and your laptop / bastion if you SSH in) | Provision SSH |
| `80`, `443` | `0.0.0.0/0`, `::/0` | HTTP + Certbot + HTTPS |
| All other inbound | Deny | |

Prefer DigitalOcean **VPC**: put both droplets in the same VPC. Then:

- `CLIENT_HOSTING_SSH_HOST` = hosting **private** IP
- `CLIENT_HOSTING_PUBLIC_IP` = hosting **public** IP (DNS + Certbot)

Restrict `:22` to the personal droplet’s VPC IP if you use private SSH.

On the **personal** droplet, outbound `:22` to the hosting box must be allowed (usually default).

## 4. API env + GitHub Actions secrets

`/etc/loganb-api.env` is **rewritten on every loganbarsell.com deploy**. If you only edit the file by hand, the next GHA run will drop `CLIENT_HOSTING_*`.

Add these as repository secrets (Settings → Secrets → Actions), then redeploy or restart after the workflow writes them:

| Secret | Example |
|---|---|
| `CLIENT_HOSTING_SSH_HOST` | VPC private IP or hostname |
| `CLIENT_HOSTING_PUBLIC_IP` | Public IPv4 of the hosting droplet |
| `CLIENT_HOSTING_SSH_USER` | `site-provision` (optional; this is the default) |
| `CLIENT_HOSTING_SSH_KEY_PATH` | `/etc/loganb-api/client-host.key` (optional; default) |
| `CLIENT_HOSTING_SSH_PORT` | `22` (optional) |
| `CLIENT_HOSTING_KNOWN_HOSTS_PATH` | `/var/lib/loganb-api/ssh/known_hosts` (optional) |

**Never** store the private key in env or in GitHub secrets for this path. The key file stays on disk on the personal droplet only.

If you bootstrap before the next deploy, you may also append to `/etc/loganb-api.env` and `sudo systemctl restart loganb-api`, then add the same values as GHA secrets immediately.

## 5. Smoke test as `loganb-api`

```bash
sudo -u loganb-api -H ssh \
  -i /etc/loganb-api/client-host.key \
  -o IdentitiesOnly=yes \
  -o BatchMode=yes \
  -o UserKnownHostsFile=/var/lib/loganb-api/ssh/known_hosts \
  -o StrictHostKeyChecking=yes \
  site-provision@HOSTING_SSH_HOST \
  sudo /usr/local/sbin/provision-client-site --help
```

You should see the script usage text, not a password prompt and not `sudo: a password is required`.

Then in admin → a test project with a managed hosting plan and domain whose A record points at `CLIENT_HOSTING_PUBLIC_IP` → **Provision Site**.

## Troubleshooting

| Symptom | Check |
|---|---|
| `HOSTING_TARGET_NOT_CONFIGURED` | `CLIENT_HOSTING_SSH_HOST` + `CLIENT_HOSTING_PUBLIC_IP` missing after deploy |
| DNS Waiting | Apex A/AAAA ≠ `CLIENT_HOSTING_PUBLIC_IP` (`dig +short example.com`) |
| Permission denied (publickey) | `authorized_keys` on `site-provision`; key ownership `loganb-api` `600` |
| Host key verification failed | Re-run `ssh-keyscan` into `/var/lib/loganb-api/ssh/known_hosts` |
| sudo password / not allowed | Hosting sudoers allowlist for `/usr/local/sbin/provision-client-site` |
| nginx test failed / other sites down | Script aborts before reload; inspect `/etc/nginx/sites-available/<domain>` |
| Certbot failure | Port 80 public; apex DNS; `CERTBOT_EMAIL` in `/etc/lb-hosting.env` |
| systemd / ProtectHome | Do not use `~loganb-api/.ssh`; known_hosts must be under `/var/lib/loganb-api/ssh` |
