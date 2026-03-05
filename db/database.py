"""
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

# Строка подключения к SQLite с использованием асинхронного драйвера aiosqlite
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./teeth_annotation.db"


# Асинхронный движок SQLAlchemy, общий для всего приложения.
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)


# Фабрика асинхронных сессий
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""
    pass


async def get_db():
    """Зависимость для получения асинхронной сессии в обработчиках."""
    async with AsyncSessionLocal() as session:
        yield session
