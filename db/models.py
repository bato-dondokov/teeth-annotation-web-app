"""
ORM models for the tooth annotation application database.

Contains table definitions:
- User / Role: System users and their roles.
- Xray / Tooth: X-rays and individual tooth images.
- Condition / Pathology / Recommendation / Term: Reference tables for states, 
  pathologies, recommendations, and follow-up terms.
- Answer: Annotation results linking user, tooth, condition, pathology, 
  recommendation, and term.

---
ORM-модели для работы с базой данных приложения разметки зубов.

Содержит определения таблиц:
- User / Role — пользователи системы и их роли;
- Xray / Tooth — рентгеновские снимки и отдельные изображения зубов;
- Condition / Pathology / Recommendation / Term — справочники состояний, патологий,
  рекомендаций и сроков обращения;
- Answer — результаты разметки, связывающие пользователя, зуб, состояние, патологию,
  рекомендацию и срок обращения.
"""
from __future__ import annotations

from datetime import UTC, datetime

from db.database import Base
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column


class User(Base):
    """
    Annotation system user. Stores name, phone, role, progress, and assigned tooth range.
    
    ---
    Пользователь системы разметки. Хранит имя, номер телефона, роль, 
    текущий прогресс разметки и назначенный диапазон зубов.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))  
    phone_number: Mapped[str] = mapped_column(String(20))
    role: Mapped[str] = mapped_column(String(25), ForeignKey("roles.name"))
    progress: Mapped[int] = mapped_column(default=0)
    current_tooth: Mapped[int] = mapped_column(default=0)
    range_start: Mapped[int] = mapped_column(default=0)
    range_end: Mapped[int] = mapped_column(default=0)


class Role(Base):
    """
    System user role.
    Contains the role name and the password hash for authentication.

    ---
    Роль пользователя в системе.
    Содержит название роли, а также хеш пароля для входа под этой ролью.
    """
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(25), unique=True)
    name_ru: Mapped[str] = mapped_column(String(25))
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)


class Xray(Base):
    """
    X-ray scan.
    Represents the source scan file used to extract individual tooth images.

    ---
    Рентгеновский снимок.
    Представляет исходный файл снимка, на основе которого
    вырезаются отдельные изображения зубов.
    """
    __tablename__ = "xrays"
    id: Mapped[int] = mapped_column(primary_key=True)
    file_name: Mapped[str] = mapped_column(String(255))   


class Tooth(Base):
    """
    Tooth image.
    Stores tooth complexity, a reference to the source X-ray, 
    and the filename of the tooth image.

    ---
    Изображение зуба.
    Хранит информацию о сложности зуба, ссылку на исходный снимок
    и имя файла с изображением зуба.
    """
    __tablename__ = "teeth"
    id: Mapped[int] = mapped_column(primary_key=True)
    complexity: Mapped[bool] = mapped_column(Boolean, 
                                             default=False, 
                                             nullable=False)
    xray_id: Mapped[int] = mapped_column(ForeignKey('xrays.id'))
    file_name: Mapped[str] = mapped_column(String(255))    
    cropped_file_name: Mapped[str] = mapped_column(String(255))    
    points: Mapped[str] = mapped_column(String(255))  


class Condition(Base):
    """
    Tooth condition.
    Used to store possible tooth state options.

    ---
    Состояние зуба.
    Используется для хранения возможных вариантов состояния зуба.
    """
    __tablename__ = "conditions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    name_ru: Mapped[str] = mapped_column(String(255))


class Pathology(Base):
    """
    Tooth pathology.
    Used to store possible tooth pathology options.

    ---
    Патология зуба.
    Используется для хранения возможных вариантов патологии зуба.
    """
    __tablename__ = "pathologies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    name_ru: Mapped[str] = mapped_column(String(255))


class Recommendation(Base):
    """
    Treatment recommendation.
    Used to store possible treatment recommendation options.

    ---
    Рекомендация к лечению.
    Используется для хранения возможных вариантов рекомендаций к лечению зуба.
    """
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    name_ru: Mapped[str] = mapped_column(String(255))


class Term(Base):
    """
    Follow-up term.
    Used to store possible options for medical consultation timing.

    ---
    Срок обращения.
    Используется для хранения возможных вариантов сроков обращения к врачу.
    """
    __tablename__ = "terms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    name_ru: Mapped[str] = mapped_column(String(255))


class Answer(Base):
    """
    Annotation result.
    Stores the tooth labeling outcome, including references to the user, tooth,
    condition, pathology, recommendation, and follow-up term.
    
    ---
    Результат разметки.
    Хранит информацию о результате разметки зуба, ссылки на пользователя, зуб,
    состояние, патологию, рекомендацию и срок обращения.
    """
    __tablename__ = "answers"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    tooth_id: Mapped[int] = mapped_column(ForeignKey('teeth.id'))
    condition_id: Mapped[int] = mapped_column(ForeignKey('conditions.id'))
    pathology_id: Mapped[int] = mapped_column(ForeignKey('pathologies.id'))
    rec_id: Mapped[int] = mapped_column(ForeignKey('recommendations.id'))
    term_id: Mapped[int] = mapped_column(ForeignKey('terms.id'))