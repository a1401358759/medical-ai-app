import shutil
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserSettingsUpdate
from app.utils.auth import get_current_active_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/settings")
def get_user_settings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户设置"""
    if not current_user.settings:
        # 如果用户没有设置，返回默认设置
        default_settings = {
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
                "anthropic": "",
                "kimi": "https://api.moonshot.cn/v1"
            }
        }
        current_user.settings = default_settings
        db.commit()
        db.refresh(current_user)

    return current_user.settings


@router.put("/settings")
def update_user_settings(
    settings: UserSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新用户设置"""
    # 直接替换整个设置对象
    current_user.settings = {
        "preferred_model": settings.preferred_model,
        "api_keys": settings.api_keys,
        "base_urls": settings.base_urls
    }

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {"message": "设置更新成功", "settings": current_user.settings}


@router.get("/available-models")
def get_available_models():
    """获取可用的AI模型列表"""
    return {
        "models": [
            {
                "id": "openai",
                "name": "OpenAI GPT-4",
                "description": "OpenAI的GPT-4模型，提供强大的自然语言处理能力",
                "base_url": "https://api.openai.com/v1"
            },
            {
                "id": "deepseek",
                "name": "DeepSeek Chat",
                "description": "DeepSeek的聊天模型，支持中文对话",
                "base_url": "https://api.deepseek.com/v1"
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "description": "Anthropic的Claude模型，注重安全性和准确性",
                "base_url": None
            },
            {
                "id": "kimi",
                "name": "Kimi (Moonshot)",
                "description": "通过Moonshot API访问的Kimi模型",
                "base_url": "https://api.moonshot.cn/v1"
            }
        ]
    }


# 创建头像存储目录
AVATAR_DIR = Path("avatars")
AVATAR_DIR.mkdir(exist_ok=True)


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 检查文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="只能上传图片文件")

    # 检查文件大小 (限制为5MB)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过5MB")

    # 生成文件名
    file_extension = Path(file.filename).suffix
    filename = f"avatar_{current_user.id}{file_extension}"
    file_path = AVATAR_DIR / filename

    # 保存文件
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="文件保存失败")

    # 更新用户头像路径
    current_user.avatar = str(file_path)
    db.commit()

    return {"message": "头像上传成功", "avatar_path": str(file_path)}


@router.get("/avatar/{filename}")
async def get_avatar(filename: str):
    file_path = AVATAR_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="头像文件不存在")
    return FileResponse(file_path)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
