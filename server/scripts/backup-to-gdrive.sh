#!/bin/bash

# Database credentials
DB_USER="$DB_USER"
DB_PASS="$DB_PASS"
DB_NAME="$DB_NAME"
DB_HOST="$DB_HOST"

# Backup directory and filename
BACKUP_DIR="/home/samuel/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database dump
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to Google Drive using rclone
# Make sure you have rclone configured with your Google Drive
RCLONE_CONFIG="/home/samuel/.config/rclone/rclone.conf"
REMOTE_NAME="gdrive"  # Your configured rclone remote name
REMOTE_FOLDER="backups/ProSaleManager"

# Create the remote directory if it doesn't exist
rclone --config "$RCLONE_CONFIG" mkdir "${REMOTE_NAME}:${REMOTE_FOLDER}"

# Upload the backup file
rclone --config "$RCLONE_CONFIG" copy "$BACKUP_FILE" "${REMOTE_NAME}:${REMOTE_FOLDER}/"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE} was uploaded to Google Drive"
