# Create or replace a hosting droplet

Repeatable checklist for a DigitalOcean droplet that will host **client static SPAs** (nginx + Certbot). This is not the loganbarsell.com / API droplet.

After the box is ready, point the API at it with [ONE_TIME_SETUP.md](ONE_TIME_SETUP.md) (`CLIENT_HOSTING_*`).

## 1. Create the droplet

In DigitalOcean:

1. Ubuntu LTS (22.04 or 24.04), same region as the personal droplet if you use VPC.
2. Size: start small (e.g. 1–2 GB RAM); resize later. Enable **backups** if you want DO snapshots.
3. Attach the same **VPC** as loganbarsell.com.
4. Add your laptop SSH key (so you can log in as `root` or a sudo user).
5. Hostname e.g. `lb-hosting-1`.
6. Note **public IPv4** and **private/VPC IPv4**.

Do not install the portfolio API or SQLite on this box.

## 2. Base packages

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

Optional: `ufw` if you are not using a DO Cloud Firewall — still prefer the cloud firewall from the one-time setup doc.

## 3. `site-provision` user + SSH

On the **hosting** droplet:

```bash
sudo adduser --system --group --home /home/site-provision --shell /bin/bash site-provision
sudo mkdir -p /home/site-provision/.ssh
sudo chmod 700 /home/site-provision/.ssh
# paste the personal droplet public key (/etc/loganb-api/client-host.key.pub)
sudo nano /home/site-provision/.ssh/authorized_keys
sudo chmod 600 /home/site-provision/.ssh/authorized_keys
sudo chown -R site-provision:site-provision /home/site-provision/.ssh
```

`authorized_keys` should contain **only** the loganb-api client-host public key (plus your own key if you want to SSH as this user).

## 4. Allowlisted sudoers

```bash
echo 'site-provision ALL=(root) NOPASSWD: /usr/local/sbin/provision-client-site' \
  | sudo tee /etc/sudoers.d/site-provision
sudo chmod 440 /etc/sudoers.d/site-provision
sudo visudo -cf /etc/sudoers.d/site-provision
```

Do not grant unrestricted sudo.

## 5. Install the provision script + nginx template

From this repo (on your laptop or after `git clone` / copy from the personal droplet):

```bash
# paths relative to the loganb-portfolio repo root
sudo install -d -m 755 /usr/local/share/lb-hosting
sudo install -m 644 deploy/hosting/nginx/static-spa.conf.template \
  /usr/local/share/lb-hosting/static-spa.conf.template
sudo install -m 755 deploy/hosting/provision-client-site.sh \
  /usr/local/sbin/provision-client-site
```

After you change the script in git, **re-copy** these two files. The API does not scp the script on each provision.

## 6. `/etc/lb-hosting.env`

```bash
sudo tee /etc/lb-hosting.env >/dev/null <<'EOF'
CERTBOT_EMAIL=you@example.com
PUBLIC_IP=203.0.113.10
EOF
sudo chmod 640 /etc/lb-hosting.env
sudo chown root:root /etc/lb-hosting.env
```

- `CERTBOT_EMAIL` — Let’s Encrypt account email (`--agree-tos`).
- `PUBLIC_IP` — this droplet’s **public** IPv4 (or IPv6 if that is what client A records use). Used to decide whether to request a `www` certificate.

## 7. Directory conventions

| Path | Role |
|---|---|
| `/var/www/<domain>/current` | Deploy target for client GitHub Actions (SPA `build/` contents) |
| `/etc/nginx/sites-available/<domain>` | vhost (created by the script) |
| `/etc/nginx/sites-enabled/<domain>` | symlink |

Reserved hostnames: `loganbarsell.com`, `www.loganbarsell.com` (script refuses them).

Client GHA should rsync/scp into `/var/www/<domain>/current`, then `nginx -t && systemctl reload nginx` only if you change nginx (usually not required for static files).

**Do not** point a client repo’s `SSH_HOST` at the loganbarsell.com droplet. That secret is only for this portfolio. Each client repo needs its own deploy key + `SSH_HOST` = this hosting droplet.

## 8. Point the API at this droplet

On the personal droplet + GitHub secrets (see [ONE_TIME_SETUP.md](ONE_TIME_SETUP.md)):

- `CLIENT_HOSTING_SSH_HOST` — this droplet’s VPC IP (or hostname)
- `CLIENT_HOSTING_PUBLIC_IP` — this droplet’s public IP (admin DNS hint + API DNS check)
- Re-run `ssh-keyscan` into `/var/lib/loganb-api/ssh/known_hosts`
- `sudo systemctl restart loganb-api` after env is in place

Admin Project Detail will show the new public IP in the domain hint.

## 9. Smoke test on the hosting box

```bash
sudo /usr/local/sbin/provision-client-site --help
sudo /usr/local/sbin/provision-client-site --dry-run example.com
```

Then from the personal droplet, the `loganb-api` SSH smoke test in the one-time doc. Finally provision a real test domain whose A record already points here.

## 10. Replacing an existing hosting droplet (cutover)

1. Create and bootstrap the new droplet (steps 1–7).
2. Optionally rsync existing sites: `/var/www/` and `/etc/letsencrypt/` (or re-issue certs after DNS).
3. Update `CLIENT_HOSTING_*` + `known_hosts` + GHA secrets; restart `loganb-api`.
4. Update **each client repo** GHA `SSH_HOST` / deploy key if they still pointed at the old box.
5. Lower DNS TTL beforehand; flip A/AAAA to the new public IP; **Retry Provision** if Certbot needs to run again.
6. Decommission the old droplet only after DNS + TLS look good.

## 11. Optional: migrate one existing client site

```bash
# on old host
sudo rsync -aH /var/www/example.com/ root@NEW_HOST:/var/www/example.com/
# copy nginx site + enable, nginx -t, reload
# certbot: either copy /etc/letsencrypt or re-issue after DNS points at NEW_HOST
```

Prefer re-running `provision-client-site example.com` on the new box after DNS, then rsync `current/` from the old `current/` or from GitHub Actions.
