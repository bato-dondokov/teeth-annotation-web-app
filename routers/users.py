"""
User management router.

Contains handlers for:
- Creating a user.
- Obtaining an access token.
- Retrieving the current user.

---
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
from config import settings
from db.database import get_db
from schemas import Token, UserCreate, UserPrivate, UserPublic, LoginForm

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
    Create a user.
    Accepts the new user data, the current user, and the database session;
    verifies the current user's role, checks if the user already exists 
    in the database, creates a new user record, and returns the created user.

    ---
    Создание пользователя.
    Принимает пользователя, текущего пользователя, базу данных,
    проверяет роль текущего пользователя,
    проверяет наличие пользователя в базе данных,
    создает нового пользователя в базе данных,
    возвращает нового пользователя.
    """
    if current_user.role != 'Administrator':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="register_only_admin2",
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
            detail="register_user_already_exist",
        )

    result = await db.execute(
        select(models.User).where(models.User.phone_number == user.phone_number),
    )
    existing_phone = result.scalars().first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="register_phonenumber_exist",
        )

    new_user = models.User(
        name=user.name,
        phone_number=user.phone_number,
        role = user.role
    )
    db.add(new_user)

    if user.role in ["Teacher", "Resident"]:

        result = await db.execute(
            select(func.count())
            .select_from(models.User)
            .where(models.User.role.in_(["Teacher", "Resident"]))
        )
        count = result.scalar_one()

        start = ((count - 1) // 2) * settings.annotation_range + 1
        end = start + settings.annotation_range -1
        new_user.current_tooth = start
        new_user.range_start = start
        new_user.range_end = end

    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: LoginForm,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Obtain an access token.
    Accepts form data and the database session; verifies the user exists 
    in the database, checks the user's role, generates an access token, 
    and returns it.

    ---
    Получение токена для доступа.
    Принимает форму данных, базу данных,
    проверяет наличие пользователя в базе данных,
    проверяет роль пользователя,
    создает токен для доступа,
    возвращает токен для доступа.
    """
    result = await db.execute(
        select(models.User).where(
            models.User.phone_number == form_data.phone_number,
        ),
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong_phone_number",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != form_data.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong_user_status",
            headers={"WWW-Authenticate": "Bearer"},
        )
    

    result = await db.execute(
        select(models.Role).where(models.Role.name == user.role),
    )
    role = result.scalars().first()

    if not verify_password(form_data.access_code, role.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong_access_code",
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
    Retrieve the current user.
    
    ---
    Получение текущего пользователя.
    """
    return current_user
