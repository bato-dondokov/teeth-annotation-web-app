/**
 * User registration and mass Excel import page module.
 *
 * Responsible for:
 * - validating registration form fields (Full Name, phone, role) and managing the submit button;
 * - formatting the phone number in real-time during input;
 * - verifying authorization and checking for a valid JWT token before registration;
 * - sending new user data to the /api/users/create endpoint;
 * - handling tab switching (manual registration vs. mass import);
 * - managing Excel file selection and preview for user imports;
 * - uploading Excel files to the /api/admin/excel-upload/ endpoint and displaying operation status.
 */

/**
 * Модуль страницы регистрации пользователей и массового импорта из Excel.
 *
 * Отвечает за:
 * - валидацию полей формы регистрации (ФИО, телефон, роль) и управление кнопкой отправки;
 * - форматирование телефонного номера по мере ввода;
 * - проверку авторизации и наличия JWT-токена перед регистрацией;
 * - отправку данных нового пользователя на эндпоинт /api/users/create;
 * - переключение вкладок (регистрация / импорт);
 * - выбор и предпросмотр Excel-файла для импорта пользователей;
 * - загрузку Excel-файла на эндпоинт /api/admin/excel-upload/ и показ статуса операции.
 */
import { initLang, t } from './i18n.js';
import { getErrorMessage, isPhoneValid, formatPhone, showStatusModal } from './utils.js';
import { getCurrentUser, getToken } from '/static/js/auth.js';
initLang();

// User registration form elements.
// Элементы формы регистрации пользователя.
const registerForm = document.getElementById('registerForm');
const phoneInput = document.getElementById('phonenumber');
const fullNameInput = document.getElementById("fullname");
const userRoleSelect = document.getElementById("roleselect");
const submitBtn = document.querySelector('.submit-button');

/**
 * Validates the user registration form fields.
 *
 * Conditions:
 * - the Full Name field must not be empty after calling trim();
 * - the phone number must be valid according to the isPhoneValid() function;
 * - the user role (roleselect) must not be empty.
 *
 * Depending on the result, enables or disables the form submission button.
 */

/**
 * Проверяет корректность заполнения полей формы регистрации.
 *
 * Условие:
 * - поле ФИО не должно быть пустым после trim();
 * - телефон должен быть валиден согласно функции isPhoneValid();
 * - роль пользователя (roleselect) не должна быть пустой.
 *
 * В зависимости от результата включает или отключает кнопку отправки формы.
 */
function checkForm() {
  const isNameValid = fullNameInput.value.trim() !== "";
  const isPhoneValidFlag = isPhoneValid(phoneInput.value);
  const isRoleValid = userRoleSelect.value !== "";

  submitBtn.disabled = !(isNameValid && isPhoneValidFlag && isRoleValid);
}


/**
 * Verifies the user's authorization status.
 *
 * Logic:
 * - calls getCurrentUser() to fetch user information;
 * - if the user is not authorized (returns null), redirects to the /login page;
 * - if authorized, logs the user object to the console for debugging purposes;
 * - ensures the page is only accessible to authenticated users.
 */

/**
 * Проверяет состояние авторизации пользователя.
 *
 * Логика:
 * - вызывает getCurrentUser() для получения данных о пользователе;
 * - если пользователь не авторизован (возвращен null) — перенаправляет на страницу /login;
 * - если авторизован — выводит объект пользователя в консоль для отладки;
 * - гарантирует, что страница доступна только аутентифицированным пользователям.
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
updateAuth();

/**
 * Checks for the presence of a JWT token on page load.
 * Redirects the user to /login if the token is missing.
 */

/**
 * Проверка наличия JWT-токена при загрузке страницы.
 * При отсутствии токена пользователь перенаправляется на /login.
 */
const token = getToken();
if (!token) {
    window.location.href = '/login';
}

/**
 * Re-evaluates the submit button's availability whenever 
 * the full name (FIO) or role selection changes.
 */

/**
 * При изменении имени или роли пересчитываем доступность кнопки.
 */
fullNameInput.addEventListener("input", checkForm);
userRoleSelect.addEventListener("change", checkForm);

/**
 * Phone input event handler.
 *
 * - captures the current cursor position and string length;
 * - formats the number using the formatPhone() utility;
 * - adjusts the cursor position based on changes in string length;
 * - triggers checkForm() after formatting to update the submit button state.
 */

