"""
Модуль инициализации роутеров приложения.

Содержит определения роутеров:
- users.router — роутер для работы с пользователями;
- admin.router — роутер для работы с администраторами;
- annotation.router — роутер для работы с разметкой зубов.
"""

from .users import router as users_router
from .admin import router as admin_router
from .annotation import router as annotation_router

__all__ = ["users_router", "admin_router", "annotation_router"]