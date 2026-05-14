# 🦷 Teeth Annotation Web App

[English](#english) | [Русский](#русский)


---

## English

### About

**Teeth Annotation Web App** is a web application built with FastAPI, MySQL, and a YOLO object detection model, intended for annotation of dental X-ray images.

**Key features:**
- ✅ Automatic teeth detection using the YOLO model
- ✅ Access from different devices
- ✅ Distributed annotation and progress tracking

**Tech stack:** YOLO · FastAPI · MySQL · SQLAlchemy

---

### Local Setup

#### Prerequisites

Make sure the following are installed on your machine:

- [Python](https://www.python.org/) 3.10+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+
- [Git](https://git-scm.com/)

#### Step 1 — Clone the repository

```bash
git clone https://github.com/bato-dondokov/teeth-annotation-web-app.git
cd your-repo
```

#### Step 2 — Create a virtual environment and install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

<details>
<summary> Dependencies in requirements.txt</summary>

```
fastapi[standard]
sqlalchemy==2.0.46
aiomysql==0.3.2
greenlet==3.3.1
passlib[argon2]
pyjwt==2.11.0
pydantic-settings==2.13.0
pillow==12.1.1
pwdlib==0.3.0
opencv-python-headless
ultralytics==8.3.131
openpyxl==3.1.5
cryptography3
```

</details>

#### Step 3 — Create the database

Log in to MySQL and run:

```sql
CREATE DATABASE your_db_name;
```

#### Step 4 — Configure environment variables

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then copy the example config and fill in your values:

```bash
cp .env.example .env
```

```env
# Security
SECRET_KEY=your_secret_key

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db_name

# Default model weights path
# If you want to use your own YOLO model, change the path
MODEL_WEIGHTS=ml/YOLO11s-OBB(main)/weights/best.pt

# X-rays dir path
XRAYS_DIR=static/xrays/

# Teeth dir path
TEETH_DIR=static/teeth/

# Annotation range (number of X-ray images assigned to a single user)
ANNOTATION_RANGE=5

# Access codes for user roles
ADMINISTRATOR_CODE=your_access_code
TEACHER_CODE=your_access_code
RESIDENT_CODE=your_access_code

# Default superuser phone number created on first startup
ADMIN_PHONE=+7 (9XX) XXX-XX-XX
```

#### Step 5 — Define annotation labels

You can change annotation labels in `config.py`. There are four types of labels:
- **Conditions** — possible tooth state options
- **Pathologies** — possible tooth pathology options
- **Recommendations** — possible treatment recommendation options
- **Terms** — possible options for medical consultation timing

For example:

```python
DEFAULT_PATHOLOGIES = [
    {"ru": "Сомневаюсь в ответе",           "en": "Uncertain diagnosis"},
    {"ru": "Интактный зуб",                  "en": "Intact tooth"},
    {"ru": "Кариес эмали",                   "en": "Enamel caries"},
    {"ru": "Кариес дентина",                 "en": "Dentin caries"},
    {"ru": "Кариес цемента",                 "en": "Cementum caries"},
    {"ru": "Начальный пульпит (гиперемия)",  "en": "Initial pulpitis (pulp hyperemia)"},
    {"ru": "Пульпит",                        "en": "Pulpitis"},
    {"ru": "Периодонтит",                    "en": "Apical periodontitis"},
    {"ru": "Радикулярная киста",             "en": "Radicular cyst"},
    {"ru": "Пародонтальная киста",           "en": "Periodontal cyst"},
    {"ru": "Ретенция/дистопия",              "en": "Impaction/dystopia"},
    {"ru": "Пародонтальный карман",          "en": "Periodontal pocket"},
    {"ru": "Периимплантит",                  "en": "Peri-implantitis"},
]
```

#### Step 6 — Run the app

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The app will be available at **http://localhost:8000**
Interactive docs (Swagger UI) at **http://localhost:8000/docs**

#### Step 7 — Upload X-rays automatically

After the first run, use `auto_upload_xrays.py` to bulk-upload your X-ray images. Specify the path to your X-rays directory in the script:

```python
if __name__ == "__main__":
    RAW_DATA = 'your_X-rays_directory_path'
```

> Your directory should contain only images in **png**, **jpg**, or **jpeg** format.

Then run:

```bash
python auto_upload_xrays.py
```

---

### Production Deployment

This guide covers local setup only. For production, we recommend deploying with **Nginx as a reverse proxy** and running the app via `systemd` or Docker.

Good reference: [FastAPI Deployment with Nginx — official docs](https://fastapi.tiangolo.com/deployment/manually/)

---

## Русский

### О проекте

**Teeth Annotation Web App** — это веб-приложение на FastAPI, MySQL и модели детекции объектов YOLO, предназначенное для разметки стоматологических рентгеновских снимков.

**Ключевые возможности:**
- ✅ Автоматическое определение зубов с помощью модели YOLO
- ✅ Доступ с разных устройств
- ✅ Распределенная разметка и отслеживание прогресса

**Технологический стек:** YOLO · FastAPI · MySQL · SQLAlchemy

---

### Локальный запуск

#### Требования

Убедитесь, что на вашей машине установлено:

- [Python](https://www.python.org/) 3.10+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+
- [Git](https://git-scm.com/)

#### Шаг 1 — Клонировать репозиторий

```bash
git clone https://github.com/bato-dondokov/teeth-annotation-web-app.git
cd your-repo
```

#### Шаг 2 — Создать виртуальное окружение и установить зависимости

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

<details>
<summary> Зависимости из requirements.txt</summary>

```
fastapi[standard]
sqlalchemy==2.0.46
aiomysql==0.3.2
greenlet==3.3.1
passlib[argon2]
pyjwt==2.11.0
pydantic-settings==2.13.0
pillow==12.1.1
pwdlib==0.3.0
opencv-python-headless
ultralytics==8.3.131
openpyxl==3.1.5
cryptography3
```
</details>

#### Шаг 3 — Создать базу данных

Войдите в MySQL и выполните:

```sql
CREATE DATABASE your_db_name;
```

#### Шаг 4 — Настроить переменные окружения

Сгенерируйте секретный ключ:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Скопируйте пример конфига и заполните своими значениями:

```bash
cp .env.example .env
```

```env
# Безопасность
SECRET_KEY=ваш_секретный_ключ

# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=ваш_пользователь
DB_PASSWORD=ваш_пароль
DB_NAME=имя_базы_данных

# Путь к весам модели по умолчанию
# Если хотите использовать свою модель YOLO — укажите другой путь
MODEL_WEIGHTS=ml/YOLO11s-OBB(main)/weights/best.pt

# Путь к директории рентгеновских снимков
XRAYS_DIR=static/xrays/

# Путь к директории с изображениями зубов
TEETH_DIR=static/teeth/

# Диапазон разметки (количество снимков, назначаемых одному пользователю)
ANNOTATION_RANGE=5

# Коды доступа для ролей
ADMINISTRATOR_CODE=ваш_код_доступа
TEACHER_CODE=ваш_код_доступа
RESIDENT_CODE=ваш_код_доступа

# Номер телефона суперпользователя, создаваемого при первом запуске
ADMIN_PHONE=+7 (9XX) XXX-XX-XX
```

#### Шаг 5 — Настроить метки разметки

Метки разметки можно изменить в файле `config.py`. Доступны четыре типа меток:
- **Conditions** — возможные состояния зуба
- **Pathologies** — возможные патологии зуба
- **Recommendations** — возможные варианты лечения
- **Terms** — варианты сроков медицинской консультации

Пример:

```python
DEFAULT_PATHOLOGIES = [
    {"ru": "Сомневаюсь в ответе",           "en": "Uncertain diagnosis"},
    {"ru": "Интактный зуб",                  "en": "Intact tooth"},
    {"ru": "Кариес эмали",                   "en": "Enamel caries"},
    {"ru": "Кариес дентина",                 "en": "Dentin caries"},
    {"ru": "Кариес цемента",                 "en": "Cementum caries"},
    {"ru": "Начальный пульпит (гиперемия)",  "en": "Initial pulpitis (pulp hyperemia)"},
    {"ru": "Пульпит",                        "en": "Pulpitis"},
    {"ru": "Периодонтит",                    "en": "Apical periodontitis"},
    {"ru": "Радикулярная киста",             "en": "Radicular cyst"},
    {"ru": "Пародонтальная киста",           "en": "Periodontal cyst"},
    {"ru": "Ретенция/дистопия",              "en": "Impaction/dystopia"},
    {"ru": "Пародонтальный карман",          "en": "Periodontal pocket"},
    {"ru": "Периимплантит",                  "en": "Peri-implantitis"},
]
```

#### Шаг 6 — Запустить приложение

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Приложение будет доступно по адресу **http://localhost:8000**
Интерактивная документация (Swagger UI) — **http://localhost:8000/docs**

#### Шаг 7 — Автоматически загрузить снимки

После первого запуска используйте скрипт `auto_upload_xrays.py` для массовой загрузки рентгеновских снимков. Укажите путь к вашей директории со снимками:

```python
if __name__ == "__main__":
    RAW_DATA = 'путь_к_вашей_директории_со_снимками'
```

> Директория должна содержать только изображения в форматах **png**, **jpg** или **jpeg**.

Затем запустите скрипт:

```bash
python auto_upload_xrays.py
```

---

### Деплой на сервер

Этот гайд описывает только локальный запуск. Для продакшена рекомендуем развернуть приложение с **Nginx в качестве обратного прокси** и запустить его через `systemd` или Docker.

Хороший ориентир: [Деплой FastAPI с Nginx — официальная документация](https://fastapi.tiangolo.com/deployment/manually/)