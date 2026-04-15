/**
 * Административный модуль фронтенда.
 *
 * Отвечает за:
 * - проверку авторизации администратора и наличие JWT‑токена;
 * - обработку выхода из системы;
 * - скачивание резервной копии базы данных по защищённому API‑эндпоинту;
 * - отображение ошибок при проблемах с запросом или сетью.
 */
import { getCurrentUser, logout, getToken } from '/static/js/auth.js';

/**
 * Проверяет состояние авторизации пользователя.
 *
 * Асинхронно получает текущего пользователя через getCurrentUser().
 * Если пользователь не авторизован — выполняет редирект на страницу /login.
 * Если авторизован — выводит данные пользователя в консоль (для отладки).
 *
 * Вызывается один раз при загрузке страницы.
 */
async function updateAuth() {
    const user = await getCurrentUser();

    if (!user) {
        // Not logged in, redirect to login page
        window.location.href = "/login";        
    } else {
        return user;
    }
}

// Кнопка выхода из аккаунта администратора и обработчик клика.
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}
updateAuth();

// Проверка наличия JWT‑токена при загрузке страницы.
// При отсутствии токена пользователь перенаправляется на /login.
const token = getToken();
if (!token) {
    window.location.href = '/login';
}

// const downloadBtn = document.getElementById('downloadBtn');
/**
 * Обработчик кнопки скачивания резервной копии базы данных.
 *
 * При клике:
 * - проверяет наличие JWT‑токена, при его отсутствии перенаправляет на /login;
 * - отправляет POST‑запрос на эндпоинт /api/admin/dbdownload/ с токеном в заголовке;
 * - при успешном ответе:
 *     - читает бинарный ответ как Blob,
 *     - создаёт временную ссылку и инициирует скачивание файла backup_<ISO‑дата>.db;
 * - при ошибке ответа сервера:
 *     - парсит JSON‑ошибку и показывает модальное окно с сообщением об ошибке;
 * - при сетевой ошибке:
 *     - показывает модальное окно с сообщением о проблеме с соединением.
 */
// downloadBtn.addEventListener('click', async () => {

//     try {
//         const response = await fetch('/api/admin/dbdownload/', {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         });

//         if (response.ok) {
//             const blob = await response.blob();
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `backup_${new Date().toISOString()}.db`;
//             document.body.appendChild(a);
//             a.click();
//             a.remove();
//         } else {
//             const error = await response.json();
//             showStatusModal({
//                 type: "error",
//                 message: getErrorMessage(error)
//             });
//         }
//     } catch (error) {
//         showStatusModal({
//             type: "error",
//             message: 'Ошибка сети. Пожалуйста, проверьте подключение и повторите попытку.'
//         });
//     }
// });
