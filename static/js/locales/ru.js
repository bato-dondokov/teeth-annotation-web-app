export default {
    // Layout
    layout_head_default_title: "Разметка зубов",


    // Login page
    login_header_title: "Разметка зубов",
    login_header_subtitle: "Войдите, чтобы начать разметку",
    login_form_phonenumber: "Номер телефона",
    login_form_phonenumber_placeholder: "+7 (___) ___-__-__",
    login_form_status: "Статус",
    login_form_status_default: "Выберите свой статус",
    login_form_accesscode: "Код доступа",
    login_form_accesscode_placeholder: "Введите код доступа",
    login_form_info: "Если у вас нет кода доступа, обратитесь к преподавателю",
    login_form_submit: "Войти",


    // Admin page
    logout_button_text: "Выйти",
    admin_header_title: "Панель администратора",
    admin_header_subtitle: "Выберите нужную команду",
    admin_menu_item_progress: "Посмотреть прогресс экспертов",
    admin_menu_item_add_xray: "Добавить снимок",
    admin_menu_item_add_user: "Добавить номер для доступа",
    admin_menu_item_download: "Выгрузить БД",


    // Progress page
    goback_button_text: "Вернуться назад",
    progress_header_title: "Панель администратора",
    progress_header_subtitle: "Прогресс экспертов",
    progress_users_count: "Всего пользователей: {count}",
    progress_desc: "{role} (диапазон снимков: {start}-{end})",
    progress_percentage: "{percent}% ({current} из {total})",
    progress_no_users: "Отсутствуют результаты для отображения прогресса экспертов.",
    


    // Add-xray page
    add_xray_header_subtitle: "Добавление снимков",
    add_xray_info: "Выберите снимки для загрузки",
    add_xray_total: "Всего снимков: {count}",
    add_xray_button: "Добавить",
    add_xray_no_more_then_10: "Можно загрузить максимум 10 файлов.",
    add_xray_no_files: "Нет файлов для загрузки",
    add_xray_process_info: "Выполняется загрузка и обработка файлов. Это может занять некоторое время...",
    add_xray_upload_error: "Ошибка загрузки: {detail}",
    add_xray_upload_success: "Файлы успешно загружены!",
    add_xray_upload_error2: "Ошибка загрузки: {error_detail}",
    add_xray_only_admin: "Только администраторы могут загружать снимки",
    add_xray_files_not_uploaded: "Файлы не загружены",
    add_xray_file_exist: "Файл с таким именем уже существует",
    add_xray_process_error: "Ошибка при загрузке снимков на сервере",


    // Register page
    register_header_subtitle: "Добавление пользователя",
    register_tab_form: "Через форму",
    register_tab_table: "Через таблицу",
    register_form_fullname: "ФИО",
    register_form_fullname_placeholder: "Введите ФИО пользователя",
    register_form_phonenumber: "Номер телефона",
    register_form_phonenumber_placeholder: "+7 (___) ___-__-__",
    register_form_status: "Статус",
    register_form_status_default: "Выберите свой статус",
    register_form_submit: "Добавить",
    register_excel_info: "Выберите табличный файл в Excel формате (.xlsx)",
    register_excel_submit: "Добавить",
    register_success: "Пользователь успешно зарегистрирован!",
    register_error: "Ошибка регистрации: {detail}",
    register_network_error: "Network error. Please check your connection and try again.",
    register_no_file: "Файл не выбран",
    register_no_files: "Нет файлов для загрузки",
    register_process: "Выполняется загрузка и обработка файлов. Это может занять некоторое время...",
    register_process_error: "Ошибка загрузки: {detail}",
    register_excel_success: "Пользователи успешно добавлены!",
    register_excel_server_error: "Ошибка при загрузке файлов: {error_detail}",
    register_only_admin: "Только администраторы могут загружать файлы",
    register_invalid_file_type: "Неверный тип файла. Пожалуйста, загрузите файл Excel (.xlsx).",
    register_invalid_file_size: "Файл слишком большой. Максимальный размер: {max_size} MB",
    register_invalid_table_columns: "Необходимые столбцы отсутствуют (ФИО, Телефон)",
    register_server_error: "Ошибка при загрузке Excel-файла на сервере",
    register_only_admin2: "Только администраторы могут создавать пользователей",
    register_user_already_exist: "Пользователь с таким именем уже существует",
    register_phonenumber_exist: "Номер телефона уже зарегистрирован",


    // Annotation page
    annotation_header_title: "Разметка зубов",
    annotation_header_subtitle: "Выберите нужные варианты",
    annotation_condition_label: "Исходное состояние",
    annotation_condition_default: "Выберите исходное состояние",
    annotation_pathology_label: "Патология",
    annotation_pathology_default: "Выберите патологию",
    annotation_recommendation_label: "Рекомендация",
    annotation_recommendation_default: "Выберите рекомендацию",
    annotation_term_label: "Сроки обращения",
    annotation_term_default: "Выберите сроки обращения",
    annotation_submit_button: "Подтвердить",
    annotation_tooth_desc: "Снимок зуба №{number} из диапазона [{start}, {end}]",
    annotation_instructions: "Пожалуйста, внимательно изучите его и выберите наиболее подходящие варианты из выпадающих списков. Ваши ответы помогут в обучении и улучшении диагностики. Спасибо за ваше участие!",
    annotation_complete_message: "Вы успешно завершили разметку всех назначенных зубов. Спасибо за ваше участие!",
    annotation_no_images_message: "Отсутствуют снимки для разметки. Обратитесь к преподавателю.",
    annotation_saved_success: "Аннотация успешно сохранена!",
    annotation_save_error: "Ошибка сохранения аннотации",

    // Login page modal messages
    login_success_message: "Пользователь успешно авторизован!",
    login_auth_error_message: "Ошибка авторизации: {detail}",
    login_network_error_message: "Ошибка сети. Пожалуйста, проверьте подключение и повторите попытку.",


    // Text from backend
    no_expert_progress: "Отсутствуют результаты для отображения прогресса экспертов.",
    wrong_phone_number: "Неверный номер телефона",
    wrong_user_status: "Неверный статус пользователя",
    wrong_access_code: "Неверный код доступа"
}