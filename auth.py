"""
Модуль аутентификации и авторизации.
Содержит:
- функции для хеширования и проверки паролей;
- создание и проверку JWT access‑токенов;
- зависимость FastAPI для получения текущего пользователя по токену;
- алиас типа `CurrentUser` для удобной типизации зависимостей.
"""
from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import db.models as models
from db.database import get_db

# Конфигурация алгоритма хеширования паролей (рекомендуемые параметры pwdlib).
password_hash = PasswordHash.recommended()
# Схема OAuth2 с использованием Bearer‑токена для эндпоинта выдачи токена.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/token")


def hash_password(password: str) -> str:
    """
    Возвращает хеш пароля.
    Использует настроенный алгоритм из pwdlib.PasswordHash.recommended().
    Хеш сохраняется в базе вместо исходного пароля.
    """
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет соответствие пароля и его хеша.
    :param plain_password: пароль в открытом виде, введённый пользователем.
    :param hashed_password: хеш пароля из базы данных.
    :return: True, если пароль корректен, иначе False.
    """
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Создаёт JWT access‑токен.
    В payload добавляется поле "exp" с временем истечения:
    - если передан expires_delta — используется он;
    - иначе берётся значение из settings.access_token_expire_minutes.
    :param data: словарь с данными для включения в токен (например, {"sub": user_id}).
    :param expires_delta: дополнительное время жизни токена.
    :return: строка с закодированным JWT.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes,
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def verify_access_token(token: str) -> str | None:
    """
    Проверяет JWT access‑токен и возвращает subject (id пользователя), если токен валиден.
    Декодирует токен с использованием секретного ключа и алгоритма из настроек.
    Требует наличия полей "exp" и "sub" в payload. При любой ошибке декодирования
    или неверном токене возвращает None.
    :param token: строка JWT‑токена.
    :return: значение "sub" (обычно строковый id пользователя) или None.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload.get("sub")
    

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> models.User:
    """
    Возвращает текущего пользователя на основе переданного JWT‑токена.
    Шаги:
    - извлекает токен из запроса через OAuth2PasswordBearer;
    - проверяет токен функцией verify_access_token() и получает user_id;
    - валидирует, что user_id можно привести к int;
    - делает запрос к базе данных для поиска пользователя с таким id;
    - при отсутствии пользователя или любой проблеме с токеном выбрасывает
      HTTP 401 Unauthorized с соответствующим сообщением.
    Используется как зависимость в обработчиках FastAPI, требующих аутентификации.
    :raises HTTPException: при невалидном/просроченном токене или отсутствии пользователя.
    :return: ORM‑объект пользователя (models.User).
    """
    user_id = verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(models.User).where(models.User.id == user_id_int),
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Алиас для использования в зависимостях FastAPI:
CurrentUser = Annotated[models.User, Depends(get_current_user)]