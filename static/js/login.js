/**
 * Frontend Login Module.
 *
 * Responsible for:
 * - validating annotation form fields and required inputs;
 * - formatting the phone number input in real-time;
 * - handling JWT authentication via the /api/users/me endpoint;
 * - storing tokens and managing redirects based on user roles (Admin or User);
 * - displaying status modals for success or failure during the login process.
 */

/**
 * Модуль входа в систему (фронтенд).
 *
 * Отвечает за:
 * - валидацию обязательных полей формы входа;
 * - форматирование ввода номера телефона в реальном времени;
 * - выполнение аутентификации через эндпоинт /api/users/me;
 * - сохранение JWT-токенов и управление редиректами в зависимости от роли (админ или разметчик);
 * - отображение модальных окон статуса при успешном входе или возникновении ошибок.
 */


import { initLang, t } from './i18n.js';
initLang();


import { getErrorMessage, isPhoneValid, formatPhone, showStatusModal } from './utils.js';

// Authorization form elements and associated input fields.
// Элементы формы авторизации и связанные поля ввода.
const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phonenumber');
const userRoleSelect = document.getElementById("roleselect");
const passwordInput = document.getElementById("accesscode");
const submitBtn = document.querySelector('.submit-button');

/**
 * Validates the login form fields.
 *
 * Conditions:
 * - the phone number must be valid according to the isPhoneValid() function;
 * - the user role (roleselect) must not be empty;
 * - the password field must not be empty after calling trim().
 *
 * Depending on the result, enables or disables the form submission button.
 */

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

/**
 * Re-evaluates the submit button's availability whenever 
 * the password or role selection changes.
 */

/**
 * При изменении пароля или роли пересчитываем доступность кнопки.
 */
passwordInput.addEventListener("input", checkForm);
userRoleSelect.addEventListener("change", checkForm);

/**
 * Phone input event handler.
 *
 * - captures the current cursor position and string length;
 * - formats the number using the formatPhone() utility;
 * - adjusts the cursor position to ensure a seamless typing experience;
 * - triggers checkForm() after formatting to update the submit button state.
 */

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
 * Login form submission handler.
 *
 * Behavior:
 * - prevents the default form submission (event.preventDefault());
 * - collects form data into a FormData object and logs it (for debugging);
 * - sends a POST request to /api/users/token, passing FormData in the body
 * (required by OAuth2PasswordRequestForm — specifically form data, not JSON);
 * - on success:
 * - extracts the access_token from the JSON response,
 * - stores the token in localStorage,
 * - determines the redirect path based on the selected role
 * (admin → /admin, otherwise → /annotation),
 * - displays a success modal and redirects the user upon confirmation;
 * - on server error:
 * - parses the error JSON and displays it via showStatusModal
 * using the getErrorMessage(error) utility;
 * - on network error:
 * - displays a modal window with a connection problem message.
 */

/**
 * Обработчик отправки формы логина.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (event.preventDefault());
 * - собирает данные формы в FormData и выводит их в консоль (для отладки);
 * - отправляет POST-запрос на /api/users/token, передавая FormData в теле
 * (требование OAuth2PasswordRequestForm — именно form data, а не JSON);
 * - при успешном ответе:
 * - читает JSON с токеном (access_token),
 * - сохраняет токен в localStorage,
 * - определяет следующую страницу по выбранной роли
 * (admin → /admin, иначе → /annotation),
 * - показывает модальное окно об успешной авторизации и
 * по подтверждению перенаправляет пользователя;
 * - при ошибочном ответе сервера:
 * - читает JSON ошибки и показывает её через showStatusModal
 * с использованием getErrorMessage(error);
 * - при сетевой ошибке:
 * - показывает модальное окно с сообщением о проблеме с соединением.
 */
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
        phone_number: phoneInput.value,
        role: userRoleSelect.value,
        access_code: passwordInput.value,
      };

    try {
        const response = await fetch('/api/users/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            
            let userRole = formData.get('roleselect');
            let nextPage = userRole === "Administrator" ? "/admin" : "/annotation";

            showStatusModal({
                type: "success",
                message: t("login_success_message"),
                onConfirm: () => {
                    window.location.href = nextPage;
                }
            });
        } else {
            const error = await response.json();
            
            showStatusModal({
                type: "error",
                message: t("login_auth_error_message", { detail: t(getErrorMessage(error)) })
            });
        }
    } catch (error) {
        showStatusModal({
            type: "error",
            message: t("login_network_error_message")
        });
    }
});