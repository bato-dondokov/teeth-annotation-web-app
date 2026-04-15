import { getCurrentUser, logout, getToken,  } from '/static/js/auth.js';
import { showStatusModal, getErrorMessage } from '/static/js/utils.js';

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
const user = await updateAuth();

function showCompletionAndStop(id) {
    Array.from(document.body.children).forEach((el) => {
        if (el.id !== "statusModal") {
            el.style.display = "none";
        }
    });
    if (id == 0) {
        showStatusModal({
            type: "success",
            message: "Вы успешно завершили разметку всех назначенных зубов. Спасибо за ваше участие!",
            onConfirm: () => {
                window.location.href = "/login";
            }
        });
    } else {
        showStatusModal({
            type: "error",
            message: "Отсутствуют снимки для разметки. Обратитесь к преподавателю.",
            onConfirm: () => {
                window.location.href = '/login';
            }
        });
    }

    throw new Error("Annotation flow stopped: there is no more teeth to annotate");
}

// Проверка наличия JWT‑токена при загрузке страницы.
// При отсутствии токена пользователь перенаправляется на /login.
const token = getToken();
if (!token) {
    window.location.href = '/login';
}

// Элементы интерфейса для отображения изображений и текста разметки.
const thumbnail = document.getElementById('thumbnail');
const thumbnail_cropped = document.getElementById('thumbnail-cropped');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const annotationDesc = document.getElementById('annotation-desc');
const annotationInstructions = document.getElementById('annotation-instructions');
// Описание текущего зуба и инструкции для пользователя.
annotationDesc.textContent = "Снимок зуба №" + user.current_tooth + " из диапазона [" + user.range_start + ", " + user.range_end + "]";
annotationInstructions.textContent = "Пожалуйста, внимательно изучите его и выберите наиболее подходящие варианты из выпадающих списков. Ваши ответы помогут в обучении и улучшении диагностики. Спасибо за ваше участие!";


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
 *   и перенаправляет пользователя на /login по подтверждению.
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

// Лайтбокс для увеличенного просмотра снимка.
// Клик по миниатюре открывает лайтбокс с соответствующим изображением,
// клик по фону лайтбокса закрывает его.
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


// При изменении любого из выпадающих списков перепроверяем,
// можно ли активировать кнопку отправки.
conditionSelect.addEventListener('change', checkForm);
pathologySelect.addEventListener('change', checkForm);
recommendationSelect.addEventListener('change', checkForm);
termSelect.addEventListener('change', checkForm);

// При загрузке страницы кнопка выключена
checkForm();

/**
 * Обработчик отправки формы аннотации зуба.
 *
 * Поведение:
 * - предотвращает стандартную отправку формы (e.preventDefault());
 * - считывает выбранные значения из select’ов и приводит их к числам;
 * - отправляет POST‑запрос на /api/annotation/save с JSON‑телом:
 *   { condition, pathology, recommendation, term };
 * - при успешном ответе:
 *     - показывает модальное окно об успешном сохранении аннотации,
 *     - по подтверждению перенаправляет пользователя на страницу /annotation
 *       для перехода к следующему зубу;
 * - при ошибке ответа сервера:
 *     - показывает модальное окно с сообщением об ошибке,
 *       сформированным функцией getErrorMessage(error);
 * - при исключении (сетевая ошибка и т.п.):
 *     - показывает модальное окно с текстом ошибки.
 */
annotationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(annotationForm);

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
                message: "Аннотация успешно сохранена!",
                onConfirm: () => {
                            window.location.href = "/annotation";
                        }
            });
        } else {
            const error = await response.json();
            showStatusModal({
                type: "error",
                message: `Ошибка сохранения аннотации: ${getErrorMessage(error)}`
            });
        }
    } catch (err) {
        showStatusModal({
            type: "error",
            message: `Ошибка сохранения аннотации: ${err}`
        });
    }
});
