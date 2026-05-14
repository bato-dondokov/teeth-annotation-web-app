"""
Asynchronous database configuration module.

Provides:
- `SQLALCHEMY_DATABASE_URL`: Database connection string.
- `engine`: Asynchronous SQLAlchemy engine instance.
- `AsyncSessionLocal`: Factory for creating asynchronous sessions.
- `Base`: Declarative base class for ORM models.
- `get_db`: Dependency provider for obtaining async sessions in request handlers.

---

Модуль конфигурации асинхронного подключения к базе данных.

Создаёт:
- строку подключения к БД `SQLALCHEMY_DATABASE_URL`;
- асинхронный движок SQLAlchemy `engine`;
- фабрику асинхронных сессий `AsyncSessionLocal`;
- базовый класс ORM-моделей `Base`;
- зависимость `get_db` для получения асинхронной сессии в обработчиках.
"""
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)
from sqlalchemy.orm import DeclarativeBase
from config import settings


# MySQL connection string using the aiomysql async driver.
# Строка подключения к MySQL с использованием асинхронного драйвера aiomysql.
SQLALCHEMY_DATABASE_URL = (
    "mysql+aiomysql://"
    f"{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}"
    f"/{settings.db_name}"
)


# Application-wide asynchronous SQLAlchemy engine.
# Асинхронный движок SQLAlchemy, общий для всего приложения.
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)


# Asynchronous session factory for database operations.
# Фабрика асинхронных сессий для операций с базой данных.
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    
    ---
    Базовый класс для всех ORM-моделей.
    """
    pass


async def get_db():
    """
    Async session dependency for request handlers.

    ---
    Зависимость для получения асинхронной сессии в обработчиках.
    """
    async with AsyncSessionLocal() as session:
        yield session
