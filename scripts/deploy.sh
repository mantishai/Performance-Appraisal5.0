#!/bin/bash

echo "=== HRMS部署脚本 ==="

echo "拉取代码..."
git pull origin main

echo "安装依赖..."
npm install

echo "运行测试..."
npm run test

echo "构建项目..."
npm run build

echo "停止旧容器..."
docker-compose -f docker/docker-compose.yml down

echo "启动新容器..."
docker-compose -f docker/docker-compose.yml up -d --build

echo "健康检查..."
sleep 5
curl -f http://localhost/health || exit 1

echo "部署完成！"