"""
Здесь определяются зависимости FastAPI, используемые в разных частях приложения.
Содержит фабрику `get_detector` для получения экземпляра `Xray2Teeth`
из `app.state`, чтобы использовать его в обработчиках как зависимость.
"""
from fastapi import Request
from xray2img import Xray2Teeth


def get_detector(request: Request) -> Xray2Teeth:
    return request.app.state.detector