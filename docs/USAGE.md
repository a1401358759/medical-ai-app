# 医疗AI助手使用指南

## 快速开始

### 1. 环境准备

确保您的系统已安装：
- Python 3.8 或更高版本
- Node.js 18 或更高版本
- Git

### 2. 获取 OpenAI API Key

1. 访问 [OpenAI 官网](https://platform.openai.com/)
2. 注册账户并登录
3. 在 API Keys 页面创建新的 API Key
4. 复制 API Key 备用

### 3. 启动应用

#### 方法一：使用启动脚本（推荐）

```bash
# 在项目根目录运行
./start.sh
```

#### 方法二：手动启动

**启动后端：**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 编辑 .env 文件，设置您的 OpenAI API Key
# OPENAI_API_KEY=your_actual_api_key_here

python main.py
```

**启动前端：**
```bash
cd frontend
npm install
npm start
```

### 4. 访问应用

- 前端界面：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 功能使用

### 用户注册和登录

1. 访问 http://localhost:3000
2. 点击"注册新账户"
3. 填写用户信息并注册
4. 使用注册的用户名和密码登录

### 智能医疗问答

1. 登录后自动进入聊天界面
2. 在输入框中输入您的医疗问题
3. AI 将基于医疗知识为您提供建议
4. 支持多轮对话，AI 会记住对话上下文

### 医疗报告分析

1. 点击左侧导航的"报告分析"
2. 上传您的医疗报告（支持 PDF 和 DOCX 格式）
3. AI 将自动分析报告内容
4. 查看分析结果和建议

### 个人资料管理

1. 点击左侧导航的"个人资料"
2. 查看您的账户信息
3. 管理个人设置

## 注意事项

### 医疗免责声明

⚠️ **重要提醒**：
- 本应用提供的医疗建议仅供参考
- 不能替代专业医生的诊断和治疗
- 如有健康问题，请及时就医
- 紧急情况请拨打急救电话

### 数据安全

- 您的个人信息和医疗数据仅存储在本地数据库
- 建议定期备份重要数据
- 不要在公共网络环境下传输敏感医疗信息

### 技术限制

- 需要稳定的网络连接
- OpenAI API 需要有效的 API Key
- 文件上传大小限制为 10MB
- 支持的文档格式：PDF、DOCX

## 故障排除

### 常见问题

**1. 后端启动失败**
- 检查 Python 版本是否为 3.8+
- 确认已安装所有依赖：`pip install -r requirements.txt`
- 检查 .env 文件中的 API Key 是否正确

**2. 前端启动失败**
- 检查 Node.js 版本是否为 18+
- 删除 node_modules 并重新安装：`rm -rf node_modules && npm install`

**3. 聊天功能无响应**
- 检查 OpenAI API Key 是否有效
- 确认网络连接正常
- 查看浏览器控制台是否有错误信息

**4. 文件上传失败**
- 检查文件格式是否为 PDF 或 DOCX
- 确认文件大小不超过 10MB
- 检查后端服务是否正常运行

### 获取帮助

如果遇到问题，请：
1. 查看浏览器控制台错误信息
2. 检查后端服务日志
3. 参考 API 文档：http://localhost:8000/docs
4. 提交 Issue 到项目仓库

## 开发说明

### 后端开发

项目使用 FastAPI 框架，主要文件结构：
```
backend/
├── app/
│   ├── api/          # API 路由
│   ├── models/       # 数据库模型
│   ├── schemas/      # Pydantic 模式
│   ├── services/     # 业务逻辑
│   └── utils/        # 工具函数
├── main.py           # 应用入口
└── requirements.txt  # 依赖列表
```

### 前端开发

项目使用 React 18 + TypeScript，主要文件结构：
```
frontend/
├── src/
│   ├── components/   # 可复用组件
│   ├── pages/        # 页面组件
│   ├── services/     # API 服务
│   └── types/        # TypeScript 类型
├── package.json      # 依赖配置
└── tailwind.config.js # 样式配置
```

### 数据库

项目使用 SQLite 作为数据库：
- 轻量级、高性能
- 无需额外安装数据库服务
- 数据存储在 `backend/medical_ai.db` 文件中
