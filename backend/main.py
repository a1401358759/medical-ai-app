from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, reports, users, system
from app.database import engine
from app.models import Base

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="医疗AI助手 API",
    description="基于 LangChain 的智能医疗问答系统，支持多种 AI 模型",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(chat.router, prefix="/api/chat", tags=["聊天"])
app.include_router(reports.router, prefix="/api/reports", tags=["报告"])
app.include_router(system.router, prefix="/api/system", tags=["系统"])

@app.get("/")
async def root():
    return {"message": "医疗AI助手 API 服务运行中"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
