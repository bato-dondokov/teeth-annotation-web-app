translations = {
    "ru": {
        "progress_no_users": "Отсутствуют результаты для отображения прогресса экспертов.",
        "register_invalid_file_size": "Файл слишком большой. Максимальный размер: {max_size}",
    },
    "en": {
        "progress_no_users": "No results to display expert progress.",
        "register_invalid_file_size": "File is too large. Maximum size: {max_size}",
    }
}

def t(lang: str, key, **kwargs) -> str:
    lang_dict = translations.get(lang, translations["ru"])
    message = lang_dict.get(key, str(key))
    return message.format(**kwargs) if kwargs else message