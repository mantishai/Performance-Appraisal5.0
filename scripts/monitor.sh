#!/bin/bash

echo "=== HRMS监控脚本 ==="

check_service() {
    if curl -f -s -o /dev/null $1; then
        echo "✅ $2: 正常"
    else
        echo "❌ $2: 异常"
    fi
}

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ 磁盘使用率: ${DISK_USAGE}%"
fi

MEM_USAGE=$(free | awk 'NR==2 {print int($3/$2*100)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "⚠️ 内存使用率: ${MEM_USAGE}%"
fi

check_service "http://localhost/health" "Web服务"
check_service "http://localhost:8080/health" "API服务"

docker exec hrms-mysql mysqladmin ping -h localhost -uroot -p$DB_PASSWORD > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 数据库: 正常"
else
    echo "❌ 数据库: 异常"
fi