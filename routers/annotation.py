"""
Router for tooth annotation operations.

Contains handlers for:
- Retrieving a tooth image.
- Retrieving a cropped tooth image.
- Saving a tooth annotation response.

---
Роутер для работы с разметкой зубов.

Содержит обработчики для:
- получения изображения зуба;
- получения изображения зуба с урезанным изображением;
- сохранения ответа на разметку зуба.
"""
import os
from typing import Annotated


from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import db.models as models
from auth import CurrentUser
from db.database import get_db
from schemas import AnnotationRequest

router = APIRouter()

@router.get("/tooth/{tooth_id}")
async def get_tooth(
    current_user: CurrentUser,
    tooth_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Retrieve a tooth image.
    Accepts the current user, tooth ID, and database session; verifies 
    the user's role, fetches the tooth image from the database, 
    and returns the image file.

    ---
    Получение изображения зуба.
    Принимает текущего пользователя, id зуба, базу данных,
    проверяет роль пользователя,
    получает изображение зуба из базы данных,
    возвращает изображение зуба.
    """

    if current_user.role not in ['Resident', 'Teacher']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to annotate scans.",
        )
    result = await db.execute(
        select(models.Tooth).where(models.Tooth.id == tooth_id)
    )
    tooth = result.scalars().first()
    
    if not tooth or not os.path.exists(tooth.file_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scans available for annotation. Please contact your teacher.",
        ) 
    filename = tooth.file_name
    return FileResponse(
        path=filename,
        media_type="image/png",
    )


@router.post("/tooth_cropped/{tooth_id}")
async def get_cropped_tooth(
    current_user: CurrentUser,
    tooth_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Retrieve a cropped tooth image.
    Accepts the current user, tooth ID, and database session; verifies 
    the user's role, fetches the cropped tooth image from the database, 
    and returns the cropped image file.

    ---
    Получение изображения зуба с урезанным изображением.
    Принимает текущего пользователя, id зуба, базу данных,
    проверяет роль пользователя,
    получает изображение зуба с урезанным изображением из базы данных,
    возвращает изображение зуба с урезанным изображением.
    """
    if current_user.role not in ['Resident', 'Teacher']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to annotate scans.",
        )
    result = await db.execute(
        select(models.Tooth).where(models.Tooth.id == tooth_id)
    )
    tooth = result.scalars().first()
    if not tooth or not os.path.exists(tooth.cropped_file_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scans available for annotation. Please contact your teacher.",
        )
    filename = tooth.cropped_file_name
    return FileResponse(
        path=filename,
        media_type="image/png",
    )


@router.post("/save")
async def save_answer(
    current_user: CurrentUser,
    annotation_request: AnnotationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Save tooth annotation response.
    Accepts the current user, an annotation request, and the database session; 
    verifies the user's role, creates a new annotation record in the database, 
    and returns the created response.

    ---
    Сохранение ответа на разметку зуба.
    Принимает текущего пользователя, запрос на разметку зуба, базу данных,
    проверяет роль пользователя,
    создает новый ответ на разметку зуба в базе данных,
    возвращает новый ответ на разметку зуба.
    """
    if current_user.role not in ['Resident', 'Teacher']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to annotate scans.",
        )
    
    new_answer = models.Answer(
        user_id=current_user.id,
        tooth_id=current_user.current_tooth,
        condition_id=annotation_request.condition,
        pathology_id=annotation_request.pathology,
        rec_id=annotation_request.recommendation,
        term_id=annotation_request.term
    )
    db.add(new_answer)

    result = await db.execute(
        select(models.User).where(models.User.id == current_user.id)
    )
    user = result.scalars().first()
    progress = (
        (current_user.current_tooth - user.range_start + 1)
        / (user.range_end - user.range_start + 1)
    ) * 100
    user.progress = int(progress)
    if user.current_tooth < user.range_end and user.current_tooth != 0:
        user.current_tooth += 1
    elif user.current_tooth == user.range_end:
        user.current_tooth = 0
    await db.commit()
    await db.refresh(new_answer)
    return {"message": "Tooth annotation response successfully saved."}