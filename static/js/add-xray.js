/**
 * X-ray Upload Module.
 *
 * Responsible for:
 * - user authorization and JWT token validation;
 * - file selection via hidden <input type="file">;
 * - live preview of selected images (name, size, thumbnail, removal);
 * - sending files to the backend (FastAPI) as FormData;
 * - displaying operation status (success / error / progress) via modals.
 */

/**
 * Модуль загрузки рентгеновских снимков.
 *
 * Отвечает за:
 * - проверку авторизации пользователя и наличие JWT-токена;
 * - выбор файлов через скрытый <input type="file">;
 * - предпросмотр выбранных изображений (имя, размер, превью, удаление);
 * - отправку файлов на бэкенд (FastAPI) в виде FormData;
 * - отображение статуса операций (успех / ошибка / процесс) через модальные окна.
 */

import { initLang, t } from './i18n.js';
initLang();


import { showStatusModal } from './utils.js';
import { getCurrentUser, getToken } from '/static/js/auth.js';

// Main UI elements for file uploading.
// Основные элементы интерфейса для загрузки файлов.
const uploadBlock = document.getElementById('uploadBlock');
const fileInput = document.getElementById('fileInput');
const previewList = document.getElementById('previewList');
const uploadBtn = document.getElementById('uploadBtn');


/**
 * Checks the user's authorization status.
 *
 * Asynchronously retrieves the current user via getCurrentUser().
 * If the user is not authorized, redirects to the /login page.
 * If authorized, logs user data to the console (for debugging).
 *
 * Called once upon page load.
 */

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

uploadBlock.addEventListener('click', () => {
    fileInput.click();
});


/**
 * Array of user-selected files before uploading to the server.
 */

/**
 * Массив выбранных пользователем файлов перед отправкой на сервер.
 */
let selectedFiles = [];

/**
 * Shows the upload button only when files are selected.
 */

/**
 * Показывает кнопку загрузки только при наличии выбранных файлов.
 */
function updateUploadButtonVisibility() {
    uploadBtn.style.display = selectedFiles.length > 0 ? "" : "none";
}


/**
 * Handler for file selection changes.
 *
 * Limits the selection to a maximum of 10 files, saves them into the
 * selectedFiles array, and triggers the preview rendering.
 *
 * If the limit is exceeded, displays an error modal and resets
 * the fileInput value.
 */

/**
 * Обработчик изменения списка выбранных файлов.
 *
 * Ограничивает выбор максимум 10 файлами, сохраняет выбранные файлы
 * в массив selectedFiles и запускает отрисовку предпросмотра.
 *
 * При превышении лимита показывает модальное окно с ошибкой
 * и сбрасывает значение fileInput.
 */
fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);

    if (files.length > 10) {
        showStatusModal({
            type: "error",
            message: t("add_xray_no_more_then_10")
        });
        fileInput.value = "";
        return;
    }

    selectedFiles = files;
    renderPreview();
    updateUploadButtonVisibility();
});


/**
 * Renders a preview of selected files in the previewList element.
 *
 * For each image file, creates a block containing:
 * - a thumbnail (img.preview-img);
 * - the file name;
 * - a delete button;
 * - the file size in megabytes.
 *
 * Attaches deletion handlers via addDeleteHandlers() after rendering.
 */

/**
 * Отрисовывает предпросмотр выбранных файлов в элементе previewList.
 *
 * Для каждого файла-изображения создаёт блок с:
 * - миниатюрой (img.preview-img);
 * - именем файла;
 * - кнопкой удаления;
 * - размером файла в мегабайтах.
 *
 * После отрисовки навешивает обработчики удаления через addDeleteHandlers().
 */
function renderPreview() {
    previewList.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        if (!file.type.startsWith('image/')) return;

        const previewItem = document.createElement('div');
        previewItem.className = "preview-item";

        previewItem.innerHTML = `
            <img src="${URL.createObjectURL(file)}" class="preview-img">

            <div class="preview-desc">   
                <div class="preview-desc-first-line">
                    <p class="preview-filename">${file.name}</p>
                    <img 
                        src="/static/icons/cross.png"
                        class="delete-btn"
                        data-index="${index}"
                        alt="remove"
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
 * Assigns click handlers to the delete buttons in the file preview list.
 *
 * Upon clicking:
 * - removes the file with the corresponding index from the selectedFiles array;
 * - re-triggers renderPreview() to update the list.
 */

/**
 * Назначает обработчики клика на кнопки удаления файлов из предпросмотра.
 *
 * При клике:
 * - удаляет файл с соответствующим индексом из массива selectedFiles;
 * - повторно вызывает renderPreview() для обновления списка.
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


uploadBtn.addEventListener('click', uploadFiles);
updateUploadButtonVisibility();


/**
 * Sends selected files to the server.
 *
 * Behavior:
 * - if no files are selected, displays an error message and stops execution;
 * - constructs FormData, appending each file under the "files" key
 * (key name must match the expected FastAPI parameter);
 * - displays a modal window indicating the start of upload and processing;
 * - performs a POST request to "api/admin/xray-upload/" with the JWT token in the header;
 * - redirects the user to /login upon a 401 response;
 * - throws an error if the response status is unsuccessful;
 * - on success:
 * - parses the JSON response,
 * - logs information about saved files to the console,
 * - displays a success message,
 * - clears the state (selectedFiles, preview list, and fileInput value);
 * - on any error, logs the error and displays an error modal.
 */

/**
 * Отправляет выбранные файлы на сервер.
 *
 * Поведение:
 * - если файлы не выбраны — показывает сообщение об ошибке и прекращает работу;
 * - формирует FormData, добавляя каждый файл под ключом "files"
 * (имя ключа должно совпадать с ожидаемым параметром FastAPI);
 * - показывает модальное окно о начале загрузки и обработки;
 * - выполняет POST-запрос на "api/admin/xray-upload/" с JWT-токеном в заголовке;
 * - при ответе 401 перенаправляет пользователя на /login;
 * - при неуспешном статусе выбрасывает ошибку;
 * - при успехе:
 * - читает JSON-ответ,
 * - выводит информацию о сохранённых файлах в консоль,
 * - показывает сообщение об успешной загрузке,
 * - очищает состояние (selectedFiles, список превью и значение fileInput);
 * - при любой ошибке логирует её и показывает модальное окно с сообщением об ошибке.
 */
async function uploadFiles() {

    if (selectedFiles.length === 0) {
        showStatusModal({
            type: "error",
            message: t("add_xray_no_files")
        });
        return;
    }

    const formData = new FormData();

    selectedFiles.forEach(file => {
        formData.append("files", file);
    });

    try {

        showStatusModal({
            type: "success",
            message: t("add_xray_process_info"),
            showButton: false
        });


        const response = await fetch("api/admin/xray-upload/", {
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
            const error = await response.json();
            showStatusModal({
                type: "error",
                message: t("add_xray_upload_error", { detail: t(getErrorMessage(error)) })
            });
            selectedFiles = [];
            previewList.innerHTML = "";
            fileInput.value = "";
            updateUploadButtonVisibility();
            return;
        }

        showStatusModal({
            type: "success",
            message: t("add_xray_upload_success"),
            onConfirm: () => {
                window.location.reload();
            }
        });

        selectedFiles = [];
        previewList.innerHTML = "";
        fileInput.value = "";
        updateUploadButtonVisibility();

    } catch (error) {

        showStatusModal({
            type: "error",
            message: t("add_xray_upload_error2", {error_detail: t(error)})
        });
    } 
}
