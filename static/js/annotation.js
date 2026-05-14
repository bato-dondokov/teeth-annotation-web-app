import { getCurrentUser, logout, getToken,  } from '/static/js/auth.js';
import { showStatusModal, getErrorMessage } from '/static/js/utils.js';
import { initLang, t } from './i18n.js';
initLang();

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

// Administrator logout button and its click handler.
// Кнопка выхода из аккаунта администратора и обработчик клика.
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}
const user = await updateAuth();


/**
 * Stops the annotation flow and displays a completion or error message.
 *
 * Behavior:
 * - hides all top-level elements of the page except for the status modal;
 * - if id is 0, displays a success modal indicating that the annotation is finished;
 * - if id is non-zero, displays an error modal indicating no images were found;
 * - redirects the user to /login upon clicking the confirmation button in the modal;
 * - throws an Error to halt further execution of the script.
 */

/**
 * Останавливает процесс аннотации и выводит сообщение о завершении или ошибке.
 *
 * Поведение:
 * - скрывает все прямые дочерние элементы body, кроме модального окна статуса;
 * - если id равен 0 — показывает модальное окно об успешном завершении разметки;
 * - если id не равен 0 — показывает модальное окно с ошибкой (отсутствие снимков);
 * - при подтверждении в модальном окне перенаправляет пользователя на /login;
 * - выбрасывает исключение Error для принудительной остановки выполнения скрипта.
 */
function showCompletionAndStop(id) {
    Array.from(document.body.children).forEach((el) => {
        if (el.id !== "statusModal") {
            el.style.display = "none";
        }
    });
    if (id == 0) {
        showStatusModal({
            type: "success",
            message: t("annotation_complete_message"),
            onConfirm: () => {
                window.location.href = "/login";
            }
        });
    } else {
        showStatusModal({
            type: "error",
            message: t("annotation_no_images_message"),
            onConfirm: () => {
                window.location.href = '/login';
            }
        });
    }

    throw new Error("Annotation flow stopped: there is no more teeth to annotate");
}

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

// UI elements for displaying images and markup text.
// Элементы интерфейса для отображения изображений и текста разметки.
const thumbnail = document.getElementById('thumbnail');
const thumbnail_cropped = document.getElementById('thumbnail-cropped');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const annotationDesc = document.getElementById('annotation-desc');
const annotationInstructions = document.getElementById('annotation-instructions');
// Описание текущего зуба и инструкции для пользователя.
annotationDesc.textContent = t("annotation_tooth_desc", {
    number: user.current_tooth,
    start: user.range_start,
    end: user.range_end
});
annotationInstructions.textContent = t("annotation_instructions");


/**
 * Loads images for a specific tooth by its ID.
 *
 * Performs two requests:
 * 1) GET /api/annotation/tooth/{id} — retrieves the original tooth image;
 * 2) POST /api/annotation/tooth_cropped/{id} — retrieves the cropped fragment.
 *
 * On success:
 * - converts the Blob into a temporary URL and sets it as the src for the corresponding img elements.
 *
 * On server error response:
 * - displays a modal window with the error message received from the backend.
 *
 * On network error or missing images:
 * - displays a modal window stating that the annotation is complete
 * and redirects the user to /login upon confirmation.
 */

/**
 * Загружает изображения для указанного зуба по его идентификатору.
 *
 * Делает два запроса:
 * 1) GET /api/annotation/tooth/{id} — получает исходное изображение зуба;
 * 2) POST /api/annotation/tooth_cropped/{id} — получает обрезанный фрагмент.
 *
 * При успешном ответе:
 * - преобразует Blob в временный URL и устанавливает его в src соответствующих img;
 *
 * При ошибке ответа сервера:
 * - показывает модальное окно с сообщением об ошибке, полученной от бэкенда;
 *
 * При сетевой ошибке или отсутствии снимков:
 * - показывает модальное окно с сообщением о завершении разметки
 * и перенаправляет пользователя на /login по подтверждению.
 */
