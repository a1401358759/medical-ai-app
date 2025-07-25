"""
数据库配置选择器
根据环境变量自动选择数据库类型和配置
"""

import os


# 数据库类型枚举
class DatabaseType:
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"


def get_database_type() -> str:
    """获取数据库类型"""
    database_url = os.getenv("DATABASE_URL", "")

    if database_url.startswith("postgresql://"):
        return DatabaseType.POSTGRESQL
    elif database_url.startswith("mysql://"):
        return DatabaseType.MYSQL
    else:
        return DatabaseType.SQLITE


def get_database_config():
    """根据数据库类型返回相应的配置"""
    database_type = get_database_type()

    if database_type == DatabaseType.POSTGRESQL:
        from .database_postgresql import Base, SessionLocal, check_db_connection, engine, get_db, health_check, init_db
        return {
            "engine": engine,
            "SessionLocal": SessionLocal,
            "Base": Base,
            "get_db": get_db,
            "init_db": init_db,
            "check_db_connection": check_db_connection,
            "health_check": health_check,
            "type": DatabaseType.POSTGRESQL
        }
    else:
        # 默认使用SQLite配置
        from .database import Base, SessionLocal, engine, get_db
        return {
            "engine": engine,
            "SessionLocal": SessionLocal,
            "Base": Base,
            "get_db": get_db,
            "type": DatabaseType.SQLITE
        }


# 导出主要配置
config = get_database_config()
engine = config["engine"]
SessionLocal = config["SessionLocal"]
Base = config["Base"]
get_db = config["get_db"]
database_type = config["type"]

# 可选的高级功能（仅PostgreSQL支持）
init_db = config.get("init_db")
check_db_connection = config.get("check_db_connection")
health_check = config.get("health_check")
