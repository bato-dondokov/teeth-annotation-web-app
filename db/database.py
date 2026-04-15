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
from config import DB_CONFIG

# Строка подключения к MySQL с использованием асинхронного драйвера aiomysql
SQLALCHEMY_DATABASE_URL = (
    "mysql+aiomysql://"
    f"{DB_CONFIG['user']}:{DB_CONFIG['password']}"
    f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}"
    f"/{DB_CONFIG['database']}"
)


# Асинхронный движок SQLAlchemy, общий для всего приложения.
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)


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
