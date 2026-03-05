/**
 * Модуль страницы регистрации пользователей и массового импорта из Excel.
 *
 * Отвечает за:
 * - валидацию полей формы регистрации (ФИО, телефон, роль) и управление кнопкой отправки;
 * - форматирование телефонного номера по мере ввода;
 * - проверку авторизации и наличия JWT‑токена перед регистрацией;
 * - отправку данных нового пользователя на эндпоинт /api/users/create;
 * - переключение вкладок (регистрация / импорт);
 * - выбор и предпросмотр Excel‑файла для импорта пользователей;
 * - загрузку Excel‑файла на эндпоинт /api/admin/excel-upload/ и показ статуса операции.
 */
import { getErrorMessage, isPhoneValid, formatPhone, showStatusModal } from './utils.js';
import { getCurrentUser, getToken } from '/static/js/auth.js';

// Элементы формы регистрации пользователя.
const registerForm = document.getElementById('registerForm');
const phoneInput = document.getElementById('phonenumber');
const fullNameInput = document.getElementById("fullname");
const userRoleSelect = document.getElementById("roleselect");
const submitBtn = document.querySelector('.submit-button');

/**
 * Проверяет корректность заполнения полей формы регистрации.
 *
 * Условия:
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
        console.log("Current user:", user);
    }
}
updateAuth();

// Проверка наличия JWT‑токена при загрузке страницы.
// При отсутствии токена пользователь перенаправляется на /login.
const token = getToken();
if (!token) {
    window.location.href = '/login';
}

// При изменении имени или роли пересчитываем доступность кнопки.
fullNameInput.addEventListener("input", checkForm);
userRoleSelect.addEventListener("change", checkForm);

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
 * Обработчик отправки формы регистрации нового пользователя.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (event.preventDefault());
 * - собирает данные из registerForm в FormData;
 * - формирует объект userData с полями name, phone_number и role;
 * - отправляет POST‑запрос на /api/users/create с JSON‑телом и JWT‑токеном
 *   в заголовке Authorization;
 * - при успешном ответе:
 *     - показывает модальное окно об успешной регистрации пользователя;
 * - при ошибочном ответе сервера:
 *     - парсит JSON‑ошибку и показывает её через showStatusModal
 *       с использованием getErrorMessage(error);
 * - при сетевой ошибке:
 *     - показывает модальное окно с сообщением о проблеме с соединением.
 */
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log("Form submitted");

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
                message: "Пользователь успешно зарегистрирован!",
            });
        } else {
            const error = await response.json();

            showStatusModal({
                type: "error",
                message: `Ошибка регистрации: ${getErrorMessage(error)}`
            });
        }
    } catch (error) {
        showStatusModal({
            type: "error",
            message: 'Network error. Please check your connection and try again.'
        });
    }
});


// Вкладки и соответствующие им блоки форм.
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form-block');


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

// Элементы интерфейса для выбора и предпросмотра Excel‑файла импорта.
const uploadBlock = document.getElementById('uploadBlock');
const fileInput = document.getElementById('fileInput');
const previewList = document.getElementById('previewList');

// Клик по области uploadBlock открывает диалог выбора файла.
uploadBlock.addEventListener('click', () => {
    fileInput.click();
});

let selectedFiles = []; 

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
    console.log(file.type)

    if (!file) {
        showStatusModal({
            type: "error",
            message: "Файл не выбран"
        });
        return;
    }

    selectedFiles = [file]; 
    renderPreview()
});


/**
 * Отрисовывает предпросмотр выбранного Excel‑файла.
 *
 * Для каждого файла в selectedFiles:
 * - проверяет MIME‑тип (ожидается
 *   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 * - создаёт блок preview-item с:
 *   - иконкой Excel;
 *   - именем файла;
 *   - кнопкой удаления;
 *   - размером файла в мегабайтах.
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
                    Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB
                </p> 
            </div>
        `;

        previewList.appendChild(previewItem);
    });
    addDeleteHandlers();
}


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

// Кнопка запуска импорта пользователей из Excel.
const uploadBtn = document.getElementById('uploadBtn');
uploadBtn.addEventListener('click', uploadFiles);


/**
 * Отправляет выбранный Excel‑файл на сервер для массового создания пользователей.
 *
 * Поведение:
 * - если файл не выбран (selectedFiles пуст) — показывает сообщение об ошибке;
 * - создаёт FormData и добавляет в неё первый файл под ключом "file";
 * - показывает модальное окно о начале загрузки и обработки;
 * - отправляет POST‑запрос на "api/admin/excel-upload/" с телом formData
 *   и JWT‑токеном в заголовке Authorization;
 * - при ответе 401 выполняет редирект на /login;
 * - при неуспешном статусе:
 *     - читает JSON‑ошибку, показывает её через showStatusModal
 *       и выводит текст ошибки в консоль;
 * - при успешном ответе:
 *     - читает JSON с информацией о количестве добавленных пользователей,
 *     - логирует insert_count в консоль,
 *     - показывает модальное окно об успешном добавлении пользователей,
 *     - очищает состояние (selectedFiles, previewList, fileInput);
 * - при исключении (ошибка сети и т.п.):
 *     - логирует ошибку в консоль,
 *     - показывает модальное окно с сообщением об ошибке загрузки.
 */
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showStatusModal({
            type: "error",
            message: "Нет файлов для загрузки"
        });
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFiles[0]);  
    try {
        showStatusModal({
            type: "success",
            message: "Выполняется загрузка и обработка файлов. Это может занять некоторое время...",
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
            showStatusModal({
                type: 'error',
                message: `Ошибка загрузки: ${errorData.detail}`
            })
            console.log(errorData.detail);
        }

        const data = await response.json();

        console.log("Пользователи добавлены:", data.insert_count);

        showStatusModal({
            type: "success",
            message: "Пользователи успешно добавлены!",
        });

        selectedFiles = [];
        previewList.innerHTML = "";
        fileInput.value = "";

    } catch (error) {
        console.error(error);
        showStatusModal({
            type: "error",
            message: `Ошибка при загрузке файлов: ${error}`,
        });
    } 
}

