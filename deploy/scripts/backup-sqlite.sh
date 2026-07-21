#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DATABASE_PATH:-/var/lib/loganb-api/inquiries.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/loganb-api}"
KEEP="${BACKUP_KEEP:-7}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${BACKUP_DIR}/inquiries-${STAMP}.sqlite"

mkdir -p "${BACKUP_DIR}"

if [[ ! -f "${DB_PATH}" ]]; then
  echo "Database not found at ${DB_PATH}; skipping backup."
  exit 0
fi

# SQLite-safe online backup (copies a consistent snapshot)
sqlite3 "${DB_PATH}" ".backup '${DEST}'"
chmod 600 "${DEST}"

# Keep only the newest KEEP files
mapfile -t FILES < <(ls -1t "${BACKUP_DIR}"/inquiries-*.sqlite 2>/dev/null || true)
if (( ${#FILES[@]} > KEEP )); then
  for ((i=KEEP; i<${#FILES[@]}; i++)); do
    rm -f "${FILES[$i]}"
  done
fi

echo "Backup written to ${DEST}"
