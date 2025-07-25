"""
PostgreSQL 数据库配置
用于生产环境的PostgreSQL数据库连接
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# 数据库连接配置
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required for PostgreSQL")

# PostgreSQL 引擎配置
engine = create_engine(
    DATABASE_URL,
    # 连接池配置
    poolclass=QueuePool,
    pool_size=20,              # 连接池大小
    max_overflow=30,           # 最大溢出连接数
    pool_pre_ping=True,        # 连接前ping检查
    pool_recycle=3600,         # 1小时后回收连接
    pool_timeout=30,           # 连接超时时间

    # 性能优化
    echo=False,                # 不显示SQL语句
    echo_pool=False,           # 不显示连接池信息

    # 连接参数
    connect_args={
        "connect_timeout": 10,  # 连接超时
        "application_name": "medical_ai_app",  # 应用名称
        "options": "-c timezone=utc"  # 设置时区
    }
)

# 会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 基础模型类
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库"""
    # 导入所有模型以确保它们被注册
    from app.models import Base

    # 创建所有表
    Base.metadata.create_all(bind=engine)


def check_db_connection():
    """检查数据库连接"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False


# 数据库健康检查
def health_check():
    """数据库健康检查"""
    try:
        with engine.connect() as conn:
            # 检查连接
            result = conn.execute("SELECT 1 as health_check")
            if result.scalar() == 1:
                return {"status": "healthy", "database": "postgresql"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

    return {"status": "unknown"}
