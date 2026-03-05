/**
 * Набор вспомогательных функций фронтенда.
 *
 * Содержит:
 * - утилиту извлечения человеко‑читаемого сообщения об ошибке из ответа API;
 * - функции показа/скрытия модальных окон;
 * - валидацию и форматирование телефонного номера;
 * - универсальную модалку статуса операций (успех / ошибка) с коллбеком.
 */


/**
 * Извлекает текст ошибки из ответа API.
 *
 * Поддерживаемые форматы:
 * - error.detail — строка: возвращается как есть;
 * - error.detail — массив объектов (например, Pydantic‑валидация):
 *     берутся поля msg и склеиваются в одну строку через ". ".
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
 * Проверяет корректность телефонного номера.
 *
 * Логика:
 * - из строки удаляются все нецифровые символы;
 * - номер считается валидным, если:
 *     - длина ровно 11 цифр;
 *     - первая цифра — "7";
 *     - вторая цифра — "9" (формат мобильного номера РФ: 79...).
 */
export function isPhoneValid(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 11 && cleaned[0] === "7" && cleaned[1] === "9";
}


/**
 * Форматирует строку с телефоном в вид: +7 (9XX) XXX-XX-XX.
 *
 * Шаги:
 * - удаляет все нецифровые символы;
 * - нормализует первые цифры:
 *     - при пустой строке устанавливает "79";
 *     - если первая цифра "8", заменяет её на "7";
 *     - если первая цифра не "7", принудительно добавляет "7" в начало;
 *     - если вторая цифра не "9", вставляет "9" как вторую;
 * - собирает форматированную строку с "+7 ", скобками и дефисами
 *   по мере наличия достаточного количества цифр.
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
 *     - закрывает модалку (hideModal("statusModal"));
 *     - при наличии onConfirm вызывает его один раз.
 */
export function showStatusModal({
    type = "success", // success | error
    message = "",
    onConfirm = null
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

    // Обработчик кнопки
    const handleClick = () => {
        hideModal("statusModal");

        if (onConfirm) {
            onConfirm();
        }
    };

    button.addEventListener("click", handleClick, { once: true });
}