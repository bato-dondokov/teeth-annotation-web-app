"""
Главный модуль приложения FastAPI для веб‑сервиса разметки зубов.
Отвечает за:
- инициализацию БД и загрузку значений по умолчанию при старте;
- загрузку и конфигурацию модели Xray2Teeth;
- создание экземпляра FastAPI и подключение роутеров;
- настройку статики и Jinja2‑шаблонов;
- маршруты для HTML‑страниц (login, register, admin, progress, add‑xray, annotation);
- обработчики ошибок (HTTP и ошибки валидации) для API и HTML‑страниц.
"""
import os
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exception_handlers import (http_exception_handler,
                                        request_validation_exception_handler)
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.exceptions import HTTPException as StarletteHTTPException

import config
import db.models as models
from auth import (hash_password)
from config import (DEFAULT_CONDITIONS, DEFAULT_PATHOLOGIES,
                    DEFAULT_RECOMMENDATIONS, DEFAULT_TERMS, DEFAULT_USER,
                    MODEL_WEIGHTS, TEETH_DIR, XRAYS_DIR)
from db.database import AsyncSessionLocal, Base, engine, get_db
from routers import admin, annotation, users
from xray2img import Xray2Teeth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Контекстный менеджер жизненного цикла приложения.
    При старте:
    - создаёт все таблицы в базе данных (Base.metadata.create_all);
    - открывает сессию и:
        - проверяет наличие ролей и справочников (Condition и др.);
        - при их отсутствии:
            - добавляет роли и пароли по умолчанию (config.DEFAULT_ROLES);
            - заполняет справочники состояний, патологий, рекомендаций и сроков
              (DEFAULT_CONDITIONS, DEFAULT_PATHOLOGIES, DEFAULT_RECOMMENDATIONS, DEFAULT_TERMS);
            - создаёт пользователя по умолчанию (DEFAULT_USER);
            - фиксирует изменения (commit);
    - создаёт директории для хранения снимков и изображений зубов (XRAYS_DIR, TEETH_DIR);
    - загружает модель YOLO через Xray2Teeth и сохраняет её в app.state.detector,
      а также настраивает путь для сохранения зубов (TEETH_DIR).
    При завершении работы приложения:
    - корректно закрывает (dispose) асинхронный движок SQLAlchemy.
    :param app: экземпляр FastAPI, к которому привязан жизненный цикл.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


    async with AsyncSessionLocal() as db:
        result = await db.execute(select(models.Role.name))
        existing_roles = result.scalars().all()

        result = await db.execute(select(models.Condition))
        existing_conditions = result.scalars().all()

        if not existing_roles:
            for role, role_desc in config.DEFAULT_ROLES.items():
                db.add(models.Role(name=role, 
                                   name_ru=role_desc['name'], 
                                   password_hash=hash_password(role_desc['password'])))
            for condition in DEFAULT_CONDITIONS:
                db.add(models.Condition(name=condition))
            for pathology in DEFAULT_PATHOLOGIES:
                db.add(models.Pathology(name=pathology))
            for recommendation in DEFAULT_RECOMMENDATIONS:
                db.add(models.Recommendation(name=recommendation))
            for term in DEFAULT_TERMS:
                db.add(models.Term(name=term))
            db.add(models.User(name=DEFAULT_USER['name'],
                               phone_number=DEFAULT_USER['phone_number'],
                               role=DEFAULT_USER['role']))
            await db.commit()
            print("Значения по-умолчанию добавлены в базу данных.")
            
        print("Loading YOLO model...")

        os.makedirs(XRAYS_DIR, exist_ok=True)
        os.makedirs(TEETH_DIR, exist_ok=True)
    
        app.state.detector = Xray2Teeth(MODEL_WEIGHTS)
        app.state.detector.TEETH_DIR = TEETH_DIR

        print("Model loaded successfully") 

    yield
    # Shutdown
    await engine.dispose()


# Создаём экземпляр FastAPI с кастомным жизненным циклом.
app = FastAPI(lifespan=lifespan)
# Подключаем статику и шаблоны.
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Подключаем роутеры для API.
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(
    annotation.router, 
    prefix="/api/annotation", 
    tags=["annotation"])

@app.get("/", include_in_schema=False, name="login")
@app.get("/login", include_in_schema=False, name="login")
async def login_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    Страница входа в систему.
    Загружает список ролей из базы данных и передаёт их в шаблон login.html
    для отображения в выпадающем списке ролей.
    :param db: асинхронная сессия БД.
    :param request: объект HTTP‑запроса.
    """
    result = await db.execute(
        select(models.Role),
    )
    roles = result.scalars().all()
    return templates.TemplateResponse(
        request,
        "login.html",
        {"title": "Вход", "roles": roles},
    )


@app.get("/register", include_in_schema=False)
async def register_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    Страница добавления новых пользователей.
    Загружает список ролей и передаёт их в шаблон register.html,
    где администратор может создать пользователей вручную или через импорт.
    :param db: асинхронная сессия БД.
    :param request: объект HTTP‑запроса.
    """
    result = await db.execute(
        select(models.Role),
    )
    roles = result.scalars().all()
    return templates.TemplateResponse(
        request,
        "register.html",
        {"title": "Добавление пользователей", "roles": roles},
    )