/**
 * Обработчик ввода телефона.
 *
 * - запоминает текущую позицию курсора и длину строки;
 * - форматирует номер с помощью formatPhone();
 * - корректирует позицию курсора с учётом изменений длины строки;
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
 * Handler for the new user registration form submission.
 *
 * Behavior:
 * - prevents the default form submission (event.preventDefault());
 * - collects data from registerForm into a FormData object;
 * - constructs a userData object with name, phone_number, and role fields;
 * - sends a POST request to /api/users/create with a JSON body and the JWT token 
 * in the Authorization header;
 * - on success:
 * - displays a status modal indicating successful user registration;
 * - on server error:
 * - parses the error JSON and displays it via showStatusModal 
 * using the getErrorMessage(error) utility;
 * - on network error:
 * - displays a modal window with a connection problem message.
 */

/**
 * Обработчик отправки формы регистрации нового пользователя.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (event.preventDefault());
 * - собирает данные из registerForm в FormData;
 * - формирует объект userData с полями name, phone_number и role;
 * - отправляет POST-запрос на /api/users/create с JSON-телом и JWT-токеном 
 * в заголовке Authorization;
 * - при успешном ответе:
 * - показывает модальное окно об успешной регистрации пользователя;
 * - при ошибочном ответе сервера:
 * - парсит JSON-ошибку и показывает её через showStatusModal 
 * с использованием getErrorMessage(error);
 * - при сетевой ошибке:
 * - показывает модальное окно с сообщением о проблеме с соединением.
 */
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const userData = {
        name: formData.get('fullname'),
        phone_number: formData.get('phonenumber'),
        role: formData.get('roleselect'),
    };

    try {
        const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
        });

        if (response.ok) {
            showStatusModal({
                type: "success",
                message: t("register_success"),
            });
        } else {
            const error = await response.json();

            showStatusModal({
                type: "error",
                message: t("register_error", { detail: t(getErrorMessage(error)) }),
            });
        }
    } catch (error) {
        showStatusModal({
            type: "error",
            message: t("register_network_error")
        });
    }
});

// Tab elements and their corresponding form blocks.
// Вкладки и соответствующие им блоки форм.
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form-block');


/**
 * Tab switching logic.
 *
 * When a tab is clicked:
 * - removes the 'active' class from all tabs and form blocks;
 * - adds the 'active' class to the clicked tab;
 * - identifies and activates the corresponding form block based on the 'data-tab' attribute.
 */

/**
 * Логика переключения вкладок.
 *
 * При клике по вкладке:
 * - снимает класс 'active' со всех вкладок и форм;
 * - добавляет класс 'active' к выбранной вкладке;
 * - находит и активирует соответствующий блок формы по атрибуту data-tab.
 */
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    tab.classList.add('active');
    const targetForm = document.getElementById(tab.dataset.tab);
    targetForm.classList.add('active');
  });
});

// UI elements for Excel file selection and import preview.
// Элементы интерфейса для выбора и предпросмотра Excel‑файла импорта.
const uploadBlock = document.getElementById('uploadBlock');
const fileInput = document.getElementById('fileInput');
const previewList = document.getElementById('previewList');


// Triggers the file selection dialog when the upload area is clicked.
// Клик по области uploadBlock открывает диалог выбора файла.
uploadBlock.addEventListener('click', () => {
    fileInput.click();
});

let selectedFiles = []; 

/**
 * Handler for selecting a file for user import.
 *
 * - retrieves the first selected file from fileInput.files[0];
 * - displays an error message if no file is selected;
 * - stores the file in the selectedFiles array;
 * - triggers the preview rendering process (renderPreview()).
 */

/**
 * Обработчик выбора файла для импорта пользователей.
 *
 * - получает первый выбранный файл из fileInput.files[0];
 * - при отсутствии файла показывает сообщение об ошибке;
 * - сохраняет файл в массив selectedFiles;
 * - запускает отрисовку предпросмотра (renderPreview()).
 */
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (!file) {
        showStatusModal({
            type: "error",
            message: t("register_no_file")
        });
        return;
    }

    selectedFiles = [file]; 
    renderPreview();
    updateUploadButtonVisibility();
});


/**
 * Renders a preview of the selected Excel files.
 *
 * For each file in the selectedFiles array:
 * - verifies the MIME type (expects 
 * "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 * - creates a preview-item block containing:
 * - an Excel icon;
 * - the filename;
 * - a delete button;
 * - the file size converted to megabytes.
 *
 * After rendering, attaches deletion event listeners via addDeleteHandlers().
 */

/**
 * Отрисовывает предпросмотр выбранного Excel-файла.
 *
 * Для каждого файла в selectedFiles:
 * - проверяет MIME-тип (ожидается
 * "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 * - создаёт блок preview-item с:
 * - иконкой Excel;
 * - именем файла;
 * - кнопкой удаления;
 * - размером файла в мегабайтах.
 *
 * После отрисовки навешивает обработчики удаления через addDeleteHandlers().
 */
