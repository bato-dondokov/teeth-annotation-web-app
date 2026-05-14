"""
Configuration file.
---

Конфигурационный файл
"""
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Global application settings.
    Manages configuration using Pydantic Settings, including:
    - JWT Security: Secret keys and token lifetime.
    - File Limits: Validation parameters for X-ray uploads.
    - Database Connection: Credentials and host information.
    - Paths: Locations for model weights and processed image directories.
    - Workflow: Default assignment range for annotators.

    ---
    Глобальные настройки приложения.
    Управляет конфигурацией через Pydantic Settings, включая:
    - Безопасность JWT: секретные ключи и время жизни токенов.
    - Лимиты файлов: параметры валидации для загрузки рентгеновских снимков.
    - Подключение к БД: учетные данные и адрес хоста.
    - Пути: расположение весов модели и директорий для обработанных изображений.
    - Рабочий процесс: диапазон задач по умолчанию для разметчиков.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # JWT & Security
    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # File limits
    max_upload_size_bytes: int = int(0.01 * 1024 * 1024)  # 5MB
    max_upload_size_mb: int = 5

    # Database
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str

    # Model weights path
    model_weights: str

    # X-rays dir path 
    xrays_dir: str
    
    # Teeth dir path 
    teeth_dir: str

    # Annotation range (number of X-ray images assigned to a single user).
    annotation_range: int = 5

    # Access code for user roles
    administrator_code: str
    teacher_code: str
    resident_code: str

    # Default user (superuser) phone number created during the initial system startup
    admin_phone: str


settings = Settings()


"""
Default user roles
Роли пользователей по умолчанию
"""
DEFAULT_ROLES = {
    'Resident': {'name': 'Ординатор', 'password': settings.resident_code}, 
    'Teacher': {'name': 'Преподаватель', 'password': settings.teacher_code}, 
    'Administrator': {'name': 'Администратор', 'password': settings.administrator_code}
    }

"""
Default user (superuser) created during the initial system startup.
Ensures that at least one administrative account exists to access the 
management dashboard and perform initial configuration.
---
Пользователь по умолчанию (суперпользователь), создаваемый при первом запуске системы.
Гарантирует наличие хотя бы одной административной учетной записи для 
доступа к панели управления и выполнения начальных настроек.
"""
DEFAULT_USER = {
    'name': 'Admin', 
    'phone_number': settings.admin_phone,
    'role': 'Administrator'
    }


"""
Default tooth conditions
Названия исходных состояний по умолчанию
"""
DEFAULT_CONDITIONS = [
    {
        "ru": "Ошибка в обнаружении зуба", 
        "en": "Tooth detection error"},
    {
        "ru": "Сомневаюсь в ответе", 
        "en": "Uncertain diagnosis"},
    {
        "ru": "Зуб ранее не лечен", 
        "en": "Tooth not previously treated"},
    {
        "ru": "Пломба", 
        "en": "Filling"},
    {
        "ru": "Коронка", 
        "en": "Crown"},
    {
        "ru": "Штифт", 
        "en": "Post"},
    {
        "ru": "Вкладка", 
        "en": "Inlay/Onlay restoration"},
    {
        "ru": "Корневые каналы запломбированы полностью", 
        "en": "Root canals fully obturated"},
    {
        "ru": "Недостаточная обтурация корневых каналов", 
        "en": "Inadequate root canal obturation"},
    {
        "ru": "Брекет", 
        "en": "Orthodontic bracket"},
    {
        "ru": "Дентальный имплантат", 
        "en": "Dental implant"},
    {
        "ru": "Корень", 
        "en": "Root"},
]

