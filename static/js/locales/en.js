export default {
    // Layout
    layout_head_default_title: "Teeth annotation",


    // Login page
    login_header_title: "Teeth annotation",
    login_header_subtitle: "Login to start annotation",
    login_form_phonenumber: "Phone number",
    login_form_phonenumber_placeholder: "+7 (___) ___-__-__",
    login_form_status: "Status",
    login_form_status_default: "Select your status",
    login_form_accesscode: "Access code",
    login_form_accesscode_placeholder: "Enter access code",
    login_form_info: "If you don't have an access code, contact the teacher",
    login_form_submit: "Login",


    // Admin page
    logout_button_text: "Logout",
    admin_header_title: "Admin panel",
    admin_header_subtitle: "Select the command",
    admin_menu_item_progress: "View experts progress",
    admin_menu_item_add_xray: "Add X-ray",
    admin_menu_item_add_user: "Add user",
    admin_menu_item_download: "Download DB",


    // Progress page
    goback_button_text: "Go back",
    progress_header_title: "Admin panel",
    progress_header_subtitle: "Experts progress",
    progress_users_count: "Total users number: {count}",
    progress_desc: "{role} (X-rays range: {start}-{end})",
    progress_percentage: "{percent}% ({current} of {total})",
    progress_no_users: "No results found to display expert progress.",


    // Add-xray page
    add_xray_header_subtitle: "Add X-rays",
    add_xray_info: "Select X-rays to upload",
    add_xray_total: "Total X-rays number: {count}",
    add_xray_button: "Add",
    add_xray_no_more_then_10: "Maximum 10 files allowed.",
    add_xray_no_files: "No files to upload",
    add_xray_process_info: "Uploading and processing files. This may take some time...",
    add_xray_upload_error: "Upload error: {detail}",
    add_xray_upload_success: "Files uploaded successfully!",
    add_xray_upload_error2: "Upload error: {error_detail}",

    // Register page
    register_header_subtitle: "Add user",
    register_tab_form: "Via form",
    register_tab_table: "Via table",
    register_form_fullname: "Full name",
    register_form_fullname_placeholder: "Enter user's full name",
    register_form_phonenumber: "Phone number",
    register_form_phonenumber_placeholder: "+7 (___) ___-__-__",
    register_form_status: "Status",
    register_form_status_default: "Select your status",
    register_form_submit: "Add",
    register_excel_info: "Select an Excel table file (.xlsx)",
    register_excel_submit: "Add",
    register_success: "User registered successfully!",
    register_error: "Registration error: {detail}",
    register_network_error: "Network error. Please check your connection and try again.",
    register_no_file: "No file selected",
    register_no_files: "No files to upload",
    register_process: "Uploading and processing files. This may take some time...",
    register_process_error: "Upload error: {detail}",
    register_excel_success: "Users added successfully!",
    register_excel_server_error: "Error uploading files: {error_detail}", 
    register_only_admin: "Only administrators can upload files",
    register_invalid_file_type: "Invalid file type. Please upload an Excel file (.xlsx).",
    register_invalid_file_size: "File is too large. Maximum size: {max_size} MB",
    register_invalid_table_columns: "Required columns are missing (Full Name, Phone)",
    register_server_error: "Server error occurred while uploading the Excel file",
    register_only_admin2: "Only administrators can create users",
    register_user_already_exist: "A user with this name already exists",
    register_phonenumber_exist: "Phone number is already registered",

    // Annotation page
    annotation_header_title: "Teeth annotation",
    annotation_header_subtitle: "Select the required options",
    annotation_condition_label: "Initial condition",
    annotation_condition_default: "Select initial condition",
    annotation_pathology_label: "Pathology",
    annotation_pathology_default: "Select pathology",
    annotation_recommendation_label: "Recommendation",
    annotation_recommendation_default: "Select recommendation",
    annotation_term_label: "Time to seek care",
    annotation_term_default: "Select time to seek care",
    annotation_submit_button: "Confirm",
    annotation_tooth_desc: "Tooth image #{number} in range [{start}, {end}]",
    annotation_instructions: "Please review the image carefully and choose the most appropriate options from the dropdown lists. Your answers help train and improve diagnostics. Thank you for your participation!",
    annotation_complete_message: "You have successfully completed annotation of all assigned teeth. Thank you for your participation!",
    annotation_no_images_message: "No images are available for annotation. Please contact the teacher.",
    annotation_saved_success: "Annotation saved successfully!",
    annotation_save_error: "Annotation save error",

    // Login page modal messages
    login_success_message: "User successfully authenticated!",
    login_auth_error_message: "Authorization error: {detail}",
    login_network_error_message: "Network error. Please check your connection and try again.",

    // Text from backend
    no_expert_progress: "Отсутствуют результаты для отображения прогресса экспертов.",
    wrong_phone_number: "Invalid phone number",
    wrong_user_status: "Invalid user status",
    wrong_access_code: "Invalid access code"
}