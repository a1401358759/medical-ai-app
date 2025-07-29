from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
)
from app.services.multi_ai_service import ai_service
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

    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()
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
        session.updated_at = session.created_at or datetime.now()
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
        stmt = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
        session = db.execute(stmt).scalars().first()

        if not session:
            print(f"会话 {session_id} 不存在或不属于当前用户")
            raise HTTPException(status_code=404, detail="会话不存在")

        print(f"找到会话: {session.title}")

        # 先删除会话相关的所有消息
        stmt = delete(ChatMessage).where(ChatMessage.session_id == session_id)
        db.execute(stmt)

        # 删除会话
        db.delete(session)
        db.commit()

        return {"message": "会话删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除会话失败: {e!s}")


@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_chat_session(
    session_id: int,
    session_update: ChatSessionUpdate,
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

    # 更新会话标题
    session.title = session_update.title
    db.commit()
    db.refresh(session)

    return session


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
        stmt = update(ChatSession).where(ChatSession.id == message.session_id).values(updated_at=datetime.now())
        db.execute(stmt)

    # 保存用户消息
    user_message = ChatMessage(
        session_id=message.session_id,
        role="user",
        content=message.content
    )
    db.add(user_message)
    db.commit()

    # 根据用户设置创建AI服务实例
    ai_service.create_user_ai_service(current_user.settings)
    # 获取AI回复
    ai_response = await ai_service.chat(message.content, context)

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


@router.post("/messages/{message_id}/regenerate", response_model=ChatMessageResponse)
async def regenerate_chat_message(
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime

    # 获取要重新生成的消息
    ai_message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.role == "assistant"
    ).first()

    if not ai_message:
        raise HTTPException(status_code=404, detail="消息不存在或不是AI消息")

    # 验证会话所有权
    session = db.query(ChatSession).filter(
        ChatSession.id == ai_message.session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 获取会话历史（不包括要重新生成的消息）
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == ai_message.session_id,
        ChatMessage.created_at < ai_message.created_at
    ).order_by(ChatMessage.created_at).all()

    context = [{"role": msg.role, "content": msg.content} for msg in history]

    # 根据用户设置创建AI服务实例
    ai_service.create_user_ai_service(current_user.settings)

    # 获取AI回复
    ai_response = await ai_service.chat(ai_message.content, context)

    # 更新AI消息内容
    ai_message.content = ai_response
    ai_message.updated_at = datetime.now()

    # 更新会话的 updated_at 字段
    session.updated_at = datetime.now()

    db.commit()
    db.refresh(ai_message)

    return ai_message
