/**
 * Frontend authentication management module.
 *
 * Responsible for:
 * - reading and writing the JWT token in localStorage;
 * - fetching the current user from the backend and caching the result;
 * - handling system logout and clearing authentication data.
 */

/**
 * Модуль управления аутентификацией на фронтенде.
 *
 * Отвечает за:
 * - чтение и запись JWT-токена в localStorage;
 * - получение текущего пользователя с бэкенда и кеширование результата;
 * - выход из системы и очистку данных аутентификации.
 */
let currentUser = null;
let fetchPromise = null;


/**
 * Returns information about the current user.
 *
 * Logic:
 * - if the user is already loaded (currentUser != null), returns them immediately;
 * - if a user request is already in progress (fetchPromise != null), returns 
 * the existing promise to avoid duplicate requests;
 * - retrieves the token from localStorage (access_token); if no token exists, returns null;
 * - if a token is present, makes a GET /api/users/me request with the Authorization header;
 * - on a successful response (response.ok), parses the JSON, saves it to currentUser, 
 * and returns the user object;
 * - on an error response, removes the token from localStorage and returns null;
 * - on a network error, logs it to the console and returns null;
 * - finally, always resets fetchPromise to null.
 */

/**
 * Возвращает информацию о текущем пользователе.
 *
 * Логика:
 * - если пользователь уже загружен (currentUser != null) — сразу возвращает его;
 * - если запрос на пользователя уже выполняется (fetchPromise != null) —
 * возвращает существующий промис, чтобы не дублировать запрос;
 * - берёт токен из localStorage (access_token); если токена нет — возвращает null;
 * - при наличии токена делает запрос GET /api/users/me с заголовком Authorization;
 * - при успешном ответе (response.ok) парсит JSON, сохраняет его в currentUser
 * и возвращает объект пользователя;
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
 * Logs the user out of the system.
 *
 * Removes the JWT token from localStorage, clears the currentUser cache,
 * and redirects the user to the /login page.
 */

/**
 * Выполняет выход пользователя из системы.
 *
 * Удаляет JWT-токен из localStorage, сбрасывает кеш currentUser
 * и перенаправляет пользователя на страницу /login.
 */
export function logout() {
  localStorage.removeItem("access_token");
  currentUser = null;
  window.location.href = "/login";
}

/**
 * Retrieves the current JWT access token from storage
 * Возвращает текущий JWT‑токен доступа из localStorage.
 */
export function getToken() {
  return localStorage.getItem("access_token");
}

/**
 * Saves the JWT access token to localStorage.
 */

/**
 * Сохраняет JWT-токен доступа в localStorage.
 */
export function setToken(token) {
  localStorage.setItem("access_token", token);
}

/**
 * Clears the cached current user information.
 *
 * Used when a forced re-fetch of user data is required
 * (e.g., after a role change or profile update without a full logout).
 */

/**
 * Очищает кеш информации о текущем пользователе.
 *
 * Используется, когда нужно принудительно запросить пользователя заново
 * (например, после смены роли или профиля без полного разлогина).
 */
export function clearUserCache() {
  currentUser = null;
}