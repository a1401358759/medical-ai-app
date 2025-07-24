import os
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import tempfile

from app.database import get_db
from app.schemas.report import ReportResponse
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.models.report import MedicalReport
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/upload", response_model=ReportResponse)
async def upload_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 检查文件类型
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 PDF 和 DOCX 文件")
    
    # 保存文件
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{current_user.id}_{file.filename}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # 处理文档内容
    file_type = "pdf" if file.content_type == "application/pdf" else "docx"
    content = ai_service.process_document(file_path, file_type)
    
    # 分析报告
    analysis = await ai_service.analyze_report(content, file_type)
    
    # 保存到数据库
    report = MedicalReport(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        content=content,
        analysis=analysis
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

@router.get("/", response_model=List[ReportResponse])
def get_reports(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).all()
    return reports

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report
