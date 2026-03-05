/**
 * Модуль управления аутентификацией на фронтенде.
 *
 * Отвечает за:
 * - чтение и запись JWT‑токена в localStorage;
 * - получение текущего пользователя с бэкенда и кеширование результата;
 * - выход из системы и очистку данных аутентификации.
 */
let currentUser = null;
let fetchPromise = null;

/**
 * Возвращает информацию о текущем пользователе.
 *
 * Логика:
 * - если пользователь уже загружен (currentUser != null) — сразу возвращает его;
 * - если запрос на пользователя уже выполняется (fetchPromise != null) —
 *   возвращает существующий промис, чтобы не дублировать запрос;
 * - берёт токен из localStorage (access_token); если токена нет — возвращает null;
 * - при наличии токена делает запрос GET /api/users/me с заголовком Authorization;
 * - при успешном ответе (response.ok) парсит JSON, сохраняет его в currentUser
 *   и возвращает объект пользователя;
 * - при ошибочном ответе удаляет токен из localStorage и возвращает null;
 * - при сетевой ошибке логирует её в консоль и возвращает null;
 * - в конце всегда сбрасывает fetchPromise в null.
 */
export async function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        currentUser = await response.json();
        return currentUser;
      }

      localStorage.removeItem("access_token");
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Выполняет выход пользователя из системы.
 *
 * Удаляет JWT‑токен из localStorage, сбрасывает кеш currentUser
 * и перенаправляет пользователя на страницу /login.
 */
export function logout() {
  localStorage.removeItem("access_token");
  currentUser = null;
  window.location.href = "/login";
}

/**
 * Возвращает текущий JWT‑токен доступа из localStorage.
 */
export function getToken() {
  return localStorage.getItem("access_token");
}

/**
 * Сохраняет JWT‑токен доступа в localStorage.
 */
export function setToken(token) {
  localStorage.setItem("access_token", token);
}

/**
 * Очищает кеш информации о текущем пользователе.
 *
 * Используется, когда нужно принудительно запросить пользователя заново
 * (например, после смены роли или профиля без полного разлогина).
 */
export function clearUserCache() {
  currentUser = null;
}