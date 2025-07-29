from fastapi import APIRouter

from app.services.ai_service import get_model_info

router = APIRouter()


@router.get("/model-info")
def get_ai_model_info():
    """获取当前 AI 模型信息"""
    return get_model_info()


@router.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy", "message": "医疗AI助手服务运行正常"}
