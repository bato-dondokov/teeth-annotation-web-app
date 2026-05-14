/**
 * Localization and Internationalization (i18n) Module.
 *
 * Responsible for:
 * - managing language dictionaries (RU/EN);
 * - dynamic text replacement with template support;
 * - automatic updating of UI elements based on data-attributes;
 * - persisting language preferences via localStorage and Cookies.
 */

/**
 * Модуль локализации и интернационализации (i18n).
 *
 * Отвечает за:
 * - управление словарями перевода (RU/EN);
 * - динамическую подстановку текста с поддержкой шаблонов;
 * - автоматическое обновление элементов интерфейса по data-атрибутам;
 * - сохранение выбора языка в localStorage и Cookie.
 */

import ru from './locales/ru.js';
import en from './locales/en.js';

const langs = { ru, en };
let currentLang = 'ru';


/**
 * Translates a key into the current language with optional data interpolation.
 *
 * Logic:
 * - retrieves the string from the dictionary or returns the key if not found;
 * - replaces placeholders like {key} with values from the data object;
 * - supports language-specific keys in the data object (e.g., nameRu or nameEn).
 * Params:
 * key - The translation key.
 * data - An object containing values for interpolation.
 * The translated and formatted string.
 */

/**
 * Переводит ключ на текущий язык с возможностью интерполяции данных.
 *
 * Логика:
 * - получает строку из словаря или возвращает сам ключ, если перевод не найден;
 * - заменяет плейсхолдеры вида {key} значениями из объекта data;
 * - поддерживает поиск специфичных для языка ключей в объекте данных (например, nameRu или nameEn).
 * Параметры
 * key — Ключ перевода.
 * data — Объект с данными для подстановки в шаблон.
 * Переведенная и отформатированная строка.
 */
export function t(key, data = {}) {
    let str = langs[currentLang][key] ?? key;
    return str.replace(/\{(\w+)\}/g, (_, k) => {
      return data[k + currentLang.charAt(0).toUpperCase() + currentLang.slice(1)]
        ?? data[k]
        ?? '';
    });
  }


/**
 * Applies the selected language to all relevant DOM elements.
 *
 * Behavior:
 * - updates text content for elements with [data-i18n];
 * - updates placeholders for elements with [data-i18n-placeholder];
 * - updates titles for elements with [data-i18n-title];
 * - handles direct language attributes ([data-ru], [data-en]);
 * - updates the 'lang' attribute of the <html> element.
 *
 * lang - Language code ('ru' or 'en').
 */

/**
 * Применяет выбранный язык ко всем соответствующим элементам DOM.
 *
 * Поведение:
 * - обновляет текстовое содержимое для элементов с [data-i18n];
 * - обновляет плейсхолдеры для [data-i18n-placeholder];
 * - обновляет подсказки для [data-i18n-title];
 * - обрабатывает прямые атрибуты языка ([data-ru], [data-en]);
 * - обновляет атрибут 'lang' у тега <html>.
 *
 * lang — Код языка ('ru' или 'en').
 */
export function applyLang(lang) {
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const data = { ...el.dataset };
    delete data.i18n;
    el.textContent = t(key, data);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });

  // Элементы с data-ru / data-en
document.querySelectorAll('[data-ru][data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });

  document.documentElement.lang = lang;
}


/**
 * Sets the new language and saves it to the system.
 *
 * Logic:
 * - stores the language code in localStorage;
 * - sets a cookie for server-side language detection (expires in 1 year);
 * - calls applyLang() to refresh the UI.
 *
 * lang - Language code ('ru' or 'en').
 */

/**
 * Устанавливает новый язык и сохраняет его в системе.
 *
 * Логика:
 * - сохраняет код языка в localStorage;
 * - устанавливает cookie для определения языка на стороне сервера (срок 1 год);
 * - вызывает applyLang() для обновления интерфейса.
 *
 * lang — Код языка ('ru' или 'en').
 */
export function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.cookie = `lang=${lang};path=/;max-age=31536000`;
  applyLang(lang);
}


/**
 * Initializes the language settings upon page load.
 *
 * Logic:
 * - checks localStorage for a saved language;
 * - defaults to 'ru' if the browser language starts with 'ru', otherwise 'en';
 * - ensures the language cookie is set and applies the language.
 */

/**
 * Инициализирует настройки языка при загрузке страницы.
 *
 * Логика:
 * - проверяет наличие сохраненного языка в localStorage;
 * - если не найдено, выбирает 'ru', если язык браузера начинается на 'ru', иначе 'en';
 * - прописывает cookie и применяет выбранный язык.
 */
export function initLang() {
  const saved = localStorage.getItem('lang')
    || (navigator.language.startsWith('ru') ? 'ru' : 'en');
  document.cookie = `lang=${saved};path=/;max-age=31536000`; 
  applyLang(saved);
}

window.setLang = setLang;