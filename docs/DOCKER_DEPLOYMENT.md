# 医疗AI助手 Docker 部署指南

## 概述

本项目提供了完整的Docker部署方案，包括前端、后端、数据库和缓存服务。

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB RAM
- 至少 10GB 磁盘空间

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd medical-ai-app
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量文件
nano .env
```

**重要配置项：**

```env
# 数据库配置
DATABASE_URL=postgresql://medical_ai_user:medical_ai_password@db:5432/medical_ai

# 安全配置（生产环境请修改）
SECRET_KEY=your-secret-key-here-change-in-production

# AI模型API密钥（必需）
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
KIMI_API_KEY=your-kimi-api-key
```

### 3. 一键部署

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 4. 手动部署（可选）

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 服务架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   Database  │
│   (Nginx)   │◄──►│  (FastAPI)  │◄──►│ (PostgreSQL)│
│   Port 80   │    │  Port 8000  │    │  Port 5432  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    Redis    │
                   │  Port 6379  │
                   └─────────────┘
```

## 服务说明

### 前端服务 (Frontend)
- **镜像**: 基于 Node.js 18 + Nginx
- **端口**: 80
- **功能**: 静态文件服务、API代理、路由处理
- **访问**: http://localhost

### 后端服务 (Backend)
- **镜像**: 基于 Python 3.11 + FastAPI
- **端口**: 8000
- **功能**: API服务、AI模型集成、文件处理
- **访问**: http://localhost:8000

### 数据库服务 (Database)
- **镜像**: PostgreSQL 15
- **端口**: 5432
- **功能**: 数据存储、用户管理、聊天记录
- **数据持久化**: `postgres_data` 卷

### 缓存服务 (Redis)
- **镜像**: Redis 7
- **端口**: 6379
- **功能**: 会话缓存、临时数据存储
- **数据持久化**: `redis_data` 卷

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]
```

### 数据管理

```bash
# 备份数据库
docker-compose exec db pg_dump -U medical_ai_user medical_ai > backup.sql

# 恢复数据库
docker-compose exec -T db psql -U medical_ai_user medical_ai < backup.sql

# 清理数据卷
docker-compose down -v
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d

# 或者使用部署脚本
./deploy.sh
```

## 环境配置

### 开发环境

```bash
# 使用开发配置
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 生产环境

```bash
# 使用生产配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 监控和日志

### 健康检查

```bash
# 检查前端健康状态
curl http://localhost/health

# 检查后端健康状态
curl http://localhost:8000/
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80
   netstat -tulpn | grep :8000

   # 修改docker-compose.yml中的端口映射
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库服务状态
   docker-compose logs db

   # 重启数据库服务
   docker-compose restart db
   ```

3. **API密钥配置错误**
   ```bash
   # 检查环境变量
   docker-compose exec backend env | grep API_KEY

   # 重新配置.env文件
   ```

4. **内存不足**
   ```bash
   # 增加Docker内存限制
   # 或在docker-compose.yml中添加内存限制
   ```

### 性能优化

1. **启用Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

2. **使用多阶段构建**
   - 已在Dockerfile中配置

3. **配置资源限制**
   ```yaml
   # 在docker-compose.yml中添加
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

## 安全建议

1. **修改默认密码**
   - 数据库密码
   - SECRET_KEY
   - API密钥

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   ufw allow 80
   ufw allow 443
   ```

3. **使用HTTPS**
   - 配置SSL证书
   - 使用反向代理

4. **定期更新**
   ```bash
   # 更新镜像
   docker-compose pull
   docker-compose up -d
   ```

## 备份和恢复

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec db pg_dump -U medical_ai_user medical_ai > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 联系支持

如有问题，请查看：
- [项目文档](./docs/)
- [GitHub Issues](https://github.com/your-repo/issues)
- [部署日志](./logs/)
