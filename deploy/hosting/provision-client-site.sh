#!/usr/bin/env bash
# Idempotent static-SPA site provisioner for the client hosting droplet.
# Installed as /usr/local/sbin/provision-client-site (sudoers allowlist).
set -euo pipefail

ENV_FILE="${LB_HOSTING_ENV:-/etc/lb-hosting.env}"
TEMPLATE="${LB_HOSTING_TEMPLATE:-/usr/local/share/lb-hosting/static-spa.conf.template}"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
WWW_ROOT_BASE="/var/www"

RESERVED_HOSTS="loganbarsell.com www.loganbarsell.com"

usage() {
  cat <<'EOF'
Usage: provision-client-site [--dry-run] <hostname>
       provision-client-site --help

Creates /var/www/<hostname>/current, an nginx static SPA vhost, enables it,
runs nginx -t, reloads, and requests a Let's Encrypt cert (apex; www if DNS matches).

Requires /etc/lb-hosting.env with CERTBOT_EMAIL. PUBLIC_IP is used to decide
whether to include www.<hostname> in the certificate.
EOF
}

log() { printf '%s\n' "$*"; }
err() { printf '%s\n' "$*" >&2; }

normalize_hostname() {
  local raw="$1"
  local s
  s="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  s="${s#http://}"
  s="${s#https://}"
  s="${s%%/*}"
  s="${s%%:*}"
  s="${s%.}"
  if [[ "$s" == www.* ]]; then
    s="${s#www.}"
  fi
  printf '%s' "$s"
}

is_valid_hostname() {
  local s="$1"
  [[ ${#s} -le 255 ]] || return 1
  [[ "$s" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]
}

is_reserved() {
  local s="$1"
  local r
  for r in $RESERVED_HOSTS; do
    if [[ "$s" == "$r" ]]; then
      return 0
    fi
  done
  return 1
}

host_resolves_to() {
  local name="$1"
  local expect="$2"
  local ips
  ips="$(getent ahostsv4 "$name" 2>/dev/null | awk '{print $1}' | sort -u || true)"
  ips+=$'\n'
  ips+="$(getent ahostsv6 "$name" 2>/dev/null | awk '{print $1}' | sort -u || true)"
  printf '%s\n' "$ips" | grep -Fxq "$expect"
}

DRY_RUN=0
DOMAIN_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --)
      shift
      break
      ;;
    -*)
      err "Unknown option: $1"
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$DOMAIN_ARG" ]]; then
        err "Unexpected extra argument: $1"
        usage >&2
        exit 1
      fi
      DOMAIN_ARG="$1"
      shift
      ;;
  esac
done

if [[ -z "$DOMAIN_ARG" ]]; then
  err "Missing hostname."
  usage >&2
  exit 1
fi

DOMAIN="$(normalize_hostname "$DOMAIN_ARG")"
if [[ -z "$DOMAIN" ]] || ! is_valid_hostname "$DOMAIN"; then
  err "Invalid hostname: ${DOMAIN_ARG}"
  exit 1
fi
if is_reserved "$DOMAIN"; then
  err "Refusing reserved hostname: ${DOMAIN}"
  exit 1
fi

WWW_ROOT="${WWW_ROOT_BASE}/${DOMAIN}/current"
SITE_AVAILABLE="${NGINX_AVAILABLE}/${DOMAIN}"
SITE_ENABLED="${NGINX_ENABLED}/${DOMAIN}"

CERTBOT_EMAIL=""
PUBLIC_IP=""
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CERTBOT_EMAIL:-}" ]]; then
  err "CERTBOT_EMAIL is not set (expected in ${ENV_FILE})."
  exit 1
fi

INCLUDE_WWW=0
if [[ -n "${PUBLIC_IP:-}" ]] && host_resolves_to "www.${DOMAIN}" "$PUBLIC_IP"; then
  INCLUDE_WWW=1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry run for ${DOMAIN}"
  log "  www root: ${WWW_ROOT}"
  log "  nginx site: ${SITE_AVAILABLE}"
  log "  template: ${TEMPLATE}"
  log "  certbot email: ${CERTBOT_EMAIL}"
  log "  include www cert: ${INCLUDE_WWW}"
  exit 0
fi

if [[ ! -f "$TEMPLATE" ]]; then
  err "Missing nginx template: ${TEMPLATE}"
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  err "Must run as root (use sudo)."
  exit 1
fi

mkdir -p "$WWW_ROOT"
if [[ ! -f "${WWW_ROOT}/index.html" ]]; then
  cat > "${WWW_ROOT}/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coming soon</title>
</head>
<body>
  <p>This site is being set up.</p>
</body>
</html>
HTML
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed "s/__DOMAIN__/${DOMAIN}/g" "$TEMPLATE" > "$tmp"
install -m 644 "$tmp" "$SITE_AVAILABLE"

ln -sfn "$SITE_AVAILABLE" "$SITE_ENABLED"

if ! nginx -t; then
  err "nginx -t failed; not reloading. Inspect ${SITE_AVAILABLE}."
  rm -f "$SITE_ENABLED"
  exit 2
fi

systemctl reload nginx

certbot_args=(
  --nginx
  --non-interactive
  --agree-tos
  --redirect
  --keep-until-expiring
  -m "$CERTBOT_EMAIL"
  -d "$DOMAIN"
)
if [[ "$INCLUDE_WWW" -eq 1 ]]; then
  certbot_args+=(-d "www.${DOMAIN}")
fi

if ! certbot "${certbot_args[@]}"; then
  err "certbot failed for ${DOMAIN}."
  exit 3
fi

if ! nginx -t; then
  err "nginx -t failed after certbot."
  exit 2
fi

systemctl reload nginx
log "Provisioned ${DOMAIN} (${WWW_ROOT})."
