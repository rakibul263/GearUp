#!/usr/bin/env bash

# ==============================================================================
# GearUp Database Automated Backup Script
# Usage: ./scripts/db-backup.sh
# Supports cron execution (e.g. 0 2 * * * /path/to/scripts/db-backup.sh)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/gearup_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f .env ]; then
    # Load DATABASE_URL from .env
    DATABASE_URL="$(grep -v '^#' .env | grep -E '^DATABASE_URL=' | cut -d '=' -f2- | tr -d '\"' | tr -d '\'')"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL is not set" >&2
  exit 1
fi

echo "📦 Starting database backup to ${BACKUP_FILE}..."

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "${DATABASE_URL}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
  echo "✅ Backup successfully created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"
else
  echo "⚠️ Warning: pg_dump utility not found locally."
  echo "   In Docker/Kubernetes environments, run:"
  echo "   docker exec gearup-postgres pg_dump -U gearup_user gearup_db | gzip > ${BACKUP_FILE}"
fi

# Retention policy: remove backups older than RETENTION_DAYS
if [ -d "${BACKUP_DIR}" ]; then
  find "${BACKUP_DIR}" -type f -name "gearup_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
  echo "🧹 Old backups older than ${RETENTION_DAYS} days pruned."
fi
