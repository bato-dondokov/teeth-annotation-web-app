"""
Роутер для работы с администраторами.

Содержит обработчики для:
- загрузки снимков;
- загрузки базы данных;
- загрузки Excel-файла с данными пользователей.
"""
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Annotated, List

import pandas as pd
from fastapi import (APIRouter, Depends, File, HTTPException,
                     UploadFile, status)
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

import db.models as models
from auth import CurrentUser
from config import ANNOTATION_RANGE, TEETH_DIR, XRAYS_DIR, settings
from db.database import get_db
from dependencies import get_detector
from excel_utils import read_excel_from_bytes, extract_first_phone
from xray2img import Xray2Teeth

# Роутер для работы с администраторами.
router = APIRouter()

@router.post("/xray-upload/")
async def upload_images(db: Annotated[AsyncSession, Depends(get_db)],
                        current_user: CurrentUser,
                        detector: Xray2Teeth = Depends(get_detector),
                        files: List[UploadFile] = File(...)):
    """
    Загрузка снимков.
    Принимает список файлов, проверяет роль пользователя,
    сохраняет файлы в папку с рентгеновскими снимками,
    получает изображения зубов из снимков, используя модель обнаружения объектов,
    сохраняет изображения зубов в папку с изображениями зубов,
    сохраняет информацию о снимке и изображениях зубов в базу данных.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут загружать снимки",
        )
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файлы не загружены",
        )
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Слишком много файлов. Максимум 10 файлов.",
        )
    
    saved_files = []

    for file in files:
        extension = Path(file.filename).suffix
        unique_name = f"{uuid.uuid4()}{extension}"
        save_path = XRAYS_DIR + unique_name

        with open(save_path, "wb") as buffer:
            buffer.write(await file.read())

        result = await db.execute(
            select(models.Xray).where(
                func.lower(models.Xray.file_name) == unique_name.lower(),
            ),
        )
        existing_xray = result.scalars().first()
        if existing_xray:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл с таким именем уже существует",
            )
        if not existing_xray:
            new_xray = models.Xray(file_name=unique_name)
            db.add(new_xray)
            await db.flush() 
            detector.XRAY_FILE = save_path
            try:
                detector.process()
                xray_id = new_xray.id
                teeth = os.listdir(os.path.join(TEETH_DIR, unique_name[:-4]))
                for tooth in teeth:
                    tooth_path = os.path.join(
                        TEETH_DIR, 
                        unique_name[:-4], 
                        tooth, 
                        tooth+'.png')
                    cropped_tooth_path = os.path.join(
                        TEETH_DIR, 
                        unique_name[:-4], 
                        tooth, 
                        tooth+'-cropped.png')
                    is_tooth_exist = await db.execute(
                        select(models.Tooth).where(
                            models.Tooth.file_name == tooth_path,
                            models.Tooth.xray_id == xray_id
                        )
                    )
                    if not is_tooth_exist.scalars().first():
                        new_tooth = models.Tooth(
                            file_name=tooth_path, 
                            cropped_file_name=cropped_tooth_path,
                            xray_id=xray_id
                        )
                        db.add(new_tooth)
                        await db.flush()
                await db.commit()                
            except Exception as err:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Ошибка при загрузке снимков: {err}",
                )
            saved_files.append(unique_name)
    return {"files": saved_files}


# @router.post("/dbdownload/")
# async def download_db(current_user: CurrentUser):
#     """
#     Скачивание базы данных.
#     Принимает текущего пользователя, проверяет роль пользователя,
#     возвращает файл с базой данных.
#     """
#     if current_user.role != 'admin':
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Только администраторы могут скачивать базу данных",
#         )
    
#     try:
#         now = datetime.now().strftime("%Y-%m-%d")
#         filename = f"backup_{now}.db"
#         return FileResponse(
#             path=DB_FILE,
#             filename=filename,
#             media_type="application/x-sqlite3"
#         )
#     except Exception as err:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Ошибка при скачивании базы данных: {err}",
#         )


@router.post("/excel-upload/")
async def upload_images(db: Annotated[AsyncSession, Depends(get_db)],
                        current_user: CurrentUser,
                        file: UploadFile):
    """
    Загрузка Excel-файла с данными пользователей.
    Принимает файл, проверяет роль пользователя,
    читает данные из файла,
    сохраняет данные в базу данных.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут загружать файлы",
        )
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл не загружен",
        )
    
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Неверный тип файла. "
                    "Пожалуйста, загрузите файл Excel (.xlsx)."),
        )
    
    content = await file.read()

    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(f"Файл слишком большой. Максимальный размер: "
                    f"{settings.max_upload_size_bytes // (1024 * 1024)}MB"),
        )

    try:
        df = await run_in_threadpool(read_excel_from_bytes, content)
        FIO_COLUMN = "ФИО"
        PHONE_COLUMN = "Телефон"
        if FIO_COLUMN not in df.columns or PHONE_COLUMN not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("Необходимые столбцы отсутствуют (ФИО, Телефон)"),
            )
        
        inserted = 0

        for index, row in df.iterrows():
            fio = row[FIO_COLUMN]
            phone_raw = row[PHONE_COLUMN]
            if pd.isna(fio) or pd.isna(phone_raw):
                continue

            phone = extract_first_phone(str(phone_raw))
            print(phone)
            if not phone:
                continue

            new_user = models.User(
                name=fio,
                phone_number=phone,
                role = 'resident'
            )
            db.add(new_user)

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

            inserted += 1
        await db.commit()
        return {'insert_count': inserted}
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при загрузке Excel-файла: {err}",
        )