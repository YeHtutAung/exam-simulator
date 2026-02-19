#!/bin/bash
# Daily PostgreSQL backup to local directory
# Add to crontab: 0 3 * * * /home/ec2-user/exam-simulator/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="/home/ec2-user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump database from the running container
docker compose --env-file /home/ec2-user/exam-simulator/.env.production -f /home/ec2-user/exam-simulator/docker-compose.prod.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-exam}" "${POSTGRES_DB:-exam_simulator}" \
  | gzip > "$BACKUP_DIR/exam_db_${TIMESTAMP}.sql.gz"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "exam_db_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "[$(date)] Backup complete: exam_db_${TIMESTAMP}.sql.gz"
