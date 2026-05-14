"""
Dental X-ray Batch Processing & Database Ingestion Script.

This script performs the following workflow:
1. Scans the 'RAW_DATA' directory for new X-ray images (.jpg, .jpeg).
2. Anonymizes files using UUIDs and moves them to the project storage.
3. Initializes the YOLO model to detect individual teeth.
4. Processes each X-ray to generate Oriented Bounding Boxes (OBB).
5. Crops individual teeth and saves them as separate image files.
6. Populates the 'xrays' and 'teeth' database tables while maintaining 
   relational integrity via SQLAlchemy transactions.

RUSSIAN:
Скрипт массовой обработки рентгеновских снимков и загрузки в базу данных.

Основные этапы работы:
1. Сканирование директории 'RAW_DATA' на наличие новых снимков (.jpg, .jpeg).
2. Анонимизация файлов с помощью UUID и перенос в хранилище проекта.
3. Инициализация YOLO модели для обнаружения отдельных зубов.
4. Обработка каждого снимка для получения ориентированных рамок (OBB).
5. Нарезка зубов и сохранение их в виде отдельных изображений.
6. Заполнение таблиц 'xrays' и 'teeth' в БД с соблюдением реляционной 
   целостности через транзакции SQLAlchemy.
"""
import os
import shutil
import json
import uuid
from pathlib import Path

from db.database import engine
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker

from xray2img import Xray2Teeth
from config import settings
from db.models import Xray, Tooth

if __name__=="__main__":
    RAW_DATA = '/Users/docc/PROJECTS/TEETH/test_xrays'
    X2I = Xray2Teeth(settings.model_weights)
    X2I.TEETH_DIR = settings.teeth_dir
    DATABASE_URL = (
        "mysql+pymysql://"
        f"{settings.db_user}:{settings.db_password}"
        f"@{settings.db_host}:{settings.db_port}"
        f"/{settings.db_name}"
    )
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionLocal()

    total_jpg = 0
    for file_name in os.listdir(RAW_DATA):
        if file_name.lower().endswith((".jpg", ".jpeg")):
            total_jpg += 1

    processed = 0

    try:
        for file_name in os.listdir(RAW_DATA):
            if file_name.lower().endswith((".jpg", ".jpeg", ".png")):
                file_path = os.path.join(RAW_DATA, file_name)
                print("File processing:", file_path)
                extension = Path(file_path).suffix

                unique_name = f"{uuid.uuid4()}{extension}"
                save_path = settings.xrays_dir + unique_name

                shutil.copy2(file_path, save_path)

                new_xray = Xray(file_name=unique_name)
                db.add(new_xray)
                db.flush() 
                X2I.XRAY_FILE = save_path

                result= X2I.process()
                if not result:
                    print(f"X-rays no detections: {processed} out of {total_jpg}. Upload in progress...")
                else:
                    xray_id = new_xray.id
                    if file_path.lower().endswith((".jpg", ".png")):
                        teeth = os.listdir(os.path.join(settings.teeth_dir, unique_name[:-4]))
                        obbs_path = os.path.join(settings.teeth_dir, unique_name[:-4], "obbs.json")
                    if file_path.lower().endswith(".jpeg"):
                        teeth = os.listdir(os.path.join(settings.teeth_dir, unique_name[:-5]))
                        obbs_path = os.path.join(settings.teeth_dir, unique_name[:-5], "obbs.json")
                    with open(obbs_path, 'r', encoding='utf-8') as f:
                        obbs = json.load(f)
                    for tooth in teeth:
                        if tooth.lower().endswith(".json"):
                            continue
                        tooth_path = os.path.join(
                            settings.teeth_dir, 
                            unique_name[:-4], 
                            tooth, 
                            tooth+'.png')
                        cropped_tooth_path = os.path.join(
                            settings.teeth_dir, 
                            unique_name[:-4], 
                            tooth, 
                            tooth+'-cropped.png')
                        is_tooth_exist = db.execute(
                            select(Tooth).where(
                                Tooth.file_name == tooth_path,
                                Tooth.xray_id == xray_id
                            )
                        )
                        obb_str = " ".join(str(num) for sublist in obbs[tooth] for num in sublist)
                        if not is_tooth_exist.scalars().first():
                            new_tooth = Tooth(
                                file_name=tooth_path, 
                                cropped_file_name=cropped_tooth_path,
                                xray_id=xray_id,
                                points=obb_str
                            )
                            db.add(new_tooth)
                            db.flush()
                    db.commit() 
                    processed +=1              

                    print(f"X-rays uploaded to the database: {processed} out of {total_jpg}. Upload in progress...")
                    print("~~~~~~~~~~~~~~~~~~")
                    print("\n")
        print(f"X-ray upload completed! Uploaded {processed} X-rays.") 
    except Exception as err:
        print(err)
        db.rollback()
    db.close()