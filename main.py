"""
Main FastAPI application module for the dental annotation web service.
Responsible for:
- Database initialization and loading default values on startup.
- Loading and configuring the Xray2Teeth model.
- Creating the FastAPI instance and including routers.
- Configuring static files and Jinja2 templates.
- HTML page routes (login, register, admin, progress, add-xray, annotation).
- Exception handlers (HTTP and validation errors) for both API and HTML pages.

---
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

import db.models as models
from auth import (hash_password)
from config import (DEFAULT_CONDITIONS, DEFAULT_PATHOLOGIES,
                    DEFAULT_RECOMMENDATIONS, DEFAULT_TERMS, DEFAULT_USER, 
                    DEFAULT_ROLES, settings)
from db.database import AsyncSessionLocal, Base, engine, get_db
from routers import admin, annotation, users
from xray2img import Xray2Teeth
from locales import t


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    On startup:
    - Creates all database tables (Base.metadata.create_all).
    - Opens a database session to:
        - Check for the existence of roles and reference data (Conditions, etc.).
        - If missing:
            - Adds default roles and passwords (DEFAULT_ROLES).
            - Populates reference tables for conditions, pathologies, recommendations, 
              and terms (DEFAULT_CONDITIONS, DEFAULT_PATHOLOGIES, etc.).
            - Creates the default user (DEFAULT_USER).
            - Commits the changes.
    - Creates storage directories for X-rays and tooth images (XRAYS_DIR, TEETH_DIR).
    - Loads the YOLO model via Xray2Teeth, saves it to app.state.detector, 
      and configures the tooth image saving path.
    On shutdown:
    - Gracefully disposes of the asynchronous SQLAlchemy engine.
    :param app: The FastAPI instance to which the lifespan is attached.
    
    ---
    Контекстный менеджер жизненного цикла приложения.
    При старте:
    - создаёт все таблицы в базе данных (Base.metadata.create_all);
    - открывает сессию и:
        - проверяет наличие ролей и справочников (Condition и др.);
        - при их отсутствии:
            - добавляет роли и пароли по умолчанию (DEFAULT_ROLES);
            - заполняет справочники состояний, патологий, рекомендаций и сроков;
            - создаёт пользователя по умолчанию (DEFAULT_USER);
            - фиксирует изменения (commit);
    - создаёт директории для хранения снимков и изображений зубов (XRAYS_DIR, TEETH_DIR);
    - загружает модель YOLO через Xray2Teeth и сохраняет её в app.state.detector.
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
        # existing_conditions = result.scalars().all()

        if not existing_roles:
            for role, role_desc in DEFAULT_ROLES.items():
                db.add(models.Role(name=role, 
                                   name_ru=role_desc['name'], 
                                   password_hash=hash_password(role_desc['password'])))
            for condition in DEFAULT_CONDITIONS:
                db.add(models.Condition(name=condition["en"], 
                                        name_ru=condition["ru"]))
            for pathology in DEFAULT_PATHOLOGIES:
                db.add(models.Pathology(name=pathology["en"],
                                        name_ru=pathology["ru"]))
            for recommendation in DEFAULT_RECOMMENDATIONS:
                db.add(models.Recommendation(name=recommendation["en"],
                                             name_ru=recommendation["ru"]))
            for term in DEFAULT_TERMS:
                db.add(models.Term(name=term["en"],
                                   name_ru=term["ru"]))
            db.add(models.User(name=DEFAULT_USER['name'],
                               phone_number=DEFAULT_USER['phone_number'],
                               role=DEFAULT_USER['role']))
            await db.commit()
            print("Default values have been added to the database.")
            
        print("Loading YOLO model...")

        os.makedirs(settings.xrays_dir, exist_ok=True)
        os.makedirs(settings.teeth_dir, exist_ok=True)
    
        app.state.detector = Xray2Teeth(settings.model_weights)
        app.state.detector.TEETH_DIR = settings.teeth_dir

        print("Model loaded successfully") 

    yield
    # Shutdown
    await engine.dispose()


# Create the FastAPI instance with the custom lifespan manager.
# Создаём экземпляр FastAPI с кастомным жизненным циклом.
app = FastAPI(lifespan=lifespan)

# Mounting static files and initializing templates.
# Подключаем статику и шаблоны.
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Register API routers.
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
    User login page.
    Retrieves the list of roles from the database and passes them to the 
    login.html template for display in the role selection dropdown.
    :param db: Asynchronous database session.
    :param request: The HTTP request object.

    ---
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
    User registration and addition page.
    Retrieves the list of roles and passes them to the register.html template,
    where an administrator can create users manually or via bulk import.
    :param db: Asynchronous database session.
    :param request: The HTTP request object.

    ---
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
    result = await db.execute(
        select(func.count(models.User.id))
        .where(models.User.role != "Administrator")
    )
    users_count = result.scalar()
    return templates.TemplateResponse(
        request,
        "register.html",
        {
            "title": "Добавление пользователей", 
            "roles": roles, 
            "users_count": users_count
        },
    )


@app.get("/admin", include_in_schema=False)
async def admin_page(request: Request):
    """
    Administrator dashboard page.
    Renders the admin.html template with no additional context other than the page title.

    ---
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
    Expert progress display page.
    Queries the database for:
    - ID, name, role (in Russian), progress, and tooth range for users 
      with "teacher" and "resident" roles.
    - Sorts the results by the start of the tooth range.
    - Raises an HTTP 404 exception with a descriptive message if no data is found.
    Renders the progress.html template containing a table of users and their progress.
    :param db: Asynchronous database session.
    :param request: The HTTP request object.

    ---
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
            models.Role.name_ru.label("role_ru"),
            models.Role.name.label("role_en"),
            models.User.progress,
            models.User.current_tooth,
            models.User.range_start,
            models.User.range_end
        ).join(models.Role, models.User.role == models.Role.name)
        .where(models.User.role.in_(["Teacher", "Resident"]))
        .order_by(models.User.range_start)
    )
    users = result.all()
    lang = request.cookies.get("lang", "ru")
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t(lang, "progress_no_users"),
        )

    result = await db.execute(
        select(func.count(models.User.id))
        .where(models.User.role != "Administrator")
    )
    users_count = result.scalar()

    return templates.TemplateResponse(
        request,
        "progress.html",
        {"title": "Прогресс экспертов", 
        "users": users, 
        "users_count": users_count},
    )


