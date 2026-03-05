/**
 * Модуль загрузки рентгеновских снимков.
 *
 * Отвечает за:
 * - проверку авторизации пользователя и наличие JWT‑токена;
 * - выбор файлов через скрытый <input type="file">;
 * - предпросмотр выбранных изображений (имя, размер, превью, удаление);
 * - отправку файлов на бэкенд (FastAPI) в виде FormData;
 * - отображение статуса операций (успех / ошибка / процесс) через модальные окна.
 */
import { showStatusModal } from './utils.js';
import { getCurrentUser, getToken } from '/static/js/auth.js';

// Основные элементы интерфейса для загрузки файлов.
const uploadBlock = document.getElementById('uploadBlock');
const fileInput = document.getElementById('fileInput');
const previewList = document.getElementById('previewList');
const uploadBtn = document.getElementById('uploadBtn');

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

uploadBlock.addEventListener('click', () => {
    fileInput.click();
});

// Массив выбранных пользователем файлов перед отправкой на сервер.
let selectedFiles = [];

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
            message: "Можно загрузить максимум 10 файлов."
        });
        fileInput.value = "";
        return;
    }

    selectedFiles = files;
    renderPreview();
});


/**
 * Отрисовывает предпросмотр выбранных файлов в элементе previewList.
 *
 * Для каждого файла‑изображения создаёт блок с:
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

/**
 * Отправляет выбранные файлы на сервер.
 *
 * Поведение:
 * - если файлы не выбраны — показывает сообщение об ошибке и прекращает работу;
 * - формирует FormData, добавляя каждый файл под ключом "files"
 *   (имя ключа должно совпадать с ожидаемым параметром FastAPI);
 * - показывает модальное окно о начале загрузки и обработки;
 * - выполняет POST‑запрос на "api/admin/xray-upload/" с JWT‑токеном в заголовке;
 * - при ответе 401 перенаправляет пользователя на /login;
 * - при неуспешном статусе выбрасывает ошибку;
 * - при успехе:
 *     - читает JSON‑ответ,
 *     - выводит информацию о сохранённых файлах в консоль,
 *     - показывает сообщение об успешной загрузке,
 *     - очищает состояние (selectedFiles, список превью и значение fileInput);
 * - при любой ошибке логирует её и показывает модальное окно с сообщением об ошибке.
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

    selectedFiles.forEach(file => {
        formData.append("files", file);
    });

    try {

        showStatusModal({
            type: "success",
            message: "Выполняется загрузка и обработка файлов. Это может занять некоторое время...",
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
                message: `Ошибка загрузки: ${getErrorMessage(error)}`
            });
        }

        const data = await response.json();

        console.log("Файлы сохранены:", data.files);

        showStatusModal({
            type: "success",
            message: "Файлы успешно загружены!",
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
