from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserSettings(BaseModel):
    preferred_model: str = "openai"
    api_keys: Dict[str, str] = {
        "openai": "",
        "deepseek": "",
        "anthropic": "",
        "kimi": ""
    }
    base_urls: Dict[str, str] = {
        "openai": "https://api.openai.com/v1",
        "deepseek": "https://api.deepseek.com/v1",
        "anthropic": "",
        "kimi": "https://api.moonshot.cn/v1"
    }


class UserSettingsUpdate(BaseModel):
    """用户设置更新模型，接收整个设置对象"""
    preferred_model: str
    api_keys: Dict[str, str]
    base_urls: Dict[str, str]


class User(UserBase):
    id: int
    avatar: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    settings: Optional[UserSettings] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    avatar: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
