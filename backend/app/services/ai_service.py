# 导入新的多模型 AI 服务
from .multi_ai_service import ai_service

# 为了保持向后兼容，重新导出主要方法
async def chat(user_id: int, message: str, context=None):
    return await ai_service.chat(user_id, message, context)

async def analyze_report(file_content: str, file_type: str):
    return await ai_service.analyze_report(file_content, file_type)

def process_document(file_path: str, file_type: str):
    return ai_service.process_document(file_path, file_type)

def update_vector_store(documents):
    return ai_service.update_vector_store(documents)

def get_model_info():
    return ai_service.get_model_info()
