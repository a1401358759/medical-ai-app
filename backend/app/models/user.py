from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    avatar = Column(String, nullable=True)  # 头像文件路径
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # 用户设置字段
    settings = Column(JSON, default=lambda: {
        "preferred_model": "openai",
        "api_keys": {
            "openai": "",
            "deepseek": "",
            "anthropic": "",
            "kimi": ""
        },
        "base_urls": {
            "openai": "https://api.openai.com/v1",
            "deepseek": "https://api.deepseek.com/v1",
            "kimi": "https://api.moonshot.cn/v1"
        }
    })
