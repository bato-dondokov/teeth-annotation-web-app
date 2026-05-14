"""
Utility functions for handling Excel files.
Contains a utility to read an Excel file from byte content 
(e.g., uploaded via HTTP) using pandas.

---
Вспомогательные функции для работы с Excel‑файлами.
Содержит утилиту чтения Excel‑файла из байтового содержимого
(например, загруженного через HTTP) с помощью pandas.
"""
import re
from io import BytesIO
import pandas as pd

def read_excel_from_bytes(contents: bytes):
    return pd.read_excel(BytesIO(contents))

def extract_first_phone(phone_value: str) -> str | None:
    """
    Phone number normalization:
    - 8XXXXXXXXXX  -> 7XXXXXXXXXX
    - +7XXXXXXXXXX -> 7XXXXXXXXXX
    - Result: "+7 (XXX) XXX-XX-XX" or None if no number is found.

    ---
    Нормализация телефона:
    - 8XXXXXXXXXX  -> 7XXXXXXXXXX
    - +7XXXXXXXXXX -> 7XXXXXXXXXX
    - результат: "+7 (XXX) XXX-XX-XX" или None, если номер не найден
    """
    if not isinstance(phone_value, str):
        return None

    digits = re.sub(r"\D", "", phone_value)

    candidates = []

    # 8XXXXXXXXXX -> 7XXXXXXXXXX
    for m in re.findall(r"8\d{10}", digits):
        candidates.append("7" + m[1:])

    # 7XXXXXXXXXX
    candidates.extend(re.findall(r"7\d{10}", digits))

    if not candidates:
        return None
        
    candidate = candidates[0]
    phone_number = (
        "+7 (" + candidate[1:4] + ") "
        + candidate[4:7] + "-" + candidate[7:9] + "-" + candidate[9:]
    )
    return phone_number