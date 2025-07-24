# AI 模型配置指南

本应用支持多种 AI 模型，您可以根据需要选择合适的模型。

## 支持的模型

### 1. OpenAI GPT-4 (推荐)
- **模型名称**: `openai`
- **特点**: 功能强大，医疗知识丰富
- **费用**: 按使用量计费
- **配置**:
  ```env
  AI_MODEL=openai
  OPENAI_API_KEY=your_openai_api_key
  OPENAI_BASE_URL=https://api.openai.com/v1
  ```

### 2. DeepSeek
- **模型名称**: `deepseek`
- **特点**: 中文能力强，性价比高
- **费用**: 相对较低
- **配置**:
  ```env
  AI_MODEL=deepseek
  DEEPSEEK_API_KEY=your_deepseek_api_key
  DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
  ```

### 3. Anthropic Claude
- **模型名称**: `anthropic`
- **特点**: 安全性高，医疗建议谨慎
- **费用**: 中等
- **配置**:
  ```env
  AI_MODEL=anthropic
  ANTHROPIC_API_KEY=your_anthropic_api_key
  ```

### 4. Kimi (通过 Moonshot)
- **模型名称**: `kimi`
- **特点**: 中文优化，知识更新及时
- **费用**: 较低
- **配置**:
  ```env
  AI_MODEL=kimi
  KIMI_API_KEY=your_kimi_api_key
  KIMI_BASE_URL=https://api.moonshot.cn/v1
  ```

### 5. 模拟模式 (免费)
- **模型名称**: `mock`
- **特点**: 无需 API Key，用于测试
- **费用**: 免费
- **配置**:
  ```env
  AI_MODEL=mock
  ```

## 获取 API Key

### OpenAI
1. 访问 https://platform.openai.com/
2. 注册账户并登录
3. 在 API Keys 页面创建新的 API Key
4. 复制 API Key

### DeepSeek
1. 访问 https://platform.deepseek.com/
2. 注册账户并登录
3. 在 API 管理页面创建 API Key
4. 复制 API Key

### Anthropic (Claude)
1. 访问 https://console.anthropic.com/
2. 注册账户并登录
3. 在 API Keys 页面创建新的 API Key
4. 复制 API Key

### Kimi (Moonshot)
1. 访问 https://platform.moonshot.cn/
2. 注册账户并登录
3. 在 API 管理页面创建 API Key
4. 复制 API Key

## 配置步骤

### 1. 选择模型
编辑 `backend/.env` 文件，设置 `AI_MODEL` 参数：
```env
AI_MODEL=deepseek  # 或其他模型名称
```

### 2. 设置 API Key
在同一个文件中设置对应模型的 API Key：
```env
# 如果使用 DeepSeek
DEEPSEEK_API_KEY=your_actual_deepseek_api_key

# 如果使用 OpenAI
OPENAI_API_KEY=your_actual_openai_api_key

# 如果使用 Anthropic
ANTHROPIC_API_KEY=your_actual_anthropic_api_key

# 如果使用 Kimi
KIMI_API_KEY=your_actual_kimi_api_key
```

### 3. 重启应用
```bash
# 停止当前服务 (Ctrl+C)
# 重新运行启动脚本
./start.sh
```

## 模型对比

| 模型 | 中文能力 | 医疗知识 | 费用 | 响应速度 | 推荐指数 |
|------|----------|----------|------|----------|----------|
| OpenAI GPT-4 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 高 | 快 | ⭐⭐⭐⭐⭐ |
| DeepSeek | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中 | 快 | ⭐⭐⭐⭐ |
| Anthropic Claude | ⭐⭐⭐ | ⭐⭐⭐⭐ | 中 | 中等 | ⭐⭐⭐ |
| Kimi | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 低 | 快 | ⭐⭐⭐⭐ |
| Mock | ⭐ | ⭐ | 免费 | 快 | ⭐⭐ |

## 测试模式

如果您没有 API Key 或想先测试应用功能，可以使用模拟模式：

```env
AI_MODEL=mock
```

模拟模式会提供预设的医疗建议，适合功能测试。

## 故障排除

### 常见问题

**1. API Key 无效**
- 检查 API Key 是否正确复制
- 确认账户余额充足
- 验证 API Key 权限

**2. 模型响应慢**
- 检查网络连接
- 尝试其他模型
- 查看服务商状态页面

**3. 模型不支持**
- 确认模型名称拼写正确
- 检查是否安装了相应的依赖
- 查看错误日志

### 获取帮助

- 查看 API 文档：http://localhost:8000/docs
- 检查模型状态：http://localhost:8000/api/system/model-info
- 查看后端日志获取详细错误信息

## 成本优化建议

1. **开发阶段**: 使用 Mock 模式
2. **测试阶段**: 使用 Kimi 或 DeepSeek
3. **生产环境**: 根据需求选择 OpenAI 或 DeepSeek
4. **预算有限**: 优先考虑 Kimi 或 DeepSeek

## 安全注意事项

- 不要在代码中硬编码 API Key
- 定期轮换 API Key
- 监控 API 使用量
- 设置合理的使用限制
