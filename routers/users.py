"""
Роутер для работы с пользователями.

Содержит обработчики для:
- создания пользователя;
- получения токена для доступа;
- получения текущего пользователя.
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import db.models as models
from auth import (CurrentUser, create_access_token, verify_password)
from config import ANNOTATION_RANGE, settings
from db.database import get_db
from schemas import Token, UserCreate, UserPrivate, UserPublic

# Роутер для работы с пользователями.
router = APIRouter()

@router.post(
    "/create",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    user: UserCreate, 
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Создание пользователя.
    Принимает пользователя, текущего пользователя, базу данных,
    проверяет роль текущего пользователя,
    проверяет наличие пользователя в базе данных,
    создает нового пользователя в базе данных,
    возвращает нового пользователя.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать пользователей",
        )
    
    result = await db.execute(
        select(models.User).where(
            func.lower(models.User.name) == user.name.lower(),
        ),
    )
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует",
        )

    result = await db.execute(
        select(models.User).where(models.User.phone_number == user.phone_number),
    )
    existing_phone = result.scalars().first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Номер телефона уже зарегистрирован",
        )

    new_user = models.User(
        name=user.name,
        phone_number=user.phone_number,
        role = user.role
    )
    db.add(new_user)

    if user.role in ["teacher", "resident"]:

        result = await db.execute(
            select(func.count())
            .select_from(models.User)
            .where(models.User.role.in_(["teacher", "resident"]))
        )
        count = result.scalar_one()

        start = ((count - 1) // 2) * ANNOTATION_RANGE + 1
        end = start + ANNOTATION_RANGE -1
        new_user.current_tooth = start
        new_user.range_start = start
        new_user.range_end = end

    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Получение токена для доступа.
    Принимает форму данных, базу данных,
    проверяет наличие пользователя в базе данных,
    проверяет роль пользователя,
    создает токен для доступа,
    возвращает токен для доступа.
    """
    result = await db.execute(
        select(models.User).where(
            models.User.phone_number == form_data.username,
        ),
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный номер телефона",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(models.Role).where(models.Role.name == user.role),
    )
    role = result.scalars().first()

    if not verify_password(form_data.password, role.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserPrivate)
async def get_current_user(
    current_user: CurrentUser,
):
    """
    Получение текущего пользователя.
    """
    return current_user
