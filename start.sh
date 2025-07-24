#!/bin/bash

echo "启动医疗AI助手..."

# 检查是否在正确的目录
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 启动后端
echo "启动后端服务..."
cd backend

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cat > .env << 'ENVEOF'
# AI 模型配置
# 选择使用的模型: openai, deepseek, anthropic, kimi, mock
AI_MODEL=mock

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# DeepSeek 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Anthropic (Claude) 配置
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Kimi 配置 (通过 Moonshot API)
KIMI_API_KEY=your_kimi_api_key_here
KIMI_BASE_URL=https://api.moonshot.cn/v1

# 应用配置
SECRET_KEY=your_secret_key_here_change_this_in_production
DATABASE_URL=sqlite:///./medical_ai.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVEOF
    echo "请编辑 backend/.env 文件，选择 AI 模型并设置相应的 API Key"
    echo "支持的模型：openai, deepseek, anthropic, kimi, mock"
fi

echo "后端服务将在 http://localhost:8000 启动"
python main.py &
BACKEND_PID=$!

# 启动前端
echo "启动前端服务..."
cd ../frontend
npm install
echo "前端服务将在 http://localhost:3000 启动"
npm start &
FRONTEND_PID=$!

echo "应用已启动！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo "模型信息: http://localhost:8000/api/system/model-info"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
