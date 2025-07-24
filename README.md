# 医疗AI助手

一个基于 LangChain 的智能医疗问答系统，支持用户注册、医疗咨询、报告分析等功能。

## 🆕 新功能：多模型支持

现在支持多种 AI 模型，无需 OpenAI API Key 也能使用：

- 🤖 **OpenAI GPT-4** - 功能强大，医疗知识丰富
- 🇨🇳 **DeepSeek** - 中文能力强，性价比高
- 🛡️ **Anthropic Claude** - 安全性高，医疗建议谨慎
- 🚀 **Kimi** - 中文优化，知识更新及时
- 🧪 **模拟模式** - 无需 API Key，用于测试

详细配置请查看 [AI 模型配置指南](docs/AI_MODELS.md)

## ✨ 最新功能

### 🎨 用户体验优化
- 🌙 **暗色模式** - 支持亮色/暗色主题切换
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 👤 **用户头像** - 支持头像上传和显示
- 🎯 **智能布局** - 聊天界面完美居中，头像与消息分离

### 💬 聊天功能增强
- 🗂️ **会话管理** - 支持多会话创建、删除和管理
- 📤 **报告上传** - 聊天页面直接上传医疗报告
- 🔄 **实时交互** - 流畅的消息发送和接收
- 🎨 **美观界面** - 现代化的聊天气泡设计

### 🔐 用户系统完善
- 👤 **个人资料** - 完整的用户信息管理
- 🖼️ **头像系统** - 支持自定义头像上传
- 🧭 **导航优化** - 顶部导航栏和侧边栏设计
- 🚪 **快速返回** - 标题栏点击返回聊天主页

## 功能特性

- 🔐 用户注册和认证
- 💬 智能医疗问答（支持上下文）
- 📄 医疗报告上传和分析
- 🔍 RAG（检索增强生成）支持
- 🔌 MCP（Model Context Protocol）集成
- 🎨 现代化 React.js 前端
- ⚡ FastAPI 高性能后端
- 🗄️ SQLite 轻量级数据库
- 🤖 多模型 AI 支持
- 🌙 暗色模式支持
- 📱 响应式设计
- 👤 用户头像系统
- 🗂️ 会话管理
- 🎯 智能布局

## 技术栈

### 前端
- React.js 18
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Heroicons
- 响应式设计
- 暗色模式

### 后端
- FastAPI
- LangChain
- SQLite
- SQLAlchemy
- Pydantic
- JWT 认证
- 文件上传处理
- 头像存储

### AI/ML
- 多模型支持（OpenAI, DeepSeek, Anthropic, Kimi）
- LangChain RAG
- MCP 协议
- 向量数据库

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+

### 安装和运行

1. 克隆项目
```bash
git clone <repository-url>
cd medical-ai-app
```

2. 启动应用（推荐）
```bash
./start.sh
```

3. 配置 AI 模型
编辑 `backend/.env` 文件，选择模型并设置 API Key：
```env
# 选择模型：openai, deepseek, anthropic, kimi, mock
AI_MODEL=mock  # 无需 API Key，用于测试

# 如果使用其他模型，设置对应的 API Key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 模型信息: http://localhost:8000/api/system/model-info

## 模型选择建议

### 🧪 开发测试
```env
AI_MODEL=mock
```
无需 API Key，适合功能测试

### 💰 预算有限
```env
AI_MODEL=deepseek
# 或
AI_MODEL=kimi
```
中文能力强，费用较低

### 🏥 生产环境
```env
AI_MODEL=openai
```
功能最强大，医疗知识最丰富

## 配置说明

### 环境变量配置
```env
# AI 模型选择
AI_MODEL=deepseek

# 各模型 API Key
DEEPSEEK_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_api_key
KIMI_API_KEY=your_api_key

# 应用配置
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./medical_ai.db
```

## 主要功能

### 用户管理
- 用户注册和登录
- JWT 令牌认证
- 用户资料管理
- 头像上传和显示

### 智能聊天
- 基于 LangChain 的医疗问答
- 上下文记忆功能
- 多轮对话支持
- 多模型 AI 支持
- 会话管理（创建、删除）
- 美观的聊天界面

### 报告分析
- 支持 PDF 和 DOCX 文件上传
- 自动文档内容提取
- AI 驱动的报告分析
- 聊天页面直接上传

### 界面功能
- 🌙 暗色模式切换
- 📱 响应式设计
- 🎯 智能布局
- 🧭 导航优化
- 👤 头像系统

### RAG 支持
- 向量数据库存储
- 语义搜索
- 知识库检索

## 开发说明

### 后端开发
- 使用 FastAPI 框架
- SQLAlchemy ORM
- SQLite 数据库
- 多模型 LangChain 集成
- 文件上传处理
- 头像存储管理

### 前端开发
- React 18 + TypeScript
- Tailwind CSS 样式
- React Router 路由
- Axios HTTP 客户端
- 响应式设计
- 暗色模式支持
- 现代化 UI 组件

### 数据库
- SQLite 轻量级数据库
- 无需额外安装数据库服务
- 数据存储在 `backend/medical_ai.db` 文件中
- 支持用户头像路径存储

### 文件存储
- 头像文件存储在 `backend/avatars/` 目录
- 支持图片格式验证
- 文件大小限制（5MB）

## 项目结构

```
medical-ai-app/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── models/         # 数据库模型
│   │   ├── schemas/        # Pydantic 模式
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── avatars/            # 用户头像存储
│   └── main.py             # 应用入口
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型
│   │   └── contexts/       # React Context
│   └── package.json
├── docs/                   # 文档
└── README.md
```

## 文档

- [使用指南](docs/USAGE.md)
- [AI 模型配置](docs/AI_MODELS.md)

## 许可证

MIT License
