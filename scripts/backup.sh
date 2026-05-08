#!/bin/bash

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hrms_backup_$DATE.tar.gz"

echo "=== HRMS备份脚本 ==="

mkdir -p $BACKUP_DIR

echo "备份数据库..."
docker exec hrms-mysql mysqldump -uroot -p$DB_PASSWORD hrms > $BACKUP_DIR/db_backup_$DATE.sql

echo "备份文件..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads

echo "备份配置..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env.production nginx/nginx.conf

echo "合并备份..."
tar -czf $BACKUP_FILE -C $BACKUP_DIR db_backup_$DATE.sql uploads_$DATE.tar.gz config_$DATE.tar.gz

echo "清理旧备份..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_FILE"