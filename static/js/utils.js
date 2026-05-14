/**
 * A set of frontend utility functions.
 *
 * Includes:
 * - a utility for extracting human-readable error messages from API responses;
 * - functions for showing and hiding modal windows;
 * - phone number validation and formatting logic;
 * - a universal operation status modal (success/error) with callback support.
 */

/**
 * Набор вспомогательных функций фронтенда.
 *
 * Содержит:
 * - утилиту извлечения человеко-читаемого сообщения об ошибке из ответа API;
 * - функции показа/скрытия модальных окон;
 * - валидацию и форматирование телефонного номера;
 * - универсальную модалку статуса операций (успех / ошибка) с коллбеком.
 */


/**
 * Extracts the error message from the API response.
 *
 * Supported formats:
 * - error.detail as a string: returned as is;
 * - error.detail as an array of objects (e.g., Pydantic validation):
 * extracts the 'msg' fields and joins them into a single string using ". ".
 * If the format is unknown, a default message is returned.
 */

/**
 * Извлекает текст ошибки из ответа API.
 *
 * Поддерживаемые форматы:
 * - error.detail — строка: возвращается как есть;
 * - error.detail — массив объектов (например, Pydantic-валидация):
 * берутся поля msg и склеиваются в одну строку через ". ".
 * Если формат неизвестен, возвращается дефолтное сообщение.
 */
export function getErrorMessage(error) {
  if (typeof error.detail === "string") {
    return error.detail;
  } else if (Array.isArray(error.detail)) {
    return error.detail.map((err) => err.msg).join(". ");
  }
  return "An error occurred. Please try again.";
}


/**
 * Displays a modal window by its ID.
 *
 * Adds the "active" class to the modal and disables body scrolling.
 * If the element with the specified ID is not found, it does nothing and returns null.
 */

/**
 * Показывает модальное окно по его ID.
 *
 * Добавляет модалке класс "active" и запрещает прокрутку body.
 * Если элемент с таким ID не найден, ничего не делает и возвращает null.
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  return modal;
}


/**
 * Hides a modal window by its ID.
 *
 * Removes the "active" class from the modal and restores body scrolling.
 * If the element with the specified ID is not found, the function does nothing.
 */

/**
 * Скрывает модальное окно по его ID.
 *
 * Убирает класс "active" у модалки и восстанавливает прокрутку body.
 * Если элемент с таким ID не найден, ничего не делает.
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}


/**
 * Validates the phone number format.
 *
 * Logic:
 * - removes all non-digit characters from the input string;
 * - considers the number valid only if:
 * - it consists of exactly 11 digits;
 * - the first digit is "7";
 * - the second digit is "9" (standard format for Russian mobile numbers: 79...).
 */

/**
 * Проверяет корректность телефонного номера.
 *
 * Логика:
 * - из строки удаляются все нецифровые символы;
 * - номер считается валидным, если:
 * - длина ровно 11 цифр;
 * - первая цифра — "7";
 * - вторая цифра — "9" (формат мобильного номера РФ: 79...).
 */
export function isPhoneValid(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 11 && cleaned[0] === "7" && cleaned[1] === "9";
}


/**
 * Formats a phone string into the template: +7 (9XX) XXX-XX-XX.
 *
 * Steps:
 * - removes all non-digit characters;
 * - normalizes the leading digits:
 * - if the string is empty, defaults to "79";
 * - if the first digit is "8", replaces it with "7";
 * - if the first digit is not "7", prepends "7" to the start;
 * - if the second digit is not "9", inserts "9" as the second digit;
 * - constructs the formatted string with "+7 ", parentheses, and hyphens
 * as more digits become available.
 */

/**
 * Форматирует строку с телефоном в вид: +7 (9XX) XXX-XX-XX.
 *
 * Шаги:
 * - удаляет все нецифровые символы;
 * - нормализует первые цифры:
 * - при пустой строке устанавливает "79";
 * - если первая цифра "8", заменяет её на "7";
 * - если первая цифра не "7", принудительно добавляет "7" в начало;
 * - если вторая цифра не "9", вставляет "9" как вторую;
 * - собирает форматированную строку с "+7 ", скобками и дефисами
 * по мере наличия достаточного количества цифр.
 */
export function formatPhone(value) {
  let digits = value.replace(/\D/g, "");

  // исправляем первые две цифры: +7 9
  if (digits.length === 0) digits = "79";
  if (digits[0] === "8") digits = "7" + digits.slice(1);
  if (digits[0] !== "7") digits = "7" + digits;
  if (digits[1] !== "9") digits = digits[0] + "9" + digits.slice(1);

  // форматируем
  let formatted = "+7 ";
  if (digits.length > 1) formatted += "(" + digits.slice(1, 4);
  if (digits.length >= 5) formatted += ") " + digits.slice(4, 7);
  if (digits.length >= 8) formatted += "-" + digits.slice(7, 9);
  if (digits.length >= 10) formatted += "-" + digits.slice(9, 11);

  return formatted;
}


/**
 * Displays an operation status modal window.
 *
 * Utilizes the "statusModal" ID and the following sub-elements:
 * - #statusModalContent: container receiving the "success" or "error" class;
 * - #statusModalIcon: status icon (✓ or ✕);
 * - #statusModalMessage: the message text;
 * - #statusModalBtn: the confirmation/close button.
 *
 * Behavior:
 * - opens the modal via showModal("statusModal");
 * - clears previous styling classes (e.g., "success", "error");
 * - applies a new class based on the 'type' parameter;
 * - sets the icon to ✓ for success and ✕ for error;
 * - populates the message text;
 * - attaches a click listener to the button that:
 * - closes the modal (hideModal("statusModal"));
 * - executes the 'onConfirm' callback once, if provided.
 */

/**
 * Показывает модальное окно статуса операции.
 *
 * Использует модалку с ID "statusModal" и элементы:
 * - #statusModalContent — контейнер, которому добавляется класс "success" или "error";
 * - #statusModalIcon — иконка статуса (✓ или ✕);
 * - #statusModalMessage — текст сообщения;
 * - #statusModalBtn — кнопка подтверждения/закрытия.
 *
 * Поведение:
 * - открывает модалку через showModal("statusModal");
 * - сбрасывает старые классы типа ("success", "error");
 * - устанавливает класс в зависимости от type;
 * - ставит иконку ✓ для success и ✕ для error;
 * - записывает переданное сообщение;
 * - вешает обработчик на кнопку, который:
 * - закрывает модалку (hideModal("statusModal"));
 * - при наличии onConfirm вызывает его один раз.
 */
export function showStatusModal({
    type = "success", // success | error
    message = "",
    onConfirm = null,
    showButton = true
}) {
    const modal = showModal("statusModal");

    const content = document.getElementById("statusModalContent");
    const icon = document.getElementById("statusModalIcon");
    const text = document.getElementById("statusModalMessage");
    const button = document.getElementById("statusModalBtn");

    // Очищаем старые классы
    content.classList.remove("success", "error");

    // Устанавливаем тип
    content.classList.add(type);

    // Устанавливаем иконку
    icon.textContent = type === "success" ? "✓" : "✕";

    // Устанавливаем текст
    text.textContent = message;

    if (!showButton) {
      button.style.display = "none";
      return modal;
    }

    button.style.display = "";

    // Обработчик кнопки
    const handleClick = () => {
        hideModal("statusModal");

        if (onConfirm) {
            onConfirm();
        }
    };

    button.addEventListener("click", handleClick, { once: true });

    return modal;
}