"""
Default pathology labels
Названия патологий по умолчанию
"""
DEFAULT_PATHOLOGIES = [
    {
        "ru": "Сомневаюсь в ответе",
        "en": "Uncertain diagnosis",
    },
    {
        "ru": "Интактный зуб",
        "en": "Intact tooth",
    },
    {
        "ru": "Кариес эмали",
        "en": "Enamel caries",
    },
    {
        "ru": "Кариес дентина",
        "en": "Dentin caries",
    },
    {
        "ru": "Кариес цемента",
        "en": "Cementum caries",
    },
    {
        "ru": "Начальный пульпит (гиперемия)",
        "en": "Initial pulpitis (pulp hyperemia)",
    },
    {
        "ru": "Пульпит",
        "en": "Pulpitis",
    },
    {
        "ru": "Периодонтит",
        "en": "Apical periodontitis",
    },
    {
        "ru": "Радикулярная киста",
        "en": "Radicular cyst",
    },
    {
        "ru": "Пародонтальная киста",
        "en": "Periodontal cyst",
    },
    {
        "ru": "Ретенция/дистопия",
        "en": "Impaction/dystopia",
    },
    {
        "ru": "Пародонтальный карман",
        "en": "Periodontal pocket",
    },
    {
        "ru": "Периимлантит",
        "en": "Peri-implantitis",
    },
]

"""
Default medical recommendations
Названия рекомендаций по умолчанию
"""
DEFAULT_RECOMMENDATIONS = [
    {
        "ru": "Сомневаюсь в ответе",
        "en": "Uncertain diagnosis",
    },
    {
        "ru": "Провести экструзию",
        "en": "Perform extrusion",
    },
    {
        "ru": "Провести пломбирование",
        "en": "Perform restoration",
    },
    {
        "ru": "Провести эндодонтическое лечение",
        "en": "Perform endodontic treatment",
    },
    {
        "ru": "Провести протезирование",
        "en": "Perform prosthetic rehabilitation",
    },
    {
        "ru": "Удалить зуб",
        "en": "Extract tooth",
    },
    {
        "ru": "Провести цистэктомию/цистотомию",
        "en": "Perform cystectomy/cystotomy",
    },
    {
        "ru": "Установить дентальный имплантат",
        "en": "Place a dental implant",
    },
    {
        "ru": "Провести кюретаж",
        "en": "Perform curettage",
    },
    {
        "ru": "Продолжить наблюдение",
        "en": "Continue observation",
    },
]

"""
Default timeframes (Terms) for recommendations
Названия сроков по умолчанию (для рекомендаций)
"""
DEFAULT_TERMS = [
    {
        "ru": "Сомневаюсь в ответе",
        "en": "Uncertain diagnosis",
    },
    {
        "ru": "Обратиться к стоматологу немедленно",
        "en": "See a dentist immediately",
    },
    {
        "ru": "Обратиться в течение 14 дней",
        "en": "See a dentist within 14 days",
    },
    {
        "ru": "Обратиться в течение 30 дней",
        "en": "See a dentist within 30 days",
    },
    {
        "ru": "Продолжить диспансерное наблюдение у стоматолога - терапевта 1р/6мес",
        "en": "Continue follow-up with a general dentist (once every 6 months)",
    },
    {
        "ru": "Рентген - контроль через 3-4 мес",
        "en": " X-ray control in 3-4 months",
    },
]
        
"""
Image cropping coefficients.
- OBB_SCALE: Factor to increase the size of the oriented bounding box (e.g., 2.0 doubles the area).
- CROP_WIDTH: Fixed width of the resulting cropped tooth image in pixels.
- CROP_LENGTH: Fixed length (height) of the resulting cropped tooth image in pixels.
---
Коэффициенты для обрезки снимка.
- OBB_SCALE: Коэффициент увеличения размеров ориентированной ограничивающей рамки (например, 2.0 увеличивает область вдвое).
- CROP_WIDTH: Фиксированная ширина получаемого изображения зуба в пикселях.
- CROP_LENGTH: Фиксированная длина (высота) получаемого изображения зуба в пикселях.
"""
OBB_SCALE = 2.0 
CROP_WIDTH = 200 
CROP_LENGTH = 280