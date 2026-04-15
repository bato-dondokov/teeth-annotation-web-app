/**
 * Модуль страницы входа в систему.
 *
 * Отвечает за:
 * - валидацию полей формы (телефон, роль, пароль) и управление кнопкой отправки;
 * - форматирование телефонного номера по мере ввода;
 * - отправку данных формы на эндпоинт /api/users/token для получения токена;
 * - сохранение access_token в localStorage;
 * - показ статуса авторизации через модальные окна и перенаправление
 *   пользователя на нужную страницу (админку или разметку).
 */
import { getErrorMessage, isPhoneValid, formatPhone, showStatusModal } from './utils.js';

// Элементы формы авторизации и связанные поля ввода.
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phonenumber');
const userRoleSelect = document.getElementById("roleselect");
const passwordInput = document.getElementById("accesscode");
const submitBtn = document.querySelector('.submit-button');

/**
 * Проверяет корректность заполнения полей формы логина.
 *
 * Условия:
 * - телефон должен быть валиден согласно функции isPhoneValid();
 * - роль пользователя (roleselect) не должна быть пустой;
 * - поле пароля не должно быть пустым после trim().
 *
 * В зависимости от результата включает или отключает кнопку отправки формы.
 */
function checkForm() {
  const isPhoneValidFlag = isPhoneValid(phoneInput.value);
  const isRoleValid = userRoleSelect.value !== "";
  const isPasswordValid = passwordInput.value.trim() !== "";

  submitBtn.disabled = !(isPhoneValidFlag && isRoleValid && isPasswordValid);
}

// При изменении пароля или роли пересчитываем доступность кнопки.
passwordInput.addEventListener("input", checkForm);
userRoleSelect.addEventListener("change", checkForm);

/**
 * Обработчик ввода телефона.
 *
 * - запоминает текущую позицию курсора и длину строки;
 * - форматирует номер с помощью formatPhone();
 * - корректирует позицию курсора, чтобы пользователь не "терялся" при вводе;
 * - после форматирования пересчитывает валидность формы (checkForm()).
 */
phoneInput.addEventListener("input", () => {
  const cursorPos = phoneInput.selectionStart;
  const oldLength = phoneInput.value.length;

  phoneInput.value = formatPhone(phoneInput.value);

  const newLength = phoneInput.value.length;
  phoneInput.selectionEnd = cursorPos + (newLength - oldLength);

  checkForm();
});

/**
 * Обработчик отправки формы логина.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (event.preventDefault());
 * - собирает данные формы в FormData и выводит их в консоль (для отладки);
 * - отправляет POST‑запрос на /api/users/token, передавая FormData в теле
 *   (требование OAuth2PasswordRequestForm — именно form data, а не JSON);
 * - при успешном ответе:
 *     - читает JSON с токеном (access_token),
 *     - сохраняет токен в localStorage,
 *     - определяет следующую страницу по выбранной роли
 *       (admin → /admin, иначе → /annotation),
 *     - показывает модальное окно об успешной авторизации и
 *       по подтверждению перенаправляет пользователя;
 * - при ошибочном ответе сервера:
 *     - читает JSON ошибки и показывает её через showStatusModal
 *       с использованием getErrorMessage(error);
 * - при сетевой ошибке:
 *     - показывает модальное окно с сообщением о проблеме с соединением.
 */
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    try {
        const response = await fetch('/api/users/token', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            
            let userRole = formData.get('roleselect');
            let nextPage = userRole === "admin" ? "/admin" : "/annotation";

            showStatusModal({
                type: "success",
                message: "Пользователь успешно авторизован!",
                onConfirm: () => {
                    window.location.href = nextPage;
                }
            });
        } else {
            const error = await response.json();
            
            showStatusModal({
                type: "error",
                message: `Ошибка авторизации: ${getErrorMessage(error)}`
            });
        }
    } catch (error) {
        showStatusModal({
            type: "error",
            message: 'Ошибка сети. Пожалуйста, проверьте подключение и повторите попытку.'
        });
    }
});