function renderPreview() {
    previewList.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        if (file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return;

        const previewItem = document.createElement('div');
        previewItem.className = "preview-item";

        previewItem.innerHTML = `
            <img src="static/icons/excel-icon.png" class="preview-img">

            <div class="preview-desc">   
                <div class="preview-desc-first-line">
                    <p class="preview-filename">${file.name}</p>
                    <img 
                        src="/static/icons/cross.png"
                        class="delete-btn"
                        data-index="${index}"
                        alt="Удалить"
                        style="cursor:pointer; width:20px; height:20px;"
                    >
                </div>                 
                <p class="preview-desc-second-line">
                    ${(file.size / 1024 / 1024).toFixed(2)} MB
                </p> 
            </div>
        `;

        previewList.appendChild(previewItem);
    });
    addDeleteHandlers();
    updateUploadButtonVisibility();
}


/**
 * Assigns click event handlers to the file removal buttons in the preview.
 *
 * When a button is clicked:
 * - removes the file at the corresponding index from the selectedFiles array;
 * - re-triggers renderPreview() to update the displayed list.
 */

/**
 * Назначает обработчики клика на кнопки удаления файлов из предпросмотра.
 *
 * При клике по кнопке:
 * - удаляет файл с соответствующим индексом из массива selectedFiles;
 * - заново вызывает renderPreview() для обновления списка.
 */
function addDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            selectedFiles.splice(index, 1);
            renderPreview();
        });
    });
}

const uploadBtn = document.getElementById('uploadBtn');
uploadBtn.addEventListener('click', uploadFiles);

/**
 * Displays the import button only when a file has been selected.
 */

/**
 * Показывает кнопку импорта только при наличии выбранного файла.
 */
function updateUploadButtonVisibility() {
    uploadBtn.style.display = selectedFiles.length > 0 ? "" : "none";
}
updateUploadButtonVisibility();


/**
 * Handles the bulk user import from an Excel file.
 *
 * Behavior:
 * - ensures a file is selected; otherwise, displays an error message;
 * - appends the selected file from the selectedFiles array to a FormData object;
 * - sends a POST request to /api/admin/excel-upload/ with the FormData body 
 * and the JWT token in the Authorization header;
 * - on success:
 * - displays a status modal confirming the bulk registration;
 * - clears the selection and resets the preview;
 * - on server error (e.g., 401 Unauthorized):
 * - redirects to /login if the session is invalid;
 * - otherwise, parses the error JSON and displays it via showStatusModal;
 * - on network or unexpected error:
 * - displays a modal window with a connection or operation failure message.
 */

/**
 * Отправляет выбранный Excel-файл на сервер для массового импорта пользователей.
 *
 * Поведение:
 * - проверяет наличие выбранного файла; если файл не выбран, показывает ошибку;
 * - добавляет файл из массива selectedFiles в объект FormData;
 * - отправляет POST-запрос на /api/admin/excel-upload/ с телом FormData 
 * и JWT-токеном в заголовке Authorization;
 * - при успешном ответе:
 * - показывает модальное окно об успешном завершении импорта;
 * - очищает список выбранных файлов и сбрасывает предпросмотр;
 * - при ошибке сервера (например, 401 Unauthorized):
 * - выполняет редирект на /login, если сессия невалидна;
 * - в остальных случаях парсит JSON-ошибку и выводит её через showStatusModal;
 * - при сетевой или непредвиденной ошибке:
 * - показывает модальное окно с сообщением о проблеме с соединением или выполнением операции.
 */
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showStatusModal({
            type: "error",
            message: t("register_no_files")
        });
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFiles[0]);  
    try {
        showStatusModal({
            type: "success",
            message: t("register_process"),
            showButton: false
        });

        const response = await fetch("api/admin/excel-upload/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            const detail = errorData.detail;

            // Сначала переводим detail
            const translatedDetail = typeof detail === 'object'
              ? t(detail.code, detail)
              : t(detail);  
            showStatusModal({
                type: 'error',
                message: t("register_process_error", {detail: translatedDetail })
            });
            selectedFiles = [];
            previewList.innerHTML = "";
            fileInput.value = "";
            updateUploadButtonVisibility();
            return;
        }

        showStatusModal({
            type: "success",
            message: t("register_excel_success"),
            onConfirm: () => {
                window.location.reload();
            }
        });
        selectedFiles = [];
        previewList.innerHTML = "";
        fileInput.value = "";
        updateUploadButtonVisibility();

    } catch (error) {
        console.error(error);
        showStatusModal({
            type: "error",
            message: t("register_excel_server_error", {error_detail: t(error)}),
        });
    } 
}

