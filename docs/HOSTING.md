# Client site hosting

Managed client sites (static SPAs) are provisioned on a **dedicated hosting droplet**, not on the loganbarsell.com box. The admin **Provision Site** action on Project Detail SSHs from the API to that droplet and runs an idempotent nginx + Certbot script.

Ready for Launch and Stripe `hosting_status` are unchanged. Provision is independent: you can provision during the build (`active`) or after complete. No client email is sent.

## Statuses (`project_sites`)

| Key | Label | Meaning |
|---|---|---|
| `none` | Not Provisioned | Never attempted |
| `dns_waiting` | DNS Waiting | Apex A/AAAA does not yet point at the hosting public IP |
| `provisioning` | Provisioning | SSH + script in progress |
| `live` | Live | nginx site + TLS succeeded |
| `failed` | Failed | SSH or script error (`last_error` on the project) |

`domain_status` stays ownership (`Client Owns` / `Needs Purchase` / `Connected`). On a successful provision the API sets `domain_status` to `connected` (you can still edit it). Stripe `hosting_status` is billing only.

## Env vars (API / personal droplet)

Set on the **personal** droplet (`/etc/loganb-api.env`) and as GitHub Actions secrets so deploys do not wipe them. **Do not** put the SSH private key in the env file.

| Variable | Required | Notes |
|---|---|---|
| `CLIENT_HOSTING_SSH_HOST` | Yes (to enable) | Hosting droplet IP or hostname (VPC private IP preferred) |
| `CLIENT_HOSTING_PUBLIC_IP` | Yes (to enable) | Public IPv4/IPv6 for DNS hints + apex DNS check |
| `CLIENT_HOSTING_SSH_USER` | No | Default `site-provision` |
| `CLIENT_HOSTING_SSH_KEY_PATH` | No | Default `/etc/loganb-api/client-host.key` |
| `CLIENT_HOSTING_SSH_PORT` | No | Default `22` |
| `CLIENT_HOSTING_KNOWN_HOSTS_PATH` | No | Default `/var/lib/loganb-api/ssh/known_hosts` |

If host or public IP is missing, **Provision Site** returns `503` `HOSTING_TARGET_NOT_CONFIGURED`. The API still boots.

## Layout on the hosting droplet

```text
/var/www/<domain>/current     ← GHA / rsync deploy target (SPA build)
/etc/nginx/sites-available/<domain>
/etc/nginx/sites-enabled/<domain>
/usr/local/sbin/provision-client-site
/usr/local/share/lb-hosting/static-spa.conf.template
/etc/lb-hosting.env           ← CERTBOT_EMAIL, PUBLIC_IP
```

V1 is static SPA only (`try_files` → `index.html`). Reserved: `loganbarsell.com`.

## Operator runbooks

1. [Create or replace a hosting droplet](hosting/NEW_HOSTING_DROPLET.md)
2. [One-time personal droplet + SSH + firewall](hosting/ONE_TIME_SETUP.md)

After both: point a test domain A record at `CLIENT_HOSTING_PUBLIC_IP`, then use **Provision Site** on an admin project with a managed hosting plan and a domain name.

Client repo GitHub Actions must SSH to the **hosting** droplet (`SSH_HOST` in that repo), not the loganbarsell.com deploy secrets.
