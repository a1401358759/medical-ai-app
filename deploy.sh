#!/bin/bash

# 医疗AI助手 Docker 部署脚本

set -e

echo "🚀 开始部署医疗AI助手..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件，正在从模板创建..."
    cp env.example .env
    echo "📝 请编辑.env文件，配置必要的环境变量"
    echo "   特别是AI模型的API密钥"
    read -p "按回车键继续..."
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查健康状态..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 前端服务健康"
else
    echo "❌ 前端服务不健康"
fi

if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ 后端服务健康"
else
    echo "❌ 后端服务不健康"
fi

echo ""
echo "🎉 部署完成！"
echo "📱 前端访问地址: http://localhost"
echo "🔧 后端API地址: http://localhost:8000"
echo "📊 数据库端口: localhost:5432"
echo ""
echo "📝 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  更新服务: docker-compose pull && docker-compose up -d"