@app.get("/add-xray", include_in_schema=False)
async def add_xray_page(
    db: Annotated[AsyncSession, Depends(get_db)], 
    request: Request
):
    """
    X-ray upload page.
    Renders the add-xray.html template, which allows the administrator 
    to upload new images for subsequent annotation.

    ---
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
    Tooth annotation page.
    Retrieves reference data from the database, including:
    - Conditions,
    - Pathologies,
    - Recommendations,
    - Terms,
    and passes them to the annotation.html template to populate dropdown menus 
    used during the annotation of each individual tooth.
    :param db: Asynchronous database session.
    :param request: The HTTP request object.

    ---
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
    Global HTTP exception handler.
    Behavior:
    - If the request path starts with "/api":
        - Delegates processing to the default FastAPI http_exception_handler 
          and returns a JSON response for the API.
    - Otherwise:
        - Generates a human-readable error message.
        - Renders the error.html template with the status code and message text.
    :param request: The HTTP request object.
    :param exception: The caught Starlette/FastAPI HTTP exception.

    ---
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
    Request validation error handler.
    Behavior:
    - If the request path starts with "/api":
        - Uses the default FastAPI request_validation_exception_handler 
          to return a JSON error (422 Unprocessable Entity).
    - Otherwise:
        - Renders the error.html template with a 422 status code and a 
          generic message about an incorrect request.
    :param request: The HTTP request object.
    :param exception: The RequestValidationError containing specific error details.
    
    ---
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