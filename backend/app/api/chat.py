from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionResponse
from app.services.ai_service import ai_service
from app.utils.auth import get_current_active_user

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    session: ChatSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_session = ChatSession(
        user_id=current_user.id,
        title=session.title
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()

    # 修复任何updated_at为None的会话
    for session in sessions:
        if session.updated_at is None:
            session.updated_at = session.created_at or datetime.utcnow()

    db.commit()
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 修复updated_at为None的情况
    if session.updated_at is None:
        session.updated_at = session.created_at or datetime.utcnow()
        db.commit()

    return session


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"开始删除会话 {session_id}")

        # 验证会话所有权
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()

        if not session:
            print(f"会话 {session_id} 不存在或不属于当前用户")
            raise HTTPException(status_code=404, detail="会话不存在")

        print(f"找到会话: {session.title}")

        # 先删除会话相关的所有消息
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
        print(f"找到 {len(messages)} 条消息需要删除")

        for message in messages:
            db.delete(message)

        # 删除会话
        db.delete(session)
        db.commit()

        print(f"成功删除会话 {session_id} 和 {len(messages)} 条消息")
        return {"message": "会话删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除会话失败: {e!s}")


@router.post("/messages", response_model=ChatMessageResponse)
async def create_chat_message(
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    # 获取会话历史
    context = []
    if message.session_id:
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == message.session_id
        ).order_by(ChatMessage.created_at).all()
        context = [{"role": msg.role, "content": msg.content} for msg in history]

        # 更新会话的 updated_at 字段
        session = db.query(ChatSession).filter(ChatSession.id == message.session_id).first()
        if session:
            session.updated_at = datetime.utcnow()

    # 保存用户消息
    user_message = ChatMessage(
        session_id=message.session_id,
        role="user",
        content=message.content
    )
    db.add(user_message)
    db.commit()

    # 获取AI回复
    ai_response = await ai_service.chat(current_user.id, message.content, context)

    # 保存AI回复
    ai_message = ChatMessage(
        session_id=message.session_id,
        role="assistant",
        content=ai_response
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    return ai_message


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 验证会话所有权
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    return messages
