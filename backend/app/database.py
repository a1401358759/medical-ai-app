import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./medical_ai.db")

# 根据数据库类型配置连接参数
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL 配置
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # 连接前ping检查
        pool_recycle=300,    # 5分钟后回收连接
        pool_size=10,        # 连接池大小
        max_overflow=20      # 最大溢出连接数
    )
else:
    # SQLite 配置（开发环境）
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
