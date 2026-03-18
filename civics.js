/* ============================================================
   USCIS Practice Test — JavaScript
   Civics (flash cards, listen, practice, study, history)
   + English (reading, writing, speaking, mock test)
   + Gamification (streaks, achievements, progress)
   ============================================================ */

(function () {
    "use strict";

    // ---- DOM Helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const show = (el) => { if (el) el.style.display = ""; };
    const hide = (el) => { if (el) el.style.display = "none"; };

    // ---- Auth / User Management ----
    function simpleHash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return h.toString(36); }

    function getUsers() { try { return JSON.parse(localStorage.getItem("civics_users") || "{}"); } catch { return {}; } }
    function saveUsers(u) { try { localStorage.setItem("civics_users", JSON.stringify(u)); } catch {} }
    function getCurrentUser() { try { return localStorage.getItem("civics_currentUser") || ""; } catch { return ""; } }
    function setCurrentUser(u) { try { localStorage.setItem("civics_currentUser", u); } catch {} }

    let currentUser = getCurrentUser(); // "" = not logged in, "guest" = guest, else username

    // ---- Storage (profile-scoped) ----
    function lsPrefix() { return "civics_profile_" + (currentUser || "guest") + "_"; }
    const LS = {
        get(k, fallback) { try { const v = localStorage.getItem(lsPrefix() + k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
        set(k, v) { try { localStorage.setItem(lsPrefix() + k, JSON.stringify(v)); autoSaveFlash(); } catch {} },
    };

    // Global LS (not profile-scoped, for settings like language, voice)
    const GLS = {
        get(k, fallback) { try { const v = localStorage.getItem("civics_" + k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
        set(k, v) { try { localStorage.setItem("civics_" + k, JSON.stringify(v)); } catch {} },
    };

    // ---- Save indicator ----
    let saveFlashTimeout = null;
    function autoSaveFlash() {
        const el = $("#saveIndicator");
        if (!el) return;
        el.classList.add("visible");
        clearTimeout(saveFlashTimeout);
        saveFlashTimeout = setTimeout(() => el.classList.remove("visible"), 1500);
    }

    // ============================================================
    //  TRANSLATIONS (i18n)
    // ============================================================
    let currentLang = "en";

    const LANGUAGES = [
        { code: "en", flag: "\uD83C\uDDFA\uD83C\uDDF8", name: "English" },
        { code: "es", flag: "\uD83C\uDDEA\uD83C\uDDF8", name: "Espa\u00f1ol" },
        { code: "zh", flag: "\uD83C\uDDE8\uD83C\uDDF3", name: "\u4E2D\u6587" },
        { code: "vi", flag: "\uD83C\uDDFB\uD83C\uDDF3", name: "Ti\u1EBFng Vi\u1EC7t" },
        { code: "ko", flag: "\uD83C\uDDF0\uD83C\uDDF7", name: "\uD55C\uAD6D\uC5B4" },
        { code: "tl", flag: "\uD83C\uDDF5\uD83C\uDDED", name: "Filipino" },
        { code: "ar", flag: "\uD83C\uDDF8\uD83C\uDDE6", name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { code: "fr", flag: "\uD83C\uDDEB\uD83C\uDDF7", name: "Fran\u00e7ais" },
        { code: "pt", flag: "\uD83C\uDDE7\uD83C\uDDF7", name: "Portugu\u00eas" },
        { code: "ru", flag: "\uD83C\uDDF7\uD83C\uDDFA", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
    ];

    const translations = {
    en: {
        landing_title: "USCIS Citizenship Test Prep",
        landing_subtitle: "Free practice tests for the civics and English portions of the naturalization exam",
        continue_guest: "Continue as Guest",
        get_started: "Get Started",
        sign_in: "Sign In",
        create_account: "Create Account",
        username: "Username",
        password: "Password",
        display_name: "Display Name",
        confirm_password: "Confirm Password",
        hero_title: 'Prepare for Your<br><span class="gradient-text">Citizenship Test</span>',
        civics_test: "Civics Test",
        english_test: "English Test",
        eligibility_check: "Eligibility Check",
        start_studying: "Start Studying",
        start_practicing: "Start Practicing",
        check_now: "Check Now",
        your_progress: "Your Progress",
        day_streak: "Day Streak",
        achievements: "Achievements",
        tests_taken: "Tests Taken",
        avg_score: "Avg Score",
        back: "Back",
        settings: "Settings",
        sign_out: "Sign Out",
        switch_user: "Switch User",
        guest: "Guest",
        flash_cards: "Flash Cards",
        listen: "Listen",
        practice_test: "Practice Test",
        study: "Study",
        history: "History",
        all_categories: "All Categories",
        shuffle: "Shuffle",
        read_aloud: "Read Aloud",
        i_got_it_right: "I Got It Right",
        i_got_it_wrong: "I Got It Wrong",
        begin_test: "Begin Test",
        submit_answer: "Submit Answer",
        next: "Next",
        previous: "Previous",
        passed: "Passed!",
        keep_studying: "Keep Studying",
        reading: "Reading",
        writing_dictation: "Writing (Dictation)",
        speaking: "Speaking",
        full_mock_test: "Full Mock Test",
        listen_first: "Listen First",
        play_sentence: "Play Sentence",
        check: "Check",
        type_what_you_hear: "Type what you hear...",
        eligibility_self_check: "Eligibility Self-Check",
        ready_to_apply: "Ready to Apply!",
        needs_attention: "Needs Attention",
        issues_found: "Issues Found",
        not_legal_advice: "This is not legal advice",
        common_questions: "Common Questions & Concerns",
        find_help: "Find Help Near You",
        non_profit_legal: "Non-Profit Legal Aid",
        immigration_attorneys: "Immigration Attorneys",
        start_over: "Start Over",
        retake: "Retake",
        continue_text: "Continue",
        resume: "Resume",
        save: "Save",
        saved: "Saved",
        continue_where_left_off: "Continue where you left off?",
        yes: "Yes",
        no_start_fresh: "Start Fresh",
        english_done: "English Done",
        wrong_password: "Incorrect password",
        username_taken: "Username already taken",
        passwords_no_match: "Passwords do not match",
        fields_required: "All fields are required",
        not_started: "Not Started",
        in_progress: "In Progress",
        of: "of",
        checked: "checked",
        all_clear: "All Clear!",
        save_continue_later: "Save & Continue Later",
        progress_saved_toast: "Progress saved! You can continue anytime.",
        // FAQ translations
        faq_subtitle: "Answers to the questions applicants ask most often.",
        faq_cat_money: "Money & Costs",
        faq_q_cost: "How much does it cost to apply for citizenship?",
        faq_a_cost: "The N-400 filing fee is $760 (or $710 online). Fee waivers are available for low-income applicants using Form I-912.",
        faq_q_fee_help: "Can I get help paying for it?",
        faq_a_fee_help: "Yes. Many non-profit organizations offer fee assistance. See the resources section below.",
        faq_cat_privacy: "Privacy & Safety",
        faq_q_info_shared: "Will my information be shared?",
        faq_a_info_shared: "USCIS keeps your application confidential. Information is protected under federal privacy laws.",
        faq_q_dv: "Can I apply if I'm in a domestic violence situation?",
        faq_a_dv: "Yes. VAWA (Violence Against Women Act) protections may apply. Contact a legal aid organization for confidential help.",
        faq_cat_criminal: "Criminal Background",
        faq_q_arrested_dropped: "I was arrested but charges were dropped. Do I still have to disclose it?",
        faq_a_arrested_dropped: "Yes. You must disclose ALL arrests, charges, citations, and detentions \u2014 even if dismissed, expunged, or sealed.",
        faq_q_dui: "Will a DUI prevent me from becoming a citizen?",
        faq_a_dui: "A single DUI is typically not a bar, but two or more DUIs may be. Consult an immigration attorney.",
        faq_q_juvenile: "I had a juvenile offense. Does that count?",
        faq_a_juvenile: "Juvenile offenses may still need to be disclosed. Consult an attorney for guidance.",
        faq_cat_taxes: "Taxes",
        faq_q_missed_taxes: "What if I missed filing taxes for one year?",
        faq_a_missed_taxes: "File the missing return(s) before your interview. Bring IRS tax transcripts as proof.",
        faq_q_tax_docs: "Do I need to bring tax documents to my interview?",
        faq_a_tax_docs: "Yes. Bring IRS tax transcripts for the past 3\u20135 years (depending on your track).",
        faq_cat_travel: "Travel",
        faq_q_travel_pending: "Can I travel while my N-400 is pending?",
        faq_a_travel_pending: "Yes, but extended travel during the process could cause issues. Keep trips short.",
        faq_q_long_trip: "I took a long trip. Is my application ruined?",
        faq_a_long_trip: "Not necessarily. Trips under 6 months are usually fine. 6\u201312 months need explanation. Over 1 year may require restarting.",
        faq_cat_green_card: "Green Card Issues",
        faq_q_expired_gc: "My green card expired. Can I still apply?",
        faq_a_expired_gc: "Yes. An expired green card does not affect your immigration status. You can apply with an expired card.",
        faq_q_divorced: "I got my green card through marriage but I'm now divorced. Can I still apply?",
        faq_a_divorced: "If you've been an LPR for 5+ years, yes (using the standard 5-year track, not the 3-year married track).",
        faq_cat_process: "General Process",
        faq_q_how_long: "How long does the process take?",
        faq_a_how_long: "Currently 6\u201312 months from filing to oath ceremony, depending on your location.",
        faq_q_interview: "What happens at the interview?",
        faq_a_interview: "A USCIS officer will review your N-400, test your English, ask civics questions, and ask about your background.",
        faq_q_interpreter: "Can I bring an interpreter?",
        faq_a_interpreter: "Only if you qualify for the English test exemption. Otherwise, the interview is conducted in English.",
        // Resources
        resources_subtitle: "Organizations and attorneys who can help with your citizenship journey.",
        resources_disclaimer: "This is a demo list. Contact information is for illustration purposes.",
        // Eligibility questions
        elig_step_of: "Step {0} of {1}",
        elig_results_title: "Results",
        // Practice config
        practice_need_pass: "Need {0} correct to pass (60%)",
        no_questions_match: "No questions match your filters.",
        no_test_history: "No test history yet. Take a practice test to see your results here.",
        marked_as_known: "{0} marked as known",
        question_n_of: "Question {0} of {1}",
        score_label: "Score: {0}",
        correct_out_of: "{0} correct out of {1} questions",
        // English practice
        no_speech_detected: "No speech detected. Try again.",
        good_response: "Good response! You spoke a complete answer.",
        try_full_sentence: "Try to answer in a full sentence for better practice.",
        try_again_complete: "Try again with a more complete answer.",
        you_said: "You said:",
        // Mock test
        mock_test_title: "Full English Mock Test",
        mock_test_desc: "This simulates the real USCIS English test: 3 Reading sentences + 3 Writing sentences + Speaking section",
        begin_mock_test: "Begin Mock Test",
        reading_section: "Reading Section",
        writing_section: "Writing Section (Dictation)",
        speaking_section: "Speaking Section",
        read_sentence_aloud: "Read the following sentence aloud:",
        listen_then_type: "Listen to the sentence, then type what you heard:",
        answer_question: "Answer the following question:",
        take_another: "Take Another Mock Test",
        // Eligibility self-check detail text
        elig_disclaimer: "This is an informational tool only and is not legal advice. Eligibility for naturalization depends on many factors. Consult an immigration attorney for personalized guidance.",
        share_with_friend: "Share with a Friend",
        share_tab_sms: "Text Message",
        share_tab_email: "Email",
        share_phone_label: "Phone Number",
        share_email_label: "Email Address",
        share_language_label: "Message Language",
        share_send: "Send",
        share_sending: "Sending...",
        share_sent: "Message sent!",
        share_error: "Failed to send. Please try again.",
        share_email_coming_soon: "Email sharing coming soon. Use text message for now.",
        share_email_subject: "Free U.S. Citizenship Test Prep",
    },
    es: {
        landing_title: "Preparaci\u00f3n para el Examen de Ciudadan\u00eda USCIS",
        landing_subtitle: "Pruebas de pr\u00e1ctica gratuitas para las secciones de educaci\u00f3n c\u00edvica e ingl\u00e9s del examen de naturalizaci\u00f3n",
        continue_guest: "Continuar como invitado",
        get_started: "Comenzar",
        sign_in: "Iniciar sesi\u00f3n",
        create_account: "Crear cuenta",
        username: "Nombre de usuario",
        password: "Contrase\u00f1a",
        display_name: "Nombre para mostrar",
        confirm_password: "Confirmar contrase\u00f1a",
        hero_title: 'Prep\u00e1rate para tu<br><span class="gradient-text">Examen de Ciudadan\u00eda</span>',
        civics_test: "Examen C\u00edvico",
        english_test: "Examen de Ingl\u00e9s",
        eligibility_check: "Verificaci\u00f3n de Elegibilidad",
        start_studying: "Comenzar a estudiar",
        start_practicing: "Comenzar a practicar",
        check_now: "Verificar ahora",
        your_progress: "Tu Progreso",
        day_streak: "D\u00edas seguidos",
        achievements: "Logros",
        tests_taken: "Ex\u00e1menes",
        avg_score: "Promedio",
        back: "Atr\u00e1s",
        settings: "Ajustes",
        sign_out: "Cerrar sesi\u00f3n",
        switch_user: "Cambiar usuario",
        guest: "Invitado",
        flash_cards: "Tarjetas",
        listen: "Escuchar",
        practice_test: "Examen de pr\u00e1ctica",
        study: "Estudiar",
        history: "Historial",
        all_categories: "Todas las categor\u00edas",
        shuffle: "Mezclar",
        read_aloud: "Leer en voz alta",
        i_got_it_right: "Acert\u00e9",
        i_got_it_wrong: "Fall\u00e9",
        begin_test: "Iniciar examen",
        submit_answer: "Enviar respuesta",
        next: "Siguiente",
        previous: "Anterior",
        passed: "\u00a1Aprobado!",
        keep_studying: "Sigue estudiando",
        reading: "Lectura",
        writing_dictation: "Escritura (Dictado)",
        speaking: "Expresi\u00f3n oral",
        full_mock_test: "Examen simulado completo",
        listen_first: "Escucha primero",
        play_sentence: "Reproducir oraci\u00f3n",
        check: "Verificar",
        type_what_you_hear: "Escribe lo que escuches...",
        eligibility_self_check: "Autoverificaci\u00f3n de elegibilidad",
        ready_to_apply: "\u00a1Listo para solicitar!",
        needs_attention: "Necesita atenci\u00f3n",
        issues_found: "Problemas encontrados",
        not_legal_advice: "Esto no es asesor\u00eda legal",
        common_questions: "Preguntas frecuentes",
        find_help: "Encuentra ayuda cerca de ti",
        non_profit_legal: "Ayuda legal sin fines de lucro",
        immigration_attorneys: "Abogados de inmigraci\u00f3n",
        start_over: "Empezar de nuevo",
        retake: "Repetir",
        continue_text: "Continuar",
        resume: "Reanudar",
        save: "Guardar",
        saved: "Guardado",
        continue_where_left_off: "\u00bfContinuar donde lo dejaste?",
        yes: "S\u00ed",
        no_start_fresh: "Empezar de nuevo",
        english_done: "Ingl\u00e9s hecho",
        wrong_password: "Contrase\u00f1a incorrecta",
        username_taken: "Nombre de usuario ya existe",
        passwords_no_match: "Las contrase\u00f1as no coinciden",
        fields_required: "Todos los campos son obligatorios",
        not_started: "No iniciado",
        in_progress: "En progreso",
        of: "de",
        checked: "verificados",
        all_clear: "\u00a1Todo bien!",
        save_continue_later: "Guardar y continuar despu\u00e9s",
        progress_saved_toast: "\u00a1Progreso guardado! Puedes continuar en cualquier momento.",
        faq_subtitle: "Respuestas a las preguntas m\u00e1s frecuentes de los solicitantes.",
        faq_cat_money: "Dinero y costos",
        faq_q_cost: "\u00bfCu\u00e1nto cuesta solicitar la ciudadan\u00eda?",
        faq_a_cost: "La tarifa del formulario N-400 es de $760 ($710 en l\u00ednea). Hay exenciones de tarifas disponibles para solicitantes de bajos ingresos usando el Formulario I-912.",
        faq_q_fee_help: "\u00bfPuedo obtener ayuda para pagar?",
        faq_a_fee_help: "S\u00ed. Muchas organizaciones sin fines de lucro ofrecen asistencia con las tarifas. Consulte la secci\u00f3n de recursos a continuaci\u00f3n.",
        faq_cat_privacy: "Privacidad y seguridad",
        faq_q_info_shared: "\u00bfSe compartir\u00e1 mi informaci\u00f3n?",
        faq_a_info_shared: "USCIS mantiene su solicitud confidencial. La informaci\u00f3n est\u00e1 protegida por las leyes federales de privacidad.",
        faq_q_dv: "\u00bfPuedo solicitar si estoy en una situaci\u00f3n de violencia dom\u00e9stica?",
        faq_a_dv: "S\u00ed. Las protecciones de VAWA (Ley de Violencia Contra la Mujer) pueden aplicar. Contacte una organizaci\u00f3n de ayuda legal para asistencia confidencial.",
        faq_cat_criminal: "Antecedentes penales",
        faq_q_arrested_dropped: "Fui arrestado pero los cargos fueron retirados. \u00bfTodav\u00eda tengo que revelarlo?",
        faq_a_arrested_dropped: "S\u00ed. Debe revelar TODOS los arrestos, cargos, citaciones y detenciones, incluso si fueron desestimados, borrados o sellados.",
        faq_q_dui: "\u00bfUn DUI me impedir\u00e1 obtener la ciudadan\u00eda?",
        faq_a_dui: "Un solo DUI generalmente no es un impedimento, pero dos o m\u00e1s podr\u00edan serlo. Consulte a un abogado de inmigraci\u00f3n.",
        faq_q_juvenile: "Tuve una ofensa juvenil. \u00bfCuenta eso?",
        faq_a_juvenile: "Las ofensas juveniles a\u00fan pueden necesitar ser reveladas. Consulte a un abogado para orientaci\u00f3n.",
        faq_cat_taxes: "Impuestos",
        faq_q_missed_taxes: "\u00bfQu\u00e9 pasa si no present\u00e9 impuestos un a\u00f1o?",
        faq_a_missed_taxes: "Presente la(s) declaraci\u00f3n(es) faltante(s) antes de su entrevista. Lleve transcripciones de impuestos del IRS como prueba.",
        faq_q_tax_docs: "\u00bfNecesito llevar documentos de impuestos a mi entrevista?",
        faq_a_tax_docs: "S\u00ed. Lleve transcripciones de impuestos del IRS de los \u00faltimos 3 a 5 a\u00f1os (dependiendo de su v\u00eda).",
        faq_cat_travel: "Viajes",
        faq_q_travel_pending: "\u00bfPuedo viajar mientras mi N-400 est\u00e1 pendiente?",
        faq_a_travel_pending: "S\u00ed, pero los viajes prolongados durante el proceso podr\u00edan causar problemas. Mantenga los viajes cortos.",
        faq_q_long_trip: "Hice un viaje largo. \u00bfSe arruin\u00f3 mi solicitud?",
        faq_a_long_trip: "No necesariamente. Viajes de menos de 6 meses generalmente est\u00e1n bien. De 6 a 12 meses necesitan explicaci\u00f3n. M\u00e1s de 1 a\u00f1o puede requerir reiniciar.",
        faq_cat_green_card: "Problemas con la tarjeta verde",
        faq_q_expired_gc: "Mi tarjeta verde expir\u00f3. \u00bfPuedo solicitar a\u00fan?",
        faq_a_expired_gc: "S\u00ed. Una tarjeta verde expirada no afecta su estatus migratorio. Puede solicitar con una tarjeta expirada.",
        faq_q_divorced: "Obtuve mi tarjeta verde por matrimonio pero ahora estoy divorciado/a. \u00bfPuedo solicitar?",
        faq_a_divorced: "Si ha sido residente permanente por 5+ a\u00f1os, s\u00ed (usando la v\u00eda est\u00e1ndar de 5 a\u00f1os, no la v\u00eda de 3 a\u00f1os por matrimonio).",
        faq_cat_process: "Proceso general",
        faq_q_how_long: "\u00bfCu\u00e1nto tiempo toma el proceso?",
        faq_a_how_long: "Actualmente de 6 a 12 meses desde la presentaci\u00f3n hasta la ceremonia de juramento, dependiendo de su ubicaci\u00f3n.",
        faq_q_interview: "\u00bfQu\u00e9 pasa en la entrevista?",
        faq_a_interview: "Un oficial de USCIS revisar\u00e1 su N-400, evaluar\u00e1 su ingl\u00e9s, har\u00e1 preguntas c\u00edvicas y preguntar\u00e1 sobre sus antecedentes.",
        faq_q_interpreter: "\u00bfPuedo llevar un int\u00e9rprete?",
        faq_a_interpreter: "Solo si califica para la exenci\u00f3n del examen de ingl\u00e9s. De lo contrario, la entrevista se realiza en ingl\u00e9s.",
        resources_subtitle: "Organizaciones y abogados que pueden ayudarle en su camino hacia la ciudadan\u00eda.",
        resources_disclaimer: "Esta es una lista de demostraci\u00f3n. La informaci\u00f3n de contacto es solo para fines ilustrativos.",
        elig_disclaimer: "Esta es solo una herramienta informativa y no constituye asesor\u00eda legal. La elegibilidad para la naturalizaci\u00f3n depende de muchos factores. Consulte a un abogado de inmigraci\u00f3n para orientaci\u00f3n personalizada.",
    },
    zh: {
        landing_title: "USCIS \u516C\u6C11\u8003\u8BD5\u51C6\u5907",
        landing_subtitle: "\u5F52\u5316\u8003\u8BD5\u7684\u516C\u6C11\u77E5\u8BC6\u548C\u82F1\u8BED\u90E8\u5206\u514D\u8D39\u7EC3\u4E60\u8BD5\u9898",
        continue_guest: "\u4EE5\u8BBF\u5BA2\u8EAB\u4EFD\u7EE7\u7EED",
        get_started: "\u5F00\u59CB",
        sign_in: "\u767B\u5F55",
        create_account: "\u521B\u5EFA\u8D26\u6237",
        username: "\u7528\u6237\u540D",
        password: "\u5BC6\u7801",
        display_name: "\u663E\u793A\u540D\u79F0",
        confirm_password: "\u786E\u8BA4\u5BC6\u7801",
        hero_title: '\u51C6\u5907\u4F60\u7684<br><span class="gradient-text">\u516C\u6C11\u8003\u8BD5</span>',
        civics_test: "\u516C\u6C11\u77E5\u8BC6\u8003\u8BD5",
        english_test: "\u82F1\u8BED\u8003\u8BD5",
        eligibility_check: "\u8D44\u683C\u68C0\u67E5",
        start_studying: "\u5F00\u59CB\u5B66\u4E60",
        start_practicing: "\u5F00\u59CB\u7EC3\u4E60",
        check_now: "\u7ACB\u5373\u68C0\u67E5",
        your_progress: "\u4F60\u7684\u8FDB\u5EA6",
        day_streak: "\u8FDE\u7EED\u5929\u6570",
        achievements: "\u6210\u5C31",
        tests_taken: "\u8003\u8BD5\u6B21\u6570",
        avg_score: "\u5E73\u5747\u5206",
        back: "\u8FD4\u56DE",
        settings: "\u8BBE\u7F6E",
        sign_out: "\u9000\u51FA",
        switch_user: "\u5207\u6362\u7528\u6237",
        guest: "\u8BBF\u5BA2",
        flash_cards: "\u95EA\u5361",
        listen: "\u542C\u529B",
        practice_test: "\u6A21\u62DF\u8003\u8BD5",
        study: "\u5B66\u4E60",
        history: "\u5386\u53F2",
        all_categories: "\u6240\u6709\u7C7B\u522B",
        shuffle: "\u968F\u673A",
        read_aloud: "\u6717\u8BFB",
        i_got_it_right: "\u6211\u7B54\u5BF9\u4E86",
        i_got_it_wrong: "\u6211\u7B54\u9519\u4E86",
        begin_test: "\u5F00\u59CB\u8003\u8BD5",
        submit_answer: "\u63D0\u4EA4\u7B54\u6848",
        next: "\u4E0B\u4E00\u9898",
        previous: "\u4E0A\u4E00\u9898",
        passed: "\u901A\u8FC7\uFF01",
        keep_studying: "\u7EE7\u7EED\u5B66\u4E60",
        reading: "\u9605\u8BFB",
        writing_dictation: "\u5199\u4F5C\uFF08\u542C\u5199\uFF09",
        speaking: "\u53E3\u8BED",
        full_mock_test: "\u5168\u771F\u6A21\u62DF\u8003\u8BD5",
        listen_first: "\u5148\u542C",
        play_sentence: "\u64AD\u653E\u53E5\u5B50",
        check: "\u68C0\u67E5",
        type_what_you_hear: "\u8F93\u5165\u4F60\u542C\u5230\u7684...",
        eligibility_self_check: "\u8D44\u683C\u81EA\u67E5",
        ready_to_apply: "\u51C6\u5907\u7533\u8BF7\uFF01",
        needs_attention: "\u9700\u8981\u6CE8\u610F",
        issues_found: "\u53D1\u73B0\u95EE\u9898",
        not_legal_advice: "\u8FD9\u4E0D\u662F\u6CD5\u5F8B\u5EFA\u8BAE",
        common_questions: "\u5E38\u89C1\u95EE\u9898\u4E0E\u5173\u6CE8",
        find_help: "\u5728\u4F60\u9644\u8FD1\u627E\u5230\u5E2E\u52A9",
        non_profit_legal: "\u975E\u8425\u5229\u6CD5\u5F8B\u63F4\u52A9",
        immigration_attorneys: "\u79FB\u6C11\u5F8B\u5E08",
        start_over: "\u91CD\u65B0\u5F00\u59CB",
        retake: "\u91CD\u8003",
        continue_text: "\u7EE7\u7EED",
        resume: "\u6062\u590D",
        save: "\u4FDD\u5B58",
        saved: "\u5DF2\u4FDD\u5B58",
        continue_where_left_off: "\u7EE7\u7EED\u4E0A\u6B21\u7684\u8FDB\u5EA6\uFF1F",
        yes: "\u662F",
        no_start_fresh: "\u91CD\u65B0\u5F00\u59CB",
        english_done: "\u82F1\u8BED\u5B8C\u6210",
        wrong_password: "\u5BC6\u7801\u9519\u8BEF",
        username_taken: "\u7528\u6237\u540D\u5DF2\u88AB\u4F7F\u7528",
        passwords_no_match: "\u5BC6\u7801\u4E0D\u4E00\u81F4",
        fields_required: "\u6240\u6709\u5B57\u6BB5\u90FD\u662F\u5FC5\u586B\u7684",
        not_started: "\u672A\u5F00\u59CB",
        in_progress: "\u8FDB\u884C\u4E2D",
        of: "/",
        checked: "\u5DF2\u68C0\u67E5",
        all_clear: "\u5168\u90E8\u901A\u8FC7\uFF01",
        save_continue_later: "\u4FDD\u5B58\u5E76\u7A0D\u540E\u7EE7\u7EED",
        progress_saved_toast: "\u8FDB\u5EA6\u5DF2\u4FDD\u5B58\uFF01\u60A8\u53EF\u4EE5\u968F\u65F6\u7EE7\u7EED\u3002",
        faq_subtitle: "\u7533\u8BF7\u4EBA\u6700\u5E38\u95EE\u7684\u95EE\u9898\u89E3\u7B54\u3002",
        faq_cat_money: "\u8D39\u7528",
        faq_q_cost: "\u7533\u8BF7\u516C\u6C11\u8EAB\u4EFD\u9700\u8981\u591A\u5C11\u94B1\uFF1F",
        faq_a_cost: "N-400\u7533\u8BF7\u8D39\u4E3A760\u7F8E\u5143\uFF08\u7F51\u4E0A\u7533\u8BF7710\u7F8E\u5143\uFF09\u3002\u4F4E\u6536\u5165\u7533\u8BF7\u4EBA\u53EF\u4F7F\u7528I-912\u8868\u683C\u7533\u8BF7\u8D39\u7528\u8C41\u514D\u3002",
        faq_q_fee_help: "\u6211\u80FD\u83B7\u5F97\u4ED8\u6B3E\u5E2E\u52A9\u5417\uFF1F",
        faq_a_fee_help: "\u53EF\u4EE5\u3002\u8BB8\u591A\u975E\u8425\u5229\u7EC4\u7EC7\u63D0\u4F9B\u8D39\u7528\u63F4\u52A9\u3002\u8BF7\u53C2\u89C1\u4E0B\u65B9\u8D44\u6E90\u90E8\u5206\u3002",
        faq_cat_privacy: "\u9690\u79C1\u4E0E\u5B89\u5168",
        faq_q_info_shared: "\u6211\u7684\u4FE1\u606F\u4F1A\u88AB\u5206\u4EAB\u5417\uFF1F",
        faq_a_info_shared: "USCIS\u4F1A\u5BF9\u60A8\u7684\u7533\u8BF7\u4FDD\u5BC6\u3002\u4FE1\u606F\u53D7\u8054\u90A6\u9690\u79C1\u6CD5\u4FDD\u62A4\u3002",
        faq_q_dv: "\u5982\u679C\u6211\u5904\u4E8E\u5BB6\u5EAD\u66B4\u529B\u60C5\u51B5\uFF0C\u6211\u53EF\u4EE5\u7533\u8BF7\u5417\uFF1F",
        faq_a_dv: "\u53EF\u4EE5\u3002VAWA\uFF08\u300A\u5BF9\u5987\u5973\u66B4\u529B\u6CD5\u6848\u300B\uFF09\u4FDD\u62A4\u53EF\u80FD\u9002\u7528\u3002\u8BF7\u8054\u7CFB\u6CD5\u5F8B\u63F4\u52A9\u7EC4\u7EC7\u83B7\u53D6\u4FDD\u5BC6\u5E2E\u52A9\u3002",
        faq_cat_criminal: "\u72AF\u7F6A\u80CC\u666F",
        faq_q_arrested_dropped: "\u6211\u88AB\u9010\u6355\u4F46\u6307\u63A7\u88AB\u64A4\u9500\u4E86\u3002\u6211\u8FD8\u9700\u8981\u62AB\u9732\u5417\uFF1F",
        faq_a_arrested_dropped: "\u662F\u7684\u3002\u60A8\u5FC5\u987B\u62AB\u9732\u6240\u6709\u9010\u6355\u3001\u6307\u63A7\u3001\u4F20\u7968\u548C\u62D8\u7559\u2014\u2014\u5373\u4F7F\u5DF2\u88AB\u64A4\u9500\u3001\u6D88\u9664\u6216\u5C01\u5B58\u3002",
        faq_q_dui: "\u9189\u9A7E\uFF08DUI\uFF09\u4F1A\u963B\u6B62\u6211\u6210\u4E3A\u516C\u6C11\u5417\uFF1F",
        faq_a_dui: "\u5355\u6B21DUI\u901A\u5E38\u4E0D\u4F1A\u6784\u6210\u969C\u788D\uFF0C\u4F46\u4E24\u6B21\u6216\u66F4\u591A\u6B21\u53EF\u80FD\u4F1A\u3002\u8BF7\u54A8\u8BE2\u79FB\u6C11\u5F8B\u5E08\u3002",
        faq_q_juvenile: "\u6211\u6709\u672A\u6210\u5E74\u4EBA\u8FDD\u6CD5\u8BB0\u5F55\u3002\u8FD9\u7B97\u5417\uFF1F",
        faq_a_juvenile: "\u672A\u6210\u5E74\u4EBA\u8FDD\u6CD5\u8BB0\u5F55\u53EF\u80FD\u4ECD\u9700\u8981\u62AB\u9732\u3002\u8BF7\u54A8\u8BE2\u5F8B\u5E08\u83B7\u53D6\u6307\u5BFC\u3002",
        faq_cat_taxes: "\u7A0E\u52A1",
        faq_q_missed_taxes: "\u5982\u679C\u6211\u67D0\u4E00\u5E74\u6CA1\u6709\u62A5\u7A0E\u600E\u4E48\u529E\uFF1F",
        faq_a_missed_taxes: "\u5728\u9762\u8BD5\u524D\u63D0\u4EA4\u7F3A\u5931\u7684\u62A5\u7A0E\u8868\u3002\u5E26\u4E0AIRS\u7A0E\u52A1\u8BB0\u5F55\u4F5C\u4E3A\u8BC1\u660E\u3002",
        faq_q_tax_docs: "\u6211\u9700\u8981\u5E26\u7A0E\u52A1\u6587\u4EF6\u53BB\u9762\u8BD5\u5417\uFF1F",
        faq_a_tax_docs: "\u9700\u8981\u3002\u5E26\u4E0A\u8FC7\u53BB3\u52305\u5E74\u7684IRS\u7A0E\u52A1\u8BB0\u5F55\uFF08\u53D6\u51B3\u4E8E\u60A8\u7684\u7533\u8BF7\u8DEF\u5F84\uFF09\u3002",
        faq_cat_travel: "\u65C5\u884C",
        faq_q_travel_pending: "\u6211\u7684N-400\u6B63\u5728\u5BA1\u7406\u4E2D\uFF0C\u6211\u53EF\u4EE5\u65C5\u884C\u5417\uFF1F",
        faq_a_travel_pending: "\u53EF\u4EE5\uFF0C\u4F46\u5BA1\u7406\u671F\u95F4\u7684\u957F\u65F6\u95F4\u65C5\u884C\u53EF\u80FD\u4F1A\u5BFC\u81F4\u95EE\u9898\u3002\u4FDD\u6301\u77ED\u9014\u65C5\u884C\u3002",
        faq_q_long_trip: "\u6211\u8FDB\u884C\u4E86\u4E00\u6B21\u957F\u9014\u65C5\u884C\u3002\u6211\u7684\u7533\u8BF7\u4F1A\u88AB\u6BC1\u5417\uFF1F",
        faq_a_long_trip: "\u4E0D\u4E00\u5B9A\u30026\u4E2A\u6708\u4EE5\u5185\u7684\u65C5\u884C\u901A\u5E38\u6CA1\u95EE\u9898\u30026\u523012\u4E2A\u6708\u9700\u8981\u89E3\u91CA\u3002\u8D85\u8FC71\u5E74\u53EF\u80FD\u9700\u8981\u91CD\u65B0\u5F00\u59CB\u3002",
        faq_cat_green_card: "\u7EFF\u5361\u95EE\u9898",
        faq_q_expired_gc: "\u6211\u7684\u7EFF\u5361\u8FC7\u671F\u4E86\u3002\u6211\u8FD8\u80FD\u7533\u8BF7\u5417\uFF1F",
        faq_a_expired_gc: "\u53EF\u4EE5\u3002\u8FC7\u671F\u7684\u7EFF\u5361\u4E0D\u5F71\u54CD\u60A8\u7684\u79FB\u6C11\u8EAB\u4EFD\u3002\u60A8\u53EF\u4EE5\u7528\u8FC7\u671F\u7EFF\u5361\u7533\u8BF7\u3002",
        faq_q_divorced: "\u6211\u901A\u8FC7\u5A5A\u59FB\u83B7\u5F97\u7EFF\u5361\uFF0C\u4F46\u73B0\u5728\u5DF2\u79BB\u5A5A\u3002\u6211\u8FD8\u80FD\u7533\u8BF7\u5417\uFF1F",
        faq_a_divorced: "\u5982\u679C\u60A8\u5DF2\u662F\u6C38\u4E45\u5C45\u6C11\u8D855\u5E74\u4EE5\u4E0A\uFF0C\u53EF\u4EE5\uFF08\u4F7F\u7528\u6807\u51C65\u5E74\u8DEF\u5F84\uFF0C\u800C\u975E3\u5E74\u5A5A\u59FB\u8DEF\u5F84\uFF09\u3002",
        faq_cat_process: "\u4E00\u822C\u6D41\u7A0B",
        faq_q_how_long: "\u8FD9\u4E2A\u8FC7\u7A0B\u9700\u8981\u591A\u957F\u65F6\u95F4\uFF1F",
        faq_a_how_long: "\u76EE\u524D\u4ECE\u63D0\u4EA4\u5230\u5BA3\u8A93\u4EEA\u5F0F\u9700\u89816\u523012\u4E2A\u6708\uFF0C\u53D6\u51B3\u4E8E\u60A8\u7684\u4F4D\u7F6E\u3002",
        faq_q_interview: "\u9762\u8BD5\u4E2D\u4F1A\u53D1\u751F\u4EC0\u4E48\uFF1F",
        faq_a_interview: "USCIS\u5B98\u5458\u5C06\u5BA1\u67E5\u60A8\u7684N-400\u3001\u6D4B\u8BD5\u60A8\u7684\u82F1\u8BED\u3001\u63D0\u95EE\u516C\u6C11\u77E5\u8BC6\u95EE\u9898\uFF0C\u5E76\u8BE2\u95EE\u60A8\u7684\u80CC\u666F\u3002",
        faq_q_interpreter: "\u6211\u53EF\u4EE5\u5E26\u53E3\u8BD1\u5458\u5417\uFF1F",
        faq_a_interpreter: "\u53EA\u6709\u5728\u60A8\u7B26\u5408\u82F1\u8BED\u8003\u8BD5\u8C41\u514D\u6761\u4EF6\u65F6\u624D\u53EF\u4EE5\u3002\u5426\u5219\uFF0C\u9762\u8BD5\u4EE5\u82F1\u8BED\u8FDB\u884C\u3002",
        resources_subtitle: "\u53EF\u4EE5\u5728\u60A8\u7684\u516C\u6C11\u8EAB\u4EFD\u4E4B\u65C5\u4E2D\u63D0\u4F9B\u5E2E\u52A9\u7684\u7EC4\u7EC7\u548C\u5F8B\u5E08\u3002",
        resources_disclaimer: "\u8FD9\u662F\u4E00\u4E2A\u6F14\u793A\u5217\u8868\u3002\u8054\u7CFB\u4FE1\u606F\u4EC5\u4F9B\u8BF4\u660E\u4E4B\u7528\u3002",
        elig_disclaimer: "\u8FD9\u53EA\u662F\u4E00\u4E2A\u4FE1\u606F\u5DE5\u5177\uFF0C\u4E0D\u6784\u6210\u6CD5\u5F8B\u5EFA\u8BAE\u3002\u5F52\u5316\u8D44\u683C\u53D6\u51B3\u4E8E\u8BB8\u591A\u56E0\u7D20\u3002\u8BF7\u54A8\u8BE2\u79FB\u6C11\u5F8B\u5E08\u83B7\u53D6\u4E2A\u6027\u5316\u6307\u5BFC\u3002",
    },
    vi: {
        landing_title: "Luy\u1EC7n thi Qu\u1ED1c t\u1ECBch USCIS",
        landing_subtitle: "B\u00E0i thi th\u1EED mi\u1EC5n ph\u00ED cho ph\u1EA7n ki\u1EBFn th\u1EE9c c\u00F4ng d\u00E2n v\u00E0 ti\u1EBFng Anh c\u1EE7a k\u1EF3 thi nh\u1EADp qu\u1ED1c t\u1ECBch",
        continue_guest: "Ti\u1EBFp t\u1EE5c v\u1EDBi vai kh\u00E1ch",
        get_started: "B\u1EAFt \u0111\u1EA7u",
        sign_in: "\u0110\u0103ng nh\u1EADp",
        create_account: "T\u1EA1o t\u00E0i kho\u1EA3n",
        username: "T\u00EAn ng\u01B0\u1EDDi d\u00F9ng",
        password: "M\u1EADt kh\u1EA9u",
        display_name: "T\u00EAn hi\u1EC3n th\u1ECB",
        confirm_password: "X\u00E1c nh\u1EADn m\u1EADt kh\u1EA9u",
        hero_title: 'Chu\u1EA9n b\u1ECB cho<br><span class="gradient-text">K\u1EF3 thi Qu\u1ED1c t\u1ECBch</span>',
        civics_test: "Thi Ki\u1EBFn th\u1EE9c C\u00F4ng d\u00E2n",
        english_test: "Thi Ti\u1EBFng Anh",
        eligibility_check: "Ki\u1EC3m tra \u0110i\u1EC1u ki\u1EC7n",
        start_studying: "B\u1EAFt \u0111\u1EA7u h\u1ECDc",
        start_practicing: "B\u1EAFt \u0111\u1EA7u luy\u1EC7n t\u1EADp",
        check_now: "Ki\u1EC3m tra ngay",
        your_progress: "Ti\u1EBFn \u0111\u1ED9 c\u1EE7a b\u1EA1n",
        day_streak: "Chu\u1ED7i ng\u00E0y",
        achievements: "Th\u00E0nh t\u00EDch",
        tests_taken: "S\u1ED1 b\u00E0i thi",
        avg_score: "\u0110i\u1EC3m TB",
        back: "Quay l\u1EA1i",
        settings: "C\u00E0i \u0111\u1EB7t",
        sign_out: "\u0110\u0103ng xu\u1EA5t",
        switch_user: "Chuy\u1EC3n ng\u01B0\u1EDDi d\u00F9ng",
        guest: "Kh\u00E1ch",
        flash_cards: "Th\u1EBB ghi nh\u1EDB",
        listen: "Nghe",
        practice_test: "Thi th\u1EED",
        study: "H\u1ECDc",
        history: "L\u1ECBch s\u1EED",
        all_categories: "T\u1EA5t c\u1EA3 ch\u1EE7 \u0111\u1EC1",
        shuffle: "Tr\u1ED9n",
        read_aloud: "\u0110\u1ECDc to",
        i_got_it_right: "T\u00F4i \u0111\u00FAng",
        i_got_it_wrong: "T\u00F4i sai",
        begin_test: "B\u1EAFt \u0111\u1EA7u thi",
        submit_answer: "G\u1EEDi c\u00E2u tr\u1EA3 l\u1EDDi",
        next: "Ti\u1EBFp",
        previous: "Tr\u01B0\u1EDBc",
        passed: "\u0110\u1EADu!",
        keep_studying: "Ti\u1EBFp t\u1EE5c h\u1ECDc",
        reading: "\u0110\u1ECDc",
        writing_dictation: "Vi\u1EBFt (Ch\u00EDnh t\u1EA3)",
        speaking: "N\u00F3i",
        full_mock_test: "Thi th\u1EED \u0111\u1EA7y \u0111\u1EE7",
        listen_first: "Nghe tr\u01B0\u1EDBc",
        play_sentence: "Ph\u00E1t c\u00E2u",
        check: "Ki\u1EC3m tra",
        type_what_you_hear: "G\u00F5 nh\u1EEFng g\u00EC b\u1EA1n nghe...",
        eligibility_self_check: "T\u1EF1 ki\u1EC3m tra \u0111i\u1EC1u ki\u1EC7n",
        ready_to_apply: "S\u1EB5n s\u00E0ng n\u1ED9p \u0111\u01A1n!",
        needs_attention: "C\u1EA7n ch\u00FA \u00FD",
        issues_found: "Ph\u00E1t hi\u1EC7n v\u1EA5n \u0111\u1EC1",
        not_legal_advice: "\u0110\u00E2y kh\u00F4ng ph\u1EA3i l\u00E0 t\u01B0 v\u1EA5n ph\u00E1p l\u00FD",
        common_questions: "C\u00E2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p",
        find_help: "T\u00ECm h\u1ED7 tr\u1EE3 g\u1EA7n b\u1EA1n",
        non_profit_legal: "Tr\u1EE3 gi\u00FAp ph\u00E1p l\u00FD phi l\u1EE3i nhu\u1EADn",
        immigration_attorneys: "Lu\u1EADt s\u01B0 di tr\u00FA",
        start_over: "B\u1EAFt \u0111\u1EA7u l\u1EA1i",
        retake: "Thi l\u1EA1i",
        continue_text: "Ti\u1EBFp t\u1EE5c",
        resume: "Ti\u1EBFp t\u1EE5c",
        save: "L\u01B0u",
        saved: "\u0110\u00E3 l\u01B0u",
        continue_where_left_off: "Ti\u1EBFp t\u1EE5c t\u1EEB n\u01A1i b\u1EA1n \u0111\u00E3 d\u1EEBng?",
        yes: "C\u00F3",
        no_start_fresh: "B\u1EAFt \u0111\u1EA7u m\u1EDBi",
        english_done: "Ti\u1EBFng Anh xong",
        wrong_password: "Sai m\u1EADt kh\u1EA9u",
        username_taken: "T\u00EAn \u0111\u00E3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng",
        passwords_no_match: "M\u1EADt kh\u1EA9u kh\u00F4ng kh\u1EDBp",
        fields_required: "Vui l\u00F2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 c\u00E1c tr\u01B0\u1EDDng",
        not_started: "Ch\u01B0a b\u1EAFt \u0111\u1EA7u",
        in_progress: "\u0110ang ti\u1EBFn h\u00E0nh",
        of: "trong",
        checked: "\u0111\u00E3 ki\u1EC3m tra",
        all_clear: "T\u1EA5t c\u1EA3 \u0111\u1EA1t!",
        save_continue_later: "L\u01B0u v\u00E0 ti\u1EBFp t\u1EE5c sau",
        progress_saved_toast: "Ti\u1EBFn \u0111\u1ED9 \u0111\u00E3 \u0111\u01B0\u1EE3c l\u01B0u! B\u1EA1n c\u00F3 th\u1EC3 ti\u1EBFp t\u1EE5c b\u1EA5t c\u1EE9 l\u00FAc n\u00E0o.",
    },
    ko: {
        landing_title: "USCIS \uC2DC\uBBFC\uAD8C \uC2DC\uD5D8 \uC900\uBE44",
        landing_subtitle: "\uADC0\uD654 \uC2DC\uD5D8\uC758 \uC2DC\uBBFC \uC9C0\uC2DD \uBC0F \uC601\uC5B4 \uBD80\uBD84 \uBB34\uB8CC \uC5F0\uC2B5 \uC2DC\uD5D8",
        continue_guest: "\uC190\uB2D8\uC73C\uB85C \uACC4\uC18D",
        get_started: "\uC2DC\uC791\uD558\uAE30",
        sign_in: "\uB85C\uADF8\uC778",
        create_account: "\uACC4\uC815 \uB9CC\uB4E4\uAE30",
        username: "\uC0AC\uC6A9\uC790\uBA85",
        password: "\uBE44\uBC00\uBC88\uD638",
        display_name: "\uD45C\uC2DC \uC774\uB984",
        confirm_password: "\uBE44\uBC00\uBC88\uD638 \uD655\uC778",
        hero_title: '<span class="gradient-text">\uC2DC\uBBFC\uAD8C \uC2DC\uD5D8</span><br>\uC900\uBE44\uD558\uAE30',
        civics_test: "\uC2DC\uBBFC \uC9C0\uC2DD \uC2DC\uD5D8",
        english_test: "\uC601\uC5B4 \uC2DC\uD5D8",
        eligibility_check: "\uC790\uACA9 \uD655\uC778",
        start_studying: "\uD559\uC2B5 \uC2DC\uC791",
        start_practicing: "\uC5F0\uC2B5 \uC2DC\uC791",
        check_now: "\uC9C0\uAE08 \uD655\uC778",
        your_progress: "\uB098\uC758 \uC9C4\uD589 \uC0C1\uD669",
        day_streak: "\uC5F0\uC18D \uC77C\uC218",
        achievements: "\uC5C5\uC801",
        tests_taken: "\uC2DC\uD5D8 \uD69F\uC218",
        avg_score: "\uD3C9\uADE0 \uC810\uC218",
        back: "\uB4A4\uB85C",
        settings: "\uC124\uC815",
        sign_out: "\uB85C\uADF8\uC544\uC6C3",
        switch_user: "\uC0AC\uC6A9\uC790 \uBCC0\uACBD",
        guest: "\uC190\uB2D8",
        flash_cards: "\uD50C\uB798\uC2DC \uCE74\uB4DC",
        listen: "\uB4E3\uAE30",
        practice_test: "\uBAA8\uC758 \uC2DC\uD5D8",
        study: "\uD559\uC2B5",
        history: "\uAE30\uB85D",
        all_categories: "\uBAA8\uB4E0 \uCE74\uD14C\uACE0\uB9AC",
        shuffle: "\uC12C\uAE30",
        read_aloud: "\uC18C\uB9AC \uB0B4\uC5B4 \uC77D\uAE30",
        i_got_it_right: "\uB9DE\uC558\uC5B4\uC694",
        i_got_it_wrong: "\uD2C0\uB838\uC5B4\uC694",
        begin_test: "\uC2DC\uD5D8 \uC2DC\uC791",
        submit_answer: "\uB2F5 \uC81C\uCD9C",
        next: "\uB2E4\uC74C",
        previous: "\uC774\uC804",
        passed: "\uD569\uACA9!",
        keep_studying: "\uACC4\uC18D \uD559\uC2B5\uD558\uC138\uC694",
        reading: "\uC77D\uAE30",
        writing_dictation: "\uC4F0\uAE30 (\uBC1B\uC544\uC4F0\uAE30)",
        speaking: "\uB9D0\uD558\uAE30",
        full_mock_test: "\uC804\uCCB4 \uBAA8\uC758 \uC2DC\uD5D8",
        listen_first: "\uBA3C\uC800 \uB4E3\uAE30",
        play_sentence: "\uBB38\uC7A5 \uC7AC\uC0DD",
        check: "\uD655\uC778",
        type_what_you_hear: "\uB4E4\uC740 \uAC83\uC744 \uC785\uB825\uD558\uC138\uC694...",
        eligibility_self_check: "\uC790\uACA9 \uC790\uAC00 \uD655\uC778",
        ready_to_apply: "\uC2E0\uCCAD \uC900\uBE44 \uC644\uB8CC!",
        needs_attention: "\uC8FC\uC758 \uD544\uC694",
        issues_found: "\uBB38\uC81C \uBC1C\uACAC",
        not_legal_advice: "\uC774\uAC83\uC740 \uBC95\uB960 \uC870\uC5B8\uC774 \uC544\uB2D9\uB2C8\uB2E4",
        common_questions: "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38",
        find_help: "\uADFC\uCC98\uC5D0\uC11C \uB3C4\uC6C0 \uCC3E\uAE30",
        non_profit_legal: "\uBE44\uC601\uB9AC \uBC95\uB960 \uC9C0\uC6D0",
        immigration_attorneys: "\uC774\uBBFC \uBCC0\uD638\uC0AC",
        start_over: "\uCC98\uC74C\uBD80\uD130",
        retake: "\uC7AC\uC2DC\uD5D8",
        continue_text: "\uACC4\uC18D",
        resume: "\uC7AC\uAC1C",
        save: "\uC800\uC7A5",
        saved: "\uC800\uC7A5\uB428",
        continue_where_left_off: "\uC774\uC5B4\uC11C \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
        yes: "\uC608",
        no_start_fresh: "\uCC98\uC74C\uBD80\uD130",
        english_done: "\uC601\uC5B4 \uC644\uB8CC",
        wrong_password: "\uBE44\uBC00\uBC88\uD638\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4",
        username_taken: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC0AC\uC6A9\uC790\uBA85\uC785\uB2C8\uB2E4",
        passwords_no_match: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
        fields_required: "\uBAA8\uB4E0 \uD544\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694",
        not_started: "\uC2DC\uC791 \uC804",
        in_progress: "\uC9C4\uD589 \uC911",
        of: "/",
        checked: "\uD655\uC778\uB428",
        all_clear: "\uBAA8\uB450 \uD1B5\uACFC!",
        save_continue_later: "\uC800\uC7A5 \uD6C4 \uB098\uC911\uC5D0 \uACC4\uC18D",
        progress_saved_toast: "\uC9C4\uD589 \uC0C1\uD669\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4! \uC5B8\uC81C\uB4E0\uC9C0 \uACC4\uC18D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    },
    tl: {
        landing_title: "Paghahanda sa Pagsusulit ng Pagkamamamayan ng USCIS",
        landing_subtitle: "Libreng mga practice test para sa bahagi ng civics at Ingles ng naturalization exam",
        continue_guest: "Magpatuloy bilang Bisita",
        get_started: "Magsimula",
        sign_in: "Mag-sign In",
        create_account: "Gumawa ng Account",
        username: "Username",
        password: "Password",
        display_name: "Pangalan na Ipapakita",
        confirm_password: "Kumpirmahin ang Password",
        hero_title: 'Maghanda para sa Iyong<br><span class="gradient-text">Pagsusulit sa Pagkamamamayan</span>',
        civics_test: "Pagsusulit sa Civics",
        english_test: "Pagsusulit sa Ingles",
        eligibility_check: "Pagsusuri ng Kwalipikasyon",
        start_studying: "Magsimulang Mag-aral",
        start_practicing: "Magsimulang Mag-ensayo",
        check_now: "Suriin Ngayon",
        your_progress: "Iyong Progreso",
        day_streak: "Sunod-sunod na Araw",
        achievements: "Mga Nakamit",
        tests_taken: "Bilang ng Pagsusulit",
        avg_score: "Ave. Iskor",
        back: "Bumalik",
        settings: "Mga Setting",
        sign_out: "Mag-sign Out",
        switch_user: "Palitan ang User",
        guest: "Bisita",
        flash_cards: "Flash Cards",
        listen: "Makinig",
        practice_test: "Practice Test",
        study: "Pag-aralan",
        history: "Kasaysayan",
        all_categories: "Lahat ng Kategorya",
        shuffle: "I-shuffle",
        read_aloud: "Basahin Nang Malakas",
        i_got_it_right: "Tama Ako",
        i_got_it_wrong: "Mali Ako",
        begin_test: "Simulan ang Pagsusulit",
        submit_answer: "Isumite ang Sagot",
        next: "Susunod",
        previous: "Nakaraan",
        passed: "Pumasa!",
        keep_studying: "Ipagpatuloy ang Pag-aaral",
        reading: "Pagbasa",
        writing_dictation: "Pagsulat (Dikta)",
        speaking: "Pagsasalita",
        full_mock_test: "Buong Mock Test",
        listen_first: "Makinig Muna",
        play_sentence: "I-play ang Pangungusap",
        check: "Suriin",
        type_what_you_hear: "I-type ang narinig mo...",
        eligibility_self_check: "Sariling Pagsusuri ng Kwalipikasyon",
        ready_to_apply: "Handa Nang Mag-apply!",
        needs_attention: "Kailangan ng Pansin",
        issues_found: "May Natuklasan na Isyu",
        not_legal_advice: "Hindi ito legal na payo",
        common_questions: "Mga Karaniwang Tanong",
        find_help: "Humanap ng Tulong Malapit sa Iyo",
        non_profit_legal: "Non-Profit na Legal Aid",
        immigration_attorneys: "Mga Abogado sa Imigrasyon",
        start_over: "Magsimula Muli",
        retake: "Ulitin",
        continue_text: "Magpatuloy",
        resume: "Ipagpatuloy",
        save: "I-save",
        saved: "Na-save",
        continue_where_left_off: "Ipagpatuloy kung saan ka tumigil?",
        yes: "Oo",
        no_start_fresh: "Magsimula Muli",
        english_done: "Ingles Tapos",
        wrong_password: "Maling password",
        username_taken: "Gamit na ang username",
        passwords_no_match: "Hindi tugma ang mga password",
        fields_required: "Kinakailangan ang lahat ng field",
        not_started: "Hindi pa nasimulan",
        in_progress: "Kasalukuyang ginagawa",
        of: "sa",
        checked: "nasuri",
        all_clear: "Lahat Malinaw!",
        save_continue_later: "I-save at Ipagpatuloy Mamaya",
        progress_saved_toast: "Na-save ang progreso! Maaari kang magpatuloy anumang oras.",
    },
    ar: {
        landing_title: "\u0627\u0644\u062A\u062D\u0636\u064A\u0631 \u0644\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0637\u0646\u0629 USCIS",
        landing_subtitle: "\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u062A\u062F\u0631\u064A\u0628\u064A\u0629 \u0645\u062C\u0627\u0646\u064A\u0629 \u0644\u0623\u062C\u0632\u0627\u0621 \u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062F\u0646\u064A\u0629 \u0648\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0645\u0646 \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062A\u062C\u0646\u0633",
        continue_guest: "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0643\u0636\u064A\u0641",
        get_started: "\u0627\u0628\u062F\u0623",
        sign_in: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
        create_account: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
        username: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",
        password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
        display_name: "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636",
        confirm_password: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
        hero_title: '\u0627\u0633\u062A\u0639\u062F \u0644\u0640<br><span class="gradient-text">\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0637\u0646\u0629</span>',
        civics_test: "\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062F\u0646\u064A\u0629",
        english_test: "\u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
        eligibility_check: "\u0641\u062D\u0635 \u0627\u0644\u0623\u0647\u0644\u064A\u0629",
        start_studying: "\u0627\u0628\u062F\u0623 \u0627\u0644\u062F\u0631\u0627\u0633\u0629",
        start_practicing: "\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u062F\u0631\u064A\u0628",
        check_now: "\u062A\u062D\u0642\u0642 \u0627\u0644\u0622\u0646",
        your_progress: "\u062A\u0642\u062F\u0645\u0643",
        day_streak: "\u0633\u0644\u0633\u0644\u0629 \u0623\u064A\u0627\u0645",
        achievements: "\u0625\u0646\u062C\u0627\u0632\u0627\u062A",
        tests_taken: "\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A",
        avg_score: "\u0645\u062A\u0648\u0633\u0637",
        back: "\u0631\u062C\u0648\u0639",
        settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
        sign_out: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
        switch_user: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645",
        guest: "\u0636\u064A\u0641",
        flash_cards: "\u0628\u0637\u0627\u0642\u0627\u062A",
        listen: "\u0627\u0633\u062A\u0645\u0639",
        practice_test: "\u0627\u062E\u062A\u0628\u0627\u0631 \u062A\u062F\u0631\u064A\u0628\u064A",
        study: "\u062F\u0631\u0627\u0633\u0629",
        history: "\u0633\u062C\u0644",
        all_categories: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0641\u0626\u0627\u062A",
        shuffle: "\u062E\u0644\u0637",
        read_aloud: "\u0627\u0642\u0631\u0623 \u0628\u0635\u0648\u062A \u0639\u0627\u0644\u064D",
        i_got_it_right: "\u0623\u062C\u0628\u062A \u0635\u062D",
        i_got_it_wrong: "\u0623\u062C\u0628\u062A \u062E\u0637\u0623",
        begin_test: "\u0627\u0628\u062F\u0623 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631",
        submit_answer: "\u0623\u0631\u0633\u0644 \u0627\u0644\u0625\u062C\u0627\u0628\u0629",
        next: "\u0627\u0644\u062A\u0627\u0644\u064A",
        previous: "\u0627\u0644\u0633\u0627\u0628\u0642",
        passed: "\u0646\u0627\u062C\u062D!",
        keep_studying: "\u0648\u0627\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u0629",
        reading: "\u0642\u0631\u0627\u0621\u0629",
        writing_dictation: "\u0643\u062A\u0627\u0628\u0629 (\u0625\u0645\u0644\u0627\u0621)",
        speaking: "\u0645\u062D\u0627\u062F\u062B\u0629",
        full_mock_test: "\u0627\u062E\u062A\u0628\u0627\u0631 \u062A\u062C\u0631\u064A\u0628\u064A \u0643\u0627\u0645\u0644",
        listen_first: "\u0627\u0633\u062A\u0645\u0639 \u0623\u0648\u0644\u0627\u064B",
        play_sentence: "\u0634\u063A\u0651\u0644 \u0627\u0644\u062C\u0645\u0644\u0629",
        check: "\u062A\u062D\u0642\u0642",
        type_what_you_hear: "\u0627\u0643\u062A\u0628 \u0645\u0627 \u062A\u0633\u0645\u0639\u0647...",
        eligibility_self_check: "\u0641\u062D\u0635 \u0630\u0627\u062A\u064A \u0644\u0644\u0623\u0647\u0644\u064A\u0629",
        ready_to_apply: "\u062C\u0627\u0647\u0632 \u0644\u0644\u062A\u0642\u062F\u064A\u0645!",
        needs_attention: "\u064A\u062D\u062A\u0627\u062C \u0627\u0646\u062A\u0628\u0627\u0647",
        issues_found: "\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0634\u0627\u0643\u0644",
        not_legal_advice: "\u0647\u0630\u0627 \u0644\u064A\u0633 \u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0629",
        common_questions: "\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629",
        find_help: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u0633\u0627\u0639\u062F\u0629 \u0642\u0631\u064A\u0628\u0629",
        non_profit_legal: "\u0645\u0633\u0627\u0639\u062F\u0629 \u0642\u0627\u0646\u0648\u0646\u064A\u0629 \u063A\u064A\u0631 \u0631\u0628\u062D\u064A\u0629",
        immigration_attorneys: "\u0645\u062D\u0627\u0645\u0648 \u0647\u062C\u0631\u0629",
        start_over: "\u0627\u0628\u062F\u0623 \u0645\u0646 \u062C\u062F\u064A\u062F",
        retake: "\u0623\u0639\u062F \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631",
        continue_text: "\u0645\u062A\u0627\u0628\u0639\u0629",
        resume: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641",
        save: "\u062D\u0641\u0638",
        saved: "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638",
        continue_where_left_off: "\u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0646 \u062D\u064A\u062B \u062A\u0648\u0642\u0641\u062A\u061F",
        yes: "\u0646\u0639\u0645",
        no_start_fresh: "\u0627\u0628\u062F\u0623 \u0645\u0646 \u062C\u062F\u064A\u062F",
        english_done: "\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0645\u0643\u062A\u0645\u0644\u0629",
        wrong_password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062E\u0627\u0637\u0626\u0629",
        username_taken: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644",
        passwords_no_match: "\u0643\u0644\u0645\u062A\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u062A\u064A\u0646",
        fields_required: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629",
        not_started: "\u0644\u0645 \u064A\u0628\u062F\u0623",
        in_progress: "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630",
        of: "\u0645\u0646",
        checked: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642",
        all_clear: "\u0643\u0644 \u0634\u064A\u0621 \u0648\u0627\u0636\u062D!",
        save_continue_later: "\u062D\u0641\u0638 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0644\u0627\u062D\u0642\u0627\u064B",
        progress_saved_toast: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062A\u0642\u062F\u0645! \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0641\u064A \u0623\u064A \u0648\u0642\u062A.",
    },
    fr: {
        landing_title: "Pr\u00e9paration au test de citoyennet\u00e9 USCIS",
        landing_subtitle: "Tests pratiques gratuits pour les sections d'\u00e9ducation civique et d'anglais de l'examen de naturalisation",
        continue_guest: "Continuer en tant qu'invit\u00e9",
        get_started: "Commencer",
        sign_in: "Se connecter",
        create_account: "Cr\u00e9er un compte",
        username: "Nom d'utilisateur",
        password: "Mot de passe",
        display_name: "Nom d'affichage",
        confirm_password: "Confirmer le mot de passe",
        hero_title: 'Pr\u00e9parez votre<br><span class="gradient-text">Examen de Citoyennet\u00e9</span>',
        civics_test: "Test Civique",
        english_test: "Test d'Anglais",
        eligibility_check: "V\u00e9rification d'\u00c9ligibilit\u00e9",
        start_studying: "Commencer \u00e0 \u00e9tudier",
        start_practicing: "Commencer \u00e0 pratiquer",
        check_now: "V\u00e9rifier maintenant",
        your_progress: "Votre Progr\u00e8s",
        day_streak: "Jours cons\u00e9cutifs",
        achievements: "R\u00e9alisations",
        tests_taken: "Tests pass\u00e9s",
        avg_score: "Score moyen",
        back: "Retour",
        settings: "Param\u00e8tres",
        sign_out: "D\u00e9connexion",
        switch_user: "Changer d'utilisateur",
        guest: "Invit\u00e9",
        flash_cards: "Cartes m\u00e9moire",
        listen: "\u00c9couter",
        practice_test: "Test pratique",
        study: "\u00c9tude",
        history: "Historique",
        all_categories: "Toutes les cat\u00e9gories",
        shuffle: "M\u00e9langer",
        read_aloud: "Lire \u00e0 voix haute",
        i_got_it_right: "J'ai bon",
        i_got_it_wrong: "J'ai faux",
        begin_test: "Commencer le test",
        submit_answer: "Soumettre la r\u00e9ponse",
        next: "Suivant",
        previous: "Pr\u00e9c\u00e9dent",
        passed: "R\u00e9ussi\u00a0!",
        keep_studying: "Continuez \u00e0 \u00e9tudier",
        reading: "Lecture",
        writing_dictation: "\u00c9criture (Dict\u00e9e)",
        speaking: "Expression orale",
        full_mock_test: "Test blanc complet",
        listen_first: "\u00c9coutez d'abord",
        play_sentence: "Jouer la phrase",
        check: "V\u00e9rifier",
        type_what_you_hear: "Tapez ce que vous entendez...",
        eligibility_self_check: "Auto-v\u00e9rification d'\u00e9ligibilit\u00e9",
        ready_to_apply: "Pr\u00eat \u00e0 postuler\u00a0!",
        needs_attention: "N\u00e9cessite attention",
        issues_found: "Probl\u00e8mes trouv\u00e9s",
        not_legal_advice: "Ceci n'est pas un avis juridique",
        common_questions: "Questions fr\u00e9quentes",
        find_help: "Trouver de l'aide pr\u00e8s de chez vous",
        non_profit_legal: "Aide juridique \u00e0 but non lucratif",
        immigration_attorneys: "Avocats en immigration",
        start_over: "Recommencer",
        retake: "Repasser",
        continue_text: "Continuer",
        resume: "Reprendre",
        save: "Enregistrer",
        saved: "Enregistr\u00e9",
        continue_where_left_off: "Reprendre l\u00e0 o\u00f9 vous vous \u00eates arr\u00eat\u00e9\u00a0?",
        yes: "Oui",
        no_start_fresh: "Recommencer",
        english_done: "Anglais termin\u00e9",
        wrong_password: "Mot de passe incorrect",
        username_taken: "Nom d'utilisateur d\u00e9j\u00e0 pris",
        passwords_no_match: "Les mots de passe ne correspondent pas",
        fields_required: "Tous les champs sont requis",
        not_started: "Non commenc\u00e9",
        in_progress: "En cours",
        of: "sur",
        checked: "v\u00e9rifi\u00e9s",
        all_clear: "Tout est bon\u00a0!",
        save_continue_later: "Enregistrer et continuer plus tard",
        progress_saved_toast: "Progr\u00e8s enregistr\u00e9\u00a0! Vous pouvez continuer \u00e0 tout moment.",
        faq_subtitle: "R\u00e9ponses aux questions les plus fr\u00e9quentes des candidats.",
        faq_cat_money: "Argent et co\u00fbts",
        faq_q_cost: "Combien co\u00fbte la demande de citoyennet\u00e9\u00a0?",
        faq_a_cost: "Les frais de d\u00e9p\u00f4t du N-400 sont de 760\u00a0$ (ou 710\u00a0$ en ligne). Des dispenses sont disponibles pour les demandeurs \u00e0 faible revenu via le formulaire I-912.",
        faq_q_fee_help: "Puis-je obtenir de l'aide pour payer\u00a0?",
        faq_a_fee_help: "Oui. De nombreuses organisations \u00e0 but non lucratif offrent une aide financi\u00e8re. Consultez la section ressources ci-dessous.",
        faq_cat_privacy: "Confidentialit\u00e9 et s\u00e9curit\u00e9",
        faq_q_info_shared: "Mes informations seront-elles partag\u00e9es\u00a0?",
        faq_a_info_shared: "L'USCIS garde votre demande confidentielle. Les informations sont prot\u00e9g\u00e9es par les lois f\u00e9d\u00e9rales sur la vie priv\u00e9e.",
        faq_q_dv: "Puis-je faire une demande si je suis victime de violence domestique\u00a0?",
        faq_a_dv: "Oui. Les protections VAWA peuvent s'appliquer. Contactez une organisation d'aide juridique pour une assistance confidentielle.",
        faq_cat_criminal: "Ant\u00e9c\u00e9dents criminels",
        faq_q_arrested_dropped: "J'ai \u00e9t\u00e9 arr\u00eat\u00e9 mais les charges ont \u00e9t\u00e9 abandonn\u00e9es. Dois-je encore le d\u00e9clarer\u00a0?",
        faq_a_arrested_dropped: "Oui. Vous devez d\u00e9clarer TOUTES les arrestations, charges, citations et d\u00e9tentions \u2014 m\u00eame si class\u00e9es, effac\u00e9es ou scell\u00e9es.",
        faq_q_dui: "Un DUI m'emp\u00eachera-t-il de devenir citoyen\u00a0?",
        faq_a_dui: "Un seul DUI n'est g\u00e9n\u00e9ralement pas un obstacle, mais deux ou plus pourraient l'\u00eatre. Consultez un avocat en immigration.",
        faq_q_juvenile: "J'ai eu une infraction juv\u00e9nile. Est-ce que \u00e7a compte\u00a0?",
        faq_a_juvenile: "Les infractions juv\u00e9niles peuvent encore devoir \u00eatre d\u00e9clar\u00e9es. Consultez un avocat.",
        faq_cat_taxes: "Imp\u00f4ts",
        faq_q_missed_taxes: "Et si j'ai manqu\u00e9 de d\u00e9clarer mes imp\u00f4ts une ann\u00e9e\u00a0?",
        faq_a_missed_taxes: "D\u00e9posez la ou les d\u00e9clarations manquantes avant votre entretien. Apportez les relev\u00e9s fiscaux de l'IRS comme preuve.",
        faq_q_tax_docs: "Dois-je apporter des documents fiscaux \u00e0 mon entretien\u00a0?",
        faq_a_tax_docs: "Oui. Apportez les relev\u00e9s fiscaux de l'IRS des 3 \u00e0 5 derni\u00e8res ann\u00e9es.",
        faq_cat_travel: "Voyages",
        faq_q_travel_pending: "Puis-je voyager pendant que mon N-400 est en cours\u00a0?",
        faq_a_travel_pending: "Oui, mais les voyages prolong\u00e9s pourraient poser probl\u00e8me. Gardez les voyages courts.",
        faq_q_long_trip: "J'ai fait un long voyage. Ma demande est-elle compromise\u00a0?",
        faq_a_long_trip: "Pas n\u00e9cessairement. Les voyages de moins de 6 mois sont g\u00e9n\u00e9ralement acceptables. De 6 \u00e0 12 mois n\u00e9cessitent une explication. Plus d'un an peut n\u00e9cessiter de recommencer.",
        faq_cat_green_card: "Probl\u00e8mes de carte verte",
        faq_q_expired_gc: "Ma carte verte a expir\u00e9. Puis-je encore faire une demande\u00a0?",
        faq_a_expired_gc: "Oui. Une carte verte expir\u00e9e n'affecte pas votre statut d'immigration.",
        faq_q_divorced: "J'ai obtenu ma carte verte par mariage mais je suis maintenant divorc\u00e9(e). Puis-je faire une demande\u00a0?",
        faq_a_divorced: "Si vous \u00eates r\u00e9sident permanent depuis 5+ ans, oui (en utilisant la voie standard de 5 ans).",
        faq_cat_process: "Processus g\u00e9n\u00e9ral",
        faq_q_how_long: "Combien de temps dure le processus\u00a0?",
        faq_a_how_long: "Actuellement 6 \u00e0 12 mois du d\u00e9p\u00f4t \u00e0 la c\u00e9r\u00e9monie de serment.",
        faq_q_interview: "Que se passe-t-il lors de l'entretien\u00a0?",
        faq_a_interview: "Un agent de l'USCIS examinera votre N-400, testera votre anglais, posera des questions civiques et vous interrogera sur vos ant\u00e9c\u00e9dents.",
        faq_q_interpreter: "Puis-je amener un interpr\u00e8te\u00a0?",
        faq_a_interpreter: "Seulement si vous \u00eates dispens\u00e9 du test d'anglais. Sinon, l'entretien se d\u00e9roule en anglais.",
        resources_subtitle: "Organisations et avocats qui peuvent vous aider dans votre parcours vers la citoyennet\u00e9.",
        resources_disclaimer: "Ceci est une liste de d\u00e9monstration. Les informations de contact sont \u00e0 titre illustratif.",
        elig_disclaimer: "Ceci est un outil informatif uniquement et ne constitue pas un avis juridique.",
    },
    pt: {
        landing_title: "Prepara\u00e7\u00e3o para o Teste de Cidadania USCIS",
        landing_subtitle: "Testes pr\u00e1ticos gratuitos para as se\u00e7\u00f5es de educa\u00e7\u00e3o c\u00edvica e ingl\u00eas do exame de naturaliza\u00e7\u00e3o",
        continue_guest: "Continuar como convidado",
        get_started: "Come\u00e7ar",
        sign_in: "Entrar",
        create_account: "Criar conta",
        username: "Nome de usu\u00e1rio",
        password: "Senha",
        display_name: "Nome de exibi\u00e7\u00e3o",
        confirm_password: "Confirmar senha",
        hero_title: 'Prepare-se para o<br><span class="gradient-text">Teste de Cidadania</span>',
        civics_test: "Teste C\u00edvico",
        english_test: "Teste de Ingl\u00eas",
        eligibility_check: "Verifica\u00e7\u00e3o de Elegibilidade",
        start_studying: "Come\u00e7ar a estudar",
        start_practicing: "Come\u00e7ar a praticar",
        check_now: "Verificar agora",
        your_progress: "Seu Progresso",
        day_streak: "Dias seguidos",
        achievements: "Conquistas",
        tests_taken: "Testes feitos",
        avg_score: "M\u00e9dia",
        back: "Voltar",
        settings: "Configura\u00e7\u00f5es",
        sign_out: "Sair",
        switch_user: "Trocar usu\u00e1rio",
        guest: "Convidado",
        flash_cards: "Cart\u00f5es",
        listen: "Ouvir",
        practice_test: "Teste pr\u00e1tico",
        study: "Estudo",
        history: "Hist\u00f3rico",
        all_categories: "Todas as categorias",
        shuffle: "Embaralhar",
        read_aloud: "Ler em voz alta",
        i_got_it_right: "Acertei",
        i_got_it_wrong: "Errei",
        begin_test: "Iniciar teste",
        submit_answer: "Enviar resposta",
        next: "Pr\u00f3ximo",
        previous: "Anterior",
        passed: "Aprovado!",
        keep_studying: "Continue estudando",
        reading: "Leitura",
        writing_dictation: "Escrita (Ditado)",
        speaking: "Fala",
        full_mock_test: "Simulado completo",
        listen_first: "Ou\u00e7a primeiro",
        play_sentence: "Reproduzir frase",
        check: "Verificar",
        type_what_you_hear: "Digite o que voc\u00ea ouve...",
        eligibility_self_check: "Autoverifica\u00e7\u00e3o de elegibilidade",
        ready_to_apply: "Pronto para aplicar!",
        needs_attention: "Precisa de aten\u00e7\u00e3o",
        issues_found: "Problemas encontrados",
        not_legal_advice: "Isto n\u00e3o \u00e9 aconselhamento jur\u00eddico",
        common_questions: "Perguntas frequentes",
        find_help: "Encontre ajuda perto de voc\u00ea",
        non_profit_legal: "Assist\u00eancia jur\u00eddica sem fins lucrativos",
        immigration_attorneys: "Advogados de imigra\u00e7\u00e3o",
        start_over: "Recome\u00e7ar",
        retake: "Refazer",
        continue_text: "Continuar",
        resume: "Retomar",
        save: "Salvar",
        saved: "Salvo",
        continue_where_left_off: "Continuar de onde parou?",
        yes: "Sim",
        no_start_fresh: "Come\u00e7ar de novo",
        english_done: "Ingl\u00eas conclu\u00eddo",
        wrong_password: "Senha incorreta",
        username_taken: "Nome de usu\u00e1rio j\u00e1 existe",
        passwords_no_match: "As senhas n\u00e3o coincidem",
        fields_required: "Todos os campos s\u00e3o obrigat\u00f3rios",
        not_started: "N\u00e3o iniciado",
        in_progress: "Em andamento",
        of: "de",
        checked: "verificados",
        all_clear: "Tudo certo!",
        save_continue_later: "Salvar e continuar depois",
        progress_saved_toast: "Progresso salvo! Voc\u00ea pode continuar a qualquer momento.",
        faq_subtitle: "Respostas \u00e0s perguntas mais frequentes dos candidatos.",
        faq_cat_money: "Dinheiro e custos",
        faq_q_cost: "Quanto custa solicitar a cidadania?",
        faq_a_cost: "A taxa do formul\u00e1rio N-400 \u00e9 de US$ 760 (ou US$ 710 online). Isen\u00e7\u00f5es de taxa est\u00e3o dispon\u00edveis para candidatos de baixa renda usando o Formul\u00e1rio I-912.",
        faq_q_fee_help: "Posso obter ajuda para pagar?",
        faq_a_fee_help: "Sim. Muitas organiza\u00e7\u00f5es sem fins lucrativos oferecem assist\u00eancia com taxas. Consulte a se\u00e7\u00e3o de recursos abaixo.",
        faq_cat_privacy: "Privacidade e seguran\u00e7a",
        faq_q_info_shared: "Minhas informa\u00e7\u00f5es ser\u00e3o compartilhadas?",
        faq_a_info_shared: "O USCIS mant\u00e9m sua solicita\u00e7\u00e3o confidencial. As informa\u00e7\u00f5es s\u00e3o protegidas pelas leis federais de privacidade.",
        faq_q_dv: "Posso solicitar se estou em situa\u00e7\u00e3o de viol\u00eancia dom\u00e9stica?",
        faq_a_dv: "Sim. As prote\u00e7\u00f5es da VAWA podem ser aplic\u00e1veis. Entre em contato com uma organiza\u00e7\u00e3o de assist\u00eancia jur\u00eddica para ajuda confidencial.",
        faq_cat_criminal: "Antecedentes criminais",
        faq_q_arrested_dropped: "Fui preso, mas as acusa\u00e7\u00f5es foram retiradas. Ainda preciso declarar?",
        faq_a_arrested_dropped: "Sim. Voc\u00ea deve declarar TODAS as pris\u00f5es, acusa\u00e7\u00f5es, cita\u00e7\u00f5es e deten\u00e7\u00f5es \u2014 mesmo que arquivadas ou seladas.",
        faq_q_dui: "Um DUI me impedir\u00e1 de me tornar cidad\u00e3o?",
        faq_a_dui: "Um \u00fanico DUI geralmente n\u00e3o \u00e9 impedimento, mas dois ou mais podem ser. Consulte um advogado de imigra\u00e7\u00e3o.",
        faq_q_juvenile: "Tive uma infra\u00e7\u00e3o juvenil. Isso conta?",
        faq_a_juvenile: "Infra\u00e7\u00f5es juvenis ainda podem precisar ser declaradas. Consulte um advogado.",
        faq_cat_taxes: "Impostos",
        faq_q_missed_taxes: "E se eu deixei de declarar impostos por um ano?",
        faq_a_missed_taxes: "Apresente a(s) declara\u00e7\u00e3o(\u00f5es) faltante(s) antes da sua entrevista. Leve transcri\u00e7\u00f5es fiscais do IRS como prova.",
        faq_q_tax_docs: "Preciso levar documentos fiscais para minha entrevista?",
        faq_a_tax_docs: "Sim. Leve transcri\u00e7\u00f5es fiscais do IRS dos \u00faltimos 3 a 5 anos.",
        faq_cat_travel: "Viagens",
        faq_q_travel_pending: "Posso viajar enquanto meu N-400 est\u00e1 pendente?",
        faq_a_travel_pending: "Sim, mas viagens prolongadas podem causar problemas. Mantenha as viagens curtas.",
        faq_q_long_trip: "Fiz uma viagem longa. Minha solicita\u00e7\u00e3o est\u00e1 comprometida?",
        faq_a_long_trip: "N\u00e3o necessariamente. Viagens de menos de 6 meses geralmente s\u00e3o aceitas. De 6 a 12 meses precisam de explica\u00e7\u00e3o. Mais de 1 ano pode exigir recome\u00e7ar.",
        faq_cat_green_card: "Problemas com green card",
        faq_q_expired_gc: "Meu green card expirou. Ainda posso solicitar?",
        faq_a_expired_gc: "Sim. Um green card expirado n\u00e3o afeta seu status imigrat\u00f3rio.",
        faq_q_divorced: "Obtive meu green card por casamento, mas agora estou divorciado(a). Posso solicitar?",
        faq_a_divorced: "Se voc\u00ea \u00e9 residente permanente h\u00e1 mais de 5 anos, sim (usando a via padr\u00e3o de 5 anos).",
        faq_cat_process: "Processo geral",
        faq_q_how_long: "Quanto tempo o processo leva?",
        faq_a_how_long: "Atualmente de 6 a 12 meses desde o envio at\u00e9 a cerim\u00f4nia de juramento.",
        faq_q_interview: "O que acontece na entrevista?",
        faq_a_interview: "Um oficial do USCIS revisar\u00e1 seu N-400, testar\u00e1 seu ingl\u00eas, far\u00e1 perguntas c\u00edvicas e perguntar\u00e1 sobre seus antecedentes.",
        faq_q_interpreter: "Posso levar um int\u00e9rprete?",
        faq_a_interpreter: "Somente se voc\u00ea se qualificar para a isen\u00e7\u00e3o do teste de ingl\u00eas. Caso contr\u00e1rio, a entrevista \u00e9 em ingl\u00eas.",
        resources_subtitle: "Organiza\u00e7\u00f5es e advogados que podem ajudar na sua jornada rumo \u00e0 cidadania.",
        resources_disclaimer: "Esta \u00e9 uma lista demonstrativa. As informa\u00e7\u00f5es de contato s\u00e3o apenas ilustrativas.",
        elig_disclaimer: "Esta \u00e9 apenas uma ferramenta informativa e n\u00e3o constitui aconselhamento jur\u00eddico.",
    },
    ru: {
        landing_title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043A \u044D\u043A\u0437\u0430\u043C\u0435\u043D\u0443 \u043D\u0430 \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u0442\u0432\u043E USCIS",
        landing_subtitle: "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0442\u0435\u0441\u0442\u044B \u043F\u043E \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u044E \u0438 \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C\u0443 \u044F\u0437\u044B\u043A\u0443 \u0434\u043B\u044F \u044D\u043A\u0437\u0430\u043C\u0435\u043D\u0430 \u043D\u0430 \u043D\u0430\u0442\u0443\u0440\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044E",
        continue_guest: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u043A\u0430\u043A \u0433\u043E\u0441\u0442\u044C",
        get_started: "\u041D\u0430\u0447\u0430\u0442\u044C",
        sign_in: "\u0412\u043E\u0439\u0442\u0438",
        create_account: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442",
        username: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
        password: "\u041F\u0430\u0440\u043E\u043B\u044C",
        display_name: "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u043C\u043E\u0435 \u0438\u043C\u044F",
        confirm_password: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C",
        hero_title: '\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435\u0441\u044C \u043A<br><span class="gradient-text">\u042D\u043A\u0437\u0430\u043C\u0435\u043D\u0443 \u043D\u0430 \u0413\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u0442\u0432\u043E</span>',
        civics_test: "\u0422\u0435\u0441\u0442 \u043F\u043E \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u044E",
        english_test: "\u0422\u0435\u0441\u0442 \u043F\u043E \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u043E\u043C\u0443",
        eligibility_check: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044F",
        start_studying: "\u041D\u0430\u0447\u0430\u0442\u044C \u0443\u0447\u0438\u0442\u044C\u0441\u044F",
        start_practicing: "\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0443",
        check_now: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441",
        your_progress: "\u0412\u0430\u0448 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441",
        day_streak: "\u0414\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434",
        achievements: "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F",
        tests_taken: "\u0422\u0435\u0441\u0442\u043E\u0432",
        avg_score: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0431\u0430\u043B\u043B",
        back: "\u041D\u0430\u0437\u0430\u0434",
        settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
        sign_out: "\u0412\u044B\u0439\u0442\u0438",
        switch_user: "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
        guest: "\u0413\u043E\u0441\u0442\u044C",
        flash_cards: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438",
        listen: "\u0421\u043B\u0443\u0448\u0430\u0442\u044C",
        practice_test: "\u041F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442",
        study: "\u0423\u0447\u0451\u0431\u0430",
        history: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F",
        all_categories: "\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438",
        shuffle: "\u041F\u0435\u0440\u0435\u043C\u0435\u0448\u0430\u0442\u044C",
        read_aloud: "\u0427\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u043B\u0443\u0445",
        i_got_it_right: "\u042F \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
        i_got_it_wrong: "\u042F \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E",
        begin_test: "\u041D\u0430\u0447\u0430\u0442\u044C \u0442\u0435\u0441\u0442",
        submit_answer: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442",
        next: "\u0414\u0430\u043B\u0435\u0435",
        previous: "\u041D\u0430\u0437\u0430\u0434",
        passed: "\u0421\u0434\u0430\u043D\u043E!",
        keep_studying: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439\u0442\u0435 \u0443\u0447\u0438\u0442\u044C\u0441\u044F",
        reading: "\u0427\u0442\u0435\u043D\u0438\u0435",
        writing_dictation: "\u041F\u0438\u0441\u044C\u043C\u043E (\u0414\u0438\u043A\u0442\u0430\u043D\u0442)",
        speaking: "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440",
        full_mock_test: "\u041F\u043E\u043B\u043D\u044B\u0439 \u043F\u0440\u043E\u0431\u043D\u044B\u0439 \u0442\u0435\u0441\u0442",
        listen_first: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u0441\u043B\u0443\u0448\u0430\u0439\u0442\u0435",
        play_sentence: "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
        check: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
        type_what_you_hear: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u043E, \u0447\u0442\u043E \u0441\u043B\u044B\u0448\u0438\u0442\u0435...",
        eligibility_self_check: "\u0421\u0430\u043C\u043E\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044F",
        ready_to_apply: "\u0413\u043E\u0442\u043E\u0432\u044B \u043F\u043E\u0434\u0430\u0432\u0430\u0442\u044C!",
        needs_attention: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F",
        issues_found: "\u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u044B \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B",
        not_legal_advice: "\u042D\u0442\u043E \u043D\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F",
        common_questions: "\u0427\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B",
        find_help: "\u041D\u0430\u0439\u0434\u0438\u0442\u0435 \u043F\u043E\u043C\u043E\u0449\u044C \u0440\u044F\u0434\u043E\u043C",
        non_profit_legal: "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430\u044F \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u043E\u043C\u043E\u0449\u044C",
        immigration_attorneys: "\u0418\u043C\u043C\u0438\u0433\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0430\u0434\u0432\u043E\u043A\u0430\u0442\u044B",
        start_over: "\u041D\u0430\u0447\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E",
        retake: "\u041F\u0435\u0440\u0435\u0441\u0434\u0430\u0442\u044C",
        continue_text: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C",
        resume: "\u0412\u043E\u0437\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
        save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
        saved: "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E",
        continue_where_left_off: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0441 \u0442\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430?",
        yes: "\u0414\u0430",
        no_start_fresh: "\u041D\u0430\u0447\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E",
        english_done: "\u0410\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D",
        wrong_password: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C",
        username_taken: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0437\u0430\u043D\u044F\u0442\u043E",
        passwords_no_match: "\u041F\u0430\u0440\u043E\u043B\u0438 \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442",
        fields_required: "\u0412\u0441\u0435 \u043F\u043E\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B",
        not_started: "\u041D\u0435 \u043D\u0430\u0447\u0430\u0442\u043E",
        in_progress: "\u0412 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435",
        of: "\u0438\u0437",
        checked: "\u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E",
        all_clear: "\u0412\u0441\u0451 \u0432 \u043F\u043E\u0440\u044F\u0434\u043A\u0435!",
        save_continue_later: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u043F\u043E\u0437\u0436\u0435",
        progress_saved_toast: "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D! \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0432 \u043B\u044E\u0431\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.",
        faq_subtitle: "\u041E\u0442\u0432\u0435\u0442\u044B \u043D\u0430 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u0447\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B \u0437\u0430\u044F\u0432\u0438\u0442\u0435\u043B\u0435\u0439.",
        faq_cat_money: "\u0414\u0435\u043D\u044C\u0433\u0438 \u0438 \u0440\u0430\u0441\u0445\u043E\u0434\u044B",
        faq_q_cost: "\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u043E\u0438\u0442 \u043F\u043E\u0434\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u0442\u0432\u043E?",
        faq_a_cost: "\u041F\u043E\u0448\u043B\u0438\u043D\u0430 \u0437\u0430 \u0444\u043E\u0440\u043C\u0443 N-400 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 760 \u0434\u043E\u043B\u043B. (710 \u0434\u043E\u043B\u043B. \u043E\u043D\u043B\u0430\u0439\u043D). \u041E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043E\u0442 \u043E\u043F\u043B\u0430\u0442\u044B \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0434\u043B\u044F \u0437\u0430\u044F\u0432\u0438\u0442\u0435\u043B\u0435\u0439 \u0441 \u043D\u0438\u0437\u043A\u0438\u043C \u0434\u043E\u0445\u043E\u0434\u043E\u043C \u043F\u043E \u0444\u043E\u0440\u043C\u0435 I-912.",
        faq_q_fee_help: "\u041C\u043E\u0433\u0443 \u043B\u0438 \u044F \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043F\u043E\u043C\u043E\u0449\u044C \u0432 \u043E\u043F\u043B\u0430\u0442\u0435?",
        faq_a_fee_help: "\u0414\u0430. \u041C\u043D\u043E\u0433\u0438\u0435 \u043D\u0435\u043A\u043E\u043C\u043C\u0435\u0440\u0447\u0435\u0441\u043A\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442 \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u0443\u044E \u043F\u043E\u043C\u043E\u0449\u044C. \u0421\u043C. \u0440\u0430\u0437\u0434\u0435\u043B \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u043D\u0438\u0436\u0435.",
        faq_cat_privacy: "\u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",
        faq_q_info_shared: "\u0411\u0443\u0434\u0443\u0442 \u043B\u0438 \u043C\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u044B \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C?",
        faq_a_info_shared: "USCIS \u0445\u0440\u0430\u043D\u0438\u0442 \u0432\u0430\u0448\u0435 \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E. \u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u0430 \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0437\u0430\u043A\u043E\u043D\u0430\u043C\u0438 \u043E \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438.",
        faq_cat_criminal: "\u0423\u0433\u043E\u043B\u043E\u0432\u043D\u043E\u0435 \u043F\u0440\u043E\u0448\u043B\u043E\u0435",
        faq_cat_taxes: "\u041D\u0430\u043B\u043E\u0433\u0438",
        faq_cat_travel: "\u041F\u043E\u0435\u0437\u0434\u043A\u0438",
        faq_cat_green_card: "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u043F\u043E \u0433\u0440\u0438\u043D-\u043A\u0430\u0440\u0442\u0435",
        faq_cat_process: "\u041E\u0431\u0449\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441",
        resources_subtitle: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u0430\u0434\u0432\u043E\u043A\u0430\u0442\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043C\u043E\u0433\u0443\u0442 \u043F\u043E\u043C\u043E\u0447\u044C \u043D\u0430 \u043F\u0443\u0442\u0438 \u043A \u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u0442\u0432\u0443.",
        resources_disclaimer: "\u042D\u0442\u043E \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A. \u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043F\u0440\u0438\u0432\u0435\u0434\u0435\u043D\u0430 \u0434\u043B\u044F \u0438\u043B\u043B\u044E\u0441\u0442\u0440\u0430\u0446\u0438\u0438.",
        elig_disclaimer: "\u042D\u0442\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442, \u0430 \u043D\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F.",
    },
    };

    function t(key) { return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key; }

    function applyTranslations() {
        $$("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.textContent = t(key);
        });
        $$("[data-i18n-html]").forEach(el => {
            const key = el.getAttribute("data-i18n-html");
            el.innerHTML = t(key);
        });
        // Update placeholders
        const writingInput = $("#writingInput");
        if (writingInput) writingInput.placeholder = t("type_what_you_hear");
        // RTL for Arabic
        document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
    }

    function setLanguage(code) {
        currentLang = code;
        GLS.set("lang", code);
        applyTranslations();
        // Update language labels
        const lang = LANGUAGES.find(l => l.code === code);
        if (lang) {
            const ll = $("#landingLangLabel");
            if (ll) ll.textContent = lang.name;
        }
        // Close dropdowns
        hide($("#landingLangDropdown"));
        hide($("#headerLangDropdown"));
    }

    function buildLangDropdown(containerId) {
        const container = $(`#${containerId}`);
        container.innerHTML = "";
        LANGUAGES.forEach(lang => {
            const btn = document.createElement("button");
            btn.className = "lang-dropdown-item" + (lang.code === currentLang ? " active" : "");
            btn.innerHTML = `<span>${lang.flag}</span> <span>${lang.name}</span> <span class="lang-check">\u2713</span>`;
            btn.addEventListener("click", (e) => { e.stopPropagation(); setLanguage(lang.code); });
            container.appendChild(btn);
        });
    }

    // ---- State ----
    let currentScreen = "home"; // home, civicsSelection, studyApp, englishSelection, englishPractice, eligibilityCheck
    let navigationStack = [];

    // Civics state
    let questions = [];
    let testVersion = null;
    let currentMode = "flashcards";

    // Flashcard state
    let fcIndex = 0;
    let fcFiltered = [];
    let fcFlipped = false;
    let fcCorrectCount = 0;
    let fcWrongCount = 0;
    let fcWeakFilterActive = false;

    // Listen state
    let listenIndex = 0;
    let listenFiltered = [];
    let listenPlaying = false;
    let listenUtterance = null;

    // Practice state
    let practiceQuestions = [];
    let practiceIndex = 0;
    let practiceScore = 0;
    let practiceAnswers = [];
    let practiceTimerInterval = null;
    let practiceTimeLeft = 30;
    let practiceTimerEnabled = false;
    let practiceSelectedChoice = null;
    let practiceQuestionCount = 10;
    let practiceStreakMode = false;
    let practiceStreak = 0;
    let practiceTotalAsked = 0;

    // Study state
    let knownQuestions = new Set();

    // Voice / Sound
    let selectedVoice = null;
    let voicesLoaded = false;
    let soundEnabled = GLS.get("sound", true);
    let audioCtx = null;

    // English state
    let englishData = null;
    let engMode = null; // reading, writing, speaking, mock
    let engReadingItems = [];
    let engReadingIndex = 0;
    let engWritingItems = [];
    let engWritingIndex = 0;
    let engSpeakingItems = [];
    let engSpeakingIndex = 0;
    let recognition = null;
    let isRecording = false;

    // Mock test state
    let mockPhase = null; // "reading", "writing", "speaking", "results"
    let mockStep = 0;
    let mockReadingSentences = [];
    let mockWritingSentences = [];
    let mockScores = { reading: [], writing: [], speaking: 0 };
    let mockTimerInterval = null;
    let mockTimeLeft = 0;

    // Progress tracking (re-loaded on profile switch)
    let engReadingCompleted = new Set();
    let engWritingCompleted = new Set();
    let engSpeakingCompleted = new Set();
    let engReadingPerfect = 0;
    let engWritingPerfect = 0;

    function reloadProfileState() {
        engReadingCompleted = new Set(LS.get("eng_reading_done", []));
        engWritingCompleted = new Set(LS.get("eng_writing_done", []));
        engSpeakingCompleted = new Set(LS.get("eng_speaking_done", []));
        engReadingPerfect = LS.get("eng_reading_perfect", 0);
        engWritingPerfect = LS.get("eng_writing_perfect", 0);
    }

    // Achievements
    const ACHIEVEMENTS = [
        { id: "first_steps", icon: "\u{1F476}", name: "First Steps", desc: "Completed 1 practice" },
        { id: "streak_5", icon: "\u{1F525}", name: "5-Day Streak", desc: "Practiced 5 days in a row" },
        { id: "civics_master", icon: "\u{1F3C6}", name: "Civics Master", desc: "Scored 100% on practice test" },
        { id: "perfect_reader", icon: "\u{1F4D6}", name: "Perfect Reader", desc: "Read 10 sentences perfectly" },
        { id: "dictation_pro", icon: "\u{270D}\u{FE0F}", name: "Dictation Pro", desc: "Wrote 10 sentences perfectly" },
    ];

    // Quotes
    const QUOTES = [
        "\"The U.S. is a land of opportunity. Believe in your ability to succeed.\"",
        "\"Every journey begins with a single step. Keep studying, you're doing great!\"",
        "\"Citizenship is a commitment to this country and its values.\"",
        "\"Your determination to learn is your greatest strength.\"",
        "\"Practice makes progress. Every session brings you closer to your goal.\"",
        "\"The future belongs to those who believe in the beauty of their dreams.\" \u2014 Eleanor Roosevelt",
        "\"This nation was built by immigrants. You are part of that story.\"",
        "\"Knowledge is power. The more you study, the more confident you'll feel.\"",
    ];

    // ---- SpeechRecognition setup ----
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // ================================================================
    //  INITIALIZATION
    // ================================================================

    function init() {
        // Load saved language
        currentLang = GLS.get("lang", "en");

        initVoices();
        initSoundToggle();
        initModals();
        initLanguageSelectors();
        initUserMenu();
        loadEnglishData();

        // Go straight to app as guest (no landing page)
        if (!currentUser) {
            currentUser = "guest";
            setCurrentUser("guest");
        }
        enterApp();
    }

    // ---- Voices ----
    function initVoices() {
        const sel = $("#voiceSelect");
        function loadVoices() {
            const voices = speechSynthesis.getVoices();
            if (!voices.length) return;
            voicesLoaded = true;
            sel.innerHTML = "";
            const saved = GLS.get("voice", "");
            const enVoices = voices.filter(v => v.lang.startsWith("en"));
            const list = enVoices.length ? enVoices : voices;
            list.forEach((v, i) => {
                const opt = document.createElement("option");
                opt.value = i;
                opt.textContent = `${v.name} (${v.lang})`;
                if (v.name === saved) { opt.selected = true; selectedVoice = v; }
                sel.appendChild(opt);
            });
            if (!selectedVoice && list.length) selectedVoice = list[0];
        }
        speechSynthesis.addEventListener("voiceschanged", loadVoices);
        loadVoices();
        sel.addEventListener("change", () => {
            const voices = speechSynthesis.getVoices();
            const enVoices = voices.filter(v => v.lang.startsWith("en"));
            const list = enVoices.length ? enVoices : voices;
            selectedVoice = list[sel.selectedIndex] || null;
            if (selectedVoice) GLS.set("voice", selectedVoice.name);
        });
    }

    // ---- Sound ----
    function initSoundToggle() {
        const btn = $("#soundToggle");
        btn.setAttribute("aria-checked", soundEnabled ? "true" : "false");
        btn.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            btn.setAttribute("aria-checked", soundEnabled ? "true" : "false");
            GLS.set("sound", soundEnabled);
        });
    }
    function playSound(type) {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.value = 0.15;
            if (type === "correct") { osc.frequency.value = 880; osc.type = "sine"; }
            else if (type === "wrong") { osc.frequency.value = 300; osc.type = "square"; }
            else { osc.frequency.value = 660; osc.type = "sine"; }
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch {}
    }

    // ---- Modals ----
    function initModals() {
        const pairs = [
            ["settingsToggle", "settingsModal", "settingsClose"],
            ["shortcutsToggle", "shortcutsModal", "shortcutsClose"],
        ];
        pairs.forEach(([toggleId, modalId, closeId]) => {
            const toggle = $(`#${toggleId}`);
            const modal = $(`#${modalId}`);
            const close = $(`#${closeId}`);
            toggle.addEventListener("click", () => { modal.style.display = modal.style.display === "none" ? "" : "none"; });
            close.addEventListener("click", () => { modal.style.display = "none"; });
            modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
        });
    }

    // ---- TTS ----
    function speak(text, rate, onEnd) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (selectedVoice) u.voice = selectedVoice;
        u.rate = rate || 1;
        if (onEnd) u.onend = onEnd;
        speechSynthesis.speak(u);
        return u;
    }

    // ---- Confetti ----
    function fireConfetti() {
        const overlay = $("#confettiOverlay");
        overlay.innerHTML = "";
        const colors = ["#2563eb", "#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.left = Math.random() * 100 + "%";
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.8 + "s";
            piece.style.animationDuration = (1.5 + Math.random()) + "s";
            piece.style.width = (6 + Math.random() * 8) + "px";
            piece.style.height = (6 + Math.random() * 8) + "px";
            piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
            overlay.appendChild(piece);
        }
        overlay.classList.add("active");
        setTimeout(() => { overlay.classList.remove("active"); overlay.innerHTML = ""; }, 3000);
    }

    // ================================================================
    //  LANDING PAGE / AUTH
    // ================================================================

    function initLanding() {
        $("#landingGuestBtn").addEventListener("click", () => loginAs("guest"));
    }

    function loginAs(username) {
        currentUser = username;
        setCurrentUser(username);
        enterApp();
    }

    function enterApp() {
        hide($("#landingPage"));
        show($("#mainHeader"));
        show($("#mainFooter"));
        reloadProfileState();
        updateUserUI();
        initNavigation();
        updateStreak();
        renderHome();
        show($("#homeScreen"));
        applyTranslations();
    }

    function signOut() {
        currentUser = "";
        setCurrentUser("");
        navigationStack = [];
        currentScreen = "home";
        hide($("#mainHeader"));
        hide($("#mainFooter"));
        hide($("#homeScreen"));
        hide($("#civicsSelection"));
        hide($("#studyApp"));
        hide($("#englishSelection"));
        hide($("#englishPractice"));
        hide($("#eligibilityCheck"));
        show($("#landingPage"));
        applyTranslations();
    }

    function updateUserUI() {
        // Guest mode only — no user UI to update
    }

    // ---- Language Selectors ----
    function initLanguageSelectors() {
        buildLangDropdown("landingLangDropdown");
        buildLangDropdown("headerLangDropdown");

        // Landing language button (may not exist if landing page removed)
        const landingLangBtn = $("#landingLangBtn");
        if (landingLangBtn) {
            landingLangBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const dd = $("#landingLangDropdown");
                if (dd.style.display === "none") { buildLangDropdown("landingLangDropdown"); show(dd); }
                else hide(dd);
            });
        }
        // Header language button
        $("#headerLangBtn").addEventListener("click", (e) => {
            e.stopPropagation();
            const dd = $("#headerLangDropdown");
            if (dd.style.display === "none") { buildLangDropdown("headerLangDropdown"); show(dd); }
            else hide(dd);
        });
        // Close dropdowns on outside click
        document.addEventListener("click", () => {
            hide($("#landingLangDropdown"));
            hide($("#headerLangDropdown"));
        });

        // Set initial language label
        const lang = LANGUAGES.find(l => l.code === currentLang);
        if (lang) {
            const ll = $("#landingLangLabel");
            if (ll) ll.textContent = lang.name;
        }
        applyTranslations();
    }

    // ---- User Menu (simplified — guest only for now) ----
    function initUserMenu() {
        // No user menu UI — guest mode only
    }

    // ================================================================
    //  NAVIGATION
    // ================================================================

    let navigationInitialized = false;
    function initNavigation() {
        if (navigationInitialized) return;
        navigationInitialized = true;
        // Brand = home
        $("#brandHome").addEventListener("click", goHome);
        $("#brandHome").addEventListener("keydown", (e) => { if (e.key === "Enter") goHome(); });

        // Back button
        $("#backBtn").addEventListener("click", goBack);

        // Home cards
        $("#civicsCard").addEventListener("click", () => navigateTo("civicsSelection"));
        $("#englishCard").addEventListener("click", () => navigateTo("englishSelection"));
        $("#eligibilityCard").addEventListener("click", () => {
            const saved = LS.get("elig_inprogress", null);
            if (saved && saved.step > 0 && saved.step < 11) {
                eligStep = saved.step;
                eligResults = saved.results || [];
                eligTrack = saved.track || 5;
                eligIsMale = saved.isMale || false;
                navigateTo("eligibilityCheck");
                eligRenderStep();
            } else {
                eligStartOver();
                navigateTo("eligibilityCheck");
            }
        });

        // Civics test selection
        $$(".test-card[data-test]").forEach(card => {
            card.addEventListener("click", () => loadCivicsTest(card.dataset.test));
        });

        // English mode selection
        $$(".english-mode-card[data-emode]").forEach(card => {
            card.addEventListener("click", () => loadEnglishMode(card.dataset.emode));
        });

        // Civics tabs
        $$(".mode-tab").forEach(tab => {
            tab.addEventListener("click", () => switchCivicsMode(tab.dataset.mode));
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", handleKeyboard);
    }

    function navigateTo(screen) {
        navigationStack.push(currentScreen);
        showScreen(screen);
    }

    function goBack() {
        if (navigationStack.length) {
            const prev = navigationStack.pop();
            showScreen(prev);
        } else {
            showScreen("home");
        }
    }

    function goHome() {
        navigationStack = [];
        showScreen("home");
        renderHome();
    }

    function showScreen(screen) {
        currentScreen = screen;
        // Save current screen for resume
        LS.set("lastScreen", screen);

        // Hide all screens
        hide($("#homeScreen"));
        hide($("#civicsSelection"));
        hide($("#studyApp"));
        hide($("#englishSelection"));
        hide($("#englishPractice"));
        hide($("#eligibilityCheck"));

        // Show back button if not home
        if (screen === "home") {
            hide($("#backBtn"));
        } else {
            show($("#backBtn"));
        }

        // Stop any audio
        speechSynthesis.cancel();
        stopRecognition();
        clearMockTimer();

        switch (screen) {
            case "home":
                show($("#homeScreen"));
                break;
            case "civicsSelection":
                show($("#civicsSelection"));
                break;
            case "studyApp":
                show($("#studyApp"));
                break;
            case "englishSelection":
                show($("#englishSelection"));
                checkSpeechAPI();
                break;
            case "englishPractice":
                show($("#englishPractice"));
                break;
            case "eligibilityCheck":
                show($("#eligibilityCheck"));
                break;
        }
    }

    // ================================================================
    //  HOME SCREEN
    // ================================================================

    function renderHome() {
        // Quote
        const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        $("#heroQuote").textContent = q;

        // Streak
        const streak = LS.get("dailyStreak", 0);
        $("#homeStreakCount").textContent = streak;
        $("#streakFlame").style.opacity = streak > 0 ? "1" : "0.3";

        // Achievements
        renderAchievements();

        // Progress rings
        updateHomeProgress();

        // Card status indicators
        updateCardStatuses();

        // Ready to apply / progress section
        updateReadyToApply();

        // Quick stats
        renderQuickStats();

        // FAQ accordion
        initFaqAccordion();

        // Collapsible sections
        initCollapsibleSections();

        // Share feature
        initShare();
    }

    // ---- Card Status Indicators ----
    function hasCivicsPass() {
        const history = LS.get("testHistory", []);
        return history.some(h => (h.score / h.total * 100) >= 60);
    }

    function hasEnglishPass() {
        const r = LS.get("eng_reading_done", []).length;
        const w = LS.get("eng_writing_done", []).length;
        const s = LS.get("eng_speaking_done", []).length;
        return r >= 10 && w >= 10 && s >= 5;
    }

    function getEligibilityStatus() {
        // Check completed results first
        let results = LS.get("eligibility_results", null);
        // Also check in-progress results for partial completion
        if (!results || !results.length) {
            const inprogress = LS.get("elig_inprogress", null);
            if (inprogress && inprogress.results && inprogress.results.length) {
                results = inprogress.results;
            }
        }
        if (!results || !results.length) return { done: false, allGreen: false, greens: 0, yellows: 0, reds: 0, total: 11, unchecked: 11, answered: 0 };
        let greens = 0, yellows = 0, reds = 0;
        results.forEach(r => {
            if (r && r.color === "green") greens++;
            else if (r && r.color === "yellow") yellows++;
            else if (r && r.color === "red") reds++;
        });
        const answered = greens + yellows + reds;
        return { done: answered > 0, allGreen: greens === 11 && yellows === 0 && reds === 0, greens, yellows, reds, total: 11, unchecked: 11 - answered, answered };
    }

    function updateCardStatuses() {
        // Civics status
        const civicsEl = $("#civicsStatus");
        if (civicsEl) {
            if (hasCivicsPass()) {
                civicsEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> ' + t("passed") + '</span>';
            } else {
                civicsEl.innerHTML = '';
            }
        }

        // English status
        const englishEl = $("#englishStatus");
        if (englishEl) {
            if (hasEnglishPass()) {
                englishEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Practiced!</span>';
            } else {
                englishEl.innerHTML = '';
            }
        }

        // Eligibility donut + status
        const eligStatus = getEligibilityStatus();
        updateEligibilityDonut(eligStatus);
        const eligEl = $("#eligibilityStatus");
        if (eligEl) {
            const answered = eligStatus.answered || (eligStatus.greens + eligStatus.yellows + eligStatus.reds);
            if (!eligStatus.done) {
                eligEl.innerHTML = '<span class="status-text-muted">' + t("not_started") + '</span>';
            } else if (eligStatus.allGreen) {
                eligEl.innerHTML = '<span class="status-badge status-badge--pass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> ' + t("ready_to_apply") + '</span>';
            } else if (answered < 11) {
                eligEl.innerHTML = '<span class="status-text-muted">' + answered + ' ' + t("of") + ' 11 ' + t("checked") + '</span>';
            } else if (eligStatus.reds > 0) {
                eligEl.innerHTML = '<span class="status-badge status-badge--fail">' + t("issues_found") + '</span>';
            } else {
                eligEl.innerHTML = '<span class="status-badge status-badge--warn">' + t("needs_attention") + '</span>';
            }
        }

        // Update card action text for resume
        const eligAction = $("#eligibilityCard .home-card-action");
        if (eligAction) {
            const inprogress = LS.get("elig_inprogress", null);
            if (inprogress && inprogress.step > 0 && inprogress.step < 11) {
                eligAction.innerHTML = t("resume") + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
            }
        }
    }

    function updateEligibilityDonut(status) {
        const total = status.total || 11;
        const circumference = 2 * Math.PI * 34; // ~213.63
        const greenArc = (status.greens / total) * circumference;
        const yellowArc = (status.yellows / total) * circumference;
        const redArc = (status.reds / total) * circumference;
        const grayArc = (status.unchecked / total) * circumference;

        const greenCircle = $(".elig-donut-green");
        const yellowCircle = $(".elig-donut-yellow");
        const redCircle = $(".elig-donut-red");
        const grayCircle = $(".elig-donut-gray");
        const textEl = $("#eligRingText");

        if (!greenCircle) return;

        // Each segment: dasharray = "arcLen remainingCircumference", dashoffset = -cumulativeOffset
        // We rotate the SVG -90deg via CSS so 0 is top
        let offset = 0;

        greenCircle.style.strokeDasharray = greenArc + " " + (circumference - greenArc);
        greenCircle.style.strokeDashoffset = -offset;
        offset += greenArc;

        yellowCircle.style.strokeDasharray = yellowArc + " " + (circumference - yellowArc);
        yellowCircle.style.strokeDashoffset = -offset;
        offset += yellowArc;

        redCircle.style.strokeDasharray = redArc + " " + (circumference - redArc);
        redCircle.style.strokeDashoffset = -offset;
        offset += redArc;

        if (grayCircle) {
            grayCircle.style.strokeDasharray = grayArc + " " + (circumference - grayArc);
            grayCircle.style.strokeDashoffset = -offset;
        }

        if (textEl) {
            const answered = status.answered || (status.greens + status.yellows + status.reds);
            if (answered > 0) {
                textEl.textContent = answered + "/" + total;
            } else {
                textEl.textContent = "\u2014";
            }
        }
    }

    // ---- Ready to Apply Section ----
    let readyToApplyConfettiFired = false;

    function updateReadyToApply() {
        const container = $("#readyToApply");
        if (!container) return;

        const civicsPassed = hasCivicsPass();
        const englishPassed = hasEnglishPass();
        const eligStatus = getEligibilityStatus();
        const allReady = civicsPassed && englishPassed && eligStatus.allGreen;

        if (allReady) {
            container.innerHTML = '<div class="ready-card">'
                + '<div class="ready-checkmark"><svg viewBox="0 0 52 52" width="64" height="64"><circle class="ready-checkmark-circle" cx="26" cy="26" r="25" fill="none"/><path class="ready-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></div>'
                + '<h2 class="ready-title">You\'re Ready to Apply for Citizenship!</h2>'
                + '<p class="ready-subtitle">You\'ve passed the civics test, completed English practice, and cleared the eligibility check. The next step is filing your N-400.</p>'
                + '<a href="https://www.uscis.gov/n-400" target="_blank" rel="noopener" class="ready-cta">File Form N-400 on USCIS.gov <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>'
                + '<p class="ready-encouragement">Congratulations on reaching this milestone. You\'ve put in the work and you\'re ready!</p>'
                + '</div>';
            if (!readyToApplyConfettiFired) {
                readyToApplyConfettiFired = true;
                setTimeout(fireConfetti, 400);
            }
        } else {
            const items = [
                { label: "Civics Test", done: civicsPassed, doneText: "Passed a practice test", todoText: "Score 60%+ on a practice test" },
                { label: "English Practice", done: englishPassed, doneText: "Completed enough exercises", todoText: "Complete 10 reading, 10 writing, 5 speaking" },
                { label: "Eligibility Check", done: eligStatus.allGreen, doneText: "All checks passed", todoText: eligStatus.done ? "Resolve flagged items" : "Complete the eligibility check" },
            ];
            let html = '<div class="progress-checklist">'
                + '<h3 class="progress-checklist-title">Your Citizenship Readiness</h3>'
                + '<div class="progress-checklist-items">';
            items.forEach(item => {
                html += '<div class="progress-checklist-item ' + (item.done ? "progress-checklist-item--done" : "") + '">'
                    + '<span class="progress-checklist-icon">' + (item.done
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>'
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/></svg>')
                    + '</span>'
                    + '<span class="progress-checklist-label">' + item.label + '</span>'
                    + '<span class="progress-checklist-status">' + (item.done ? item.doneText : item.todoText) + '</span>'
                    + '</div>';
            });
            html += '</div></div>';
            container.innerHTML = html;
        }
    }

    // ---- FAQ Accordion ----
    function initFaqAccordion() {
        const questions = document.querySelectorAll(".faq-question");
        questions.forEach(q => {
            // Remove old listeners by checking data attribute
            if (q.dataset.faqBound) return;
            q.dataset.faqBound = "1";
            q.addEventListener("click", () => {
                const item = q.parentElement;
                const isOpen = item.classList.contains("faq-open");
                item.classList.toggle("faq-open", !isOpen);
                q.setAttribute("aria-expanded", !isOpen);
            });
        });
    }

    function renderAchievements() {
        const container = $("#achievementsBadges");
        const unlocked = LS.get("achievements", {});
        container.innerHTML = "";
        ACHIEVEMENTS.forEach(a => {
            const badge = document.createElement("span");
            badge.className = "achievement-badge" + (unlocked[a.id] ? " unlocked" : "");
            badge.innerHTML = `<span class="achievement-badge-icon">${a.icon}</span> ${a.name}`;
            badge.title = a.desc + (unlocked[a.id] ? " (Unlocked!)" : "");
            container.appendChild(badge);
        });
    }

    function updateHomeProgress() {
        // Civics progress = % of known questions (from study mode)
        const known2008 = LS.get("known_2008", []);
        const known2024 = LS.get("known_2024", []);
        const civicsTotal = 100 + 128;
        const civicsKnown = known2008.length + known2024.length;
        const civicsPct = civicsTotal > 0 ? Math.round((civicsKnown / civicsTotal) * 100) : 0;
        setProgressRing("civicsRingFill", "civicsRingText", civicsPct, 34);

        // English progress
        const engTotal = 55 + 55 + 40;
        const engDone = engReadingCompleted.size + engWritingCompleted.size + engSpeakingCompleted.size;
        const engPct = engTotal > 0 ? Math.round((engDone / engTotal) * 100) : 0;
        setProgressRing("englishRingFill", "englishRingText", engPct, 34);
    }

    function setProgressRing(fillId, textId, pct, radius) {
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        const fill = $(`#${fillId}`);
        const text = $(`#${textId}`);
        if (fill) fill.style.strokeDashoffset = offset;
        if (text) text.textContent = pct + "%";
    }

    function renderQuickStats() {
        const grid = $("#quickStatsGrid");
        const history = LS.get("testHistory", []);
        const totalTests = history.length;
        const avgScore = totalTests ? Math.round(history.reduce((s, h) => s + (h.score / h.total * 100), 0) / totalTests) : 0;
        const streak = LS.get("dailyStreak", 0);
        const totalPracticed = engReadingCompleted.size + engWritingCompleted.size + engSpeakingCompleted.size;

        grid.innerHTML = `
            <div class="stat-card"><div class="stat-card-number">${totalTests}</div><div class="stat-card-label">${t("tests_taken")}</div></div>
            <div class="stat-card"><div class="stat-card-number">${avgScore}%</div><div class="stat-card-label">${t("avg_score")}</div></div>
            <div class="stat-card"><div class="stat-card-number">${streak}</div><div class="stat-card-label">${t("day_streak")}</div></div>
            <div class="stat-card"><div class="stat-card-number">${totalPracticed}</div><div class="stat-card-label">${t("english_done")}</div></div>
        `;
    }

    // ---- Streak ----
    function updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = LS.get("lastPracticeDate", "");
        let streak = LS.get("dailyStreak", 0);

        if (lastDate === today) return; // already logged today

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
            // streak continues, but don't increment until they practice
        } else if (lastDate && lastDate !== yesterday) {
            // streak broken
            streak = 0;
            LS.set("dailyStreak", 0);
        }
    }

    function recordPractice() {
        const today = new Date().toISOString().slice(0, 10);
        const lastDate = LS.get("lastPracticeDate", "");
        let streak = LS.get("dailyStreak", 0);

        if (lastDate === today) return; // already counted today

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday || lastDate === today) {
            streak++;
        } else {
            streak = 1;
        }
        LS.set("dailyStreak", streak);
        LS.set("lastPracticeDate", today);

        // Check achievements
        checkAchievement("first_steps");
        if (streak >= 5) checkAchievement("streak_5");
    }

    // ---- Achievements ----
    function checkAchievement(id) {
        const unlocked = LS.get("achievements", {});
        if (unlocked[id]) return;
        unlocked[id] = Date.now();
        LS.set("achievements", unlocked);
        const a = ACHIEVEMENTS.find(x => x.id === id);
        if (a) showAchievementToast(a);
        renderAchievements();
    }

    function showAchievementToast(achievement) {
        const toast = $("#achievementToast");
        $("#achievementToastIcon").textContent = achievement.icon;
        $("#achievementToastTitle").textContent = achievement.name + " Unlocked!";
        $("#achievementToastDesc").textContent = achievement.desc;
        show(toast);
        fireConfetti();
        setTimeout(() => hide(toast), 4000);
    }

    // ================================================================
    //  CIVICS TEST
    // ================================================================

    async function loadCivicsTest(version) {
        testVersion = version;
        const url = version === "2008" ? "civics_2008.json" : "civics_2024.json";
        try {
            const resp = await fetch(url);
            questions = await resp.json();
        } catch (e) {
            questions = [];
            console.error("Failed to load civics questions:", e);
            return;
        }

        // Load known
        const savedKnown = LS.get(`known_${version}`, []);
        knownQuestions = new Set(savedKnown);

        navigateTo("studyApp");
        initCivicsPanels();
        switchCivicsMode("flashcards");
    }

    function initCivicsPanels() {
        populateCategoryFilters();
        initFlashcards();
        initListen();
        initPractice();
        initStudy();
        renderHistory();
    }

    // ---- Category Filters ----
    function populateCategoryFilters() {
        const cats = [...new Set(questions.map(q => q.category))];
        ["fcCategoryFilter", "listenCategoryFilter"].forEach(id => {
            const sel = $(`#${id}`);
            sel.innerHTML = '<option value="all">All Categories</option>';
            cats.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c; opt.textContent = c;
                sel.appendChild(opt);
            });
        });
    }

    // ---- Mode Switching ----
    function switchCivicsMode(mode) {
        currentMode = mode;
        speechSynthesis.cancel();
        $$(".mode-tab").forEach(t => {
            const active = t.dataset.mode === mode;
            t.classList.toggle("active", active);
            t.setAttribute("aria-selected", active);
        });
        $$(".mode-panel").forEach(p => p.classList.remove("active"));
        const panel = $(`#panel-${mode}`);
        if (panel) panel.classList.add("active");

        if (mode === "listen") renderListenCard();
        if (mode === "study") renderStudy();
        if (mode === "history") renderHistory();
    }

    // ================================================================
    //  FLASHCARDS
    // ================================================================

    function initFlashcards() {
        fcFiltered = [...questions];
        fcIndex = 0; fcFlipped = false;
        fcCorrectCount = 0; fcWrongCount = 0; fcWeakFilterActive = false;

        // Restore saved flashcard state
        const savedFc = LS.get(`fc_state_${testVersion}`, null);
        if (savedFc && savedFc.index < fcFiltered.length) {
            fcIndex = savedFc.index;
            fcCorrectCount = savedFc.correct || 0;
            fcWrongCount = savedFc.wrong || 0;
        }

        renderFlashcard();

        $("#flashcardWrapper").addEventListener("click", flipCard);
        $("#fcPrev").addEventListener("click", () => fcNav(-1));
        $("#fcNext").addEventListener("click", () => fcNav(1));
        $("#fcShuffle").addEventListener("click", shuffleFlashcards);
        $("#fcReadAloud").addEventListener("click", readFlashcardAloud);
        $("#fcGotRight").addEventListener("click", () => assessCard(true));
        $("#fcGotWrong").addEventListener("click", () => assessCard(false));
        $("#fcWeakFilter").addEventListener("click", toggleWeakFilter);
        $("#fcCategoryFilter").addEventListener("change", filterFlashcards);

        // Save & Continue button for flash cards
        const fcActions = $("#panel-flashcards .flashcard-actions");
        if (fcActions && !fcActions.querySelector(".save-continue-btn")) {
            fcActions.appendChild(createSaveContinueBtn());
        }
    }

    function filterFlashcards() {
        const cat = $("#fcCategoryFilter").value;
        fcFiltered = cat === "all" ? [...questions] : questions.filter(q => q.category === cat);
        if (fcWeakFilterActive) {
            const weakIds = getWeakIds();
            fcFiltered = fcFiltered.filter(q => weakIds.has(q.id));
        }
        fcIndex = 0; fcFlipped = false;
        renderFlashcard();
    }

    function getWeakIds() {
        const scores = LS.get(`fc_scores_${testVersion}`, {});
        const weak = new Set();
        Object.entries(scores).forEach(([id, s]) => {
            if (s.wrong > 0 && s.wrong >= s.correct) weak.add(parseInt(id));
        });
        return weak;
    }

    function toggleWeakFilter() {
        fcWeakFilterActive = !fcWeakFilterActive;
        $("#fcWeakFilter").classList.toggle("active", fcWeakFilterActive);
        filterFlashcards();
    }

    function shuffleFlashcards() {
        for (let i = fcFiltered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fcFiltered[i], fcFiltered[j]] = [fcFiltered[j], fcFiltered[i]];
        }
        fcIndex = 0; fcFlipped = false;
        renderFlashcard();
    }

    function renderFlashcard() {
        if (!fcFiltered.length) {
            $("#fcQuestion").textContent = "No questions match your filters.";
            $("#fcCategory").textContent = "";
            return;
        }
        const q = fcFiltered[fcIndex];
        $("#fcCategory").textContent = q.category + (q.subcategory ? " > " + q.subcategory : "");
        $("#fcCategoryBack").textContent = q.category;
        $("#fcQuestion").textContent = q.question;
        const answersList = $("#fcAnswers");
        answersList.innerHTML = "";
        q.answers.forEach(a => {
            const li = document.createElement("li");
            li.textContent = a;
            answersList.appendChild(li);
        });
        // Progress
        $("#fcProgress").textContent = `${fcIndex + 1} / ${fcFiltered.length}`;
        const pct = ((fcIndex + 1) / fcFiltered.length) * 100;
        $("#fcProgressBar").style.width = pct + "%";

        // Score display
        if (fcCorrectCount || fcWrongCount) {
            $("#fcScoreDisplay").textContent = `\u2705 ${fcCorrectCount} \u274C ${fcWrongCount}`;
        } else {
            $("#fcScoreDisplay").textContent = "";
        }

        // Reset flip
        const card = $("#flashcard");
        card.classList.remove("flipped");
        fcFlipped = false;
        hide($("#fcAssessment"));
    }

    function flipCard() {
        const card = $("#flashcard");
        fcFlipped = !fcFlipped;
        card.classList.toggle("flipped", fcFlipped);
        if (fcFlipped) show($("#fcAssessment"));
        else hide($("#fcAssessment"));
    }

    function fcNav(dir) {
        if (!fcFiltered.length) return;
        fcIndex = (fcIndex + dir + fcFiltered.length) % fcFiltered.length;
        fcFlipped = false;
        renderFlashcard();
        saveFcState();
    }

    function saveFcState() {
        LS.set(`fc_state_${testVersion}`, { index: fcIndex, correct: fcCorrectCount, wrong: fcWrongCount });
    }

    function assessCard(correct) {
        const q = fcFiltered[fcIndex];
        const scores = LS.get(`fc_scores_${testVersion}`, {});
        if (!scores[q.id]) scores[q.id] = { correct: 0, wrong: 0 };
        if (correct) { scores[q.id].correct++; fcCorrectCount++; playSound("correct"); }
        else { scores[q.id].wrong++; fcWrongCount++; playSound("wrong"); }
        LS.set(`fc_scores_${testVersion}`, scores);
        recordPractice();
        fcNav(1);
    }

    function readFlashcardAloud() {
        if (!fcFiltered.length) return;
        const q = fcFiltered[fcIndex];
        const text = fcFlipped ? q.answers.join(". ") : q.question;
        speak(text);
    }

    // ================================================================
    //  LISTEN MODE
    // ================================================================

    function initListen() {
        listenFiltered = [...questions];
        listenIndex = 0;

        $("#listenPlayPause").addEventListener("click", toggleListenPlay);
        $("#listenPrev").addEventListener("click", () => listenNav(-1));
        $("#listenNext").addEventListener("click", () => listenNav(1));
        $("#listenCategoryFilter").addEventListener("change", filterListen);
        renderListenCard();
    }

    function filterListen() {
        const cat = $("#listenCategoryFilter").value;
        listenFiltered = cat === "all" ? [...questions] : questions.filter(q => q.category === cat);
        listenIndex = 0;
        renderListenCard();
    }

    function renderListenCard() {
        if (!listenFiltered.length) return;
        const q = listenFiltered[listenIndex];
        $("#listenProgress").textContent = `${listenIndex + 1} / ${listenFiltered.length}`;
        $("#listenCategory").textContent = q.category;
        $("#listenQuestion").textContent = q.question;
        $("#listenAnswer").textContent = q.answers.join(" / ");
    }

    function toggleListenPlay() {
        if (listenPlaying) {
            speechSynthesis.cancel();
            listenPlaying = false;
            showListenPlayIcon(false);
            return;
        }
        playListenCurrent();
    }

    function playListenCurrent() {
        if (!listenFiltered.length) return;
        const q = listenFiltered[listenIndex];
        const content = $("#listenContent").value;
        const speed = parseFloat($("#listenSpeed").value) || 1;
        let text = "";
        if (content === "questions" || content === "both") text += q.question + ". ";
        if (content === "answers" || content === "both") text += q.answers[0];
        listenPlaying = true;
        showListenPlayIcon(true);
        speak(text, speed, () => {
            listenPlaying = false;
            showListenPlayIcon(false);
        });
    }

    function showListenPlayIcon(playing) {
        const play = $(".play-icon");
        const pause = $(".pause-icon");
        if (playing) { hide(play); show(pause); }
        else { show(play); hide(pause); }
    }

    function listenNav(dir) {
        speechSynthesis.cancel();
        listenPlaying = false;
        showListenPlayIcon(false);
        if (!listenFiltered.length) return;
        listenIndex = (listenIndex + dir + listenFiltered.length) % listenFiltered.length;
        renderListenCard();
    }

    // ================================================================
    //  PRACTICE TEST
    // ================================================================

    function initPractice() {
        const countInput = $("#practiceQuestionCount");
        countInput.max = questions.length;
        countInput.addEventListener("input", updatePassInfo);
        updatePassInfo();

        $("#practiceBegin").addEventListener("click", startPracticeTest);
        $("#practiceSubmitAnswer").addEventListener("click", submitPracticeAnswer);
        $("#practiceRetake").addEventListener("click", retakePractice);

        // Check for saved in-progress test
        checkResumeTest();
    }

    function checkResumeTest() {
        const saved = LS.get(`practice_inprogress_${testVersion}`, null);
        if (!saved || !saved.questions || !saved.questions.length) return;
        const startDiv = $("#practiceStart");
        // Insert a resume prompt before the begin button
        const existingPrompt = startDiv.querySelector(".resume-prompt");
        if (existingPrompt) existingPrompt.remove();
        const prompt = document.createElement("div");
        prompt.className = "resume-prompt";
        prompt.innerHTML = `<span class="resume-prompt-text">${t("continue_where_left_off")} (${saved.index}/${saved.questions.length})</span>`
            + `<button class="resume-prompt-btn resume-prompt-btn--yes">${t("resume")}</button>`
            + `<button class="resume-prompt-btn resume-prompt-btn--no">${t("no_start_fresh")}</button>`;
        const beginBtn = $("#practiceBegin");
        startDiv.querySelector(".practice-info-card").insertBefore(prompt, beginBtn);
        prompt.querySelector(".resume-prompt-btn--yes").addEventListener("click", () => {
            resumePracticeTest(saved);
            prompt.remove();
        });
        prompt.querySelector(".resume-prompt-btn--no").addEventListener("click", () => {
            LS.set(`practice_inprogress_${testVersion}`, null);
            prompt.remove();
        });
    }

    function resumePracticeTest(saved) {
        practiceQuestions = saved.questions;
        practiceIndex = saved.index;
        practiceScore = saved.score;
        practiceAnswers = saved.answers || [];
        practiceQuestionCount = saved.questions.length;
        practiceTimerEnabled = saved.timerEnabled || false;
        practiceStreakMode = saved.streakMode || false;
        practiceStreak = saved.streak || 0;
        practiceTotalAsked = saved.totalAsked || saved.index;
        practiceSelectedChoice = null;

        hide($("#practiceStart"));
        show($("#practiceQuestion"));
        hide($("#practiceResults"));

        if (practiceStreakMode) show($("#streakCounter"));
        else hide($("#streakCounter"));

        renderPracticeQuestion();
    }

    function updatePassInfo() {
        const count = parseInt($("#practiceQuestionCount").value) || 10;
        const pass = Math.ceil(count * 0.6);
        $("#practicePassInfo").textContent = `Need ${pass} correct to pass (60%)`;
    }

    function startPracticeTest() {
        practiceQuestionCount = Math.min(parseInt($("#practiceQuestionCount").value) || 10, questions.length);
        practiceTimerEnabled = $("#practiceTimer").checked;
        practiceStreakMode = $("#practiceStreakMode").checked;

        // Pick random questions
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        practiceQuestions = shuffled.slice(0, practiceQuestionCount);
        practiceIndex = 0;
        practiceScore = 0;
        practiceAnswers = [];
        practiceStreak = 0;
        practiceTotalAsked = 0;
        practiceSelectedChoice = null;

        hide($("#practiceStart"));
        show($("#practiceQuestion"));
        hide($("#practiceResults"));

        if (practiceStreakMode) show($("#streakCounter"));
        else hide($("#streakCounter"));

        renderPracticeQuestion();
    }

    function renderPracticeQuestion() {
        if (practiceIndex >= practiceQuestions.length) {
            finishPracticeTest();
            return;
        }
        const q = practiceQuestions[practiceIndex];
        practiceTotalAsked++;

        if (practiceStreakMode) {
            $("#practiceQNum").textContent = `Question ${practiceTotalAsked}`;
            updateStreakDisplay();
        } else {
            $("#practiceQNum").textContent = `Question ${practiceIndex + 1} of ${practiceQuestionCount}`;
        }

        // Progress ring
        const pct = practiceIndex / practiceQuestionCount;
        const circ = 326.73;
        $("#progressRingFill").style.strokeDashoffset = circ - pct * circ;
        $("#progressRingText").textContent = `${practiceIndex}/${practiceQuestionCount}`;

        // Score
        $("#practiceScoreLive").textContent = `Score: ${practiceScore}`;
        $("#practiceScoreLive").style.color = practiceScore > 0 ? "var(--success)" : "";

        // Question
        $("#practiceQuestionText").textContent = q.question;

        // Build choices (correct + 3 wrong from other questions)
        const correctAnswer = q.answers[0];
        const wrongPool = questions.filter(x => x.id !== q.id).sort(() => Math.random() - 0.5);
        const wrongs = wrongPool.slice(0, 3).map(x => x.answers[0]);
        const choices = [correctAnswer, ...wrongs].sort(() => Math.random() - 0.5);

        const choicesDiv = $("#practiceChoices");
        choicesDiv.innerHTML = "";
        practiceSelectedChoice = null;
        $("#practiceSubmitAnswer").disabled = true;

        choices.forEach(c => {
            const btn = document.createElement("button");
            btn.className = "practice-choice";
            btn.textContent = c;
            btn.addEventListener("click", () => selectChoice(btn, c));
            choicesDiv.appendChild(btn);
        });

        // Save & Continue button for practice test
        const practiceSaveArea = $("#practiceSaveBtnArea");
        if (practiceSaveArea) {
            practiceSaveArea.innerHTML = "";
            practiceSaveArea.appendChild(createSaveContinueBtn());
        }

        // Timer
        if (practiceTimerEnabled) {
            practiceTimeLeft = 30;
            show($("#practiceTimerDisplay"));
            renderTimer();
            clearInterval(practiceTimerInterval);
            practiceTimerInterval = setInterval(() => {
                practiceTimeLeft--;
                renderTimer();
                if (practiceTimeLeft <= 0) {
                    clearInterval(practiceTimerInterval);
                    autoSubmitTimeout();
                }
            }, 1000);
        } else {
            hide($("#practiceTimerDisplay"));
        }
    }

    function renderTimer() {
        const m = Math.floor(practiceTimeLeft / 60);
        const s = practiceTimeLeft % 60;
        $("#practiceTimerDisplay").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }

    function selectChoice(btn, value) {
        $$(".practice-choice").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        practiceSelectedChoice = value;
        $("#practiceSubmitAnswer").disabled = false;
    }

    function submitPracticeAnswer() {
        clearInterval(practiceTimerInterval);
        const q = practiceQuestions[practiceIndex];
        const correct = q.answers.some(a =>
            a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() ===
            (practiceSelectedChoice || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
        );

        // Highlight
        $$(".practice-choice").forEach(btn => {
            btn.style.pointerEvents = "none";
            const isCorrect = q.answers.some(a =>
                a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim() ===
                btn.textContent.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim()
            );
            if (isCorrect) btn.classList.add("correct");
            if (btn.classList.contains("selected") && !isCorrect) btn.classList.add("wrong");
        });

        if (correct) {
            practiceScore++;
            practiceStreak++;
            playSound("correct");
        } else {
            playSound("wrong");
            if (practiceStreakMode) practiceStreak = 0;
        }

        practiceAnswers.push({
            question: q.question,
            correctAnswer: q.answers[0],
            userAnswer: practiceSelectedChoice,
            correct
        });

        // Save in-progress state
        LS.set(`practice_inprogress_${testVersion}`, {
            questions: practiceQuestions,
            index: practiceIndex + 1,
            score: practiceScore,
            answers: practiceAnswers,
            timerEnabled: practiceTimerEnabled,
            streakMode: practiceStreakMode,
            streak: practiceStreak,
            totalAsked: practiceTotalAsked,
        });

        if (practiceStreakMode) updateStreakDisplay();

        // Check streak win
        if (practiceStreakMode && practiceStreak >= 6) {
            setTimeout(() => finishPracticeTest(), 800);
            return;
        }

        // Move to next after delay
        setTimeout(() => {
            practiceIndex++;
            renderPracticeQuestion();
        }, 1200);
    }

    function autoSubmitTimeout() {
        practiceSelectedChoice = null;
        submitPracticeAnswer();
    }

    function updateStreakDisplay() {
        const flames = $("#streakFlames");
        flames.textContent = "";
        for (let i = 0; i < Math.min(practiceStreak, 6); i++) flames.textContent += "\u{1F525}";
        $("#streakNumber").textContent = practiceStreak;
    }

    function finishPracticeTest() {
        clearInterval(practiceTimerInterval);
        LS.set(`practice_inprogress_${testVersion}`, null);
        hide($("#practiceQuestion"));
        show($("#practiceResults"));

        const total = practiceAnswers.length;
        const pct = total ? Math.round((practiceScore / total) * 100) : 0;
        const pass = pct >= 60;

        if (pass) fireConfetti();

        // Checkmark
        $("#resultsCheckmark").textContent = pass ? "\u{2705}" : "\u{274C}";
        $("#resultsScore").textContent = `${practiceScore} / ${total} (${pct}%)`;
        $("#resultsScore").style.color = pass ? "var(--success)" : "var(--error)";
        $("#resultsStatus").textContent = pass ? t("passed") : t("keep_studying");
        $("#resultsStatus").style.color = pass ? "var(--success)" : "var(--error)";

        let statsHtml = "";
        if (practiceStreakMode) {
            statsHtml = `Streak mode \u2014 answered ${total} questions, best streak: ${Math.max(...practiceAnswers.reduce((acc, a, i) => {
                if (a.correct) acc[acc.length - 1]++;
                else acc.push(0);
                return acc;
            }, [0]))}`;
        } else {
            statsHtml = `${practiceScore} correct out of ${total} questions`;
        }
        $("#resultsStats").textContent = statsHtml;

        // Review
        const review = $("#resultsReview");
        review.innerHTML = "";
        practiceAnswers.forEach(a => {
            const div = document.createElement("div");
            div.className = "review-item";
            div.innerHTML = `<div class="review-q">${a.correct ? "\u2705" : "\u274C"} ${a.question}</div>
                <div class="review-a ${a.correct ? "review-correct" : "review-wrong"}">
                    ${a.correct ? a.correctAnswer : `Your answer: ${a.userAnswer || "(none)"} | Correct: ${a.correctAnswer}`}
                </div>`;
            review.appendChild(div);
        });

        // Save history
        const history = LS.get("testHistory", []);
        history.unshift({
            date: new Date().toISOString(),
            version: testVersion,
            score: practiceScore,
            total: total,
            streak: practiceStreakMode,
            passed: pass,
        });
        if (history.length > 50) history.length = 50;
        LS.set("testHistory", history);

        recordPractice();
        if (pct === 100) checkAchievement("civics_master");
    }

    function retakePractice() {
        hide($("#practiceResults"));
        show($("#practiceStart"));
    }

    // ================================================================
    //  STUDY MODE
    // ================================================================

    function initStudy() {
        $("#clearKnown").addEventListener("click", () => {
            knownQuestions.clear();
            LS.set(`known_${testVersion}`, []);
            renderStudy();
        });
    }

    function renderStudy() {
        const container = $("#studyCategories");
        container.innerHTML = "";

        const catMap = {};
        questions.forEach(q => {
            const cat = q.category;
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(q);
        });

        Object.entries(catMap).forEach(([cat, qs]) => {
            const section = document.createElement("div");
            section.className = "study-category";

            const knownInCat = qs.filter(q => knownQuestions.has(q.id)).length;
            section.innerHTML = `
                <div class="study-category-header">
                    <div class="study-category-title">${cat}</div>
                    <div class="study-category-count">${knownInCat} / ${qs.length} known</div>
                </div>
                <div class="study-questions"></div>
            `;
            const qContainer = section.querySelector(".study-questions");
            qs.forEach(q => {
                const div = document.createElement("div");
                div.className = "study-question" + (knownQuestions.has(q.id) ? " known" : "");
                div.innerHTML = `<span class="sq-number">#${q.id}</span><span class="sq-text">${q.question}</span><div class="sq-answer">${q.answers.join(" / ")}</div>`;
                div.addEventListener("click", () => {
                    div.classList.toggle("expanded");
                    if (div.classList.contains("expanded")) {
                        if (!knownQuestions.has(q.id)) {
                            knownQuestions.add(q.id);
                            div.classList.add("known");
                            LS.set(`known_${testVersion}`, [...knownQuestions]);
                            updateKnownCount();
                        }
                    }
                });
                qContainer.appendChild(div);
            });
            container.appendChild(section);
        });
        updateKnownCount();
    }

    function updateKnownCount() {
        $("#knownCount").textContent = `${knownQuestions.size} marked as known`;
    }

    // ================================================================
    //  HISTORY
    // ================================================================

    function renderHistory() {
        const container = $("#historyContent");
        const history = LS.get("testHistory", []);

        if (!history.length) {
            container.innerHTML = '<div class="history-empty">No test history yet. Take a practice test to see your results here.</div>';
            return;
        }
        container.innerHTML = "";
        history.forEach(h => {
            const pct = Math.round((h.score / h.total) * 100);
            const div = document.createElement("div");
            div.className = "history-item";
            const date = new Date(h.date);
            const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            div.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-date">${dateStr} \u2014 ${h.version} Test${h.streak ? " (Streak)" : ""}</span>
                    <span class="history-item-score ${h.passed ? "history-pass" : "history-fail"}">${pct}%</span>
                </div>
                <div class="history-item-details">${h.score} / ${h.total} correct \u2014 ${h.passed ? "PASSED" : "FAILED"}</div>
            `;
            container.appendChild(div);
        });
    }

    // ================================================================
    //  ENGLISH TEST
    // ================================================================

    async function loadEnglishData() {
        try {
            const resp = await fetch("english_test.json");
            englishData = await resp.json();
        } catch (e) {
            console.error("Failed to load English test data:", e);
        }
    }

    function checkSpeechAPI() {
        if (!SpeechRecognition) {
            show($("#speechApiWarning"));
        } else {
            hide($("#speechApiWarning"));
        }
    }

    function loadEnglishMode(mode) {
        if (!englishData) { alert("English test data is still loading. Please try again."); return; }
        engMode = mode;
        navigateTo("englishPractice");

        // Hide all sections
        hide($("#engReading"));
        hide($("#engWriting"));
        hide($("#engSpeaking"));
        hide($("#engMock"));

        switch (mode) {
            case "reading": initReading(); break;
            case "writing": initWriting(); break;
            case "speaking": initSpeaking(); break;
            case "mock": initMock(); break;
        }
    }

    // ---- Text Comparison ----
    function normalizeText(text) {
        return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
    }

    function compareTexts(target, spoken) {
        const tWords = normalizeText(target);
        const sWords = normalizeText(spoken);
        const result = [];
        let correct = 0;
        let ti = 0, si = 0;

        while (ti < tWords.length || si < sWords.length) {
            if (ti < tWords.length && si < sWords.length && tWords[ti] === sWords[si]) {
                result.push({ word: tWords[ti], status: "correct" });
                correct++;
                ti++; si++;
            } else if (ti < tWords.length && si < sWords.length) {
                // Check if target word appears later in spoken (skip extra)
                const futureInSpoken = sWords.indexOf(tWords[ti], si);
                const futureInTarget = tWords.indexOf(sWords[si], ti);

                if (futureInSpoken >= 0 && (futureInTarget < 0 || futureInSpoken - si <= futureInTarget - ti)) {
                    // Extra words in spoken before match
                    while (si < futureInSpoken) {
                        result.push({ word: sWords[si], status: "extra" });
                        si++;
                    }
                } else if (futureInTarget >= 0) {
                    // Missing words in spoken
                    while (ti < futureInTarget) {
                        result.push({ word: tWords[ti], status: "missing" });
                        ti++;
                    }
                } else {
                    result.push({ word: tWords[ti], status: "wrong", spoken: sWords[si] });
                    ti++; si++;
                }
            } else if (ti < tWords.length) {
                result.push({ word: tWords[ti], status: "missing" });
                ti++;
            } else {
                result.push({ word: sWords[si], status: "extra" });
                si++;
            }
        }

        const total = tWords.length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { result, score, correct, total };
    }

    function renderComparison(result, containerId) {
        const el = $(`#${containerId}`);
        show(el);
        el.innerHTML = result.map(r => {
            switch (r.status) {
                case "correct": return `<span class="word-correct">${r.word}</span>`;
                case "wrong": return `<span class="word-wrong">${r.spoken || r.word}</span>`;
                case "missing": return `<span class="word-missing">[${r.word}]</span>`;
                case "extra": return `<span class="word-extra">${r.word}</span>`;
                default: return r.word;
            }
        }).join(" ");
    }

    function renderScoreBar(score, containerId) {
        const el = $(`#${containerId}`);
        show(el);
        const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)";
        el.innerHTML = `Score: <span class="score-value" style="color:${color}">${score}%</span>`;
    }

    // ---- Speech Recognition ----
    function startRecognition(onResult) {
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
            return;
        }
        stopRecognition();
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        isRecording = true;

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            isRecording = false;
            onResult(transcript);
        };
        recognition.onerror = (e) => {
            isRecording = false;
            if (e.error !== "no-speech" && e.error !== "aborted") {
                console.warn("Speech recognition error:", e.error);
            }
            onResult("");
        };
        recognition.onend = () => {
            isRecording = false;
        };
        recognition.start();
    }

    function stopRecognition() {
        if (recognition) {
            try { recognition.abort(); } catch {}
            recognition = null;
        }
        isRecording = false;
    }

    // ================================================================
    //  READING PRACTICE
    // ================================================================

    function initReading() {
        show($("#engReading"));
        engReadingItems = [...englishData.reading];
        engReadingIndex = LS.get("eng_reading_index", 0);
        if (engReadingIndex >= engReadingItems.length) engReadingIndex = 0;
        renderReadingSentence();

        // Remove old listeners by cloning
        replaceClickHandler("readingListenFirst", () => {
            const s = engReadingItems[engReadingIndex];
            speak(s.sentence, 0.85);
        });
        replaceClickHandler("readingMic", startReadingRecognition);
        replaceClickHandler("readingPrev", () => { engReadingIndex = Math.max(0, engReadingIndex - 1); LS.set("eng_reading_index", engReadingIndex); renderReadingSentence(); });
        replaceClickHandler("readingNext", () => { engReadingIndex = Math.min(engReadingItems.length - 1, engReadingIndex + 1); LS.set("eng_reading_index", engReadingIndex); renderReadingSentence(); });
        replaceClickHandler("readingShuffle", () => {
            shuffleArray(engReadingItems);
            engReadingIndex = 0;
            renderReadingSentence();
        });

        // Save & Continue button for reading
        const readingSection = $("#engReading");
        if (readingSection && !readingSection.querySelector(".save-continue-btn")) {
            readingSection.appendChild(createSaveContinueBtn());
        }
    }

    function renderReadingSentence() {
        const s = engReadingItems[engReadingIndex];
        $("#readingSentence").textContent = s.sentence;
        $("#readingProgress").textContent = `${engReadingIndex + 1} / ${engReadingItems.length}`;
        hide($("#readingResult"));
        hide($("#readingScoreBar"));
        hide($("#readingMicStatus"));
        const mic = $("#readingMic");
        mic.classList.remove("recording");
    }

    function startReadingRecognition() {
        const mic = $("#readingMic");
        if (isRecording) {
            stopRecognition();
            mic.classList.remove("recording");
            hide($("#readingMicStatus"));
            return;
        }

        mic.classList.add("recording");
        show($("#readingMicStatus"));

        startRecognition((transcript) => {
            mic.classList.remove("recording");
            hide($("#readingMicStatus"));

            if (!transcript) {
                show($("#readingResult"));
                $("#readingResult").innerHTML = '<span class="word-wrong">No speech detected. Try again.</span>';
                return;
            }

            const target = engReadingItems[engReadingIndex].sentence;
            const { result, score } = compareTexts(target, transcript);
            renderComparison(result, "readingResult");
            renderScoreBar(score, "readingScoreBar");

            // Track progress
            engReadingCompleted.add(engReadingItems[engReadingIndex].id);
            LS.set("eng_reading_done", [...engReadingCompleted]);
            recordPractice();

            if (score === 100) {
                engReadingPerfect++;
                LS.set("eng_reading_perfect", engReadingPerfect);
                if (engReadingPerfect >= 10) checkAchievement("perfect_reader");
                playSound("correct");
            }
        });
    }

    // ================================================================
    //  WRITING PRACTICE
    // ================================================================

    function initWriting() {
        show($("#engWriting"));
        engWritingItems = [...englishData.writing];
        engWritingIndex = LS.get("eng_writing_index", 0);
        if (engWritingIndex >= engWritingItems.length) engWritingIndex = 0;
        renderWritingSentence();

        replaceClickHandler("writingPlay", () => playWritingSentence());
        replaceClickHandler("writingReplay", () => playWritingSentence());
        replaceClickHandler("writingCheck", checkWriting);
        replaceClickHandler("writingPrev", () => { engWritingIndex = Math.max(0, engWritingIndex - 1); LS.set("eng_writing_index", engWritingIndex); renderWritingSentence(); });
        replaceClickHandler("writingNext", () => { engWritingIndex = Math.min(engWritingItems.length - 1, engWritingIndex + 1); LS.set("eng_writing_index", engWritingIndex); renderWritingSentence(); });
        replaceClickHandler("writingShuffle", () => {
            shuffleArray(engWritingItems);
            engWritingIndex = 0;
            renderWritingSentence();
        });

        // Save & Continue button for writing
        const writingSection = $("#engWriting");
        if (writingSection && !writingSection.querySelector(".save-continue-btn")) {
            writingSection.appendChild(createSaveContinueBtn());
        }

        // Enter key submits
        $("#writingInput").addEventListener("keydown", (e) => {
            if (e.key === "Enter") checkWriting();
        });
    }

    function renderWritingSentence() {
        $("#writingProgress").textContent = `${engWritingIndex + 1} / ${engWritingItems.length}`;
        $("#writingInput").value = "";
        hide($("#writingResult"));
        hide($("#writingScoreBar"));
        hide($("#writingReplay"));
        $("#writingInput").focus();
    }

    function playWritingSentence() {
        const s = engWritingItems[engWritingIndex];
        speak(s.sentence, 0.85);
        show($("#writingReplay"));
    }

    function checkWriting() {
        const userText = $("#writingInput").value.trim();
        if (!userText) return;

        const target = engWritingItems[engWritingIndex].sentence;
        const { result, score } = compareTexts(target, userText);
        renderComparison(result, "writingResult");
        renderScoreBar(score, "writingScoreBar");

        engWritingCompleted.add(engWritingItems[engWritingIndex].id);
        LS.set("eng_writing_done", [...engWritingCompleted]);
        recordPractice();

        if (score === 100) {
            engWritingPerfect++;
            LS.set("eng_writing_perfect", engWritingPerfect);
            if (engWritingPerfect >= 10) checkAchievement("dictation_pro");
            playSound("correct");
        }
    }

    // ================================================================
    //  SPEAKING PRACTICE
    // ================================================================

    function initSpeaking() {
        show($("#engSpeaking"));
        engSpeakingItems = [...englishData.speaking];
        engSpeakingIndex = LS.get("eng_speaking_index", 0);
        if (engSpeakingIndex >= engSpeakingItems.length) engSpeakingIndex = 0;
        renderSpeakingPrompt();

        replaceClickHandler("speakingMic", startSpeakingRecognition);
        replaceClickHandler("speakingPrev", () => { engSpeakingIndex = Math.max(0, engSpeakingIndex - 1); LS.set("eng_speaking_index", engSpeakingIndex); renderSpeakingPrompt(); });
        replaceClickHandler("speakingNext", () => { engSpeakingIndex = Math.min(engSpeakingItems.length - 1, engSpeakingIndex + 1); LS.set("eng_speaking_index", engSpeakingIndex); renderSpeakingPrompt(); });
        replaceClickHandler("speakingShuffle", () => {
            shuffleArray(engSpeakingItems);
            engSpeakingIndex = 0;
            renderSpeakingPrompt();
        });

        // Save & Continue button for speaking
        const speakingSection = $("#engSpeaking");
        if (speakingSection && !speakingSection.querySelector(".save-continue-btn")) {
            speakingSection.appendChild(createSaveContinueBtn());
        }
    }

    function renderSpeakingPrompt() {
        const p = engSpeakingItems[engSpeakingIndex];
        $("#speakingPrompt").textContent = p.prompt;
        $("#speakingProgress").textContent = `${engSpeakingIndex + 1} / ${engSpeakingItems.length}`;
        hide($("#speakingSample"));
        hide($("#speakingTranscript"));
        hide($("#speakingFeedback"));
        hide($("#speakingMicStatus"));
        $("#speakingMic").classList.remove("recording");
    }

    function startSpeakingRecognition() {
        const mic = $("#speakingMic");
        if (isRecording) {
            stopRecognition();
            mic.classList.remove("recording");
            hide($("#speakingMicStatus"));
            return;
        }

        mic.classList.add("recording");
        show($("#speakingMicStatus"));

        startRecognition((transcript) => {
            mic.classList.remove("recording");
            hide($("#speakingMicStatus"));

            const p = engSpeakingItems[engSpeakingIndex];

            // Show sample
            show($("#speakingSample"));
            $("#speakingSampleText").textContent = p.sampleAnswer;

            if (!transcript) {
                show($("#speakingFeedback"));
                $("#speakingFeedback").textContent = "No speech detected. Try again.";
                $("#speakingFeedback").style.color = "var(--error)";
                $("#speakingFeedback").style.background = "var(--error-bg)";
                return;
            }

            // Show transcript
            show($("#speakingTranscript"));
            $("#speakingTranscriptText").textContent = transcript;

            // Simple scoring: check word count and if it contains relevant words
            const words = normalizeText(transcript);
            const wordCount = words.length;
            let feedback = "";
            let feedbackColor = "";
            let feedbackBg = "";

            if (wordCount >= 3) {
                feedback = "Good response! You spoke a complete answer.";
                feedbackColor = "var(--success)";
                feedbackBg = "var(--success-bg)";
                playSound("correct");
            } else if (wordCount >= 1) {
                feedback = "Try to answer in a full sentence for better practice.";
                feedbackColor = "var(--warning)";
                feedbackBg = "var(--warning-bg)";
            } else {
                feedback = "Try again with a more complete answer.";
                feedbackColor = "var(--error)";
                feedbackBg = "var(--error-bg)";
            }

            show($("#speakingFeedback"));
            $("#speakingFeedback").textContent = feedback;
            $("#speakingFeedback").style.color = feedbackColor;
            $("#speakingFeedback").style.background = feedbackBg;

            // Track
            engSpeakingCompleted.add(p.id);
            LS.set("eng_speaking_done", [...engSpeakingCompleted]);
            recordPractice();
        });
    }

    // ================================================================
    //  MOCK TEST
    // ================================================================

    function initMock() {
        show($("#engMock"));
        mockPhase = null;
        mockStep = 0;
        mockScores = { reading: [], writing: [], speaking: 0 };

        // Pick 3 random reading, 3 writing
        const rShuffled = [...englishData.reading].sort(() => Math.random() - 0.5);
        mockReadingSentences = rShuffled.slice(0, 3);
        const wShuffled = [...englishData.writing].sort(() => Math.random() - 0.5);
        mockWritingSentences = wShuffled.slice(0, 3);

        hide($("#mockResults"));
        renderMockStart();
    }

    function renderMockStart() {
        const content = $("#mockContent");
        content.innerHTML = `
            <div style="text-align:center; padding:20px">
                <div style="font-size:2rem; margin-bottom:16px">\u{1F3C6}</div>
                <h3 style="margin-bottom:8px">Full English Mock Test</h3>
                <p style="color:var(--text-secondary); margin-bottom:20px">This simulates the real USCIS English test:<br>3 Reading sentences + 3 Writing sentences + Speaking section</p>
                <button class="primary-btn" id="mockStartBtn">Begin Mock Test</button>
            </div>
        `;
        $("#mockProgress").textContent = "";
        $("#mockTimer").textContent = "";
        hide($("#mockActions").querySelector && $("#mockActions"));
        $("#mockActions").innerHTML = "";

        replaceClickHandler("mockStartBtn", () => {
            mockPhase = "reading";
            mockStep = 0;
            renderMockReading();
        });
    }

    function clearMockTimer() {
        if (mockTimerInterval) { clearInterval(mockTimerInterval); mockTimerInterval = null; }
    }

    function startMockCountdown(seconds, onDone) {
        clearMockTimer();
        mockTimeLeft = seconds;
        renderMockTimerDisplay();
        mockTimerInterval = setInterval(() => {
            mockTimeLeft--;
            renderMockTimerDisplay();
            if (mockTimeLeft <= 0) {
                clearMockTimer();
                if (onDone) onDone();
            }
        }, 1000);
    }

    function renderMockTimerDisplay() {
        const m = Math.floor(mockTimeLeft / 60);
        const s = mockTimeLeft % 60;
        $("#mockTimer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    }

    // ---- Mock Reading ----
    function renderMockReading() {
        const sentence = mockReadingSentences[mockStep];
        $("#mockProgress").textContent = `Reading ${mockStep + 1} / 3`;

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Reading Section</div>
            <div class="mock-instruction">Read the following sentence aloud:</div>
            <div class="eng-sentence" style="margin-bottom:0">${sentence.sentence}</div>
            <div class="eng-result" id="mockReadingResult" style="display:none;margin-top:16px"></div>
            <div class="eng-score-bar" id="mockReadingScore" style="display:none;margin-top:8px"></div>
        `;

        const actions = $("#mockActions");
        actions.innerHTML = `
            <button class="fab-btn" id="mockReadingMic" aria-label="Read aloud">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
        `;

        startMockCountdown(30, () => advanceMockReading(0));

        replaceClickHandler("mockReadingMic", () => {
            const mic = $("#mockReadingMic");
            if (isRecording) { stopRecognition(); mic.classList.remove("recording"); return; }
            mic.classList.add("recording");

            startRecognition((transcript) => {
                mic.classList.remove("recording");
                const { result, score } = compareTexts(sentence.sentence, transcript || "");
                renderComparison(result, "mockReadingResult");
                renderScoreBar(score, "mockReadingScore");
                mockScores.reading.push(score);
                clearMockTimer();
                setTimeout(() => advanceMockReading(), 1500);
            });
        });
    }

    function advanceMockReading(score) {
        if (score !== undefined) mockScores.reading.push(score);
        mockStep++;
        if (mockStep < 3) {
            renderMockReading();
        } else {
            mockPhase = "writing";
            mockStep = 0;
            renderMockWriting();
        }
    }

    // ---- Mock Writing ----
    function renderMockWriting() {
        const sentence = mockWritingSentences[mockStep];
        $("#mockProgress").textContent = `Writing ${mockStep + 1} / 3`;

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Writing Section (Dictation)</div>
            <div class="mock-instruction">Listen to the sentence, then type what you heard:</div>
            <div class="eng-writing-prompt" style="margin-bottom:16px">
                <button class="action-btn action-btn--secondary" id="mockWritingPlay">Play Sentence</button>
            </div>
            <div class="eng-writing-input-row">
                <input type="text" class="eng-input" id="mockWritingInput" placeholder="Type what you hear..." autocomplete="off" spellcheck="false">
                <button class="primary-btn" id="mockWritingCheck">Check</button>
            </div>
            <div class="eng-result" id="mockWritingResult" style="display:none"></div>
            <div class="eng-score-bar" id="mockWritingScore" style="display:none"></div>
        `;
        $("#mockActions").innerHTML = "";

        startMockCountdown(45, () => submitMockWriting());

        replaceClickHandler("mockWritingPlay", () => speak(sentence.sentence, 0.85));
        replaceClickHandler("mockWritingCheck", () => submitMockWriting());
        const input = $("#mockWritingInput");
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitMockWriting(); });

        // Auto-play the sentence
        setTimeout(() => speak(sentence.sentence, 0.85), 500);
    }

    function submitMockWriting() {
        clearMockTimer();
        const sentence = mockWritingSentences[mockStep];
        const userText = ($("#mockWritingInput") ? $("#mockWritingInput").value : "").trim();
        const { result, score } = compareTexts(sentence.sentence, userText);
        renderComparison(result, "mockWritingResult");
        renderScoreBar(score, "mockWritingScore");
        mockScores.writing.push(score);

        setTimeout(() => advanceMockWriting(), 1500);
    }

    function advanceMockWriting() {
        mockStep++;
        if (mockStep < 3) {
            renderMockWriting();
        } else {
            mockPhase = "speaking";
            mockStep = 0;
            renderMockSpeaking();
        }
    }

    // ---- Mock Speaking ----
    function renderMockSpeaking() {
        // Just one speaking prompt for the mock
        const prompt = englishData.speaking[Math.floor(Math.random() * englishData.speaking.length)];
        $("#mockProgress").textContent = "Speaking";

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-section-label">Speaking Section</div>
            <div class="mock-instruction">Answer the following question:</div>
            <div class="eng-speaking-prompt">${prompt.prompt}</div>
            <div id="mockSpeakingTranscript" style="display:none;text-align:center;padding:12px;background:var(--primary-lighter);border-radius:8px;margin-top:12px"></div>
        `;

        const actions = $("#mockActions");
        actions.innerHTML = `
            <button class="fab-btn" id="mockSpeakingMic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
        `;

        startMockCountdown(30, () => finishMockSpeaking(0));

        replaceClickHandler("mockSpeakingMic", () => {
            const mic = $("#mockSpeakingMic");
            if (isRecording) { stopRecognition(); mic.classList.remove("recording"); return; }
            mic.classList.add("recording");

            startRecognition((transcript) => {
                mic.classList.remove("recording");
                clearMockTimer();

                if (transcript) {
                    show($("#mockSpeakingTranscript"));
                    $("#mockSpeakingTranscript").innerHTML = `<strong>You said:</strong> ${transcript}`;
                    const words = normalizeText(transcript);
                    const score = words.length >= 3 ? 100 : words.length >= 1 ? 50 : 0;
                    finishMockSpeaking(score);
                } else {
                    finishMockSpeaking(0);
                }
            });
        });
    }

    function finishMockSpeaking(score) {
        clearMockTimer();
        mockScores.speaking = score;
        setTimeout(renderMockResults, 1500);
    }

    // ---- Mock Results ----
    function renderMockResults() {
        mockPhase = "results";
        $("#mockProgress").textContent = "Results";
        $("#mockTimer").textContent = "";
        $("#mockActions").innerHTML = "";

        const readingAvg = mockScores.reading.length
            ? Math.round(mockScores.reading.reduce((a, b) => a + b, 0) / mockScores.reading.length)
            : 0;
        const writingAvg = mockScores.writing.length
            ? Math.round(mockScores.writing.reduce((a, b) => a + b, 0) / mockScores.writing.length)
            : 0;
        const speakingScore = mockScores.speaking;
        const overall = Math.round((readingAvg + writingAvg + speakingScore) / 3);
        const passed = overall >= 60;

        if (passed) fireConfetti();

        const content = $("#mockContent");
        content.innerHTML = `
            <div class="mock-results-card">
                <div style="font-size:3rem; margin-bottom:12px">${passed ? "\u{2705}" : "\u{274C}"}</div>
                <div style="font-size:2.5rem; font-weight:800; color:${passed ? "var(--success)" : "var(--error)"}; margin-bottom:8px">${overall}%</div>
                <div style="font-size:1.1rem; font-weight:700; color:${passed ? "var(--success)" : "var(--error)"}; margin-bottom:20px">${passed ? "PASSED!" : "Keep Practicing"}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px">
                    <div class="stat-card"><div class="stat-card-number">${readingAvg}%</div><div class="stat-card-label">Reading</div></div>
                    <div class="stat-card"><div class="stat-card-number">${writingAvg}%</div><div class="stat-card-label">Writing</div></div>
                    <div class="stat-card"><div class="stat-card-number">${speakingScore}%</div><div class="stat-card-label">Speaking</div></div>
                </div>
                <button class="primary-btn" id="mockRetake">Take Another Mock Test</button>
            </div>
        `;

        replaceClickHandler("mockRetake", initMock);
        recordPractice();
    }

    // ================================================================
    //  KEYBOARD SHORTCUTS
    // ================================================================

    function handleKeyboard(e) {
        // Ignore if in input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
        // Ignore if modal open
        if ($("#settingsModal").style.display !== "none" || $("#shortcutsModal").style.display !== "none") return;

        if (currentScreen === "studyApp" && currentMode === "flashcards") {
            switch (e.key) {
                case " ":
                    e.preventDefault();
                    flipCard();
                    break;
                case "ArrowLeft":
                    fcNav(-1);
                    break;
                case "ArrowRight":
                    fcNav(1);
                    break;
                case "r": case "R":
                    readFlashcardAloud();
                    break;
                case "s": case "S":
                    shuffleFlashcards();
                    break;
                case "1":
                    if (fcFlipped) assessCard(true);
                    break;
                case "2":
                    if (fcFlipped) assessCard(false);
                    break;
            }
        }

    }

    // ================================================================
    //  UTILITIES
    // ================================================================

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function replaceClickHandler(id, handler) {
        const el = typeof id === "string" ? $(`#${id}`) : id;
        if (!el) return;
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        clone.addEventListener("click", handler);
    }

    // ================================================================
    //  SAVE & CONTINUE LATER
    // ================================================================

    const SAVE_BTN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';

    function showSaveToast() {
        const el = $("#saveIndicator");
        if (!el) return;
        const span = el.querySelector("span");
        if (span) span.textContent = t("progress_saved_toast");
        el.classList.add("visible");
        clearTimeout(saveFlashTimeout);
        saveFlashTimeout = setTimeout(() => { el.classList.remove("visible"); if (span) span.textContent = t("saved"); }, 2500);
    }

    function saveAndGoHome() {
        showSaveToast();
        setTimeout(() => goHome(), 400);
    }

    function createSaveContinueBtn() {
        const btn = document.createElement("button");
        btn.className = "save-continue-btn";
        btn.innerHTML = SAVE_BTN_SVG + ' <span>' + t("save_continue_later") + '</span>';
        btn.addEventListener("click", (e) => { e.stopPropagation(); saveAndGoHome(); });
        return btn;
    }

    // ================================================================
    //  N-400 ELIGIBILITY CHECK
    // ================================================================

    let eligStep = 0;
    let eligResults = [];   // {label, color, text}
    let eligTrack = 5;      // 3 or 5 year track
    let eligIsMale = false;

    const ELIG_LABELS = [
        "Age", "Green Card Status", "Basis for Filing", "Physical Presence",
        "Long Trips", "State Residence", "Selective Service", "Taxes",
        "Criminal History", "English & Civics", "Oath of Allegiance"
    ];

    function eligStartOver() {
        eligStep = 0;
        eligResults = [];
        eligTrack = 5;
        eligIsMale = false;
        LS.set("elig_inprogress", null);
        eligRenderStep();
    }

    function eligRenderStep() {
        const total = 11;
        const fill = $("#eligProgressFill");
        const label = $("#eligStepLabel");
        const content = $("#eligContent");
        if (!fill || !content) return;

        if (eligStep < total) {
            fill.style.width = ((eligStep / total) * 100) + "%";
            label.textContent = "Step " + (eligStep + 1) + " of " + total;
        } else {
            fill.style.width = "100%";
            label.textContent = "Results";
        }

        switch (eligStep) {
            case 0: return eligRenderQ("Are you at least 18 years old?", [
                { text: "Yes", color: "green", msg: "You meet the age requirement." },
                { text: "No", color: "red", msg: "You must be at least 18 to apply for naturalization." }
            ]);
            case 1: return eligRenderQ("Are you a Lawful Permanent Resident (green card holder)?", [
                { text: "Yes", color: "green", msg: "You have the required immigration status." },
                { text: "No", color: "red", msg: "You must have a green card before applying for citizenship." }
            ]);
            case 2: return eligRenderQ("Which best describes your situation?", [
                { text: "I've been a permanent resident for 5+ years", color: "green", msg: "You meet the continuous residence requirement for the 5-year track.", fn() { eligTrack = 5; } },
                { text: "I've been a permanent resident for 3+ years AND married to a US citizen", color: "green", msg: "You meet the continuous residence requirement for the 3-year track.", fn() { eligTrack = 3; } },
                { text: "I've been a permanent resident for less than 3 years", color: "red", msg: "You may need to wait longer before applying." },
                { text: "I'm not sure", color: "yellow", msg: "Check your green card for the date you became a permanent resident." }
            ]);
            case 3: {
                const q = eligTrack === 3
                    ? "Have you been physically present in the United States for at least 18 months out of the last 3 years?"
                    : "Have you been physically present in the United States for at least 30 months (2.5 years) out of the last 5 years?";
                return eligRenderQ(q, [
                    { text: "Yes", color: "green", msg: "You meet the physical presence requirement." },
                    { text: "Not sure", color: "yellow", msg: "Add up all your time outside the US. Every day abroad counts against you." },
                    { text: "No", color: "red", msg: "You may need to wait until you meet the physical presence requirement." }
                ]);
            }
            case 4: return eligRenderQ("Have you taken any single trip outside the United States lasting 6 months or longer?", [
                { text: "No", color: "green", msg: "Your continuous residence is intact." },
                { text: "Yes, between 6\u201312 months", color: "yellow", msg: "Trips of 6\u201312 months may disrupt your continuous residence. You may need to show you maintained ties to the US. Consider consulting an attorney." },
                { text: "Yes, 1 year or longer", color: "red", msg: "A trip of 1+ year generally breaks continuous residence. You may need to restart the waiting period. Consult an immigration attorney." }
            ]);
            case 5: return eligRenderQ("Have you lived in the state where you plan to file for at least 3 months?", [
                { text: "Yes", color: "green", msg: "You meet the state residence requirement." },
                { text: "No", color: "yellow", msg: "You\u2019ll need to wait or file in your previous state." }
            ]);
            case 6: return eligRenderSelectiveService();
            case 7: return eligRenderQ("Have you filed all required federal, state, and local tax returns since becoming a permanent resident?", [
                { text: "Yes", color: "green", msg: "Good. Keep copies of your tax transcripts for the interview." },
                { text: "No, but I can file them before my interview", color: "yellow", msg: "File any missing returns as soon as possible. USCIS may ask for tax transcripts." },
                { text: "No, and I\u2019m not sure I can", color: "red", msg: "Failure to file required tax returns may be a bar to good moral character. Consider consulting a tax professional and an immigration attorney." }
            ]);
            case 8: return eligRenderQ('Have you EVER been arrested, cited, charged, or convicted of a crime or offense (including traffic offenses like DUI)?', [
                { text: "No, never", color: "green", msg: "No criminal history concerns." },
                { text: "Yes, only minor traffic tickets (no DUI, no criminal charges)", color: "yellow", msg: "You must disclose everything on your application, but minor traffic tickets are usually not a problem." },
                { text: "Yes, I have been arrested or convicted of a crime", color: "red", msg: 'Criminal history requires careful analysis. Some offenses may be a bar to citizenship. Strongly recommend consulting an immigration attorney before applying.<br><br><strong>Important:</strong> You must disclose ALL arrests and charges, even if dismissed, expunged, or sealed.' }
            ]);
            case 9: return eligRenderQ("Are you comfortable with basic English reading, writing, and speaking?", [
                { text: "Yes", color: "green", msg: "Practice using the Civics Test and English Test sections on this site!" },
                { text: "I\u2019m studying", color: "green", msg: "Keep practicing! Use the study tools on this site." },
                { text: "I may qualify for an exemption (age/disability)", color: "green", msg: 'You may qualify for an exemption. <a href="https://www.uscis.gov/citizenship/exceptions-and-accommodations" target="_blank" rel="noopener">Check USCIS.gov for details</a>.' },
                { text: "I\u2019m not sure", color: "yellow", msg: "You\u2019ll need to be able to read, write, and speak basic English. Start practicing now!" }
            ]);
            case 10: return eligRenderQ("Are you willing to take the Oath of Allegiance to the United States?", [
                { text: "Yes", color: "green", msg: "Great. The Oath is the final step of the naturalization ceremony." },
                { text: "Yes, but with religious/conscientious objector modification", color: "green", msg: "Modifications are available for religious beliefs. You can be excused from the \u201Cbear arms\u201D portion." },
                { text: "No or not sure", color: "yellow", msg: "You must be willing to swear loyalty to the United States to become a citizen." }
            ]);
            default: return eligRenderSummary();
        }
    }

    function eligRenderQ(question, options) {
        const content = $("#eligContent");
        let html = '<div class="elig-step"><div class="glass-card" style="padding:32px;">';
        html += '<div class="elig-question">' + question + '</div>';
        html += '<div class="elig-options" id="eligOptions">';
        options.forEach((opt, i) => {
            html += '<button class="elig-option" data-idx="' + i + '">' + opt.text + '</button>';
        });
        html += '</div>';
        html += '<div id="eligResultArea"></div>';
        html += '<div class="elig-save-area" style="text-align:center;margin-top:16px;"></div>';
        html += '</div></div>';
        content.innerHTML = html;

        // Add save & continue button
        const eligSaveArea = content.querySelector(".elig-save-area");
        if (eligSaveArea) eligSaveArea.appendChild(createSaveContinueBtn());

        content.querySelectorAll(".elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx);
                const opt = options[idx];
                // Disable all options
                content.querySelectorAll(".elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                btn.style.borderColor = opt.color === "green" ? "var(--success)" : opt.color === "yellow" ? "var(--warning)" : "var(--error)";
                if (opt.fn) opt.fn();
                // Show result + next
                const area = $("#eligResultArea");
                area.innerHTML = '<div class="elig-result elig-result--' + opt.color + '">' + opt.msg + '</div>'
                    + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                // Store result and save immediately
                eligResults[eligStep] = { label: ELIG_LABELS[eligStep], color: opt.color, text: opt.msg };
                LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale });
                $("#eligNextBtn").addEventListener("click", () => {
                    eligStep++;
                    LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale });
                    eligRenderStep();
                });
                area.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
        });
    }

    // Selective Service — multi-part conditional
    function eligRenderSelectiveService() {
        const content = $("#eligContent");
        let html = '<div class="elig-step"><div class="glass-card" style="padding:32px;">';
        html += '<div class="elig-question">Are you male?</div>';
        html += '<div class="elig-options" id="eligOptions">';
        html += '<button class="elig-option" data-choice="no">No</button>';
        html += '<button class="elig-option" data-choice="yes">Yes</button>';
        html += '</div>';
        html += '<div id="eligResultArea"></div>';
        html += '</div></div>';
        content.innerHTML = html;

        content.querySelectorAll(".elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                content.querySelectorAll(".elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                if (btn.dataset.choice === "no") {
                    eligIsMale = false;
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Selective Service registration is not required." };
                    const area = $("#eligResultArea");
                    area.innerHTML = '<div class="elig-result elig-result--green">Selective Service registration is not required for you.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                    $("#eligNextBtn").addEventListener("click", () => { eligStep++; LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale }); eligRenderStep(); });
                } else {
                    eligIsMale = true;
                    eligSSPart2();
                }
            });
        });
    }

    function eligSSPart2() {
        const area = $("#eligResultArea");
        area.innerHTML = '<div class="elig-question" style="margin-top:20px;">Are you between 18 and 26 years old, OR were you ever in the US between ages 18\u201326?</div>'
            + '<div class="elig-options" id="eligSSOptions2">'
            + '<button class="elig-option" data-choice="no">No (I was never in the US during ages 18\u201326)</button>'
            + '<button class="elig-option" data-choice="current">Yes, I\u2019m currently between 18 and 26</button>'
            + '<button class="elig-option" data-choice="past">Yes, but I\u2019m over 26 now</button>'
            + '</div><div id="eligSSArea2"></div>';

        area.querySelectorAll("#eligSSOptions2 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                area.querySelectorAll("#eligSSOptions2 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area2 = $("#eligSSArea2");
                if (btn.dataset.choice === "no") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Not applicable \u2014 you were not in the US during the required age range." };
                    area2.innerHTML = '<div class="elig-result elig-result--green">Selective Service registration does not apply in your case.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                    $("#eligNextBtn").addEventListener("click", () => { eligStep++; LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale }); eligRenderStep(); });
                } else if (btn.dataset.choice === "current") {
                    eligSSPart3Current(area2);
                } else {
                    eligSSPart3Past(area2);
                }
            });
        });
    }

    function eligSSPart3Current(container) {
        container.innerHTML = '<div class="elig-question" style="margin-top:20px;">Have you registered for the Selective Service?</div>'
            + '<div class="elig-options" id="eligSSOptions3">'
            + '<button class="elig-option" data-choice="yes">Yes</button>'
            + '<button class="elig-option" data-choice="no">No</button>'
            + '</div><div id="eligSSArea3"></div>';

        container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area3 = $("#eligSSArea3");
                if (btn.dataset.choice === "yes") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Registered for Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--green">You\u2019re registered. No issues here.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                } else {
                    eligResults[6] = { label: "Selective Service", color: "yellow", text: "Should register at sss.gov before applying." };
                    area3.innerHTML = '<div class="elig-result elig-result--yellow">You should register now before applying. <a href="https://www.sss.gov" target="_blank" rel="noopener">Register at sss.gov</a></div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                }
                $("#eligNextBtn").addEventListener("click", () => { eligStep++; LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale }); eligRenderStep(); });
            });
        });
    }

    function eligSSPart3Past(container) {
        container.innerHTML = '<div class="elig-question" style="margin-top:20px;">Did you register for the Selective Service when you were between 18\u201326?</div>'
            + '<div class="elig-options" id="eligSSOptions3">'
            + '<button class="elig-option" data-choice="yes">Yes</button>'
            + '<button class="elig-option" data-choice="no">No</button>'
            + '</div><div id="eligSSArea3"></div>';

        container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(btn => {
            btn.addEventListener("click", () => {
                container.querySelectorAll("#eligSSOptions3 .elig-option").forEach(b => { b.disabled = true; b.style.opacity = "0.5"; });
                btn.style.opacity = "1";
                const area3 = $("#eligSSArea3");
                if (btn.dataset.choice === "yes") {
                    eligResults[6] = { label: "Selective Service", color: "green", text: "Registered for Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--green">You\u2019re registered. No issues here.</div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                } else {
                    eligResults[6] = { label: "Selective Service", color: "yellow", text: "May need a Status Information Letter from Selective Service." };
                    area3.innerHTML = '<div class="elig-result elig-result--yellow">You may need to request a Status Information Letter. This can affect your application. <a href="https://www.sss.gov/verify/sil/" target="_blank" rel="noopener">Request a Status Information Letter</a></div>'
                        + '<button class="elig-next-btn" id="eligNextBtn">Next \u2192</button>';
                }
                $("#eligNextBtn").addEventListener("click", () => { eligStep++; LS.set("elig_inprogress", { step: eligStep, results: eligResults, track: eligTrack, isMale: eligIsMale }); eligRenderStep(); });
            });
        });
    }

    function eligRenderSummary() {
        const content = $("#eligContent");
        let greens = 0, yellows = 0, reds = 0;
        eligResults.forEach(r => {
            if (r.color === "green") greens++;
            else if (r.color === "yellow") yellows++;
            else reds++;
        });

        let verdictClass, verdictMsg;
        if (reds > 0) {
            verdictClass = "red";
            verdictMsg = "One or more areas may prevent you from applying at this time. Review the red items below and consider consulting an immigration attorney.";
        } else if (yellows > 0) {
            verdictClass = "yellow";
            verdictMsg = "You may be eligible, but some areas need attention. Review the yellow items below.";
        } else {
            verdictClass = "green";
            verdictMsg = "You appear to meet the basic eligibility requirements! Consider filing Form N-400.";
        }

        let html = '<div class="elig-summary">';
        html += '<div class="elig-summary-header"><h2>Your Results</h2></div>';

        html += '<div class="elig-counts">';
        html += '<span class="elig-count-badge elig-count-badge--green">' + greens + ' Good</span>';
        if (yellows > 0) html += '<span class="elig-count-badge elig-count-badge--yellow">' + yellows + ' Attention</span>';
        if (reds > 0) html += '<span class="elig-count-badge elig-count-badge--red">' + reds + ' Concern</span>';
        html += '</div>';

        html += '<div class="elig-verdict elig-verdict--' + verdictClass + '">' + verdictMsg + '</div>';

        html += '<div class="elig-results-grid">';
        eligResults.forEach(r => {
            html += '<div class="elig-result-row">'
                + '<span class="elig-result-dot elig-result-dot--' + r.color + '"></span>'
                + '<span class="elig-result-label">' + r.label + '</span>'
                + '</div>';
        });
        html += '</div>';

        html += '<div class="elig-disclaimer">'
            + '<strong>Disclaimer:</strong> This is an informational tool only and is not legal advice. '
            + 'Eligibility for naturalization depends on many factors. Consult an immigration attorney for personalized guidance.'
            + '</div>';

        html += '<div class="elig-links">';
        html += '<a href="https://www.uscis.gov/n-400" target="_blank" rel="noopener">\u{1F4CB} Form N-400 on USCIS.gov</a>';
        html += '<a href="https://www.uscis.gov/citizenship/find-study-materials-and-resources" target="_blank" rel="noopener">\u{1F4DA} USCIS Study Materials</a>';
        html += '<a href="https://www.uscis.gov/citizenship/exceptions-and-accommodations" target="_blank" rel="noopener">\u267F Exceptions &amp; Accommodations</a>';
        html += '</div>';

        html += '<button class="elig-start-over" id="eligStartOverBtn">Start Over</button>';
        html += '</div>';

        content.innerHTML = html;

        // Save eligibility results to localStorage
        LS.set("eligibility_results", eligResults);

        // Confetti if all green
        if (reds === 0 && yellows === 0) {
            fireConfetti();
        }

        $("#eligStartOverBtn").addEventListener("click", eligStartOver);
    }

    // ================================================================
    //  COLLAPSIBLE SECTIONS
    // ================================================================
    function initCollapsibleSections() {
        document.querySelectorAll(".collapsible-header").forEach(header => {
            if (header.dataset.collapsibleBound) return;
            header.dataset.collapsibleBound = "1";
            header.addEventListener("click", () => {
                const section = header.parentElement;
                const isOpen = section.classList.contains("open");
                section.classList.toggle("open", !isOpen);
                header.setAttribute("aria-expanded", !isOpen);
            });
        });
    }

    // ================================================================
    //  SHARE WITH A FRIEND
    // ================================================================
    const SHARE_LINK = "https://jeffreypc1.github.io/citizenship-test-prep/";

    const SHARE_MESSAGES = {
        en: "Hi! {name} thought you might find this helpful — a free tool to prepare for the U.S. citizenship test. It includes civics practice, English reading & writing, and an eligibility checker. Try it here: {link}",
        es: "\u00a1Hola! Encontr\u00e9 una herramienta gratuita para prepararte para el examen de ciudadan\u00eda de EE.UU. Incluye pruebas de pr\u00e1ctica de c\u00edvica, lectura y escritura en ingl\u00e9s, y un verificador de elegibilidad. Pru\u00e9bala aqu\u00ed: {link}",
        zh: "\u4f60\u597d\uff01\u6211\u627e\u5230\u4e86\u4e00\u4e2a\u514d\u8d39\u5de5\u5177\uff0c\u53ef\u4ee5\u5e2e\u52a9\u4f60\u51c6\u5907\u7f8e\u56fd\u5165\u7c4d\u8003\u8bd5\u3002\u5b83\u5305\u62ec\u516c\u6c11\u5e38\u8bc6\u3001\u82f1\u8bed\u9605\u8bfb\u548c\u5199\u4f5c\u7ec3\u4e60\uff0c\u4ee5\u53ca\u8d44\u683c\u68c0\u67e5\u5de5\u5177\u3002\u8bd5\u8bd5\u770b\uff1a{link}",
        vi: "Xin ch\u00e0o! M\u00ecnh t\u00ecm \u0111\u01b0\u1ee3c m\u1ed9t c\u00f4ng c\u1ee5 mi\u1ec5n ph\u00ed gi\u00fap b\u1ea1n chu\u1ea9n b\u1ecb cho b\u00e0i thi qu\u1ed1c t\u1ecbch M\u1ef9. C\u00f3 b\u00e0i t\u1eadp v\u1ec1 gi\u00e1o d\u1ee5c c\u00f4ng d\u00e2n, \u0111\u1ecdc-vi\u1ebft ti\u1ebfng Anh v\u00e0 ki\u1ec3m tra \u0111i\u1ec1u ki\u1ec7n. Th\u1eed xem nh\u00e9: {link}",
        ko: "\uc548\ub155\ud558\uc138\uc694! \ubbf8\uad6d \uc2dc\ubbfc\uad8c \uc2dc\ud5d8 \uc900\ube44\ub97c \ub3c4\uc640\uc8fc\ub294 \ubb34\ub8cc \ub3c4\uad6c\ub97c \ucc3e\uc558\uc5b4\uc694. \uc2dc\ubbfc \uc0c1\uc2dd, \uc601\uc5b4 \uc77d\uae30\u00b7\uc4f0\uae30 \uc5f0\uc2b5, \uc790\uaca9 \ud655\uc778 \uae30\ub2a5\uc774 \ud3ec\ud568\ub418\uc5b4 \uc788\uc5b4\uc694. \uc5ec\uae30\uc11c \ud655\uc778\ud574 \ubcf4\uc138\uc694: {link}",
        tl: "Kumusta! Nakahanap ako ng libreng tool para makatulong sa paghahanda mo sa U.S. citizenship test. May kasama itong practice tests sa civics, English reading at writing, at eligibility checker. Subukan mo dito: {link}",
        ar: "\u0645\u0631\u062d\u0628\u0627\u064b! \u0648\u062c\u062f\u062a \u0623\u062f\u0627\u0629 \u0645\u062c\u0627\u0646\u064a\u0629 \u0644\u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0641\u064a \u0627\u0644\u062a\u062d\u0636\u064a\u0631 \u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u062c\u0646\u0633\u064a\u0629 \u0627\u0644\u0623\u0645\u0631\u064a\u0643\u064a\u0629. \u062a\u0634\u0645\u0644 \u0627\u062e\u062a\u0628\u0627\u0631\u0627\u062a \u062a\u062f\u0631\u064a\u0628\u064a\u0629 \u0641\u064a \u0627\u0644\u062a\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062f\u0646\u064a\u0629 \u0648\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629\u060c \u0648\u0641\u062d\u0635 \u0627\u0644\u0623\u0647\u0644\u064a\u0629. \u062c\u0631\u0628\u0647\u0627 \u0647\u0646\u0627: {link}",
        fr: "Salut ! J\u2019ai trouv\u00e9 un outil gratuit pour t\u2019aider \u00e0 pr\u00e9parer l\u2019examen de citoyennet\u00e9 am\u00e9ricaine. Il comprend des tests pratiques de civisme, de lecture et d\u2019\u00e9criture en anglais, et un v\u00e9rificateur d\u2019\u00e9ligibilit\u00e9. Essaie-le ici : {link}",
        pt: "Oi! Encontrei uma ferramenta gratuita para te ajudar a se preparar para o teste de cidadania dos EUA. Inclui testes pr\u00e1ticos de civismo, leitura e escrita em ingl\u00eas, e um verificador de elegibilidade. Experimente aqui: {link}",
        ru: "\u041f\u0440\u0438\u0432\u0435\u0442! \u042f \u043d\u0430\u0448\u0451\u043b \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u043b\u044f \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0438 \u043a \u044d\u043a\u0437\u0430\u043c\u0435\u043d\u0443 \u043d\u0430 \u0433\u0440\u0430\u0436\u0434\u0430\u043d\u0441\u0442\u0432\u043e \u0421\u0428\u0410. \u0412\u043a\u043b\u044e\u0447\u0430\u0435\u0442 \u0442\u0435\u0441\u0442\u044b \u043f\u043e \u0433\u0440\u0430\u0436\u0434\u0430\u043d\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u044e, \u0447\u0442\u0435\u043d\u0438\u044e \u0438 \u043f\u0438\u0441\u044c\u043c\u0443 \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c, \u0430 \u0442\u0430\u043a\u0436\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443 \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044f \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f\u043c. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0437\u0434\u0435\u0441\u044c: {link}",
    };

    function getShareLink(langCode) {
        return SHARE_LINK + "?lang=" + langCode;
    }

    function getShareMessage(langCode, senderName) {
        const msg = SHARE_MESSAGES[langCode] || SHARE_MESSAGES.en;
        const name = (senderName || "").trim() || "A friend";
        return msg.replace("{name}", name).replace("{link}", getShareLink(langCode));
    }

    function showShareToast(message, type) {
        const toast = $("#shareToast");
        if (!toast) return;
        toast.textContent = message;
        toast.className = "share-toast " + type + " visible";
        setTimeout(() => { toast.classList.remove("visible"); }, 3500);
    }

    function initShare() {
        const toggleBtn = $("#shareToggleBtn");
        const card = $("#shareCard");
        const tabSms = $("#shareTabSms");
        const tabEmail = $("#shareTabEmail");
        const smsForm = $("#shareSmsForm");
        const emailForm = $("#shareEmailForm");
        const smsLang = $("#shareSmsLang");
        const emailLang = $("#shareEmailLang");
        const smsPreview = $("#shareSmsPreview");
        const emailPreview = $("#shareEmailPreview");
        const sendSmsBtn = $("#shareSendSms");
        const sendEmailBtn = $("#shareSendEmail");
        const emailNote = $("#shareEmailNote");

        if (!toggleBtn || !card) return;

        // Populate language selects
        [smsLang, emailLang].forEach(sel => {
            sel.innerHTML = "";
            LANGUAGES.forEach(l => {
                const opt = document.createElement("option");
                opt.value = l.code;
                opt.textContent = l.flag + " " + l.name;
                if (l.code === currentLang) opt.selected = true;
                sel.appendChild(opt);
            });
        });

        const smsNameInput = $("#shareSmsName");
        const emailNameInput = $("#shareEmailName");

        function updatePreviews() {
            const smsName = smsNameInput ? smsNameInput.value.trim() : "";
            const emailName = emailNameInput ? emailNameInput.value.trim() : "";
            if (smsPreview) smsPreview.textContent = getShareMessage(smsLang.value, smsName);
            if (emailPreview) emailPreview.textContent = getShareMessage(emailLang.value, emailName);
        }
        updatePreviews();

        smsLang.addEventListener("change", updatePreviews);
        emailLang.addEventListener("change", updatePreviews);
        if (smsNameInput) smsNameInput.addEventListener("input", updatePreviews);
        if (emailNameInput) emailNameInput.addEventListener("input", updatePreviews);

        // Toggle card
        toggleBtn.addEventListener("click", () => {
            if (card.style.display === "none") {
                card.style.display = "";
                updatePreviews();
            } else {
                card.style.display = "none";
            }
        });

        // Tabs
        tabSms.addEventListener("click", () => {
            tabSms.classList.add("active");
            tabEmail.classList.remove("active");
            smsForm.style.display = "";
            emailForm.style.display = "none";
        });
        tabEmail.addEventListener("click", () => {
            tabEmail.classList.add("active");
            tabSms.classList.remove("active");
            emailForm.style.display = "";
            smsForm.style.display = "none";
        });

        // Send SMS
        sendSmsBtn.addEventListener("click", async () => {
            const phone = $("#sharePhone").value.trim();
            const senderName = smsNameInput ? smsNameInput.value.trim() : "";
            if (!phone) { showShareToast("Please enter a phone number.", "error"); return; }
            sendSmsBtn.disabled = true;
            sendSmsBtn.innerHTML = '<span class="spinner"></span> ' + t("share_sending");
            try {
                const res = await fetch("/civics/share/sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: phone, message: getShareMessage(smsLang.value, senderName) }),
                });
                const data = await res.json();
                if (data.ok) {
                    showShareToast(t("share_sent"), "success");
                    $("#sharePhone").value = "";
                } else {
                    showShareToast(data.error || t("share_error"), "error");
                }
            } catch (e) {
                showShareToast(t("share_error"), "error");
            }
            sendSmsBtn.disabled = false;
            sendSmsBtn.textContent = t("share_send");
        });

        // Send Email
        sendEmailBtn.addEventListener("click", async () => {
            const email = $("#shareEmail").value.trim();
            if (!email) { showShareToast("Please enter an email address.", "error"); return; }
            sendEmailBtn.disabled = true;
            sendEmailBtn.innerHTML = '<span class="spinner"></span> ' + t("share_sending");
            try {
                const res = await fetch("/civics/share/email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email,
                        subject: t("share_email_subject"),
                        body: getShareMessage(emailLang.value),
                    }),
                });
                const data = await res.json();
                if (data.ok) {
                    showShareToast(t("share_sent"), "success");
                    $("#shareEmail").value = "";
                } else if (data.error === "Email not configured") {
                    emailNote.style.display = "";
                    showShareToast(t("share_email_coming_soon"), "error");
                } else {
                    showShareToast(data.error || t("share_error"), "error");
                }
            } catch (e) {
                showShareToast(t("share_error"), "error");
            }
            sendEmailBtn.disabled = false;
            sendEmailBtn.textContent = t("share_send");
        });

        // Check email config availability on first email tab click
        tabEmail.addEventListener("click", async () => {
            try {
                const res = await fetch("/civics/share/email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "", body: "" }),
                });
                const data = await res.json();
                if (data.error === "Email not configured") {
                    emailNote.style.display = "";
                }
            } catch {}
        }, { once: true });
    }

    // ================================================================
    //  BOOT
    // ================================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
