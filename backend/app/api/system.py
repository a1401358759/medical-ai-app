from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy", "message": "医疗AI助手服务运行正常"}
