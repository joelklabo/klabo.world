#!/bin/bash

# Backup script for PostgreSQL database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if using container or direct PostgreSQL
if command -v container &> /dev/null; then
    echo "Creating backup using Apple container..."
    container exec blog-postgres pg_dump -U bloguser blog > $BACKUP_FILE
else
    echo "Creating backup using local PostgreSQL..."
    PGPASSWORD=localpass pg_dump -h localhost -U bloguser blog > $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Keep only last 10 backups
    cd $BACKUP_DIR
    ls -t backup_*.sql | tail -n +11 | xargs rm -f 2>/dev/null
    cd ..
else
    echo "Backup failed!"
    exit 1
fi