async function loadImageById(id) {
    if (id == 0) {
        showCompletionAndStop(id);
        return;
    }
    try {
        const response = await fetch(`/api/annotation/tooth/${id}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok){
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            thumbnail.src = blobUrl;
        } else {
            const error = await response.json();
            showCompletionAndStop(id, error);
        }
    } catch (err) {
        showCompletionAndStop(id, err);
    }
    try {
        const response2 = await fetch(`/api/annotation/tooth_cropped/${id}`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (response2.ok){
            const blob2 = await response2.blob();
            const blobUrl2 = URL.createObjectURL(blob2);
            thumbnail_cropped.src = blobUrl2;
        } else {
            const error2 = await response2.json();
            showCompletionAndStop(id, error2);
        }
    } catch (err) {
        showCompletionAndStop(id, err);
    }
}

/**
 * Lightbox for enlarged image viewing.
 * * Clicking on a thumbnail opens the lightbox with the corresponding image;
 * clicking on the lightbox background closes it.
 */

/**
 * Лайтбокс для увеличенного просмотра снимка.
 * * Клик по миниатюре открывает лайтбокс с соответствующим изображением,
 * клик по фону лайтбокса закрывает его.
 */
loadImageById(user.current_tooth);
thumbnail.addEventListener('click', () => {
    lightboxImg.src = thumbnail.src;
    lightbox.style.display = 'flex';
});

thumbnail_cropped.addEventListener('click', () => {
    lightboxImg.src = thumbnail_cropped.src;
    lightbox.style.display = 'flex';
});

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.style.display = 'none';
});


const annotationForm = document.getElementById('annotationForm');
const conditionSelect = document.getElementById('condition');
const pathologySelect = document.getElementById('pathology');
const recommendationSelect = document.getElementById('recommendation');
const termSelect = document.getElementById('term');
const submitBtn = annotationForm.querySelector('.submit-button');


/**
 * Checks if all required fields in the annotation form are filled.
 *
 * If a non-empty option is selected in every <select> element, enables the submit button.
 * Otherwise, disables the button to prevent submitting an incomplete annotation.
 */

/**
 * Проверяет, заполнены ли все обязательные поля формы аннотации.
 *
 * Если в каждом select выбран непустой вариант, включает кнопку отправки.
 * В противном случае — отключает кнопку, предотвращая отправку неполной аннотации.
 */
function checkForm() {
    const allSelected =
        conditionSelect.value !== "" &&
        pathologySelect.value !== "" &&
        recommendationSelect.value !== "" &&
        termSelect.value !== "";

    submitBtn.disabled = !allSelected;
}


/**
 * Whenever any dropdown list changes, re-check if the submit 
 * button can be activated.
 */

/**
 * При изменении любого из выпадающих списков перепроверяем,
 * можно ли активировать кнопку отправки.
 */
conditionSelect.addEventListener('change', checkForm);
pathologySelect.addEventListener('change', checkForm);
recommendationSelect.addEventListener('change', checkForm);
termSelect.addEventListener('change', checkForm);

checkForm();

/**
 * Tooth annotation form submission handler.
 *
 * Behavior:
 * - prevents the default form submission (e.preventDefault());
 * - reads selected values from dropdowns and converts them to numbers;
 * - sends a POST request to /api/annotation/save with a JSON body:
 * { condition, pathology, recommendation, term };
 * - on success:
 * - displays a modal window indicating the annotation was saved successfully,
 * - upon confirmation, redirects the user to the /annotation page
 * to proceed to the next tooth;
 * - on server error:
 * - displays a modal window with an error message 
 * generated by the getErrorMessage(error) function;
 * - on exception (network error, etc.):
 * - displays a modal window with the error text.
 */

/**
 * Обработчик отправки формы аннотации зуба.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (e.preventDefault());
 * - считывает выбранные значения из select’ов и приводит их к числам;
 * - отправляет POST-запрос на /api/annotation/save с JSON-телом:
 * { condition, pathology, recommendation, term };
 * - при успешном ответе:
 * - показывает модальное окно об успешном сохранении аннотации,
 * - по подтверждению перенаправляет пользователя на страницу /annotation
 * для перехода к следующему зубу;
 * - при ошибке ответа сервера:
 * - показывает модальное окно с сообщением об ошибке,
 * сформированным функцией getErrorMessage(error);
 * - при исключении (сетевая ошибка и т.п.):
 * - показывает модальное окно с текстом ошибки.
 */
annotationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('/api/annotation/save', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                condition: parseInt(conditionSelect.value),
                pathology: parseInt(pathologySelect.value),
                recommendation: parseInt(recommendationSelect.value),
                term: parseInt(termSelect.value)
            })

        });
        if (response.ok) {
            showStatusModal({
                type: "success",
                message: t("annotation_saved_success"),
                onConfirm: () => {
                            window.location.href = "/annotation";
                        }
            });
        } else {
            const error = await response.json();
            showStatusModal({
                type: "error",
                message: `${t("annotation_save_error")}: ${getErrorMessage(error)}`
            });
        }
    } catch (err) {
        showStatusModal({
            type: "error",
            message: `${t("annotation_save_error")}: ${err}`
        });
    }
});