@app.get("/admin", include_in_schema=False)
async def admin_page(request: Request):
    """
    Страница панели администратора.
    Рендерит шаблон admin.html без дополнительного контекста, кроме заголовка.
    """
    return templates.TemplateResponse(
        request,
        "admin.html",
        {"title": "Панель администратора"},
    )


@app.get("/progress", include_in_schema=False)
async def progress_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    Страница отображения прогресса экспертов.
    Выбирает из базы:
    - id, имя, роль (на русском), прогресс и диапазон зубов для пользователей
      с ролями "teacher" и "resident";
    - сортирует по началу диапазона;
    - при отсутствии данных выбрасывает HTTP 404 с понятным сообщением.
    Рендерит шаблон progress.html с таблицей пользователей и их прогрессом.
    :param db: асинхронная сессия БД.
    :param request: объект HTTP‑запроса.
    """
    result = await db.execute(
        select(
            models.User.id,
            models.User.name,
            models.Role.name_ru.label("role"),
            models.User.progress,
            models.User.current_tooth,
            models.User.range_start,
            models.User.range_end
        ).join(models.Role, models.User.role == models.Role.name)
        .where(models.User.role.in_(["teacher", "resident"]))
        .order_by(models.User.range_start)
    )
    users = result.all()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отсутствуют результаты для отображения прогресса экспертов.",
        )

    result = await db.execute(
        select(func.count(models.Tooth.id))
    )
    tooth_count = result.scalar()

    return templates.TemplateResponse(
        request,
        "progress.html",
        {"title": "Прогресс экспертов", 
        "users": users, 
        "tooth_count": tooth_count},
    )


@app.get("/add-xray", include_in_schema=False)
async def add_xray_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    Страница загрузки рентгеновских снимков.
    Рендерит шаблон add-xray.html, который позволяет администратору
    загружать новые снимки для последующей разметки.
    """
    result = await db.execute(
        select(func.count(models.Tooth.id))
    )
    tooth_count = result.scalar()
    return templates.TemplateResponse(
        request,
        "add-xray.html",
        {"title": "Добавление снимков", "tooth_count": tooth_count},
    )


@app.get("/annotation", include_in_schema=False)
async def annotation_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    Страница разметки зубов.
    Загружает из базы справочники:
    - состояния (Condition),
    - патологии (Pathology),
    - рекомендации (Recommendation),
    - сроки (Term),
    и передаёт их в шаблон annotation.html для заполнения выпадающих списков
    при разметке каждого зуба.
    :param db: асинхронная сессия БД.
    :param request: объект HTTP‑запроса.
    """
    result = await db.execute(select(models.Condition))
    conditions = result.scalars().all()

    result = await db.execute(select(models.Pathology))
    pathologies = result.scalars().all()

    result = await db.execute(select(models.Recommendation))
    recommendations = result.scalars().all()

    result = await db.execute(select(models.Term))
    terms = result.scalars().all()

    return templates.TemplateResponse(
        request,
        "annotation.html",
        {"title": "Разметка зубов",
          "conditions": conditions,
          "pathologies": pathologies,
          "recommendations": recommendations,
          "terms": terms},
    )


@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(
    request: Request, 
    exception: StarletteHTTPException
):
    """
    Общий обработчик HTTP‑исключений.
    Поведение:
    - если путь запроса начинается с "/api":
        - делегирует обработку стандартному http_exception_handler FastAPI
          и возвращает JSON‑ответ для API;
    - иначе:
        - формирует человеко‑читаемое сообщение об ошибке,
        - рендерит HTML‑страницу error.html с кодом статуса и текстом сообщения.
    :param request: объект HTTP‑запроса.
    :param exception: выброшенное HTTP‑исключение Starlette/FastAPI.
    """
    if request.url.path.startswith("/api"):
        return await http_exception_handler(request, exception) 

    message = (
        exception.detail
        if exception.detail
        else "An error occurred. Please check your request and try again."
    )

    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": exception.status_code,
            "title": exception.status_code,
            "message": message,
        },
        status_code=exception.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, 
    exception: RequestValidationError):
    """
    Обработчик ошибок валидации запросов.
    Поведение:
    - если путь запроса начинается с "/api":
        - использует стандартный request_validation_exception_handler FastAPI
          для возврата JSON‑ошибки (422 Unprocessable Entity);
    - иначе:
        - рендерит HTML‑страницу error.html с кодом 422 и общим сообщением
          о некорректном запросе.
    :param request: объект HTTP‑запроса.
    :param exception: исключение RequestValidationError, содержащее детали ошибок.
    """
    if request.url.path.startswith("/api"):
        await request_validation_exception_handler(request, exception)

    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "title": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "message": "Invalid request. Please check your input and try again.",
        },
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )