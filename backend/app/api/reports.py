import os
from datetime import datetime
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import ChatMessageResponse
from app.services.ai_service import ai_service
from app.utils.auth import get_current_active_user

router = APIRouter()


class ReportAnalysisRequest(BaseModel):
    session_id: Optional[int] = None


@router.post("/upload", response_model=ChatMessageResponse)
async def upload_report(
    file: UploadFile = File(...),
    session_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 检查文件类型
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 PDF 和 DOCX 文件")

    # 如果没有提供session_id，创建一个新的会话
    if session_id is None:
        session = ChatSession(
            user_id=current_user.id,
            title=f"报告分析 - {file.filename}"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        # 验证会话所有权
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

    # 保存文件
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, f"{current_user.id}_{file.filename}")

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # 处理文档内容
    file_type = "pdf" if file.content_type == "application/pdf" else "docx"
    try:
        document_content = ai_service.process_document(file_path, file_type)
        if not document_content or document_content.startswith("文档处理失败"):
            raise Exception("文档处理失败")
    except Exception as e:
        print(f"文档处理错误: {e}")
        document_content = "文档内容提取失败，请检查文件格式是否正确。"

    # 分析报告
    try:
        analysis = await ai_service.analyze_report(document_content)
        if not analysis or analysis.startswith("报告分析失败"):
            raise Exception("AI分析失败")
    except Exception as e:
        print(f"AI分析错误: {e}")
        analysis = "抱歉，AI分析服务暂时不可用，请稍后重试。"

    # 创建用户上传消息
    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        content=f"上传了医疗报告：{file.filename}",
        message_type="report_upload",
        filename=file.filename,
        file_path=file_path
    )
    db.add(user_message)

    # 创建AI分析消息
    content_summary = document_content[:300] + "..." if len(document_content) > 300 else document_content
    ai_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=f"📋 **报告分析完成**\n\n📄 **报告内容摘要：**\n{content_summary}\n\n🤖 **AI 分析结果：**\n{analysis}",
        message_type="report_analysis",
        filename=file.filename,
        file_path=file_path
    )
    db.add(ai_message)

    # 更新会话时间
    session.updated_at = datetime.now()

    db.commit()
    db.refresh(ai_message)

    return ai_message


@router.get("/", response_model=List[ChatMessageResponse])
def get_reports(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # 获取所有报告相关的消息
    reports = db.query(ChatMessage).filter(
        ChatMessage.session_id.in_(
            db.query(ChatSession.id).filter(ChatSession.user_id == current_user.id)
        ),
        ChatMessage.message_type.in_(["report_upload", "report_analysis"])
    ).order_by(ChatMessage.created_at.desc()).all()
    return reports


@router.get("/{message_id}", response_model=ChatMessageResponse)
def get_report(message_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    report = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.message_type.in_(["report_upload", "report_analysis"]),
        ChatMessage.session_id.in_(
            db.query(ChatSession.id).filter(ChatSession.user_id == current_user.id)
        )
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report
