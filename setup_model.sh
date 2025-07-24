#!/bin/bash

echo "医疗AI助手 - 模型配置工具"
echo "=========================="

# 检查是否在正确的目录
if [ ! -f "backend/main.py" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "请选择要使用的 AI 模型："
echo "1) Mock 模式 (免费，无需 API Key)"
echo "2) DeepSeek (中文能力强，性价比高)"
echo "3) Kimi (中文优化，费用较低)"
echo "4) OpenAI GPT-4 (功能最强大)"
echo "5) Anthropic Claude (安全性高)"
echo "6) 手动配置"

read -p "请输入选择 (1-6): " choice

case $choice in
    1)
        MODEL="mock"
        echo "已选择 Mock 模式，无需 API Key"
        ;;
    2)
        MODEL="deepseek"
        read -p "请输入 DeepSeek API Key: " API_KEY
        ;;
    3)
        MODEL="kimi"
        read -p "请输入 Kimi API Key: " API_KEY
        ;;
    4)
        MODEL="openai"
        read -p "请输入 OpenAI API Key: " API_KEY
        ;;
    5)
        MODEL="anthropic"
        read -p "请输入 Anthropic API Key: " API_KEY
        ;;
    6)
        echo "请手动编辑 backend/.env 文件进行配置"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

# 创建或更新 .env 文件
cd backend

if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
fi

# 备份现有文件
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "已备份现有 .env 文件为 .env.backup"
fi

# 创建新的 .env 文件
cat > .env << 'ENVEOF'
# AI 模型配置
AI_MODEL=MODEL_PLACEHOLDER

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# DeepSeek 配置
DEEPSEEK_API_KEY=DEEPSEEK_KEY_PLACEHOLDER
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Anthropic (Claude) 配置
ANTHROPIC_API_KEY=ANTHROPIC_KEY_PLACEHOLDER

# Kimi 配置 (通过 Moonshot API)
KIMI_API_KEY=KIMI_KEY_PLACEHOLDER
KIMI_BASE_URL=https://api.moonshot.cn/v1

# 应用配置
SECRET_KEY=your_secret_key_here_change_this_in_production
DATABASE_URL=sqlite:///./medical_ai.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVEOF

# 替换模型和 API Key
sed -i "s/MODEL_PLACEHOLDER/$MODEL/g" .env

if [ ! -z "$API_KEY" ]; then
    case $MODEL in
        "deepseek")
            sed -i "s/DEEPSEEK_KEY_PLACEHOLDER/$API_KEY/g" .env
            ;;
        "kimi")
            sed -i "s/KIMI_KEY_PLACEHOLDER/$API_KEY/g" .env
            ;;
        "openai")
            sed -i "s/your_openai_api_key_here/$API_KEY/g" .env
            ;;
        "anthropic")
            sed -i "s/ANTHROPIC_KEY_PLACEHOLDER/$API_KEY/g" .env
            ;;
    esac
fi

echo ""
echo "✅ 配置完成！"
echo "选择的模型: $MODEL"
if [ ! -z "$API_KEY" ]; then
    echo "API Key: ${API_KEY:0:8}..."
fi
echo ""
echo "现在可以启动应用："
echo "./start.sh"
echo ""
echo "或者查看配置："
echo "cat backend/.env"
