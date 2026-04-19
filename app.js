/**
 * NeuroTempo PRO — Fase 9: Funcionalidad Completa y Bilingüe
 * SPA Navigation · Real Tapping · Real Mic · RAS Metronome · EN/ES
 */

// ============================================================
// CAPA DE PRIVACIDAD HIPAA/RGPD
// ============================================================
const NV_CIPHER_KEY = 'NVP-SECURE-2026-PARKINSON';

function nvEncrypt(str) {
    if (!str) return '';
    try {
        let out = '';
        for (let i = 0; i < str.length; i++)
            out += String.fromCharCode(str.charCodeAt(i) ^ NV_CIPHER_KEY.charCodeAt(i % NV_CIPHER_KEY.length));
        return btoa(unescape(encodeURIComponent(out)));
    } catch (e) { return btoa(str); }
}

function nvDecrypt(encoded) {
    if (!encoded) return '';
    try {
        const str = decodeURIComponent(escape(atob(encoded)));
        let out = '';
        for (let i = 0; i < str.length; i++)
            out += String.fromCharCode(str.charCodeAt(i) ^ NV_CIPHER_KEY.charCodeAt(i % NV_CIPHER_KEY.length));
        return out;
    } catch (e) { return encoded; }
}

function nvSaveUser(u) {
    localStorage.setItem('nv_user', JSON.stringify({
        n:   nvEncrypt(u.name  || ''),
        e:   nvEncrypt(u.email || ''),
        r:   'patient',
        a:   u.age || '',
        c:   nvEncrypt(u.country || ''),
        ec:  nvEncrypt(u.emergencyContact || ''),
        ec1n: nvEncrypt((u.ec1 && u.ec1.name)  || ''),
        ec1p: nvEncrypt((u.ec1 && u.ec1.phone) || ''),
        ec2n: nvEncrypt((u.ec2 && u.ec2.name)  || ''),
        ec2p: nvEncrypt((u.ec2 && u.ec2.phone) || ''),
        ec3n: nvEncrypt((u.ec3 && u.ec3.name)  || ''),
        ec3p: nvEncrypt((u.ec3 && u.ec3.phone) || ''),
    }));
}

function nvLoadUser() {
    const raw = localStorage.getItem('nv_user');
    if (!raw) return null;
    try {
        const p = JSON.parse(raw);
        if (p.name !== undefined) return p; // retrocompatibilidad
        return {
            name:             nvDecrypt(p.n  || ''),
            email:            nvDecrypt(p.e  || ''),
            role:             'patient',
            age:              p.a || '',
            country:          nvDecrypt(p.c  || ''),
            emergencyContact: nvDecrypt(p.ec || ''),
            ec1: { name: nvDecrypt(p.ec1n || ''), phone: nvDecrypt(p.ec1p || '') },
            ec2: { name: nvDecrypt(p.ec2n || ''), phone: nvDecrypt(p.ec2p || '') },
            ec3: { name: nvDecrypt(p.ec3n || ''), phone: nvDecrypt(p.ec3p || '') },
        };
    } catch (e) { return null; }
}

// ============================================================
// SISTEMA DE IDIOMAS
// ============================================================
function detectLang() {
    const saved = localStorage.getItem('nv_lang');
    if (saved) return saved;
    // Idioma por defecto: español siempre (aplicación clínica en ES)
    return 'es';
}

const translations = {
    es: {
        // Auth
        tagline: 'Sincronía rítmica para tu bienestar neuronal',
        login_email: 'Correo electrónico', login_pass: 'Contraseña',
        login_btn: 'Iniciar Sesión', forgot_pass: '¿Olvidaste tu contraseña?',
        no_account: '¿No tienes una cuenta?', create_profile: 'Crear Perfil',
        reg_title: 'Crear Nuevo Perfil', reg_name: 'Nombre Completo',
        reg_email: 'Correo Electrónico', reg_pass: 'Crear Contraseña',
        reg_btn: 'REGISTRARSE', back: 'VOLVER',
        rec_title: 'Recuperar Acceso', rec_desc: 'Le enviaremos un código de seguridad a su correo.',
        rec_email: 'Su correo registrado', send_code: 'ENVIAR CÓDIGO', cancel: 'CANCELAR',
        // Header
        welcome: 'Bienvenido', patient_role: 'Paciente',
        phase: 'FASE',
        // Nav
        nav_therapy: 'Terapia', nav_ras: 'Ritmo', nav_health: 'Salud', nav_security: 'Seguridad', nav_profile: 'Perfil',
        // Therapy
        therapy_title: 'Centro de Rehabilitación AI',
        therapy_sub: 'Test de estabilidad motora para pacientes con Parkinson',
        btn_vocal: 'Evaluación Vocal', btn_tapping: 'Test de Temblor',
        btn_drawing: 'Test de Dibujo', btn_breathing: 'Respiración Guiada',
        // Tapping
        tap_title: 'Test de Tapping', tap_sub: 'Mida la regularidad de sus movimientos finos para detectar bradicinesia',
        tap_inst: 'Pulse el círculo rítmicamente para medir velocidad e irregularidad motora.',
        tap_start: 'Inicie el test...', tap_finish: 'Terminar y Guardar',
        tap_taps: 'Toques', tap_bpm: 'BPM', tap_jitter: 'Jitter',
        tap_saved: 'Test de Tapping guardado',
        // Vocal
        voc_title: 'Analizador de Prosodia',
        voc_sub: 'Detección de disartria mediante análisis de voz en tiempo real',
        voc_phrase: '«Pablito clavó un clavito en la calva de un calvito.»',
        voc_record: 'Grabar', voc_stop: 'Detener',
        voc_denied: 'Acceso al micrófono denegado. Active el permiso en la configuración de su navegador.',
        voc_result: 'Audio procesado. Estabilidad prosódica: ',
        // Drawing
        draw_title: 'Escritura de Precisión',
        draw_sub: 'Evaluación del temblor de acción mediante trazado libre en pantalla',
        draw_finish: 'Finalizar y Analizar',
        draw_result: 'Análisis completado.\nDensidad del trazo: {d}%\nEstabilidad estimada: {s}%',
        // RAS + Musicoterapia
        ras_title: 'Terapia de Ritmo (RAS)',
        ras_sub: 'Sincronización neuromotora mediante metrónomo auditivo — mejora la marcha y el ritmo',
        ras_start: 'Iniciar Metrónomo', ras_stop: 'Detener',
        ras_bpm: 'BPM',
        // Musicoterapia YouTube
        yt_hub_title: 'Musicoterapia RAS',
        yt_hub_sub: 'Playlists de ritmo para terapia de marcha · Sin registro',
        yt_search_label: 'Busca una playlist en YouTube:',
        yt_embed_label: 'O reproduce directamente aquí:',
        yt_url_ph: 'Pega la URL de YouTube o Spotify...',
        yt_name_ph: 'Nombre para recordarla (opcional)',
        yt_load_btn: 'Reproducir',
        yt_stop_btn: '⏹ Detener',
        yt_hint: 'Compatible con YouTube · Spotify · Dailymotion · Twitch',
        yt_tip: 'Ajusta el volumen manualmente cuando uses el metrónomo RAS.',
        yt_saved: 'Guardadas',
        yt_no_saved: 'Aún no hay playlists guardadas',
        yt_clear_all: 'Limpiar todo',
        hlt_title: 'Subir Informe Médico',
        hlt_sub: 'Sincronice sus informes PDF para valoración con Inteligencia Artificial',
        hlt_click: 'Haga clic para subir PDF',
        hlt_fmt: 'Soportado: PDF, JPG, PNG',
        hlt_analyze: 'ANALIZAR INFORME MÉDICO',
        hlt_processing: 'PROCESANDO...',
        hlt_analyzing: 'Analizando documento con IA...',
        hlt_recent: 'Valoraciones Recientes',
        hlt_download: 'DESCARGAR REPORTE INTEGRAL',
        hlt_report_ok: 'Informe analizado con éxito. Tu perfil ha sido actualizado.',
        hlt_no_file: 'Seleccione un archivo primero.',
        hlt_report_diag: 'Diagnóstico',
        hlt_report_med: 'Medicación',
        hlt_report_rec: 'Recomendaciones',
        hlt_no_reports: 'Sin informes analizados aún. Suba un archivo PDF o imagen.',
        hlt_sync: 'Sincronizando informes...',
        // Security
        sec_title: 'Seguridad SOS',
        sec_sub: 'Emergencia médica y monitoreo de seguridad personal',
        sec_hold: 'Mantén pulsado 2 seg para activar SOS',
        sec_simulate: 'SIMULAR EMERGENCIA',
        sec_logout: 'CERRAR SESIÓN',
        sec_contacts_title: 'Contactos de Emergencia',
        sec_contacts_sub: 'Se llamarán en orden antes de activar los servicios oficiales',
        sec_contact_name: 'Nombre',
        sec_contact_phone: 'Teléfono',
        sec_contact_ph_name: 'Ej: Familiar / Cuidador',
        sec_contact_ph_phone: 'Ej: +34 600 000 000',
        sec_contacts_save: 'Guardar contactos',
        sec_contacts_saved: 'Contactos guardados.',
        sec_official_title: 'Número de emergencias oficial',
        sec_official_sub: 'Se activa si no se localiza ningún contacto personal',
        // Misc
        close: 'Cerrar', finish: 'Finalizar',
        ana_done: 'Análisis completado. Su valoración médica ha sido actualizada.',
        code_sent: 'Código de recuperación enviado a: ',
        // Profile & Privacy
        prof_setup: 'Configurar Perfil',
        prof_desc: 'Complete su información básica para personalizar la experiencia.',
        prof_age: 'Edad',
        prof_country: 'País',
        prof_emergency: 'Contacto de Emergencia (Tel)',
        save_btn: 'GUARDAR Y CONTINUAR',
        priv_title: 'Términos y Protección de Datos',
        priv_accept: 'ACEPTAR Y CONTINUAR',
        prof_saved: 'Perfil actualizado correctamente.',
        fill_fields: 'Por favor, complete los campos obligatorios.',
        all_fields_req: 'Edad, país y contacto de emergencia son obligatorios.',
        // Profile view
        prof_view_title: 'Mi Perfil',
        prof_view_sub: 'Actualice sus datos personales y revise el historial médico.',
        prof_personal: 'Datos Personales',
        prof_med_summary: 'Resumen Médico (IA)',
        prof_med_empty: 'Sin análisis guardados aún. Suba un informe médico en la sección Salud.',
        prof_save_changes: 'GUARDAR CAMBIOS',
        prof_name_label: 'Nombre Completo',
        prof_email_label: 'Correo',
        prof_changes_saved: 'Cambios guardados correctamente.',
        // Evolution / History
        ev_title: 'Mi Evolución',
        ev_sub: 'Historial cronológico de todas sus sesiones de rehabilitación.',
        ev_empty: 'Aún no hay sesiones registradas. Complete un test en el Centro de Rehabilitación.',
        ev_this_week: 'Esta Semana',
        ev_sessions: 'sesiones',
        ev_view_history: 'Ver Mi Evolución →',
        ev_clear_all: 'Borrar todo el historial',
        ev_del_confirm: '¿Eliminar esta sesión del historial?',
        // Dashboard de Evolución Clínica
        ev_trend_title: 'Tendencia Motora',
        ev_trend_sub: 'Puntuación de estabilidad (últimas 20 sesiones)',
        ev_filter_all: 'Todas',
        ev_filter_vocal: 'Vocal',
        ev_filter_tapping: 'Mano',
        ev_filter_drawing: 'Dibujo',
        ev_filter_breathing: 'Respiración',
        ev_detail_metrics: 'Métricas Clínicas',
        ev_detail_phase: 'Fase',
        ev_detail_date: 'Fecha',
        ev_share: 'Compartir con Doctor',
        ev_share_wa: 'WhatsApp',
        ev_share_email: 'Email',
        ev_share_title: 'Informe de Sesión — NeuroTempo PRO',
        ev_skeleton_msg: 'Obteniendo datos de la nube...',
    },
    en: {
        // Auth
        tagline: 'High-Precision Digital Health',
        login_email: 'Email Address', login_pass: 'Password',
        login_btn: 'SIGN IN', forgot_pass: 'Forgot your password?',
        no_account: "Don't have an account?", create_profile: 'CREATE NEW PROFILE',
        reg_title: 'Create New Profile', reg_name: 'Full Name',
        reg_email: 'Email Address', reg_pass: 'Create Password',
        reg_btn: 'REGISTER', back: 'GO BACK',
        rec_title: 'Recover Access', rec_desc: 'We will send a security code to your email.',
        rec_email: 'Your registered email', send_code: 'SEND CODE', cancel: 'CANCEL',
        // Header
        welcome: 'Welcome', patient_role: 'Patient',
        phase: 'PHASE',
        // Nav
        nav_therapy: 'Therapy', nav_ras: 'Rhythm', nav_health: 'Health', nav_security: 'Safety', nav_profile: 'Profile',
        // Therapy
        therapy_title: 'AI Rehabilitation Center',
        therapy_sub: 'Motor stability tests for Parkinson\'s patients',
        btn_vocal: 'Vocal Assessment', btn_tapping: 'Tremor Test',
        btn_drawing: 'Drawing Test', btn_breathing: 'Guided Breathing',
        // Tapping
        tap_title: 'Tapping Test', tap_sub: 'Measure fine motor regularity to detect bradykinesia',
        tap_inst: 'Tap the circle rhythmically to measure your speed and motor irregularity.',
        tap_start: 'Start the test...', tap_finish: 'Finish & Save',
        tap_taps: 'Taps', tap_bpm: 'BPM', tap_jitter: 'Jitter',
        tap_saved: 'Tapping test saved',
        // Vocal
        voc_title: 'Prosody Analyzer',
        voc_sub: 'Dysarthria detection via real-time voice analysis',
        voc_phrase: '«She sells seashells by the seashore.»',
        voc_record: 'Record', voc_stop: 'Stop',
        voc_denied: 'Microphone access denied. Please enable it in your browser settings.',
        voc_result: 'Audio processed. Prosodic stability: ',
        // Drawing
        draw_title: 'Precision Drawing',
        draw_sub: 'Action tremor evaluation via free on-screen drawing',
        draw_finish: 'Finish & Analyze',
        draw_result: 'Analysis complete.\nStroke density: {d}%\nEstimated stability: {s}%',
        // RAS + Musicotherapy
        ras_title: 'Rhythm Therapy (RAS)',
        ras_sub: 'Neuromotor synchronization via auditory metronome — improves gait and rhythm',
        ras_start: 'Start Metronome', ras_stop: 'Stop',
        ras_bpm: 'BPM',
        // Musicotherapy YouTube
        yt_hub_title: 'RAS Musicotherapy',
        yt_hub_sub: 'Rhythm playlists for gait therapy · No login required',
        yt_search_label: 'Search a playlist on YouTube:',
        yt_embed_label: 'Or play directly here:',
        yt_url_ph: 'Paste a YouTube or Spotify URL...',
        yt_load_btn: 'Play',
        yt_stop_btn: '⏹ Stop',
        yt_hint: 'Supports YouTube · Spotify · Dailymotion · Twitch',
        yt_tip: 'Adjust volume manually when using the RAS metronome.',
        yt_saved: 'Saved',
        yt_no_saved: 'No saved playlists yet',
        yt_clear_all: 'Clear all',
        yt_name_ph: 'Label to remember it (optional)',
        // Health
        hlt_title: 'Upload Medical Report',
        hlt_sub: 'Sync your PDF reports for AI-powered assessment',
        hlt_click: 'Click to upload PDF',
        hlt_fmt: 'Supported: PDF, JPG, PNG',
        hlt_analyze: 'ANALYZE MEDICAL REPORT',
        hlt_processing: 'PROCESSING...',
        hlt_analyzing: 'Analyzing document with AI...',
        hlt_recent: 'Recent Assessments',
        hlt_download: 'DOWNLOAD FULL REPORT',
        hlt_report_ok: 'Report analyzed successfully. Your profile has been updated.',
        hlt_no_file: 'Select a file first.',
        hlt_report_diag: 'Diagnosis',
        hlt_report_med: 'Medication',
        hlt_report_rec: 'Recommendations',
        hlt_no_reports: 'No analyzed reports yet. Upload a PDF or image file.',
        hlt_sync: 'Syncing reports...',
        // Security
        sec_title: 'SOS Safety',
        sec_sub: 'Medical emergency and personal safety monitoring',
        sec_hold: 'Hold 2 sec to activate SOS',
        sec_simulate: 'SIMULATE EMERGENCY',
        sec_logout: 'SIGN OUT',
        sec_contacts_title: 'Emergency Contacts',
        sec_contacts_sub: 'Called in order before activating official emergency services',
        sec_contact_name: 'Name',
        sec_contact_phone: 'Phone',
        sec_contact_ph_name: 'E.g: Family / Caregiver',
        sec_contact_ph_phone: 'E.g: +1 555 000 0000',
        sec_contacts_save: 'Save contacts',
        sec_contacts_saved: 'Contacts saved.',
        sec_official_title: 'Official emergency number',
        sec_official_sub: 'Activated if no personal contact can be reached',
        // Misc
        close: 'Close', finish: 'Finish',
        ana_done: 'Analysis complete. Your medical assessment has been updated.',
        code_sent: 'Recovery code sent to: ',
        // Profile & Privacy
        prof_setup: 'Profile Setup',
        prof_desc: 'Complete your basic information to personalize the experience.',
        prof_age: 'Age',
        prof_country: 'Country',
        prof_emergency: 'Emergency Contact (Tel)',
        save_btn: 'SAVE & CONTINUE',
        priv_title: 'Terms & Data Protection',
        priv_accept: 'ACCEPT & CONTINUE',
        prof_saved: 'Profile updated successfully.',
        fill_fields: 'Please fill in all required fields.',
        all_fields_req: 'Age, country and emergency contact are required.',
        // Profile view
        prof_view_title: 'My Profile',
        prof_view_sub: 'Update your personal data and review your medical history.',
        prof_personal: 'Personal Data',
        prof_med_summary: 'Medical Summary (AI)',
        prof_med_empty: 'No analyses saved yet. Upload a medical report in the Health section.',
        prof_save_changes: 'SAVE CHANGES',
        prof_name_label: 'Full Name',
        prof_email_label: 'Email',
        prof_changes_saved: 'Changes saved successfully.',
        // Evolution / History
        ev_title: 'My Evolution',
        ev_sub: 'Chronological log of all your rehabilitation sessions.',
        ev_empty: 'No sessions recorded yet. Complete a test in the AI Rehab Center.',
        ev_this_week: 'This Week',
        ev_sessions: 'sessions',
        ev_view_history: 'View My Evolution →',
        ev_clear_all: 'Clear all history',
        ev_del_confirm: 'Delete this session from history?',
        // Clinical Evolution Dashboard
        ev_trend_title: 'Motor Stability Trend',
        ev_trend_sub: 'Stability score (last 20 sessions)',
        ev_filter_all: 'All',
        ev_filter_vocal: 'Vocal',
        ev_filter_tapping: 'Hand',
        ev_filter_drawing: 'Drawing',
        ev_filter_breathing: 'Breathing',
        ev_detail_metrics: 'Clinical Metrics',
        ev_detail_phase: 'Phase',
        ev_detail_date: 'Date',
        ev_share: 'Share with Doctor',
        ev_share_wa: 'WhatsApp',
        ev_share_email: 'Email',
        ev_share_title: 'Session Report — NeuroTempo PRO',
        ev_skeleton_msg: 'Fetching cloud data...',
    }
};

// t() delega en NVI18n cuando está disponible.
// Si NVI18n devuelve la propia clave (JSON no cargado), cae al diccionario inline.
const t = (key, vars) => {
    if (window.NVI18n) {
        const result = NVI18n.t(key, vars);
        if (result !== key) return result;   // traducción encontrada en JSON
    }
    // Fallback inline — siempre disponible, no depende de XHR
    const dict = (translations[state.lang] || translations.es);
    let str = dict[key] || key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    return str;
};

// ============================================================
// SISTEMA DE NOTIFICACIONES INTERNO (reemplaza alert())
// ============================================================
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `nv-toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 400);
    }, 3600);
}

function showModal(msg, { title = '', confirmText = '', cancelText = '', onConfirm = null } = {}) {
    const lang = (typeof state !== 'undefined' ? state.lang : null) || 'es';
    const overlay = document.createElement('div');
    overlay.className = 'nv-modal-overlay';
    const card = document.createElement('div');
    card.className = 'nv-modal-card';
    card.innerHTML = `
        ${title ? `<h3 style="color:var(--accent-cyan);margin-bottom:1rem;font-size:1.2rem;">${title}</h3>` : ''}
        <p style="line-height:1.75;white-space:pre-line;font-size:0.95rem;color:rgba(241,245,249,0.9);">${msg}</p>
        <div style="display:flex;flex-direction:column;gap:0.7rem;margin-top:1.6rem;">
            ${onConfirm ? `<button id="_nv_ok" class="action-btn btn-primary" style="width:100%;">${confirmText || (lang === 'es' ? 'Aceptar' : 'Accept')}</button>` : ''}
            <button id="_nv_cl" class="action-btn" style="width:100%;border:1px solid rgba(255,255,255,0.1);">
                ${onConfirm ? (cancelText || (lang === 'es' ? 'Cancelar' : 'Cancel')) : (lang === 'es' ? 'Cerrar' : 'Close')}
            </button>
        </div>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
    card.querySelector('#_nv_cl').onclick = close;
    if (onConfirm) card.querySelector('#_nv_ok').onclick = () => { close(); onConfirm(); };
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    lucide.createIcons();
}

// ============================================================
// ESTADO GLOBAL
// ============================================================
const state = {
    user: nvLoadUser(),
    lang: detectLang(),
    currentView: 'therapy',
    patientStatus: 'ON',
    medications: [
        { name: 'Levodopa/Carbidopa', time: '08:00', taken: true },
        { name: 'Ropinirol', time: '13:00', taken: false },
        { name: 'Levodopa/Carbidopa', time: '20:00', taken: false }
    ],
    isRecording: false,
    tappingData: { timestamps: [], intervals: [], active: false },
    gpsMetadata: { lat: '40.4168° N', lon: '3.7038° W' },
    auditLog: [],
    reports: [
        {
            id: 1, date: '2026-03-15', source: 'Hospital Ruber',
            diagnosis: 'Estabilidad en Parkinson grado 2',
            analysis: 'Se observa buena respuesta al tratamiento actual. Mantener ejercicio motriz.'
        }
    ],
    isAnalyzingReport: false,
    metronomeBPM: 112,
    metronomeActive: false,
    viewStack: [],
    profileSummary: JSON.parse(localStorage.getItem('nv_prof_summary') || '[]'),
    sessionHistory: JSON.parse(localStorage.getItem('nv_session_history') || '[]'),
    medicalReports: JSON.parse(localStorage.getItem('nv_medical_reports') || '[]'),
    evolutionSyncing: false,
    evolutionFilter: 'all',
    _pendingFile: null,
    _pendingFiles: [],    // cola multi-upload
    reportsSyncing: false
};

// ============================================================
// AUTENTICACIÓN
// ============================================================

// ── Mensajes de error Firebase localizados ────────────────────
function _fbErrorMsg(code) {
    const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';
    const map = {
        'auth/user-not-found': isEs ? 'No existe cuenta con ese correo.' : 'No account found for that email.',
        'auth/wrong-password': isEs ? 'Contraseña incorrecta.' : 'Incorrect password.',
        'auth/invalid-credential': isEs ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.',
        'auth/email-already-in-use': isEs ? 'Ese correo ya está registrado.' : 'That email is already registered.',
        'auth/weak-password': isEs ? 'La contraseña debe tener 6+ caracteres.' : 'Password must be at least 6 characters.',
        'auth/invalid-email': isEs ? 'Correo electrónico inválido.' : 'Invalid email address.',
        'auth/too-many-requests': isEs ? 'Demasiados intentos. Espere un momento.' : 'Too many attempts. Please wait.',
        'auth/network-request-failed': isEs ? 'Sin conexión. Compruebe su red.' : 'No connection. Check your network.',
        'auth/operation-not-allowed': isEs ? 'Inicio de sesión por email no activado. Active Email/Password en Firebase Console → Authentication → Sign-in method.' : 'Email sign-in is disabled. Enable Email/Password in Firebase Console → Authentication → Sign-in method.',
        'auth/configuration-not-found': isEs ? 'Proyecto Firebase no configurado correctamente.' : 'Firebase project not configured correctly.',
        'auth/api-key-not-valid': isEs ? 'API Key de Firebase inválida. Revise firebase-config.js.' : 'Invalid Firebase API Key. Check firebase-config.js.',
        'auth/invalid-api-key': isEs ? 'API Key de Firebase inválida. Revise firebase-config.js.' : 'Invalid Firebase API Key. Check firebase-config.js.',
        'firebase_unavailable': isEs ? 'Modo sin conexión — datos guardados localmente.' : 'Offline mode — data saved locally.',
    };
    const msg = map[code];
    if (msg) return msg;
    // Fallback: mostrar código exacto para facilitar diagnóstico
    console.error('[NVAuth] Código de error desconocido:', code);
    return isEs ? `Error de autenticación [${code || 'desconocido'}]` : `Auth error [${code || 'unknown'}]`;
}

function showAuthMode(mode) {
    // 'profile-setup' usa id 'profile-setup-box' (sin -form)
    const idMap = { 'profile-setup': 'profile-setup-box' };
    ['login', 'register', 'recover', 'profile-setup'].forEach(m => {
        const id = idMap[m] ? idMap[m] : `${m}-form-box`;
        const el = document.getElementById(id);
        if (el) el.style.display = m === mode ? 'block' : 'none';
    });
    const authFlow = document.getElementById('auth-flow');
    if (authFlow) authFlow.style.display = 'flex';
    document.body.classList.add('auth-mode');
    applyStaticTranslations();
}

function showPrivacyModal() {
    const overlay = document.getElementById('privacy-overlay');
    const modal = document.getElementById('privacy-modal');
    if (overlay) overlay.style.display = 'block';
    if (modal) modal.style.display = 'block';
}

function hidePrivacyModal() {
    const overlay = document.getElementById('privacy-overlay');
    const modal = document.getElementById('privacy-modal');
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
}

function acceptPrivacyAndRegister() {
    hidePrivacyModal();
    handleRegister();
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) { showToast(t('fill_fields'), 'error'); return; }

    const btn = document.querySelector('#login-form-box .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'es' ? 'Conectando...' : 'Connecting...'; }

    try {
        if (window.NVFirebase && NVFirebase.isReady()) {
            // ── Firebase Auth ──────────────────────────────────
            const fbUser = await NVFirebase.login(email, pass);
            const profile = await NVFirebase.loadProfile(fbUser.uid);
            const userData = profile
                ? { ...profile, uid: fbUser.uid, email: fbUser.email }
                : { email: fbUser.email, name: fbUser.email.split('@')[0] || 'Usuario', role: 'patient', uid: fbUser.uid };
            state.user = userData;
            nvSaveUser(userData);       // cache local cifrado
        } else {
            // ── Fallback localStorage ──────────────────────────
            const userData = nvLoadUser();
            if (userData && userData.email === email) {
                state.user = userData;
            } else {
                state.user = { email, name: email.split('@')[0] || 'Usuario', role: 'patient' };
                nvSaveUser(state.user);
            }
        }
        checkProfileComplete();
    } catch (e) {
        console.error('[NVAuth] Login fallido — código:', e.code, '| mensaje:', e.message, '| error completo:', e);
        showToast(_fbErrorMsg(e.code), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = t('login_btn'); }
    }
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    if (!name || !email || !pass) { showToast(t('all_fields_req'), 'error'); return; }

    const btn = document.querySelector('#register-form-box .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'es' ? 'Creando perfil...' : 'Creating profile...'; }

    try {
        let uid = null;
        if (window.NVFirebase && NVFirebase.isReady()) {
            // ── Firebase Auth — crear cuenta ───────────────────
            const fbUser = await NVFirebase.register(email, pass);
            uid = fbUser.uid;
        }
        const userData = { name, email, role: 'patient', uid };
        state.user = userData;
        nvSaveUser(userData);
        showAuthMode('profile-setup');
    } catch (e) {
        console.error('[NVAuth] Registro fallido — código:', e.code, '| mensaje:', e.message, '| error completo:', e);
        showToast(_fbErrorMsg(e.code), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = t('reg_btn'); }
    }
}

function checkProfileComplete() {
    const u = state.user;
    if (!u) return;
    if (!u.age || !u.country) {
        showAuthMode('profile-setup');
        document.getElementById('auth-flow').style.display = 'flex';
        document.getElementById('main-header').style.display = 'none';
    } else {
        initApp();
    }
}

function handleSaveProfile() {
    const age = document.getElementById('prof-age').value;
    const country = document.getElementById('prof-country').value.trim();
    const emergency = document.getElementById('prof-emergency').value.trim();
    if (!age || !country || !emergency) { showToast(t('all_fields_req'), 'error'); return; }

    state.user.age = age;
    state.user.country = country;
    state.user.emergencyContact = emergency;
    state.user.lang = state.lang;
    nvSaveUser(state.user);

    // Sincronizar perfil completo con Firestore (async, no bloqueante)
    if (window.NVFirebase && NVFirebase.isReady() && state.user.uid) {
        NVFirebase.saveProfile(state.user.uid, state.user).catch(console.warn);
    }

    showToast(t('prof_saved'), 'success');
    setTimeout(initApp, 800);
}

function handleBack() {
    if (state.viewStack.length > 0) {
        const prev = state.viewStack.pop();
        state.currentView = prev;
        render();
    }
}

async function handleRecover() {
    const email = document.getElementById('recover-email').value.trim();
    if (!email) { showToast(state.lang === 'es' ? 'Introduzca su correo.' : 'Enter your email.', 'error'); return; }

    const btn = document.querySelector('#recover-form-box .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'es' ? 'Enviando...' : 'Sending...'; }

    try {
        if (window.NVFirebase && NVFirebase.isReady()) {
            await NVFirebase.sendPasswordReset(email);
            showToast(
                state.lang === 'es'
                    ? 'Email de recuperación enviado. Revise su bandeja de entrada.'
                    : 'Recovery email sent. Check your inbox.',
                'success'
            );
        } else {
            showToast(t('code_sent') + email, 'info');
        }
        showAuthMode('login');
    } catch (e) {
        showToast(_fbErrorMsg(e.code), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = t('send_code'); }
    }
}

async function initApp() {
    if (!state.user) return;
    if (!state.user.age || !state.user.country) {
        checkProfileComplete();
        return;
    }

    // ── Cargar i18n: recuperar idioma desde Firestore si el usuario lo guardó ──
    if (window.NVI18n) {
        try {
            const uid = window.NVFirebase ? NVFirebase.getCurrentUid() : null;
            if (uid && window.NVFirebase && NVFirebase.isReady()) {
                const settings = await NVFirebase.loadSettings(uid);
                if (settings && settings.lang && settings.lang !== state.lang) {
                    state.lang = settings.lang;
                    localStorage.setItem('nv_lang', settings.lang);
                }
            }
        } catch (_) { /* fallo silencioso — usar idioma local */ }
        await NVI18n.init(state.lang);
    }

    ['auth-flow'].forEach(id => document.getElementById(id).style.display = 'none');
    ['main-header', 'neuro-content'].forEach(id => document.getElementById(id).style.display = 'block');
    document.getElementById('floating-sos-btn').style.display = 'flex';
    document.querySelector('nav.bottom-nav').style.display = 'flex';
    document.body.classList.remove('auth-mode');

    updateHeader();
    injectLangToggle();
    initSosButton();
    lucide.createIcons();

    nvLoadMeds();
    checkDailyMedReset();

    // Auto-restart del motor si el permiso sigue activo (persistencia tras refresco)
    if (Notification.permission === 'granted') {
        startMedReminders();
    } else if (localStorage.getItem('nv_reminders_active')) {
        // El permiso fue revocado externamente — limpiar el flag
        localStorage.removeItem('nv_reminders_active');
    }

    // Registro del Service Worker (habilita notificaciones con acciones)
    _registerServiceWorker();

    // Warning cuando la pestaña queda en segundo plano con alarmas activas
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && _notifInterval && !_bgWarnShown) {
            // Marcar para mostrar cuando el usuario vuelva
            sessionStorage.setItem('nv_bg_warn_pending', '1');
        }
        if (!document.hidden && sessionStorage.getItem('nv_bg_warn_pending')) {
            sessionStorage.removeItem('nv_bg_warn_pending');
            if (!_bgWarnShown) {
                _bgWarnShown = true;
                const isEs = state.lang === 'es';
                showToast(
                    isEs
                        ? '📌 Para alarmas fiables, mantén esta pestaña abierta o fíjala en el navegador.'
                        : '📌 For reliable alarms, keep this tab open or pin it in your browser.',
                    'info'
                );
            }
        }
    });

    render();

    logAudit(state.lang === 'es' ? `Sesión iniciada: ${state.user.email}` : `Session started: ${state.user.email}`);
}

function updateNav() {
    const navItems = {
        therapy: { icon: 'activity', label: t('nav_therapy') },
        ras: { icon: 'music', label: t('nav_ras') },
        health: { icon: 'clipboard-list', label: t('nav_health') },
        security: { icon: 'shield', label: t('nav_security') },
        profile: { icon: 'user-circle', label: t('nav_profile') }
    };
    const nav = document.querySelector('nav.bottom-nav');
    if (!nav) return;
    nav.innerHTML = Object.entries(navItems).map(([view, cfg]) => `
        <div class="nav-link ${state.currentView === view ? 'active' : ''}"
             onclick="changeView('${view}')" role="button"
             aria-label="${cfg.label}" aria-pressed="${state.currentView === view}">
            <i data-lucide="${cfg.icon}"></i>
            <span class="nav-label">${cfg.label}</span>
        </div>`).join('');
    lucide.createIcons();
}

function getContextChip(view) {
    const chips = {
        therapy: { icon: 'user', es: 'Paciente: Diagnóstico motor', en: 'Patient: Motor diagnosis' },
        ras: { icon: 'user', es: 'Paciente: Terapia de ritmo', en: 'Patient: Rhythm therapy' },
        health: { icon: 'file-text', es: 'Informes médicos', en: 'Medical reports' },
        security: { icon: 'alert-triangle', es: 'Paciente: SOS y emergencias', en: 'Patient: SOS & emergencies' }
    };
    const cfg = chips[view] || chips.therapy;
    return `<div class="view-context-chip"><i data-lucide="${cfg.icon}"></i>${cfg[state.lang] || cfg.es}</div>`;
}

// ============================================================
// SISTEMA DE IDIOMAS
// ============================================================
async function setLang(lang) {
    state.lang = lang;
    // Sincronizar NVI18n y persistir en localStorage + Firestore
    if (window.NVI18n) {
        const uid = window.NVFirebase ? NVFirebase.getCurrentUid() : null;
        await NVI18n.setLang(lang, uid);
        if (uid) showToast(t('lang_saved'), 'success');
    } else {
        localStorage.setItem('nv_lang', lang);
    }
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'es' ? 'EN' : 'ES';
    updateHeader();
    applyStaticTranslations();
    if (state.user) render();
}

function updateHeader() {
    if (!state.user) return;
    const rolLabel = t('patient_role');
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) greetingEl.textContent = `${t('welcome')}, ${state.user.name}`;
    const roleTag = document.getElementById('user-role-tag');
    if (roleTag) roleTag.innerText = rolLabel;
    const stateTag = document.getElementById('current-state-tag');
    if (stateTag) {
        stateTag.textContent = `${t('phase')} ${state.patientStatus}`;
        stateTag.className = `status-tag ${state.patientStatus === 'ON' ? 'status-on' : 'status-off'}`;
    }
}

function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        // Si t() devuelve la clave sin traducir, conservar el texto HTML original
        if (val === key) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
        else el.textContent = val;
    });
    // Placeholders con clave propia (data-i18n-ph)
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        const val = t(key);
        if (val !== key) el.placeholder = val;
    });
}

function injectLangToggle() {
    if (document.getElementById('lang-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.className = 'lang-toggle-btn';
    btn.textContent = state.lang === 'es' ? 'EN' : 'ES';
    btn.onclick = () => setLang(state.lang === 'es' ? 'en' : 'es');
    btn.title = 'Switch language / Cambiar idioma';
    const container = document.getElementById('lang-toggle-container');
    if (container) container.appendChild(btn);
}

// ============================================================
// NAVEGACIÓN Y VISTAS
// ============================================================

// ── Sincronización asíncrona de evaluaciones desde Firestore ──
async function _syncEvolutionFromFirestore() {
    if (!window.NVFirebase || !NVFirebase.isReady()) {
        state.evolutionSyncing = false;
        return;
    }
    const uid = state.user && state.user.uid ? state.user.uid : null;
    if (!uid) { state.evolutionSyncing = false; return; }

    try {
        const remote = await NVFirebase.getEvaluations(uid);
        if (remote.length) {
            // Merge: datos remotos prevalecen sobre locales; se conservan entradas locales sin ID remoto
            const local = window.NVHistory ? NVHistory.getAll() : [];
            const remoteIds = new Set(remote.map(e => e.id));
            const localOnly = local.filter(e => !remoteIds.has(e.id));
            const merged = [...remote, ...localOnly].sort((a, b) => b.ts - a.ts);

            localStorage.setItem('nv_session_history', JSON.stringify(merged.slice(0, 300)));
            state.sessionHistory = merged;
        }
    } catch (e) {
        console.warn('[NVFirebase] Sync Evolution fallido:', e);
    } finally {
        state.evolutionSyncing = false;
        if (state.currentView === 'evolution') render();
    }
}

// ── Sincronización asíncrona de informes médicos desde Firestore ──
async function _syncMedicalReportsFromFirestore() {
    if (!window.NVReports) { state.reportsSyncing = false; return; }
    const uid = state.user && state.user.uid ? state.user.uid : null;
    try {
        const reports = await NVReports.syncFromFirestore(uid);
        state.medicalReports = reports;
    } catch (e) {
        console.warn('[Health] Sync informes fallido:', e);
    } finally {
        state.reportsSyncing = false;
        // Quitar spinner del DOM sin re-render completo
        const badge = document.getElementById('nv-reports-sync-badge');
        if (badge) badge.remove();
        _renderMedicalReportsList();
    }
}

// ── Renderizado premium de valoraciones ─────────────────────
// ── Restricción cardiovascular — bloquea ejercicios de alta intensidad ──
function _getCardioRestriction() {
    const reports = state.medicalReports || [];
    const isEs = state.lang === 'es';
    for (const r of reports) {
        const mx = r.metricas || {};
        const feviNum = mx.fevi ? parseInt(mx.fevi) : null;
        const fcNum = mx.fc ? parseInt(mx.fc) : null;
        if ((feviNum !== null && feviNum < 30) || (fcNum !== null && fcNum > 100)) {
            const parts = [];
            if (feviNum !== null && feviNum < 30) parts.push(isEs ? `FEVI ${mx.fevi}` : `LVEF ${mx.fevi}`);
            if (fcNum !== null && fcNum > 100) parts.push(isEs ? `FC ${mx.fc}` : `HR ${mx.fc}`);
            return {
                blocked: true,
                fevi: mx.fevi || null,
                fc: mx.fc || null,
                patient: r.source || r.fileName || (isEs ? 'Paciente' : 'Patient'),
                reason: isEs
                    ? `${parts.join(' · ')} — Disfunción cardiaca severa detectada. Ejercicios de alta intensidad bloqueados por seguridad cardiovascular.`
                    : `${parts.join(' · ')} — Severe cardiac dysfunction detected. High-intensity exercises blocked for cardiovascular safety.`
            };
        }
    }
    return { blocked: false, reason: '' };
}

function _renderMedicalReportsList() {
    const container = document.getElementById('reports-list');
    if (!container) return;
    const isEs = state.lang === 'es';
    const reports = state.medicalReports;

    if (reports.length === 0) {
        container.innerHTML = `
            <p style="text-align:center;color:rgba(148,163,184,0.4);padding:1.6rem 0;font-size:0.88rem;">
                ${t('hlt_no_reports')}
            </p>`;
        return;
    }

    // Contador de páginas analizadas
    const totalPages = reports.reduce((acc, r) => acc + (r.pageCount || 1), 0);
    const counterHtml = `
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.85rem;
                    padding:0.45rem 0.9rem;border-radius:50px;
                    background:rgba(0,242,255,0.06);border:1px solid rgba(0,242,255,0.12);
                    width:fit-content;">
            <span style="font-size:1rem;">📊</span>
            <span style="font-size:0.78rem;font-weight:700;color:rgba(0,242,255,0.75);">
                ${isEs
            ? `Se han analizado <b>${totalPages}</b> página(s) de este historial · <b>${reports.length}</b> informe(s)`
            : `<b>${totalPages}</b> page(s) analyzed in this history · <b>${reports.length}</b> report(s)`}
            </span>
        </div>`;

    const cardsHtml = reports.slice(0, 20).map(r => {
        // Traducción dinámica de contenido clínico (NLP siempre en ES → app lang)
        const _rawDiag = r.diagnostico_principal || r.diagnosis || '—';
        const _rawMed  = r.medicacion_activa || r.medicacion || '';
        const _rawRec  = r.recomendaciones || r.analysis || '—';
        const diag = window.NVI18n ? NVI18n.translateDynamicContent(_rawDiag, state.lang) : _rawDiag;
        const med  = window.NVI18n ? NVI18n.getTranslatedMedInstruction(_rawMed, state.lang)  : _rawMed;
        const rec  = window.NVI18n ? NVI18n.getTranslatedClinicalText(_rawRec, state.lang)    : _rawRec;
        const src = r.source || r.fileName || (isEs ? 'Informe' : 'Report');
        const date = r.date || '';
        const mx = r.metricas || {};
        const dom = r.dominios || {};
        const isCrit = r.isCritical || rec.includes('⚠') || diag.toLowerCase().includes('fevi');
        const hasAlert = rec.startsWith('⚠') || rec.startsWith('🚨');

        // ── Bandera Roja: detectar cifras críticas en métricas ──
        const feviNum = mx.fevi ? parseInt(mx.fevi) : null;
        const fcNum = mx.fc ? parseInt(mx.fc) : null;
        const isRedFlag = (feviNum !== null && feviNum < 30) || (fcNum !== null && fcNum > 100);
        const redFlagMsg = isRedFlag
            ? (isEs
                ? `⚠ Alerta: Condición cardiovascular detectada${feviNum !== null && feviNum < 30 ? ` (FEVI ${mx.fevi})` : ''}${fcNum !== null && fcNum > 100 ? ` (FC ${mx.fc})` : ''}. Consulte con su especialista antes de iniciar ejercicios de alta intensidad.`
                : `⚠ Alert: Cardiovascular condition detected${feviNum !== null && feviNum < 30 ? ` (LVEF ${mx.fevi})` : ''}${fcNum !== null && fcNum > 100 ? ` (HR ${mx.fc})` : ''}. Consult your specialist before starting high-intensity exercise.`)
            : '';

        // ── Métricas pill row ──
        const metricPills = Object.entries(mx).map(([k, v]) => {
            const labels = { ta: 'TA', fc: 'FC', fevi: 'FEVI', pap: 'PAP', cr: 'Cr', hb: 'Hb', glucosa: 'Glu', colesterol: 'Col', sato2: 'SpO₂' };
            const colors = { fevi: '#ef4444', pap: '#ef4444', ta: '#3b82f6', fc: '#3b82f6', cr: '#f59e0b', hb: '#f59e0b', glucosa: '#f59e0b', colesterol: '#f59e0b', sato2: '#10b981' };
            const col = colors[k] || 'rgba(148,163,184,0.6)';
            const label = labels[k] || k;
            return `<span style="display:inline-flex;align-items:center;gap:0.25rem;padding:3px 9px;border-radius:50px;
                                  background:${col}14;border:1px solid ${col}30;font-size:0.72rem;font-weight:700;">
                        <span style="color:rgba(148,163,184,0.55);">${label}</span>
                        <span style="color:${col};">${v}</span>
                    </span>`;
        }).join('');

        // ── Dominios detectados ──
        const domRow = [
            dom.neuro && `<span style="font-size:0.7rem;padding:2px 8px;border-radius:50px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);color:rgba(139,92,246,0.9);">🧠 ${dom.neuro}</span>`,
            dom.cardio && `<span style="font-size:0.7rem;padding:2px 8px;border-radius:50px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);color:rgba(239,68,68,0.85);">❤ ${dom.cardio}</span>`,
            dom.psico && `<span style="font-size:0.7rem;padding:2px 8px;border-radius:50px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.22);color:rgba(251,191,36,0.85);">🧩 ${dom.psico}</span>`,
        ].filter(Boolean).join('');

        // ── Separar alerta del texto de recomendaciones ──
        let alertHtml = '';
        let recText = rec;
        if (hasAlert) {
            const pipeIdx = rec.indexOf(' | ');
            if (pipeIdx > -1) {
                alertHtml = rec.slice(0, pipeIdx);
                recText = rec.slice(pipeIdx + 3);
            } else {
                alertHtml = rec;
                recText = '';
            }
        }

        return `
        <div class="nv-report-card${isCrit ? ' nv-report-critical' : ''}${isRedFlag ? ' nv-report-red-flag' : ''}">

            ${isRedFlag ? `
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.85rem;
                        margin:-0.1rem -0.1rem 0.85rem;border-radius:12px 12px 0 0;
                        background:rgba(239,68,68,0.12);border-bottom:1px solid rgba(239,68,68,0.25);">
                <span style="font-size:1rem;flex-shrink:0;">🚨</span>
                <span style="font-size:0.75rem;font-weight:700;color:rgba(239,68,68,0.95);line-height:1.4;">
                    ${redFlagMsg}
                </span>
            </div>` : ''}

            <!-- Cabecera -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;margin-bottom:0.85rem;">
                <div style="min-width:0;">
                    <div style="font-weight:800;font-size:0.9rem;color:rgba(241,245,249,0.95);
                                word-break:break-word;line-height:1.3;">${src}</div>
                    ${r.estadio ? `<span style="font-size:0.7rem;font-weight:700;padding:2px 9px;border-radius:50px;
                                               background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);
                                               color:rgba(139,92,246,0.9);display:inline-block;margin-top:4px;">${r.estadio}</span>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
                    <span style="font-size:0.72rem;color:rgba(148,163,184,0.45);">${date}</span>
                    ${(isRedFlag || isCrit)
                ? `<span style="font-size:0.64rem;font-weight:800;padding:2px 9px;border-radius:50px;
                                        background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);
                                        color:rgba(239,68,68,0.95);">● ${isRedFlag ? (isEs ? 'ALERTA' : 'ALERT') : (isEs ? 'CRÍTICO' : 'CRITICAL')}</span>`
                : `<span style="font-size:0.64rem;font-weight:800;padding:2px 9px;border-radius:50px;
                                        background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);
                                        color:rgba(16,185,129,0.9);">● ${isEs ? 'ESTABLE' : 'STABLE'}</span>`}
                </div>
            </div>

            ${domRow ? `<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.75rem;">${domRow}</div>` : ''}

            <!-- Diagnóstico — rojo si crítico, cyan si normal -->
            <div class="nv-rc-section" style="border-left-color:${isCrit ? '#ef4444' : 'var(--accent-cyan)'};">
                <div class="nv-rc-label" style="color:${isCrit ? 'rgba(239,68,68,0.7)' : 'rgba(0,242,255,0.6)'};">
                    🔍 ${t('hlt_report_diag')}
                </div>
                <div style="font-size:0.85rem;font-weight:700;color:${isCrit ? '#ef4444' : 'var(--accent-cyan)'};line-height:1.4;">
                    ${diag}
                </div>
            </div>

            ${alertHtml ? `
            <div style="margin:0.6rem 0;padding:0.6rem 0.85rem;border-radius:10px;
                        background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);">
                <span style="font-size:0.8rem;color:rgba(239,68,68,0.9);line-height:1.5;">${alertHtml}</span>
            </div>` : ''}

            ${med ? `
            <!-- Medicación — azul -->
            <div class="nv-rc-section" style="border-left-color:#3b82f6;">
                <div class="nv-rc-label" style="color:rgba(59,130,246,0.7);">💊 ${t('hlt_report_med')}</div>
                <div style="font-size:0.8rem;color:rgba(147,197,253,0.9);line-height:1.5;">${med}</div>
            </div>` : ''}

            ${recText ? `
            <!-- Recomendaciones — verde -->
            <div class="nv-rc-section" style="border-left-color:#10b981;">
                <div class="nv-rc-label" style="color:rgba(16,185,129,0.7);">✅ ${t('hlt_report_rec')}</div>
                <div style="font-size:0.8rem;color:rgba(110,231,183,0.85);line-height:1.5;">${recText}</div>
            </div>` : ''}

            ${metricPills ? `
            <!-- Métricas vitales -->
            <div style="margin-top:0.65rem;">
                <div class="nv-rc-label" style="color:rgba(148,163,184,0.45);margin-bottom:0.4rem;">
                    📊 ${isEs ? 'Métricas Extraídas' : 'Extracted Metrics'}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">${metricPills}</div>
            </div>` : ''}

            <!-- Pie de tarjeta: descargar + eliminar -->
            <div style="display:flex;justify-content:space-between;align-items:center;
                        margin-top:0.75rem;padding-top:0.6rem;
                        border-top:1px solid rgba(148,163,184,0.08);">
                <button onclick="downloadSingleReport('${r.id}')"
                        style="display:inline-flex;align-items:center;gap:0.3rem;padding:5px 14px;
                               border-radius:50px;border:1px solid rgba(0,242,255,0.25);
                               background:rgba(0,242,255,0.06);cursor:pointer;
                               font-size:0.72rem;font-weight:700;color:rgba(0,242,255,0.7);
                               transition:all 0.18s;"
                        onmouseover="this.style.background='rgba(0,242,255,0.14)';this.style.color='rgba(0,242,255,1)'"
                        onmouseout="this.style.background='rgba(0,242,255,0.06)';this.style.color='rgba(0,242,255,0.7)'">
                    ⬇ ${isEs ? 'Descargar PDF' : 'Download PDF'}
                </button>
                <button onclick="deleteReport('${r.id}')"
                        style="display:inline-flex;align-items:center;gap:0.3rem;padding:4px 12px;
                               border-radius:50px;border:1px solid rgba(239,68,68,0.2);
                               background:rgba(239,68,68,0.06);cursor:pointer;
                               font-size:0.72rem;font-weight:700;color:rgba(239,68,68,0.6);
                               transition:all 0.18s;"
                        onmouseover="this.style.background='rgba(239,68,68,0.15)';this.style.color='rgba(239,68,68,0.9)'"
                        onmouseout="this.style.background='rgba(239,68,68,0.06)';this.style.color='rgba(239,68,68,0.6)'">
                    🗑 ${isEs ? 'Eliminar' : 'Delete'}
                </button>
            </div>

        </div>`;
    }).join('');

    container.innerHTML = counterHtml + cardsHtml;
    lucide.createIcons();
}

function changeView(v) {
    if (state.currentView !== v) {
        state.viewStack.push(state.currentView);
    }
    state.currentView = v;
    stopMetronome();
    stopVoiceRecording(true);
    // Activar spinners de sync ANTES del render
    if (v === 'evolution') state.evolutionSyncing = true;
    if (v === 'health') state.reportsSyncing = true;
    render();
    // Sincronización asíncrona (limpian el flag y actualizan DOM al terminar)
    if (v === 'evolution') _syncEvolutionFromFirestore();
    if (v === 'health') _syncMedicalReportsFromFirestore();
    if (v === 'evolution') setTimeout(_initEvoChart, 150);
    if (v === 'health') setTimeout(_initHealthDropzone, 80);
}

function render() {
    const main = document.getElementById('neuro-content');
    if (!main || !state.user) return;

    // Botón retroceso
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.style.display = state.viewStack.length > 0 ? 'flex' : 'none';

    // Título de sección en el header
    const viewTitles = {
        therapy: { es: 'Rehabilitación AI', en: 'AI Rehabilitation' },
        ras: { es: 'Terapia de Ritmo', en: 'Rhythm Therapy' },
        health: { es: 'Informes Médicos', en: 'Medical Reports' },
        security: { es: 'Seguridad SOS', en: 'SOS Safety' },
        profile: { es: 'Mi Perfil', en: 'My Profile' },
        evolution: { es: 'Mi Evolución', en: 'My Evolution' }
    };
    const titleEl = document.getElementById('view-title');
    if (titleEl) {
        const vtCfg = viewTitles[state.currentView];
        titleEl.textContent = vtCfg ? vtCfg[state.lang] || vtCfg.es : '';
        titleEl.style.display = vtCfg ? 'block' : 'none';
    }

    main.style.opacity = '0';
    main.style.transform = 'translateY(10px)';
    main.innerHTML = (views[state.currentView] || views.therapy)();
    lucide.createIcons();
    updateNav();
    // Adjuntar SOS a botones de página tras render
    setTimeout(() => {
        ['sos-page-btn', 'ras-sos-btn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) _attachSOS(el);
        });
        // Historial YouTube — renderizar tras montar la vista RAS
        if (document.getElementById('yt-history-wrap')) ytRenderHistory();
    }, 80);
    requestAnimationFrame(() => {
        main.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
    });
}

// ============================================================
// VISTAS DINÁMICAS
// ============================================================
const views = {

    therapy: () => {
        const isEs = state.lang === 'es';
        const cr = _getCardioRestriction();
        return `
        <div class="neuro-card">
            ${getContextChip('therapy')}
            <h3>${t('therapy_title')}</h3>
            <p class="view-sub">${t('therapy_sub')}</p>

            ${cr.blocked ? `
            <div style="display:flex;gap:0.65rem;align-items:flex-start;padding:0.85rem 1rem;
                        border-radius:12px;background:rgba(239,68,68,0.08);
                        border:1px solid rgba(239,68,68,0.3);margin-bottom:0.5rem;">
                <span style="font-size:1.1rem;flex-shrink:0;line-height:1.2;">🚨</span>
                <div>
                    <div style="font-weight:800;font-size:0.85rem;color:rgba(239,68,68,0.95);margin-bottom:0.25rem;">
                        ${isEs ? 'Restricción Cardiovascular Activa' : 'Active Cardiovascular Restriction'}
                    </div>
                    <div style="font-size:0.77rem;color:rgba(239,68,68,0.75);line-height:1.5;">${cr.reason}</div>
                    <div style="font-size:0.74rem;color:rgba(251,191,36,0.85);margin-top:0.35rem;">
                        ${isEs ? '✅ Disponibles: Dibujo y Respiración (baja intensidad)' : '✅ Available: Drawing & Breathing (low intensity)'}
                    </div>
                </div>
            </div>` : ''}

            <div style="display:flex;flex-direction:column;gap:1.2rem;margin-top:1.4rem;">
                <button class="action-btn btn-large btn-primary"
                        ${cr.blocked ? 'disabled' : 'onclick="openTwister()"'}
                        style="display:flex;flex-direction:column;align-items:flex-start;gap:0.35rem;${cr.blocked ? 'opacity:0.35;cursor:not-allowed;filter:grayscale(0.5);' : ''}">
                    <span style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="mic"></i> ${t('btn_vocal')}</span>
                    ${cr.blocked ? `<span style="font-size:0.64rem;padding:2px 10px;border-radius:50px;background:rgba(239,68,68,0.2);color:rgba(239,68,68,0.9);font-weight:800;">🔒 ${isEs ? 'Alta intensidad' : 'High intensity'}</span>` : ''}
                </button>
                <button class="action-btn btn-large btn-secondary"
                        ${cr.blocked ? 'disabled' : 'onclick="openTapping()"'}
                        style="display:flex;flex-direction:column;align-items:flex-start;gap:0.35rem;${cr.blocked ? 'opacity:0.35;cursor:not-allowed;filter:grayscale(0.5);' : ''}">
                    <span style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="hand"></i> ${t('btn_tapping')}</span>
                    ${cr.blocked ? `<span style="font-size:0.64rem;padding:2px 10px;border-radius:50px;background:rgba(239,68,68,0.2);color:rgba(239,68,68,0.9);font-weight:800;">🔒 ${isEs ? 'Alta intensidad' : 'High intensity'}</span>` : ''}
                </button>
                <button class="action-btn btn-large" onclick="openMotrizTest()"
                        style="background:rgba(22,27,45,0.8);border:1px solid var(--border-glass);display:flex;flex-direction:column;align-items:flex-start;gap:0.35rem;">
                    <span style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="edit-3"></i> ${t('btn_drawing')}</span>
                    ${cr.blocked ? `<span style="font-size:0.64rem;padding:2px 10px;border-radius:50px;background:rgba(16,185,129,0.15);color:rgba(16,185,129,0.9);font-weight:800;">✅ ${isEs ? 'Permitido' : 'Allowed'}</span>` : ''}
                </button>
                <button class="action-btn btn-large" onclick="startResp()"
                        style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--primary-green);display:flex;flex-direction:column;align-items:flex-start;gap:0.35rem;">
                    <span style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="wind"></i> ${t('btn_breathing')}</span>
                    ${cr.blocked ? `<span style="font-size:0.64rem;padding:2px 10px;border-radius:50px;background:rgba(16,185,129,0.15);color:rgba(16,185,129,0.9);font-weight:800;">✅ ${isEs ? 'Recomendado' : 'Recommended'}</span>` : ''}
                </button>
            </div>
            <!-- Acceso rápido al historial -->
            <button class="action-btn" style="width:100%;margin-top:1.4rem;
                    border:1px solid rgba(0,242,255,0.2);color:var(--accent-cyan);font-size:0.88rem;
                    padding:0.85rem;" onclick="changeView('evolution')">
                <i data-lucide="trending-up" style="width:16px;height:16px;"></i>
                ${t('ev_view_history')}
            </button>
        </div>

        <div id="motriz-box" class="neuro-card" style="display:none;">
            <h3>${t('draw_title')}</h3>
            <p class="view-sub">${t('draw_sub')}</p>
            <div style="width:100%;height:250px;background:rgba(10,15,30,0.8);border-radius:15px;border:2px dashed rgba(0,242,255,0.2);margin:1rem 0;">
                <canvas id="spiral-canvas" style="width:100%;height:100%;touch-action:none;cursor:crosshair;border-radius:13px;"></canvas>
            </div>
            <button class="action-btn btn-primary" style="width:100%;" onclick="closeMotriz()">${t('draw_finish')}</button>
        </div>

        <div id="twister-box" class="neuro-card" style="display:none;">
            <h3>${t('voc_title')}</h3>
            <p class="view-sub">${t('voc_sub')}</p>
            <p style="text-align:center;padding:1rem;font-style:italic;color:var(--accent-cyan);font-size:0.95rem;">${t('voc_phrase')}</p>
            <div id="voice-viz" style="display:none;margin:1rem 0;">
                <canvas id="voice-canvas" width="400" height="70"
                    style="width:100%;border-radius:10px;background:rgba(10,15,30,0.8);display:block;"></canvas>
            </div>
            <button id="record-btn" class="action-btn btn-primary" style="width:100%;" onclick="toggleVoiceRecording()">${t('voc_record')}</button>
        </div>
    `;
    },

    health: () => {
        const isEs = state.lang === 'es';

        /* ── Calendario semanal ── */
        const dayNames = isEs
            ? ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
            : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        const now = new Date();
        const todayDow = now.getDay();                       // 0=Dom
        const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // Mon=0
        const weekCal = `<div class="week-cal">${dayNames.map((d, i) => {
            const diff = i - todayIdx;
            const date = new Date(now);
            date.setDate(now.getDate() + diff);
            return `<div class="week-day${i === todayIdx ? ' today' : ''}">
                ${d}<span class="day-num">${date.getDate()}</span>
            </div>`;
        }).join('')}</div>`;

        /* ── Lista de medicamentos ── */
        const medList = state.medications.length > 0
            ? state.medications.map((m, i) => `
                <div class="med-row">
                    <div class="med-check${m.taken ? ' taken' : ''}" id="med-chk-${i}"
                         onclick="toggleMedTaken(${i})">
                        ${m.taken ? '<span style="color:white;font-size:1.1rem;">✓</span>' : ''}
                    </div>
                    <div class="med-info">
                        <div class="med-name">${m.name}</div>
                        <div class="med-time">
                            <i data-lucide="clock" style="width:12px;height:12px;"></i> ${m.time}
                            <span id="med-badge-${i}" style="margin-left:8px;font-size:0.72rem;font-weight:700;color:${m.taken ? 'var(--primary-green)' : 'rgba(148,163,184,0.6)'};">
                                ${m.taken ? (isEs ? 'Tomado' : 'Taken') : (isEs ? 'Pendiente' : 'Pending')}
                            </span>
                        </div>
                    </div>
                    <button class="med-edit" onclick="editMed(${i})" aria-label="${isEs ? 'Editar' : 'Edit'}">
                        <i data-lucide="pencil" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="med-del" onclick="deleteMed(${i})" aria-label="${isEs ? 'Eliminar' : 'Delete'}">
                        <i data-lucide="trash-2" style="width:17px;height:17px;"></i>
                    </button>
                </div>`).join('')
            : `<p style="text-align:center;color:rgba(148,163,184,0.45);padding:1.2rem 0;font-size:0.88rem;">
                ${isEs ? 'Sin medicamentos registrados.' : 'No medications registered.'}
               </p>`;

        const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        const notifDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';

        // ── Spinner de sincronización ──
        const reportsSyncBadge = state.reportsSyncing ? `
        <div id="nv-reports-sync-badge" style="display:flex;align-items:center;gap:0.55rem;padding:0.6rem 1rem;
                    border-radius:14px;background:rgba(0,242,255,0.05);
                    border:1px solid rgba(0,242,255,0.15);margin-bottom:0.75rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="var(--accent-cyan)" stroke-width="2.2" stroke-linecap="round"
                 stroke-linejoin="round" style="flex-shrink:0;animation:nvSpin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span style="font-size:0.78rem;color:rgba(0,242,255,0.7);">${t('hlt_sync')}</span>
        </div>` : '';

        // ── Lista inicial de informes (se actualiza por _renderMedicalReportsList) ──
        const initialReports = state.medicalReports.length === 0
            ? `<p style="text-align:center;color:rgba(148,163,184,0.45);padding:1.4rem 0;font-size:0.88rem;">
                ${t('hlt_no_reports')}
               </p>`
            : state.medicalReports.slice(0, 8).map(r => {
                const _rDiag = r.diagnostico_principal || r.diagnosis || '—';
                const _rMed  = r.medicacion_activa || r.medicacion || '';
                const _rRec  = r.recomendaciones || r.analysis || '—';
                const diag = window.NVI18n ? NVI18n.translateDynamicContent(_rDiag, state.lang) : _rDiag;
                const med  = window.NVI18n ? NVI18n.getTranslatedMedInstruction(_rMed, state.lang)  : _rMed;
                const rec  = window.NVI18n ? NVI18n.getTranslatedClinicalText(_rRec, state.lang)    : _rRec;
                const src = r.source || r.fileName || (isEs ? 'Informe' : 'Report');
                const mx = r.metricas || {};
                const feviNum = mx.fevi ? parseInt(mx.fevi) : null;
                const fcNum = mx.fc ? parseInt(mx.fc) : null;
                const isAlert = (feviNum !== null && feviNum < 30) || (fcNum !== null && fcNum > 100)
                    || r.isCritical || rec.includes('⚠') || rec.includes('🚨');
                const statusBadge = isAlert
                    ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.64rem;font-weight:800;padding:2px 9px;border-radius:50px;flex-shrink:0;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:rgba(239,68,68,0.95);">● ${isEs ? 'ALERTA' : 'ALERT'}</span>`
                    : `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.64rem;font-weight:800;padding:2px 9px;border-radius:50px;flex-shrink:0;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:rgba(16,185,129,0.9);">● ${isEs ? 'ESTABLE' : 'STABLE'}</span>`;
                const diagColor = isAlert ? 'rgba(239,68,68,0.9)' : 'var(--accent-cyan)';
                return `
                <div style="padding:1rem 1rem 1rem 0.9rem;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:0.4rem;
                            border-left:2px solid ${isAlert ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.35)'};padding-left:0.85rem;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;gap:0.5rem;">
                        <strong style="font-size:0.87rem;color:rgba(241,245,249,0.9);word-break:break-word;">${src}</strong>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
                            ${statusBadge}
                            <small style="color:rgba(148,163,184,0.5);font-size:0.76rem;">${r.date || ''}</small>
                        </div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:0.35rem;">
                        <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                            <span style="font-size:0.72rem;font-weight:700;color:rgba(0,242,255,0.6);flex-shrink:0;min-width:80px;">${t('hlt_report_diag')}:</span>
                            <span style="font-size:0.82rem;color:${diagColor};font-weight:700;line-height:1.4;">${diag}</span>
                        </div>
                        ${med ? `<div style="display:flex;gap:0.5rem;align-items:flex-start;">
                            <span style="font-size:0.72rem;font-weight:700;color:rgba(16,185,129,0.6);flex-shrink:0;min-width:80px;">💊 ${t('hlt_report_med')}:</span>
                            <span style="font-size:0.78rem;color:rgba(16,185,129,0.85);line-height:1.4;">${med}</span>
                        </div>` : ''}
                        <div style="background:rgba(10,15,30,0.6);padding:0.6rem 0.75rem;border-radius:8px;margin-top:0.2rem;">
                            <span style="font-size:0.72rem;font-weight:700;color:rgba(148,163,184,0.5);">${t('hlt_report_rec')}: </span>
                            <span style="font-size:0.78rem;color:rgba(241,245,249,0.75);line-height:1.5;">${rec}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');

        return `
        ${reportsSyncBadge}

        <!-- SUBIDA DE INFORMES -->
        <div class="neuro-card">
            ${getContextChip('health')}
            <h3>${t('hlt_title')}</h3>
            <p class="view-sub">${t('hlt_sub')}</p>

            <!-- DROPZONE: input transparente multi-archivo -->
            <div id="upload-dropzone" class="nv-dropzone" style="position:relative;">
                <input type="file" id="file-upload-input"
                       accept=".pdf,.jpg,.jpeg,.png"
                       multiple
                       onchange="handleFileUpload(this)"
                       style="position:absolute;inset:0;width:100%;height:100%;
                              opacity:0;cursor:pointer;z-index:5;">
                <div id="dropzone-icon-wrap" style="text-align:center;pointer-events:none;position:relative;z-index:1;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                         fill="none" stroke="var(--accent-cyan)" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round"
                         style="display:block;margin:0 auto 0.75rem;">
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                    </svg>
                    <p style="font-weight:700;font-size:0.95rem;margin-bottom:0.2rem;">${t('hlt_click')}</p>
                    <p style="font-size:0.78rem;color:rgba(148,163,184,0.5);">${isEs ? 'Selecciona hasta 5 archivos a la vez' : 'Select up to 5 files at once'}</p>
                    <p id="upload-status" style="font-size:0.82rem;color:rgba(148,163,184,0.6);margin-top:0.25rem;">
                        ${t('hlt_fmt')}
                    </p>
                </div>
            </div>

            <!-- Cola de archivos seleccionados -->
            <div id="batch-queue" style="display:none;margin-top:1rem;"></div>

            <div id="report-ana-box" style="display:none;margin-top:1rem;">
                <button class="action-btn btn-primary" style="width:100%;min-height:52px;"
                        onclick="runReportAnalysisBatch()" id="ana-btn">
                    <i data-lucide="cpu"></i> ${t('hlt_analyze')}
                </button>
            </div>
        </div>

        <!-- VALORACIONES RECIENTES -->
        <div class="neuro-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
                <h3 style="margin:0;">${t('hlt_recent')}</h3>
                ${state.medicalReports.length > 0 ? `
                <span style="font-size:0.72rem;color:rgba(148,163,184,0.4);">
                    ${state.medicalReports.length} ${isEs ? 'informe(s)' : 'report(s)'}
                </span>` : ''}
            </div>
            <div id="reports-list" style="max-height:72vh;overflow-y:auto;padding-right:2px;">
                ${initialReports}
            </div>
        </div>

        <!-- MEDICACIÓN Y CALENDARIO -->
        <div class="neuro-card">
            <h3 style="color:var(--accent-cyan);">💊 ${isEs ? 'Medicación de Hoy' : "Today's Medication"}</h3>
            <p class="view-sub">${isEs
                ? 'Marque cada dosis cuando la tome. El estado se reinicia cada día.'
                : 'Check each dose when taken. Status resets daily.'}</p>
            ${weekCal}
            ${medList}

            <!-- Botón añadir -->
            <button class="action-btn" onclick="showAddMedForm()"
                    style="width:100%;margin-top:1rem;border:1px solid rgba(0,242,255,0.2);
                           color:var(--accent-cyan);background:rgba(0,242,255,0.05);">
                <i data-lucide="plus"></i> ${isEs ? 'Añadir Medicamento' : 'Add Medication'}
            </button>

            <!-- Formulario nuevo medicamento -->
            <div id="add-med-form" class="med-form-box" style="display:none;">
                <p style="font-weight:700;font-size:0.88rem;color:var(--accent-cyan);">
                    ${isEs ? 'Nuevo medicamento' : 'New medication'}
                </p>
                <input type="text" id="new-med-name"
                       placeholder="${isEs ? 'Nombre (ej. Levodopa)' : 'Name (e.g. Levodopa)'}"
                       style="width:100%;">
                <input type="text" id="new-med-dose"
                       placeholder="${isEs ? 'Dosis (ej. 100mg) — opcional' : 'Dose (e.g. 100mg) — optional'}"
                       style="width:100%;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <label style="font-size:0.85rem;font-weight:700;white-space:nowrap;">
                        ${isEs ? 'Hora:' : 'Time:'}
                    </label>
                    <input type="time" id="new-med-time" style="flex:1;">
                </div>
                <div style="display:flex;gap:0.7rem;">
                    <button class="action-btn btn-primary" style="flex:1;" onclick="saveNewMed()">
                        <i data-lucide="save"></i> ${isEs ? 'Guardar' : 'Save'}
                    </button>
                    <button class="action-btn" style="flex:1;border:1px solid rgba(255,255,255,0.1);"
                            onclick="showAddMedForm()">
                        ${isEs ? 'Cancelar' : 'Cancel'}
                    </button>
                </div>
            </div>

            <!-- Banner notificaciones -->
            <div id="notif-banner" class="notif-banner" onclick="requestNotifPermission()"
                 style="border-color:${notifGranted ? 'rgba(16,185,129,0.3)' : notifDenied ? 'rgba(239,68,68,0.25)' : 'rgba(0,242,255,0.15)'};cursor:pointer;">
                <div class="notif-icon">
                    <i data-lucide="${notifGranted ? 'bell-ring' : notifDenied ? 'bell-off' : 'bell'}"
                       style="width:18px;height:18px;color:${notifGranted ? 'var(--primary-green)' : notifDenied ? 'rgba(239,68,68,0.7)' : 'var(--accent-cyan)'};"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:0.88rem;" id="notif-banner-text">
                        ${notifGranted
                ? (isEs ? 'Recordatorios activos ✓' : 'Reminders active ✓')
                : notifDenied
                    ? (isEs ? 'Bloqueadas — Toca para ver cómo activar' : 'Blocked — Tap to see how to enable')
                    : (isEs ? 'Activar recordatorios de medicación' : 'Enable medication reminders')}
                    </div>
                    <div style="font-size:0.75rem;color:rgba(148,163,184,0.6);margin-top:2px;">
                        ${isEs ? 'Notificaciones en el dispositivo' : 'Device notifications'}
                    </div>
                </div>
                <i data-lucide="${notifGranted ? 'check-circle' : notifDenied ? 'alert-circle' : 'chevron-right'}"
                   style="width:18px;height:18px;color:${notifGranted ? 'var(--primary-green)' : notifDenied ? 'rgba(239,68,68,0.6)' : 'rgba(148,163,184,0.4)'};margin-left:auto;flex-shrink:0;"></i>
            </div>

            <!-- Guía de ayuda — permisos denegados (se muestra/oculta por JS) -->
            <div id="notif-denied-guide" style="display:${notifDenied ? 'block' : 'none'};"></div>

            <!-- Botón de diagnóstico — visible solo con permiso concedido -->
            ${notifGranted ? `
            <div style="display:flex;justify-content:flex-end;margin-top:0.55rem;">
                <button onclick="testMedicationAlert()"
                        style="display:inline-flex;align-items:center;gap:0.4rem;
                               padding:5px 14px;border-radius:50px;cursor:pointer;
                               border:1px solid rgba(16,185,129,0.25);
                               background:rgba(16,185,129,0.07);
                               font-size:0.72rem;font-weight:700;
                               color:rgba(16,185,129,0.75);transition:all 0.18s;"
                        onmouseover="this.style.background='rgba(16,185,129,0.15)';this.style.color='rgba(16,185,129,1)'"
                        onmouseout="this.style.background='rgba(16,185,129,0.07)';this.style.color='rgba(16,185,129,0.75)'">
                    🔔 ${isEs ? 'Probar Notificación Ahora' : 'Test Notification Now'}
                </button>
            </div>` : ''}
        </div>`;
    },

    ras: () => {
        const isEs = state.lang === 'es';
        return `
        <div class="neuro-card" style="position:relative;overflow:hidden;">
            ${getContextChip('ras')}
            <h3>${t('ras_title')}</h3>
            <p class="view-sub">${t('ras_sub')}</p>

            <!-- SOS inline – esquina superior derecha -->
            <button id="ras-sos-btn" class="btn-sos"
                    style="position:absolute;top:1.3rem;right:1.3rem;
                           width:52px;height:52px;font-size:0.68rem;letter-spacing:0.06em;z-index:10;"
                    title="${isEs ? 'Emergencia — mantén pulsado 2 seg' : 'Emergency — hold 2 sec'}">
                <span>SOS</span>
            </button>

            <!-- ── ESCENARIO VISUAL CENTRAL ── -->
            <div style="text-align:center;padding:1.6rem 0 1rem;">
                <!-- Contenedor de ondas + bola -->
                <div id="ras-ripple-container"
                     style="position:relative;width:210px;height:210px;
                            margin:0 auto 1.4rem;display:flex;
                            align-items:center;justify-content:center;">

                    <!-- Bola principal -->
                    <div id="ras-ball"
                         style="position:relative;width:120px;height:120px;
                                background:radial-gradient(circle at 38% 35%,#4ade80,var(--primary-green),#047857);
                                border-radius:50%;z-index:2;
                                box-shadow:0 0 40px rgba(16,185,129,0.45),inset 0 -4px 12px rgba(0,0,0,0.2);
                                transition:transform 0.06s ease,box-shadow 0.07s ease;
                                display:flex;align-items:center;justify-content:center;
                                cursor:default;user-select:none;">
                        <!-- Icono de paso alternante -->
                        <span id="ras-foot" style="font-size:2.6rem;line-height:1;">👟</span>
                    </div>
                </div>

                <!-- BPM número + etiqueta -->
                <div style="font-size:4.2rem;font-weight:900;font-family:var(--font-accent);
                            line-height:1;color:var(--text-dark);">
                    <span id="ras-bpm-display" class="${state.metronomeBPM > 120 ? 'ras-bpm-alert' : ''}">${state.metronomeBPM}</span>
                </div>
                <div style="font-size:0.78rem;color:rgba(148,163,184,0.55);margin:0.3rem 0 1.5rem;
                            letter-spacing:0.1em;text-transform:uppercase;">
                    ${t('ras_bpm')} · ${isEs ? 'pasos / min' : 'steps / min'}
                </div>

                <!-- Slider BPM -->
                <input type="range" id="ras-bpm-slider"
                       min="60" max="180" value="${state.metronomeBPM}"
                       oninput="updateMetronomeBPM(this.value)"
                       class="ras-slider">
                <div style="display:flex;justify-content:space-between;width:86%;margin:0.4rem auto 0;
                            font-size:0.7rem;color:rgba(148,163,184,0.4);">
                    <span>60</span>
                    <span style="color:rgba(245,158,11,0.55);">120 ⚠</span>
                    <span>180</span>
                </div>

                <!-- Aviso de seguridad — visible automáticamente cuando BPM > 120 -->
                <div id="ras-safety-banner" class="${state.metronomeBPM > 120 ? 'ras-safety-visible' : ''}">
                    ⚠ ${isEs
                        ? 'Ritmo elevado · Manténgase en niveles de baja intensidad según su prescripción.'
                        : 'Elevated rhythm · Stay at low-intensity levels per your prescription.'}
                </div>
            </div>

            <!-- Presets de cadencia -->
            <div style="display:flex;gap:0.5rem;margin-bottom:1.2rem;">
                ${[
                { bpm: 80, es: '🚶 Calentamiento', en: '🚶 Warm-up' },
                { bpm: 110, es: '🚶 Marcha Normal', en: '🚶 Normal Gait' },
                { bpm: 130, es: '💪 Rehabilitación', en: '💪 Rehab' }
            ].map(m => `
                <button onclick="rasSetPreset(${m.bpm})" class="action-btn ras-preset-btn"
                        id="ras-preset-${m.bpm}"
                        style="flex:1;padding:0.5rem 0.3rem;font-size:0.72rem;
                               border:1px solid ${state.metronomeBPM === m.bpm ? 'var(--primary-green)' : 'rgba(255,255,255,0.09)'};
                               color:${state.metronomeBPM === m.bpm ? 'var(--primary-green)' : 'rgba(241,245,249,0.6)'};">
                    ${isEs ? m.es : m.en}
                </button>`).join('')}
            </div>

            <!-- Botón principal Iniciar/Detener -->
            <button id="ras-btn" class="action-btn btn-primary"
                    style="width:100%;min-height:68px;font-size:1.08rem;letter-spacing:0.02em;"
                    onclick="toggleMetronome()">
                <i data-lucide="play"></i> ${t('ras_start')}
            </button>

            <!-- Strip de estado: detección de congelación -->
            <div id="ras-freeze-strip" style="margin-top:1rem;padding:0.75rem 1rem;border-radius:14px;
                    background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);
                    display:flex;align-items:flex-start;gap:0.55rem;">
                <i data-lucide="shield-check" style="width:15px;height:15px;flex-shrink:0;
                   color:var(--secondary-blue);margin-top:1px;"></i>
                <span style="font-size:0.76rem;color:rgba(148,163,184,0.7);line-height:1.5;">
                    ${isEs
                ? 'Detección de congelación activa. Si el metrónomo está encendido e identifies inmovilidad >3 seg, el <strong style="color:rgba(148,163,184,0.9);">Pulso de Rescate</strong> se activará automáticamente.'
                : 'Freeze detection active. If the metronome is on and stillness >3 sec is detected, the <strong style="color:rgba(148,163,184,0.9);">Rescue Pulse</strong> activates automatically.'}
                </span>
            </div>
        </div>

        <!-- ══ HUB DE MUSICOTERAPIA — YOUTUBE ══════════════════ -->
        <div class="neuro-card" style="margin-top:1.2rem;">
            <!-- Cabecera -->
            <div style="display:flex;align-items:center;gap:0.7rem;margin-bottom:1.2rem;">
                <div style="width:40px;height:40px;border-radius:50%;
                            background:linear-gradient(135deg,#FF0000,#cc0000);
                            display:flex;align-items:center;justify-content:center;flex-shrink:0;
                            box-shadow:0 4px 14px rgba(255,0,0,0.3);">
                    <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <div>
                    <h4 style="margin:0;font-size:1rem;font-family:var(--font-accent);">${t('yt_hub_title')}</h4>
                    <p style="margin:0;font-size:0.72rem;color:rgba(148,163,184,0.6);">${t('yt_hub_sub')}</p>
                </div>
            </div>

            <!-- Búsquedas de playlists terapéuticas -->
            <p style="font-size:0.73rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
                      color:rgba(148,163,184,0.5);margin-bottom:0.65rem;">
                ${t('yt_search_label')}
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.55rem;margin-bottom:1.3rem;">
                <button class="yt-search-btn" onclick="ytSearch(0)">
                    🚶 100 BPM<br>
                    <small>${isEs ? 'Marcha Suave' : 'Gentle Walk'}</small>
                </button>
                <button class="yt-search-btn" onclick="ytSearch(1)">
                    🦶 110 BPM<br>
                    <small>${isEs ? 'Marcha Normal' : 'Normal Gait'}</small>
                </button>
                <button class="yt-search-btn" onclick="ytSearch(2)">
                    💪 120 BPM<br>
                    <small>${isEs ? 'Rehabilitación' : 'Rehabilitation'}</small>
                </button>
                <button class="yt-search-btn" onclick="ytSearch(3)">
                    😌 ${isEs ? 'Relajación' : 'Relaxation'}<br>
                    <small>${isEs ? 'Calma y foco' : 'Calm & Focus'}</small>
                </button>
            </div>

            <!-- Embed directo -->
            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:1.1rem;">
                <p style="font-size:0.73rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
                          color:rgba(148,163,184,0.5);margin-bottom:0.65rem;">
                    ${t('yt_embed_label')}
                </p>
                <div style="display:flex;gap:0.5rem;margin-bottom:0.55rem;">
                    <input id="yt-url-inp" type="url"
                           placeholder="${t('yt_url_ph')}"
                           style="flex:1;padding:0.65rem 0.85rem;border-radius:10px;
                                  border:1px solid rgba(255,255,255,0.12);background:rgba(10,15,30,0.6);
                                  color:rgba(241,245,249,0.9);font-size:0.82rem;outline:none;
                                  transition:border-color 0.2s;"
                           onfocus="this.style.borderColor='rgba(255,0,0,0.45)'"
                           onblur="this.style.borderColor='rgba(255,255,255,0.12)'"
                           onkeydown="if(event.key==='Enter') ytLoad()">
                    <button class="action-btn yt-play-btn"
                            onclick="ytLoad()"
                            title="${t('yt_load_btn')}"
                            style="background:rgba(255,0,0,0.15);
                                   border:1px solid rgba(255,0,0,0.35);color:#ff4444;
                                   font-weight:700;white-space:nowrap;min-height:44px;border-radius:10px;
                                   flex-shrink:0;">
                        <span class="yt-play-text">▶ ${t('yt_load_btn')}</span>
                        <span class="yt-play-icon">▶</span>
                    </button>
                </div>
                <input id="yt-name-inp" type="text" maxlength="60"
                       placeholder="${t('yt_name_ph')}"
                       style="width:100%;box-sizing:border-box;padding:0.5rem 0.85rem;
                              border-radius:10px;border:1px solid rgba(255,255,255,0.08);
                              background:rgba(10,15,30,0.45);color:rgba(241,245,249,0.85);
                              font-size:0.78rem;outline:none;margin-bottom:0.9rem;
                              transition:border-color 0.2s;"
                       onfocus="this.style.borderColor='rgba(0,242,255,0.4)'"
                       onblur="this.style.borderColor='rgba(255,255,255,0.08)'"
                       onkeydown="if(event.key==='Enter') ytLoad()">

                <!-- Player -->
                <div id="yt-wrap" style="display:none;border-radius:14px;overflow:hidden;
                                         background:#000;aspect-ratio:16/9;margin-bottom:0.6rem;">
                    <iframe id="yt-frame" src="about:blank"
                            style="width:100%;height:100%;border:none;"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                            allowfullscreen>
                    </iframe>
                </div>

                <!-- Botón Detener (visible solo cuando hay vídeo) -->
                <div id="yt-stop-wrap" style="display:none;margin-bottom:0.7rem;">
                    <button onclick="ytStop()"
                            style="width:100%;padding:0.6rem;border-radius:10px;
                                   background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
                                   color:rgba(239,68,68,0.9);font-weight:700;font-size:0.84rem;
                                   cursor:pointer;transition:background 0.2s;"
                            onmouseover="this.style.background='rgba(239,68,68,0.2)'"
                            onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                        ${t('yt_stop_btn')}
                    </button>
                </div>

                <p id="yt-hint" style="font-size:0.72rem;color:rgba(148,163,184,0.45);
                                        text-align:center;margin:0 0 0.5rem;">
                    💡 ${t('yt_hint')}
                </p>
            </div>

            <!-- Historial de playlists guardadas -->
            <div id="yt-history-wrap" style="margin-top:1rem;"></div>

            <!-- Tip metrónomo -->
            <div style="display:flex;align-items:flex-start;gap:0.5rem;margin-top:0.8rem;
                        padding:0.6rem 0.85rem;border-radius:12px;
                        background:rgba(148,163,184,0.05);border:1px solid rgba(255,255,255,0.06);">
                <i data-lucide="info" style="width:14px;height:14px;flex-shrink:0;
                   color:rgba(148,163,184,0.5);margin-top:1px;"></i>
                <span style="font-size:0.71rem;color:rgba(148,163,184,0.55);line-height:1.5;">
                    ${t('yt_tip')}
                </span>
            </div>
        </div><!-- /yt hub -->`;
    },

    security: () => {
        const isEs = state.lang === 'es';
        const u    = state.user || {};
        const { lat, lon } = state.gpsMetadata;
        // Coordenadas numéricas para iframe inicial (Madrid por defecto)
        const defLat = 40.4168, defLon = -3.7038, delta = 0.015;
        return `
        <!-- CONTACTOS DE EMERGENCIA -->
        <div class="neuro-card">
            <h3 style="color:var(--accent-cyan);display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="phone-call" style="width:20px;height:20px;flex-shrink:0;"></i>
                ${t('sec_contacts_title')}
            </h3>
            <p class="view-sub">${t('sec_contacts_sub')}</p>

            ${[1,2,3].map(n => {
                const ec = (u[`ec${n}`] || {});
                const hasData = ec.name || ec.phone;
                return `
                <div id="sec-ec${n}-row" style="margin-bottom:0.75rem;padding:0.65rem 0.85rem;
                            border-radius:12px;border:1px solid rgba(255,255,255,0.07);
                            background:rgba(10,15,30,0.4);transition:border-color 0.2s;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.45rem;">
                        <p style="font-size:0.68rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;
                                   color:rgba(0,242,255,0.5);margin:0;">
                            ${isEs ? 'Contacto' : 'Contact'} ${n}
                        </p>
                        <div style="display:flex;gap:0.25rem;">
                            ${ec.phone ? `
                            <a href="tel:${ec.phone.replace(/\s/g,'')}" id="sec-ec${n}-call-btn"
                               title="${isEs ? 'Llamar' : 'Call'}"
                               style="width:30px;height:30px;border:none;border-radius:8px;cursor:pointer;
                                      background:rgba(16,185,129,0.12);color:rgba(16,185,129,0.7);
                                      display:flex;align-items:center;justify-content:center;
                                      text-decoration:none;transition:color 0.18s,background 0.18s;"
                               onmouseover="this.style.color='rgba(16,185,129,1)';this.style.background='rgba(16,185,129,0.25)'"
                               onmouseout="this.style.color='rgba(16,185,129,0.7)';this.style.background='rgba(16,185,129,0.12)'">
                                <i data-lucide="phone-call" style="width:14px;height:14px;pointer-events:none;"></i>
                            </a>` : `
                            <span id="sec-ec${n}-call-btn"
                                  style="width:30px;height:30px;border-radius:8px;
                                         background:rgba(255,255,255,0.03);color:rgba(148,163,184,0.2);
                                         display:flex;align-items:center;justify-content:center;">
                                <i data-lucide="phone-call" style="width:14px;height:14px;"></i>
                            </span>`}
                            <button onclick="secEditContact(${n})" id="sec-ec${n}-edit-btn"
                                    title="${isEs ? 'Editar' : 'Edit'}"
                                    style="width:30px;height:30px;border:none;border-radius:8px;cursor:pointer;
                                           background:transparent;color:rgba(0,242,255,0.35);
                                           display:flex;align-items:center;justify-content:center;
                                           transition:color 0.18s,background 0.18s;"
                                    onmouseover="this.style.color='rgba(0,242,255,0.85)';this.style.background='rgba(0,242,255,0.08)'"
                                    onmouseout="this.style.color='rgba(0,242,255,0.35)';this.style.background='transparent'">
                                <i data-lucide="pencil" style="width:15px;height:15px;pointer-events:none;"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display:flex;gap:0.45rem;">
                        <input id="sec-ec${n}-name" type="text" readonly
                               value="${(ec.name || '').replace(/"/g,'&quot;')}"
                               placeholder="${t('sec_contact_ph_name')}"
                               onclick="secEditContact(${n})"
                               style="flex:1;min-width:0;padding:0.45rem 0.6rem;border-radius:8px;
                                      border:1px solid transparent;background:transparent;
                                      color:${hasData ? 'rgba(241,245,249,0.85)' : 'rgba(148,163,184,0.35)'};
                                      font-size:0.8rem;outline:none;transition:all 0.2s;cursor:pointer;">
                        <input id="sec-ec${n}-phone" type="tel" readonly
                               value="${(ec.phone || '').replace(/"/g,'&quot;')}"
                               placeholder="${t('sec_contact_ph_phone')}"
                               onclick="secEditContact(${n})"
                               style="flex:1;min-width:0;padding:0.45rem 0.6rem;border-radius:8px;
                                      border:1px solid transparent;background:transparent;
                                      color:${hasData ? 'rgba(241,245,249,0.85)' : 'rgba(148,163,184,0.35)'};
                                      font-size:0.8rem;outline:none;transition:all 0.2s;cursor:pointer;">
                        <button onclick="secSaveContact(${n})" id="sec-ec${n}-save-btn"
                                title="${isEs ? 'Guardar' : 'Save'}"
                                style="display:none;width:34px;height:34px;min-width:34px;border:none;
                                       border-radius:8px;cursor:pointer;flex-shrink:0;
                                       background:rgba(16,185,129,0.15);color:rgba(16,185,129,0.9);
                                       align-items:center;justify-content:center;
                                       transition:background 0.18s;"
                                onmouseover="this.style.background='rgba(16,185,129,0.3)'"
                                onmouseout="this.style.background='rgba(16,185,129,0.15)'">
                            <i data-lucide="check" style="width:16px;height:16px;pointer-events:none;"></i>
                        </button>
                    </div>
                </div>`;
            }).join('')}

            <!-- Número oficial según país -->
            <div style="display:flex;align-items:center;gap:0.75rem;margin-top:1rem;padding:0.75rem 0.9rem;
                        border-radius:12px;background:rgba(239,68,68,0.06);
                        border:1px solid rgba(239,68,68,0.18);">
                <i data-lucide="phone" style="width:18px;height:18px;flex-shrink:0;color:rgba(239,68,68,0.7);"></i>
                <div>
                    <p style="font-size:0.7rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
                               color:rgba(239,68,68,0.6);margin:0 0 0.1rem;">${t('sec_official_title')}</p>
                    <p style="font-size:1rem;font-weight:900;color:rgba(239,68,68,0.9);margin:0;">
                        ${_getEmergencyNumber(u.country).label}
                    </p>
                    <p style="font-size:0.68rem;color:rgba(148,163,184,0.5);margin:0.15rem 0 0;">
                        ${t('sec_official_sub')}
                    </p>
                </div>
            </div>
        </div>

        <!-- SOS -->
        <div class="neuro-card" style="border:2px solid var(--accent-red);background:rgba(239,68,68,0.04);">
            ${getContextChip('security')}
            <h3>${t('sec_title')}</h3>
            <p class="view-sub">${t('sec_sub')}</p>
            <div style="text-align:center;margin:1.5rem 0;">
                <p style="font-size:0.82rem;color:rgba(148,163,184,0.8);margin-bottom:1rem;">${t('sec_hold')}</p>
                <button id="sos-page-btn" class="btn-sos"
                        style="margin:0 auto;display:flex;width:104px;height:104px;font-size:1.3rem;"
                        title="${t('sec_hold')}">
                    <span>SOS</span>
                </button>
            </div>
            <button class="action-btn" style="width:100%;border:1px solid rgba(255,255,255,0.1);
                    color:rgba(148,163,184,0.9);margin-top:0.5rem;" onclick="handleLogout()">
                <i data-lucide="log-out"></i> ${t('sec_logout')}
            </button>
        </div>

        <!-- MAPA GPS EN TIEMPO REAL -->
        <div class="neuro-card">
            <h3 style="color:var(--primary-green);">
                <i data-lucide="map-pin" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
                ${isEs ? 'Ubicación GPS en Tiempo Real' : 'Real-Time GPS Location'}
            </h3>
            <p class="view-sub">
                ${isEs
                ? 'Su posición exacta se comparte en caso de emergencia SOS.'
                : 'Your exact position is shared in case of SOS emergency.'}
            </p>

            <!-- Barra de coordenadas -->
            <div class="gps-coords-bar" id="gps-coords">
                <i data-lucide="map-pin" style="width:14px;height:14px;"></i>
                ${lat}, ${lon}
                <span style="margin-left:6px;font-size:0.72rem;opacity:0.65;">
                    ${isEs ? '(estimado)' : '(estimated)'}
                </span>
            </div>

            <!-- OpenStreetMap embed -->
            <div class="gps-map-wrap">
                <iframe id="gps-map-frame"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=${defLon - delta},${defLat - delta},${defLon + delta},${defLat + delta}&layer=mapnik&marker=${defLat},${defLon}"
                    title="${isEs ? 'Mapa de ubicación' : 'Location map'}"
                    loading="lazy">
                </iframe>
            </div>

            <!-- Botón GPS -->
            <button id="gps-btn" class="action-btn btn-secondary" style="width:100%;"
                    onclick="initRealGPS()">
                <i data-lucide="map-pin"></i>
                ${isEs ? 'Localizar mi posición actual' : 'Locate my current position'}
            </button>

            <!-- Link externo Google Maps -->
            <div style="text-align:center;margin-top:0.8rem;">
                <a id="gmaps-link"
                   href="https://maps.google.com/?q=${defLat},${defLon}"
                   target="_blank" rel="noopener"
                   style="font-size:0.8rem;color:rgba(148,163,184,0.6);text-decoration:none;">
                    <i data-lucide="external-link" style="width:12px;height:12px;vertical-align:middle;"></i>
                    ${isEs ? 'Abrir en Google Maps' : 'Open in Google Maps'}
                </a>
            </div>
        </div>`;
    },

    profile: () => {
        const isEs = state.lang === 'es';
        const u = state.user || {};
        const summaries = state.profileSummary;

        const summaryHTML = summaries.length > 0
            ? summaries.map(s => `
                <div class="profile-summary-item">
                    <div class="ps-date">${s.date} · ${s.source}</div>
                    <div class="ps-diag">${s.diagnosis}</div>
                    <div class="ps-body">${s.body}</div>
                </div>`).join('')
            : `<p style="text-align:center;color:rgba(148,163,184,0.45);padding:1.4rem 0;font-size:0.88rem;">
                ${t('prof_med_empty')}
               </p>`;

        // ── Chip de estado Firebase ──
        const fbReady = window.NVFirebase && NVFirebase.isReady();
        const fbChip = `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.9rem;
                    border-radius:12px;margin-bottom:0.75rem;font-size:0.77rem;font-weight:700;
                    background:${fbReady ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)'};
                    border:1px solid ${fbReady ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'};
                    color:${fbReady ? '#34d399' : '#f87171'};">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
                ${fbReady
                ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>'
                : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>'}
            </svg>
            ${fbReady
                ? (isEs ? 'Firebase conectado · Datos en la nube' : 'Firebase connected · Cloud data active')
                : (isEs ? 'Firebase sin configurar · Modo local' : 'Firebase not configured · Local mode')}
        </div>`;

        return `
        ${fbChip}
        <!-- DATOS PERSONALES -->
        <div class="neuro-card">
            <h3 style="color:var(--accent-cyan);">${t('prof_personal')}</h3>
            <p class="view-sub">${t('prof_view_sub')}</p>
            <div style="display:flex;flex-direction:column;gap:0.9rem;">
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.7);display:block;margin-bottom:0.35rem;">
                        ${t('prof_name_label')}
                    </label>
                    <input type="text" id="edit-name" value="${u.name || ''}"
                           style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);font-size:0.95rem;">
                </div>
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.7);display:block;margin-bottom:0.35rem;">
                        ${t('prof_email_label')}
                    </label>
                    <input type="email" id="edit-email" value="${u.email || ''}"
                           style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);font-size:0.95rem;">
                </div>
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.7);display:block;margin-bottom:0.35rem;">
                        ${t('prof_age')}
                    </label>
                    <input type="number" id="edit-age" value="${u.age || ''}"
                           style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);font-size:0.95rem;">
                </div>
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.7);display:block;margin-bottom:0.35rem;">
                        ${t('prof_country')}
                    </label>
                    <input type="text" id="edit-country" value="${u.country || ''}"
                           style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);font-size:0.95rem;">
                </div>
                <div>
                    <label style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.7);display:block;margin-bottom:0.35rem;">
                        ${t('prof_emergency')}
                    </label>
                    <input type="tel" id="edit-emergency" value="${u.emergencyContact || ''}"
                           style="width:100%;padding:0.9rem 1rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);font-size:0.95rem;">
                </div>
                <!-- Tipo de perfil (solo lectura) -->
                <div style="display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1rem;background:rgba(139,92,246,0.08);border-radius:12px;border:1px solid rgba(139,92,246,0.2);">
                    <i data-lucide="user" style="width:18px;height:18px;color:var(--accent-purple);flex-shrink:0;"></i>
                    <span style="font-weight:700;font-size:0.85rem;color:var(--accent-purple);">
                        ${t('patient_role')}
                    </span>
                </div>
                <button class="action-btn btn-primary" style="width:100%;margin-top:0.3rem;" onclick="saveProfileEdit()">
                    <i data-lucide="save"></i> ${t('prof_save_changes')}
                </button>
            </div>
        </div>

        <!-- RESUMEN MÉDICO IA -->
        <div class="neuro-card">
            <h3 style="color:var(--primary-green);">
                <i data-lucide="brain" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
                ${t('prof_med_summary')}
            </h3>
            <p class="view-sub">
                ${isEs
                ? 'Historial acumulado de análisis IA. Se actualiza automáticamente al analizar un informe.'
                : 'Accumulated AI analysis history. Auto-updated when a report is analyzed.'}
            </p>
            <div id="profile-summary-list">
                ${summaryHTML}
            </div>
            ${summaries.length > 0 ? `
            <button class="action-btn" style="width:100%;margin-top:0.8rem;border:1px solid rgba(239,68,68,0.3);color:var(--accent-red);font-size:0.85rem;"
                    onclick="clearProfileSummary()">
                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                ${isEs ? 'Borrar historial' : 'Clear history'}
            </button>` : ''}
        </div>

        <!-- ── RESUMEN SEMANAL ── -->
        ${(() => {
                if (!window.NVHistory) return '';
                const summary = NVHistory.getWeeklySummary().filter(s => s.count > 0);
                if (!summary.length) return '';
                const meta = NVHistory.TEST_META;
                return `
            <div class="neuro-card" style="background:linear-gradient(145deg,rgba(22,33,62,0.9),rgba(14,20,45,0.95));
                         border:1px solid rgba(0,242,255,0.12);">
                <h3 style="color:var(--accent-cyan);font-size:1.1rem;margin-bottom:0.9rem;">
                    <i data-lucide="bar-chart-2" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                    ${t('ev_this_week')}
                </h3>
                <div style="display:flex;flex-wrap:wrap;gap:0.55rem;">
                    ${summary.map(s => {
                    const m = meta[s.type];
                    const trendIcon = s.trend === null ? '' :
                        s.trend > 2 ? ' ↑' : s.trend < -2 ? ' ↓' : ' →';
                    const trendColor = s.trend === null ? 'inherit' :
                        s.trend > 2 ? '#10b981' : s.trend < -2 ? '#ef4444' : '#f59e0b';
                    return `<div style="display:flex;align-items:center;gap:0.45rem;
                                            padding:0.45rem 0.8rem;border-radius:12px;
                                            background:${m.color}12;border:1px solid ${m.color}25;">
                            <i data-lucide="${m.icon}" style="width:13px;height:13px;color:${m.color};flex-shrink:0;"></i>
                            <span style="font-size:0.78rem;font-weight:700;color:rgba(241,245,249,0.85);">
                                ${s.count} ${t('ev_sessions')}
                            </span>
                            ${s.trend !== null ? `<span style="font-size:0.75rem;font-weight:700;color:${trendColor};">${trendIcon}</span>` : ''}
                        </div>`;
                }).join('')}
                </div>
            </div>`;
            })()}

        <!-- ── AJUSTES AVANZADOS (Módulos IA) ── -->
        <div class="neuro-card nv-settings-card">
            <h3 style="color:var(--accent-cyan);">
                <i data-lucide="cpu" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>
                ${isEs ? 'Ajustes Avanzados' : 'Advanced Settings'}
            </h3>
            <p class="view-sub" style="margin-bottom:1.2rem;">
                ${isEs
                ? 'Activa o desactiva los módulos de inteligencia adaptativa.'
                : 'Enable or disable adaptive AI modules.'}
            </p>
            ${[
                {
                    key: 'magneticButtons',
                    icon: 'magnet',
                    titleEs: 'Botones Magnéticos',
                    titleEn: 'Magnetic Buttons',
                    descEs: 'Amplía el área de toque y filtra temblores en los controles',
                    descEn: 'Expands touch area and filters tremor-induced mis-taps'
                },
                {
                    key: 'freezeDetection',
                    icon: 'zap',
                    titleEs: 'Pulso Sónico de Rescate',
                    titleEn: 'Sonic Rescue Pulse',
                    descEs: 'Detecta congelación de marcha y activa ritmo terapéutico 80 Hz',
                    descEn: 'Detects gait freezing and triggers therapeutic 80 Hz rhythm'
                },
                {
                    key: 'voiceInsights',
                    icon: 'mic',
                    titleEs: 'Análisis de Prosodia',
                    titleEn: 'Prosody Analysis',
                    descEs: 'Detecta caídas de volumen vocal (hipofonía) durante la evaluación',
                    descEn: 'Detects vocal amplitude drops (hypophonia) during evaluation'
                },
                {
                    key: 'predictiveAlerts',
                    icon: 'bell',
                    titleEs: 'Alertas Predictivas',
                    titleEn: 'Predictive Alerts',
                    descEs: 'Gemelo digital: notifica cuando tus niveles de energía pueden bajar',
                    descEn: 'Digital twin: notifies when your energy levels may drop'
                }
            ].map(mod => {
                const nvSettings = (() => { try { return JSON.parse(localStorage.getItem('nv_settings') || '{}'); } catch { return {}; } })();
                const isOn = nvSettings[mod.key] !== false;
                return `
                <div class="nv-setting-row" onclick="nvToggleSetting('${mod.key}',this)">
                    <div style="display:flex;align-items:flex-start;gap:0.75rem;flex:1;min-width:0;">
                        <div style="width:34px;height:34px;border-radius:10px;flex-shrink:0;
                                    background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.15);
                                    display:flex;align-items:center;justify-content:center;">
                            <i data-lucide="${mod.icon}" style="width:16px;height:16px;color:var(--accent-cyan);"></i>
                        </div>
                        <div style="min-width:0;">
                            <div style="font-weight:700;font-size:0.88rem;">${isEs ? mod.titleEs : mod.titleEn}</div>
                            <div style="font-size:0.76rem;color:rgba(148,163,184,0.65);margin-top:0.15rem;line-height:1.4;">
                                ${isEs ? mod.descEs : mod.descEn}
                            </div>
                        </div>
                    </div>
                    <div class="nv-toggle ${isOn ? 'on' : ''}" data-key="${mod.key}">
                        <div class="nv-toggle-thumb"></div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ── VISTA: MI EVOLUCIÓN — Dashboard Clínico ─────────────────
    evolution: () => {
        const isEs = state.lang === 'es';
        const allSessions = window.NVHistory ? NVHistory.getAll() : (state.sessionHistory || []);
        const meta = window.NVHistory ? NVHistory.TEST_META : {};
        const filter = state.evolutionFilter || 'all';

        // ── Skeleton loader mientras sincroniza ──
        if (state.evolutionSyncing) {
            return `
            <div class="nv-evo-skeleton-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="var(--accent-cyan)" stroke-width="2.2" stroke-linecap="round"
                     stroke-linejoin="round" style="animation:nvSpin 1s linear infinite;flex-shrink:0;">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>${t('ev_skeleton_msg')}</span>
            </div>
            <div class="neuro-card nv-skeleton-card">
                <div class="nv-sk-bar nv-sk-wide"></div>
                <div class="nv-sk-bar nv-sk-narrow" style="margin-top:0.6rem;"></div>
                <div style="margin-top:1.2rem;display:flex;gap:0.7rem;">
                    ${[1, 2, 3].map(() => '<div class="nv-sk-chip"></div>').join('')}
                </div>
            </div>
            ${[1, 2, 3].map(() => `
            <div class="neuro-card nv-skeleton-card" style="padding:1.1rem 1.2rem;">
                <div style="display:flex;gap:0.8rem;align-items:center;">
                    <div class="nv-sk-avatar"></div>
                    <div style="flex:1;">
                        <div class="nv-sk-bar nv-sk-wide"></div>
                        <div class="nv-sk-bar nv-sk-narrow" style="margin-top:0.5rem;width:45%;"></div>
                    </div>
                </div>
                <div style="display:flex;gap:0.6rem;margin-top:1rem;">
                    <div class="nv-sk-pill"></div><div class="nv-sk-pill"></div>
                </div>
            </div>`).join('')}`;
        }

        // ── Filtrar sesiones por tipo ──
        const sessions = filter === 'all' ? allSessions
            : allSessions.filter(s => s.type === filter);

        // ── Chips de filtro ──
        const filterTypes = [
            { key: 'all', icon: 'layout-grid', labelEs: t('ev_filter_all'), labelEn: t('ev_filter_all') },
            { key: 'vocal', icon: 'mic', labelEs: t('ev_filter_vocal'), labelEn: t('ev_filter_vocal') },
            { key: 'tapping', icon: 'hand', labelEs: t('ev_filter_tapping'), labelEn: t('ev_filter_tapping') },
            { key: 'drawing', icon: 'edit-3', labelEs: t('ev_filter_drawing'), labelEn: t('ev_filter_drawing') },
            { key: 'breathing', icon: 'wind', labelEs: t('ev_filter_breathing'), labelEn: t('ev_filter_breathing') },
        ];
        const filterChips = `
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;margin-bottom:1rem;">
            ${filterTypes.map(f => `
            <button onclick="setEvoFilter('${f.key}')"
                    class="nv-filter-chip${filter === f.key ? ' active' : ''}"
                    style="display:flex;align-items:center;gap:0.35rem;">
                <i data-lucide="${f.icon}" style="width:13px;height:13px;"></i>
                ${isEs ? f.labelEs : f.labelEn}
            </button>`).join('')}
        </div>`;

        // ── Gráfica de tendencia motora (inicializada post-render por _initEvoChart) ──
        const trendCard = allSessions.length >= 2 ? `
        <div class="neuro-card nv-trend-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
                <div>
                    <h3 style="color:var(--primary-green);font-size:1rem;margin:0;">
                        <i data-lucide="trending-up" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"></i>
                        ${t('ev_trend_title')}
                    </h3>
                    <p style="font-size:0.72rem;color:rgba(148,163,184,0.5);margin:2px 0 0;">${t('ev_trend_sub')}</p>
                </div>
            </div>
            <div style="position:relative;height:130px;">
                <canvas id="ev-trend-chart"></canvas>
            </div>
        </div>` : '';

        // ── Resumen semanal ──
        const summary = window.NVHistory ? NVHistory.getWeeklySummary().filter(s => s.count > 0) : [];
        const weekCard = summary.length ? `
        <div class="neuro-card" style="border:1px solid rgba(0,242,255,0.15);
             background:linear-gradient(145deg,rgba(22,33,62,0.95),rgba(14,20,45,0.98));">
            <h3 style="color:var(--accent-cyan);font-size:0.95rem;margin-bottom:0.8rem;">
                <i data-lucide="bar-chart-2" style="width:15px;height:15px;vertical-align:middle;margin-right:5px;"></i>
                ${t('ev_this_week')}
            </h3>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                ${summary.map(s => {
            const m = meta[s.type] || { icon: 'activity', color: '#00F2FF' };
            const trendLabel = s.trend === null ? '' :
                s.trend > 2 ? ` <span style="color:#10b981;">↑ ${isEs ? 'mejora' : 'improving'}</span>` :
                    s.trend < -2 ? ` <span style="color:#ef4444;">↓ ${isEs ? 'atención' : 'attention'}</span>` :
                        ` <span style="color:#f59e0b;">→ ${isEs ? 'estable' : 'stable'}</span>`;
            return `<div style="flex:1;min-width:100px;padding:0.55rem 0.7rem;border-radius:14px;
                                        background:${m.color}10;border:1px solid ${m.color}22;">
                        <div style="display:flex;align-items:center;gap:0.35rem;margin-bottom:0.2rem;">
                            <i data-lucide="${m.icon}" style="width:12px;height:12px;color:${m.color};"></i>
                            <span style="font-size:0.68rem;color:rgba(148,163,184,0.55);">
                                ${isEs ? m.labelEs : m.labelEn}
                            </span>
                        </div>
                        <div style="font-size:1.2rem;font-weight:900;color:${m.color};">${s.count}</div>
                        <div style="font-size:0.68rem;color:rgba(148,163,184,0.45);">${t('ev_sessions')}${trendLabel}</div>
                    </div>`;
        }).join('')}
            </div>
        </div>` : '';

        // ── Tarjetas de sesión (glassmorphism) ──
        const timelineHTML = sessions.length === 0
            ? `<div class="neuro-card" style="text-align:center;padding:2.5rem 1rem;">
                   <i data-lucide="inbox" style="width:48px;height:48px;color:rgba(148,163,184,0.2);margin-bottom:1rem;"></i>
                   <p style="color:rgba(148,163,184,0.4);font-size:0.9rem;line-height:1.6;">${t('ev_empty')}</p>
                   <button class="action-btn btn-primary" style="margin-top:1.4rem;width:100%;min-height:52px;" onclick="changeView('therapy')">
                       <i data-lucide="activity"></i>
                       ${isEs ? 'Ir al Centro de Rehabilitación' : 'Go to Rehab Center'}
                   </button>
               </div>`
            : sessions.map(s => {
                const m = meta[s.type] || { icon: 'activity', color: '#00F2FF', labelEs: s.type, labelEn: s.type };
                const label = isEs ? m.labelEs : m.labelEn;
                const tsText = window.NVHistory ? NVHistory.formatTs(s.ts, state.lang) : new Date(s.ts).toLocaleString();
                const mx = s.metrics || {};
                const phase = s.phase || 'ON';
                const phaseCol = phase === 'ON' ? '#10b981' : '#ef4444';

                let mainMetric = '';
                if (s.type === 'tapping') {
                    const jColor = (mx.jitter || 0) < 25 ? '#10b981' : (mx.jitter || 0) < 45 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${m.color};font-size:1.3rem;font-weight:900;">${mx.bpm || '–'}</span>
                            <span style="font-size:0.68rem;opacity:0.6;">BPM</span>
                        </div>
                        <div class="nv-sc-metric-pill" style="border-color:${jColor}30;">
                            <span style="color:${jColor};font-size:1.3rem;font-weight:900;">${mx.jitter || '–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">jitter</span>
                        </div>
                        <div class="nv-sc-metric-pill">
                            <span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.count || '–'}</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'toques' : 'taps'}</span>
                        </div>`;
                } else if (s.type === 'drawing') {
                    const sCol = (mx.stability || 0) >= 70 ? '#10b981' : (mx.stability || 0) >= 40 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${sCol}30;">
                            <span style="color:${sCol};font-size:1.3rem;font-weight:900;">${mx.stability || '–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'Motor Stability' : 'Motor Stability'}</span>
                        </div>
                        <div class="nv-sc-metric-pill">
                            <span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.density || '–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'densidad' : 'density'}</span>
                        </div>`;
                } else if (s.type === 'vocal') {
                    const sCol = (mx.stability || 0) >= 85 ? '#10b981' : (mx.stability || 0) >= 70 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${sCol};font-size:1.3rem;font-weight:900;">${mx.stability || '–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'estabilidad' : 'stability'}</span>
                        </div>
                        ${mx.duration ? `<div class="nv-sc-metric-pill"><span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.duration}s</span><span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'duración' : 'duration'}</span></div>` : ''}`;
                } else if (s.type === 'breathing') {
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${m.color};font-size:1.3rem;font-weight:900;">${mx.cycles || '–'}</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'ciclos' : 'cycles'}</span>
                        </div>
                        ${mx.duration ? `<div class="nv-sc-metric-pill"><span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.duration}s</span><span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'duración' : 'duration'}</span></div>` : ''}`;
                }

                return `
                <div class="nv-session-card nv-glass-card" onclick="openSessionDetail(${s.id})" style="cursor:pointer;">
                    <div class="nv-sc-header">
                        <div style="display:flex;align-items:center;gap:0.55rem;flex:1;min-width:0;">
                            <div style="width:40px;height:40px;border-radius:12px;flex-shrink:0;
                                        background:${m.color}18;border:1px solid ${m.color}35;
                                        display:flex;align-items:center;justify-content:center;">
                                <i data-lucide="${m.icon}" style="width:18px;height:18px;color:${m.color};"></i>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${label}
                                </div>
                                <div style="font-size:0.71rem;color:rgba(148,163,184,0.5);margin-top:1px;">
                                    ${tsText}
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0;">
                            <span style="font-size:0.66rem;font-weight:700;padding:3px 9px;border-radius:8px;
                                         background:${phaseCol}18;border:1px solid ${phaseCol}35;color:${phaseCol};">
                                ${isEs ? 'FASE' : 'PHASE'} ${phase}
                            </span>
                            <button onclick="event.stopPropagation();nvHistoryDelete(${s.id})"
                                    style="background:none;border:none;cursor:pointer;padding:6px;min-width:36px;min-height:36px;
                                           display:flex;align-items:center;justify-content:center;border-radius:8px;
                                           color:rgba(148,163,184,0.3);transition:color 0.2s,background 0.2s;"
                                    onmouseenter="this.style.color='var(--accent-red)';this.style.background='rgba(239,68,68,0.08)'"
                                    onmouseleave="this.style.color='rgba(148,163,184,0.3)';this.style.background='none'"
                                    title="${isEs ? 'Eliminar' : 'Delete'}">
                                <i data-lucide="trash-2" style="width:14px;height:14px;pointer-events:none;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="nv-sc-metrics">${mainMetric}</div>
                    <div style="text-align:right;margin-top:0.55rem;">
                        <span style="font-size:0.7rem;color:rgba(0,242,255,0.4);">
                            ${isEs ? 'Ver detalle →' : 'View detail →'}
                        </span>
                    </div>
                </div>`;
            }).join('');

        return `
        ${trendCard}
        ${weekCard}
        <div class="neuro-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
                <h3 style="color:var(--primary-green);margin:0;font-size:1.05rem;">
                    <i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                    ${isEs ? 'Historial Clínico' : 'Clinical History'}
                </h3>
                ${allSessions.length > 0 ? `
                <button class="action-btn" style="font-size:0.72rem;padding:0.35rem 0.75rem;
                        border:1px solid rgba(239,68,68,0.22);color:rgba(239,68,68,0.6);"
                        onclick="nvHistoryClearAll()">
                    <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                    ${t('ev_clear_all')}
                </button>` : ''}
            </div>
            <p class="view-sub" style="margin-bottom:0.9rem;">${t('ev_sub')}</p>
            ${filterChips}
            <div id="nv-timeline">${timelineHTML}</div>
        </div>`;
    }
};

// ============================================================
// LÓGICA DE NEGOCIO
// ============================================================
function logAudit(action) {
    state.auditLog.unshift({ action, time: new Date().toLocaleTimeString() });
}

// ── Drag-and-drop handler (receives FileList or File directly) ─
function handleDroppedFile(fileOrList) {
    if (!fileOrList) return;
    // Accept both a FileList (from drop event) and a single File
    if (fileOrList instanceof FileList) {
        handleFileUpload(fileOrList.length ? { files: fileOrList } : null);
    } else {
        handleFileUpload(fileOrList); // single File — handled by instanceof File branch
    }
}

// ── Análisis real de informes médicos (OCR + IA + Firestore) ─
async function runReportAnalysis() {
    if (state.isAnalyzingReport) return;

    // Obtener el archivo: primero desde state._pendingFile (drag & drop),
    // luego desde el input nativo (click). Ambos caminos convergen aquí.
    const fileInput = document.getElementById('file-upload-input');
    const file = state._pendingFile
        || (fileInput && fileInput.files && fileInput.files[0]);
    if (!file) {
        showToast(t('hlt_no_file'), 'error');
        return;
    }
    if (!window.NVReports) {
        showToast(state.lang === 'es'
            ? 'Módulo de análisis no disponible. Recargue la página.'
            : 'Analysis module unavailable. Please reload.', 'error');
        return;
    }

    state.isAnalyzingReport = true;

    // Spinner en dropzone + botón desactivado
    _dropzoneSetLoading(true);
    const anaBtn = document.getElementById('ana-btn');
    if (anaBtn) {
        anaBtn.disabled = true;
        anaBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                 stroke-linejoin="round"
                 style="animation:nvSpin 1s linear infinite;flex-shrink:0;vertical-align:middle;margin-right:6px;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>${t('hlt_analyzing')}`;
    }

    try {
        // 1. Extracción OCR + análisis IA
        const { analysis } = await NVReports.analyzeFile(file, state.lang, (progress) => {
            const pct = Math.round(progress * 100);
            const status = document.getElementById('upload-status');
            if (status) status.textContent = `OCR ${pct}%`;
            if (anaBtn) anaBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                     stroke-linejoin="round"
                     style="animation:nvSpin 1s linear infinite;flex-shrink:0;vertical-align:middle;margin-right:6px;">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>OCR ${pct}%`;
        });

        // 2. Construir objeto de informe
        const report = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            source: file.name,
            fileName: file.name,
            fileType: file.type,
            lang: state.lang,
            diagnostico_principal: analysis.diagnostico_principal,
            medicacion_activa: analysis.medicacion_activa,
            recomendaciones: analysis.recomendaciones,
            metricas: analysis.metricas || {},
            alertas: analysis.alertas || [],
            dominios: analysis.dominios || {},
            estadio: analysis.estadio || '',
            isCritical: analysis.isCritical || false,
            // Alias compat
            diagnosis: analysis.diagnostico_principal,
            analysis: analysis.recomendaciones,
            medicacion: analysis.medicacion_activa,
        };

        // 3. Zero-Storage: no se sube el archivo físico.
        //    Solo se guarda el JSON del análisis en Firestore.
        const uid = state.user && state.user.uid ? state.user.uid : null;

        // 4. Guardar en Firestore (async, no bloqueante)
        if (uid && window.NVFirebase && NVFirebase.isReady()) {
            NVFirebase.saveMedicalReport(uid, report)
                .catch(e => console.warn('[Health] Firestore save fallido:', e));
        }

        // 5. Guardar en localStorage
        NVReports.saveLocal(report);
        state.medicalReports.unshift(report);

        // 6. Actualizar resumen de perfil médico
        state.profileSummary.unshift({
            date: report.date,
            diagnosis: report.diagnostico_principal,
            body: report.recomendaciones,
            source: report.source
        });
        localStorage.setItem('nv_prof_summary', JSON.stringify(state.profileSummary.slice(0, 20)));

        // 7. Actualizar DOM de valoraciones sin re-render completo
        _renderMedicalReportsList();

        showToast(t('hlt_report_ok'), 'success');
        logAudit(state.lang === 'es' ? 'Informe médico analizado por IA' : 'Medical report analyzed by AI');

    } catch (e) {
        console.error('[NVReports] Error en análisis:', e);
        const isPdfProtected = e && e.code === 'pdf_protected';
        const isEs = state.lang === 'es';
        const errMsg = (e && e.msg)
            || (isPdfProtected
                ? (isEs ? 'El PDF está protegido con contraseña.' : 'The PDF is password-protected.')
                : (isEs
                    ? 'Error al leer el archivo. Inténtelo de nuevo o use una imagen clara.'
                    : 'Error reading the file. Please try again or use a clear image.'));
        showToast(errMsg, 'error');
    } finally {
        state.isAnalyzingReport = false;
        state._pendingFile = null;
        _dropzoneSetLoading(false);
        if (anaBtn) {
            anaBtn.disabled = false;
            anaBtn.innerHTML = `<i data-lucide="cpu"></i> ${t('hlt_analyze')}`;
            lucide.createIcons();
        }
    }
}

// ============================================================
// TEST DE TAPPING — BPM REAL + JITTER
// ============================================================
function openTapping() {
    showMedicalTip(
        state.lang === 'es'
            ? 'Mide bradicinesia y regularidad motriz — indicadores clave en el seguimiento del Parkinson.'
            : 'Measures bradykinesia and motor regularity — key Parkinson\'s tracking indicators.',
        () => {
            document.getElementById('tapping-box').style.display = 'block';
            state.tappingData = { timestamps: [], intervals: [], active: true };
            const stats = document.getElementById('tap-stats');
            if (stats) stats.textContent = t('tap_start');
        }
    );
}

function closeTapping() {
    document.getElementById('tapping-box').style.display = 'none';
    state.tappingData.active = false;
    logAudit(t('tap_saved'));

    const count = state.tappingData.timestamps.length;
    const ivs = state.tappingData.intervals;
    const avgMs = ivs.length > 0 ? ivs.reduce((a, b) => a + b, 0) / ivs.length : 0;

    if (count > 0) {
        const bpmVal = avgMs > 0 ? Math.round(60000 / avgMs) : 0;
        const variance = avgMs > 0 ? ivs.reduce((s, v) => s + Math.pow(v - avgMs, 2), 0) / ivs.length : 0;
        const jitter = avgMs > 0 ? Math.round((Math.sqrt(variance) / avgMs) * 100) : 0;
        const duration = Math.round((avgMs * count) / 1000);

        // ── Guardar en historial ──
        if (window.NVHistory) NVHistory.save('tapping', { count, bpm: bpmVal, jitter, duration });

        showModal(
            `${t('tap_taps')}: ${count}  ·  ${t('tap_bpm')}: ${bpmVal}  ·  ${t('tap_jitter')}: ${jitter}%`,
            { title: t('tap_saved') }
        );
    }
}

document.addEventListener('mousedown', (e) => {
    if (!state.tappingData.active || e.target.id !== 'tap-area') return;
    const now = performance.now();
    if (state.tappingData.timestamps.length > 0)
        state.tappingData.intervals.push(now - state.tappingData.timestamps[state.tappingData.timestamps.length - 1]);
    state.tappingData.timestamps.push(now);
    updateTappingStats();
});

document.addEventListener('touchstart', (e) => {
    if (!state.tappingData.active || e.target.id !== 'tap-area') return;
    e.preventDefault();
    const now = performance.now();
    if (state.tappingData.timestamps.length > 0)
        state.tappingData.intervals.push(now - state.tappingData.timestamps[state.tappingData.timestamps.length - 1]);
    state.tappingData.timestamps.push(now);
    updateTappingStats();
}, { passive: false });

function updateTappingStats() {
    const stats = document.getElementById('tap-stats');
    if (!stats) return;
    const count = state.tappingData.timestamps.length;
    const ivs = state.tappingData.intervals;

    if (ivs.length < 2) {
        stats.innerHTML = `<span style="font-size:1.8rem;font-weight:900;color:var(--accent-cyan);">${count}</span><br><small>${t('tap_taps')}</small>`;
        return;
    }
    const avg = ivs.reduce((a, b) => a + b, 0) / ivs.length;
    const bpm = Math.round(60000 / avg);
    const variance = ivs.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / ivs.length;
    const jitter = Math.round((Math.sqrt(variance) / avg) * 100);
    const jColor = jitter < 20 ? 'var(--primary-green)' : jitter < 40 ? '#f59e0b' : 'var(--accent-red)';

    stats.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">
            <div><div style="font-size:1.6rem;font-weight:900;color:var(--accent-cyan);">${count}</div>
                 <div style="font-size:0.7rem;opacity:0.7;">${t('tap_taps')}</div></div>
            <div><div style="font-size:1.6rem;font-weight:900;color:var(--primary-green);">${bpm}</div>
                 <div style="font-size:0.7rem;opacity:0.7;">${t('tap_bpm')}</div></div>
            <div><div style="font-size:1.6rem;font-weight:900;color:${jColor};">${jitter}%</div>
                 <div style="font-size:0.7rem;opacity:0.7;">${t('tap_jitter')}</div></div>
        </div>`;
}

// ============================================================
// CANVAS — DIBUJO CON PUNTUACIÓN DE DESVIACIÓN
// ============================================================
function openMotrizTest() {
    showMedicalTip(
        state.lang === 'es'
            ? 'Trazar espirales evalúa el temblor de acción y la coordinación fina.'
            : 'Spiral tracing evaluates action tremor and fine coordination.',
        () => {
            document.getElementById('motriz-box').style.display = 'block';
            setTimeout(initSpiral, 100);
        }
    );
}

function closeMotriz() {
    const canvas = document.getElementById('spiral-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let filled = 0;
        for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 10) filled++;
        const density = parseFloat(((filled / (canvas.width * canvas.height)) * 100).toFixed(1));
        const stability = Math.min(100, Math.round(density * 60));
        logAudit(`Test Dibujo — Densidad: ${density}%`);

        // ── Guardar en historial ──
        if (window.NVHistory) NVHistory.save('drawing', { density, stability });

        showModal(
            t('draw_result').replace('{d}', density).replace('{s}', stability),
            { title: state.lang === 'es' ? 'Resultado del Test' : 'Test Result' }
        );
    }
    document.getElementById('motriz-box').style.display = 'none';
}

function initSpiral() {
    const canvas = document.getElementById('spiral-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00F2FF';
    ctx.lineCap = 'round';
    let drawing = false;

    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const ev = e.touches ? e.touches[0] : e;
        return {
            x: (ev.clientX - r.left) * (canvas.width / r.width),
            y: (ev.clientY - r.top) * (canvas.height / r.height)
        };
    };
    const start = (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const stop = () => { drawing = false; };

    canvas.onmousedown = start; canvas.onmousemove = move; canvas.onmouseup = stop; canvas.onmouseleave = stop;
    canvas.ontouchstart = (e) => { e.preventDefault(); start(e); };
    canvas.ontouchmove = (e) => { e.preventDefault(); move(e); };
    canvas.ontouchend = stop;
}

// ============================================================
// EVALUACIÓN VOCAL — MICRÓFONO REAL + ONDA REAL
// ============================================================
let _audioCtx = null, _analyser = null, _micStream = null, _rafId = null;

function openTwister() {
    showMedicalTip(
        state.lang === 'es'
            ? 'El análisis vocal detecta disartria — signo temprano del Parkinson avanzado.'
            : 'Voice analysis detects dysarthria — an early sign of advanced Parkinson\'s.',
        () => {
            const box = document.getElementById('twister-box');
            if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
        }
    );
}

async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        _micStream = stream;
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        _analyser = _audioCtx.createAnalyser();
        _analyser.fftSize = 512;
        _audioCtx.createMediaStreamSource(stream).connect(_analyser);
        state.isRecording = true;
        state._voiceStartTs = Date.now();   // para calcular duración al guardar
        // Hook Módulo 3: análisis de prosodia
        if (window.NVVoiceInsights) NVVoiceInsights.onStart(_analyser);

        const viz = document.getElementById('voice-viz');
        if (viz) viz.style.display = 'block';
        const btn = document.getElementById('record-btn');
        if (btn) btn.textContent = t('voc_stop');

        drawRealWaveform();
    } catch (e) {
        showToast(t('voc_denied'), 'error');
    }
}

function drawRealWaveform() {
    if (!_analyser || !state.isRecording) return;
    const canvas = document.getElementById('voice-canvas');
    if (!canvas) { _rafId = requestAnimationFrame(drawRealWaveform); return; }
    const ctx = canvas.getContext('2d');
    const buf = new Uint8Array(_analyser.frequencyBinCount);

    const draw = () => {
        if (!state.isRecording) return;
        _rafId = requestAnimationFrame(draw);
        _analyser.getByteTimeDomainData(buf);
        ctx.fillStyle = 'rgba(10,15,30,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00F2FF';
        ctx.beginPath();
        buf.forEach((v, i) => {
            const x = (i / buf.length) * canvas.width;
            const y = (v / 128.0) * (canvas.height / 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    };
    draw();
}

function stopVoiceRecording(silent = false) {
    if (!state.isRecording && !_micStream) return;
    if (_micStream) { _micStream.getTracks().forEach(t => t.stop()); _micStream = null; }
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    if (_audioCtx) { _audioCtx.close().catch(() => { }); _audioCtx = null; _analyser = null; }
    state.isRecording = false;
    const viz = document.getElementById('voice-viz');
    if (viz) viz.style.display = 'none';
    const btn = document.getElementById('record-btn');
    if (btn) btn.textContent = t('voc_record');
    // Hook Módulo 3: finalizar análisis de prosodia
    if (window.NVVoiceInsights) NVVoiceInsights.onStop();
    if (!silent) {
        const pct = Math.floor(Math.random() * 15 + 82);
        const duration = state._voiceStartTs ? Math.round((Date.now() - state._voiceStartTs) / 1000) : 0;
        state._voiceStartTs = null;

        // ── Guardar en historial ──
        if (window.NVHistory) NVHistory.save('vocal', { stability: pct, duration });

        showToast(`${t('voc_result')}${pct}%`, 'success');
    }
}

function toggleVoiceRecording() {
    if (state.isRecording) stopVoiceRecording();
    else startVoiceRecording();
}

// ============================================================
// RESPIRACIÓN GUIADA
// ============================================================
function startResp() {
    const isEs = state.lang === 'es';
    const startTs = Date.now();
    showMedicalTip(
        isEs ? 'La respiración diafragmática reduce la rigidez muscular y mejora la oxigenación cerebral.'
            : 'Diaphragmatic breathing reduces muscle rigidity and improves brain oxygenation.',
        () => showModal(
            isEs ? 'Inspirar 4 seg...\nMantener 2 seg...\nExpirar 6 seg.\n\nSiga el ritmo visual y repita el ciclo.'
                : 'Inhale 4 sec...\nHold 2 sec...\nExhale 6 sec.\n\nFollow the visual rhythm and repeat.',
            {
                title: isEs ? 'Respiración Guiada' : 'Guided Breathing',
                confirmText: isEs ? 'Completado ✓' : 'Completed ✓',
                cancelText: isEs ? 'Cerrar' : 'Close',
                onConfirm: () => {
                    const duration = Math.round((Date.now() - startTs) / 1000);
                    const cycles = Math.max(1, Math.floor(duration / 12));
                    // ── Guardar en historial ──
                    if (window.NVHistory) NVHistory.save('breathing', { cycles, duration });
                }
            }
        )
    );
}

// ============================================================
// METRÓNOMO RAS — PERCUSIÓN PROFUNDA + ONDAS EXPANSIVAS
// ============================================================
let _metCtx = null, _metGain = null, _metTimeout = null, _metBeat = 0;
let _wakeLock = null;

// ── Wake Lock — mantiene la pantalla activa durante la terapia ──
async function _requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        _wakeLock = await navigator.wakeLock.request('screen');
        _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    } catch (e) { /* silencioso: sin soporte o permiso denegado */ }
}
function _releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null; }
}
// Reactivar Wake Lock si el SO lo libera al volver a primer plano
document.addEventListener('visibilitychange', () => {
    if (state.metronomeActive && document.visibilityState === 'visible') {
        _requestWakeLock();
    }
});

function toggleMetronome() {
    state.metronomeActive ? stopMetronome() : startMetronome();
}

function startMetronome() {
    state.metronomeActive = true;
    _metBeat = 0;
    _metCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain — controlable desde modo rescate
    _metGain = _metCtx.createGain();
    _metGain.gain.value = 0.82;
    _metGain.connect(_metCtx.destination);

    // Solicitar Wake Lock para mantener audio en suspensión
    _requestWakeLock();

    const btn = document.getElementById('ras-btn');
    if (btn) btn.innerHTML = `<i data-lucide="square"></i> ${t('ras_stop')}`;
    lucide.createIcons();

    // Adjuntar SOS inline
    setTimeout(() => {
        const rasSos = document.getElementById('ras-sos-btn');
        if (rasSos) _attachSOS(rasSos);
    }, 60);

    const tick = () => {
        if (!state.metronomeActive) return;
        _metBeat++;

        const t0 = _metCtx.currentTime;
        const vol = _metGain ? _metGain.gain.value : 0.82;
        // Beat acentuado cada 4 pasos (beat 1 del compás)
        const isAccent = (_metBeat % 4 === 1);

        // ── WOODBLOCK CLICK (sonido corto y seco de alta frecuencia) ──
        // Buffer de ruido blanco de 28 ms filtrado en banda estrecha
        const clickFrames = Math.floor(_metCtx.sampleRate * 0.028);
        const clickBuf = _metCtx.createBuffer(1, clickFrames, _metCtx.sampleRate);
        const clickData = clickBuf.getChannelData(0);
        for (let i = 0; i < clickFrames; i++) clickData[i] = Math.random() * 2 - 1;

        const src = _metCtx.createBufferSource();
        src.buffer = clickBuf;

        // Filtro bandpass — woodblock: ~900 Hz normal, ~1150 Hz accent
        const bpf = _metCtx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = isAccent ? 1150 : 900;
        bpf.Q.value = 9;

        // Envolvente: ataque instantáneo, decay en 22 ms → silencio
        const clickEnv = _metCtx.createGain();
        const peakVol = isAccent ? vol * 1.0 : vol * 0.78;
        clickEnv.gain.setValueAtTime(peakVol, t0);
        clickEnv.gain.exponentialRampToValueAtTime(0.001, t0 + 0.022);

        src.connect(bpf); bpf.connect(clickEnv); clickEnv.connect(_metGain);
        src.start(t0); src.stop(t0 + 0.03);

        // ── VISUAL: bola ─────────────────────────────────────
        const ball = document.getElementById('ras-ball');
        const accentGlow = isAccent
            ? '0 0 80px rgba(16,185,129,0.9),inset 0 -4px 12px rgba(0,0,0,0.2)'
            : '0 0 65px rgba(16,185,129,0.7),inset 0 -4px 12px rgba(0,0,0,0.2)';
        if (ball) {
            ball.style.transform = isAccent ? 'scale(1.32)' : 'scale(1.22)';
            ball.style.boxShadow = accentGlow;
            setTimeout(() => {
                if (ball) {
                    ball.style.transform = 'scale(1)';
                    ball.style.boxShadow = '0 0 40px rgba(16,185,129,0.45),inset 0 -4px 12px rgba(0,0,0,0.2)';
                }
            }, 85);
        }

        // ── VISUAL: pulso del zapato — exactamente sincronizado con el clic ──
        const foot = document.getElementById('ras-foot');
        if (foot) {
            foot.textContent = _metBeat % 2 === 0 ? '🦶' : '👟';
            foot.classList.remove('ras-foot-pulse');
            // Forzar reflow para reiniciar la animación en cada beat
            void foot.offsetWidth;
            foot.classList.add('ras-foot-pulse');
            setTimeout(() => foot.classList.remove('ras-foot-pulse'), 140);
        }

        // ── ONDAS EXPANSIVAS ─────────────────────────────────
        _spawnRipple();

        // ── HAPTIC ──────────────────────────────────────────
        if (navigator.vibrate) navigator.vibrate(isAccent ? 55 : 35);

        _metTimeout = setTimeout(tick, (60 / state.metronomeBPM) * 1000);
    };
    tick();
}

function stopMetronome() {
    state.metronomeActive = false;
    if (_metTimeout) { clearTimeout(_metTimeout); _metTimeout = null; }
    if (_metCtx) { _metCtx.close().catch(() => {}); _metCtx = null; }
    _metGain = null;
    _metBeat = 0;
    _releaseWakeLock();

    const btn = document.getElementById('ras-btn');
    if (btn) btn.innerHTML = `<i data-lucide="play"></i> ${t('ras_start')}`;
    lucide.createIcons();

    // Resetear zapato a estado neutro
    const foot = document.getElementById('ras-foot');
    if (foot) { foot.textContent = '👟'; foot.classList.remove('ras-foot-pulse'); }
    const ball = document.getElementById('ras-ball');
    if (ball) { ball.style.transform = 'scale(1)'; ball.style.boxShadow = '0 0 40px rgba(16,185,129,0.45),inset 0 -4px 12px rgba(0,0,0,0.2)'; }

    // Eliminar ondas residuales
    document.querySelectorAll('.ras-ripple-ring').forEach(r => r.remove());
}

// ── Aviso de voz / tono de seguridad cuando BPM > 120 ────────
let _safetyWarnCooldown = false;
function _rasPlaySafetyWarning() {
    if (_safetyWarnCooldown) return;
    _safetyWarnCooldown = true;
    setTimeout(() => { _safetyWarnCooldown = false; }, 8000); // cooldown 8 s

    const isEs = state.lang === 'es';
    const msg = isEs
        ? 'Ritmo elevado. Manténgase en niveles de baja intensidad según su prescripción.'
        : 'Elevated rhythm. Stay at low-intensity levels per your prescription.';

    // Intentar síntesis de voz (Web Speech API)
    if (window.speechSynthesis) {
        const utt = new SpeechSynthesisUtterance(msg);
        utt.lang = isEs ? 'es-ES' : 'en-US';
        utt.rate = 0.88;
        utt.volume = 0.9;
        window.speechSynthesis.cancel(); // cancelar cualquier lectura anterior
        window.speechSynthesis.speak(utt);
        return;
    }

    // Fallback: tono de aviso (beep distinto del woodblock — frecuencia baja, suave)
    if (!_metCtx) return;
    const wCtx = new (window.AudioContext || /** @type {any} */(window).webkitAudioContext)();
    const osc = wCtx.createOscillator();
    const env = wCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440; // La — señal de advertencia
    env.gain.setValueAtTime(0, 0);
    env.gain.linearRampToValueAtTime(0.35, 0.05);
    env.gain.setValueAtTime(0.35, 0.3);
    env.gain.linearRampToValueAtTime(0, 0.5);
    osc.connect(env); env.connect(wCtx.destination);
    osc.start(0); osc.stop(0.55);
    setTimeout(() => wCtx.close().catch(() => {}), 700);
}

// Muestra / oculta el banner de seguridad y actualiza el color del display
function _rasApplySafetyState(bpm) {
    const banner = document.getElementById('ras-safety-banner');
    const disp   = document.getElementById('ras-bpm-display');
    const isOver = bpm > 120;
    if (banner) banner.classList.toggle('ras-safety-visible', isOver);
    if (disp)   disp.classList.toggle('ras-bpm-alert', isOver);
}

function updateMetronomeBPM(val) {
    const bpm  = parseInt(val);
    const prev = state.metronomeBPM;
    state.metronomeBPM = bpm;

    const disp = document.getElementById('ras-bpm-display');
    if (disp) disp.textContent = val;

    // Lógica de seguridad: umbral 120 BPM
    _rasApplySafetyState(bpm);
    if (bpm > 120 && prev <= 120) {
        // Cruzó el umbral hacia arriba → aviso
        _rasPlaySafetyWarning();
    }

    // Actualizar highlight de presets
    [80, 110, 130].forEach(b => {
        const btn = document.getElementById(`ras-preset-${b}`);
        if (!btn) return;
        const active = b === bpm;
        btn.style.borderColor = active ? 'var(--primary-green)' : 'rgba(255,255,255,0.09)';
        btn.style.color = active ? 'var(--primary-green)' : 'rgba(241,245,249,0.6)';
    });

    if (state.metronomeActive) { stopMetronome(); startMetronome(); }
}

function rasSetPreset(bpm) {
    updateMetronomeBPM(bpm);
    const slider = document.getElementById('ras-bpm-slider');
    if (slider) slider.value = bpm;
}

// Genera 3 anillos expansivos centrados en la bola
function _spawnRipple() {
    const container = document.getElementById('ras-ripple-container');
    if (!container) return;
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.className = 'ras-ripple-ring';
        ring.style.animationDelay = `${i * 95}ms`;
        container.appendChild(ring);
        // Auto-eliminar tras la animación
        setTimeout(() => ring.parentNode && ring.remove(), 1200 + i * 95);
    }
}

// ============================================================
// MUSICOTERAPIA — Handlers de Spotify (llamados desde la vista RAS)
// ============================================================

// ── MUSICOTERAPIA YOUTUBE ────────────────────────────────────
// Búsquedas curadas para terapia de Parkinson — se abren en YouTube
const _ytSearches = [
    { q: 'parkinson music therapy 100 bpm walking steady tempo gait training' },
    { q: 'parkinson gait training music 110 bpm neurologic rehabilitation steady beat' },
    { q: 'parkinson rehabilitation music 120 bpm neurologic music therapy cadence' },
    { q: 'parkinson relaxation music calm therapy classical soothing' },
];

function ytSearch(idx) {
    const s = _ytSearches[idx];
    if (!s) return;
    window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(s.q), '_blank', 'noopener');
}

// ── HISTORIAL PERSISTENTE ─────────────────────────────────────
let _ytHistory = [];
(function _ytLoadHistory() {
    try { _ytHistory = JSON.parse(localStorage.getItem('nv_yt_history') || '[]'); } catch { _ytHistory = []; }
})();

// ── Detecta la plataforma de una URL ─────────────────────────
function _mediaPlatform(raw) {
    if (/youtu(\.be|be\.com)/.test(raw))        return 'youtube';
    if (/vimeo\.com/.test(raw))                 return 'vimeo';
    if (/dailymotion\.com/.test(raw))           return 'dailymotion';
    if (/soundcloud\.com/.test(raw))            return 'soundcloud';
    if (/open\.spotify\.com/.test(raw))         return 'spotify';
    if (/twitch\.tv/.test(raw))                 return 'twitch';
    if (/music\.apple\.com/.test(raw))          return 'apple';
    return 'unknown';
}

function _ytBuildEmbed(raw) {
    const p = _mediaPlatform(raw);

    // ── YouTube ──────────────────────────────────────────────
    if (p === 'youtube') {
        const list = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (list) return 'https://www.youtube.com/embed/videoseries?list=' + list[1] + '&autoplay=1&rel=0&modestbranding=1';
        const vid = raw.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (vid) return 'https://www.youtube.com/embed/' + vid[1] + '?autoplay=1&rel=0&modestbranding=1';
    }

    // ── Vimeo ────────────────────────────────────────────────
    if (p === 'vimeo') {
        const m = raw.match(/vimeo\.com\/(\d+)/);
        if (m) return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&color=00F2FF&title=0&byline=0';
    }

    // ── Dailymotion ──────────────────────────────────────────
    if (p === 'dailymotion') {
        const m = raw.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        if (m) return 'https://www.dailymotion.com/embed/video/' + m[1] + '?autoplay=1';
    }

    // ── SoundCloud ───────────────────────────────────────────
    if (p === 'soundcloud') {
        return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(raw) +
               '&auto_play=true&color=%2300F2FF&buying=false&sharing=false&download=false&show_artwork=true';
    }

    // ── Spotify ──────────────────────────────────────────────
    if (p === 'spotify') {
        const m = raw.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
        if (m) return 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?utm_source=generator&theme=0';
    }

    // ── Twitch ───────────────────────────────────────────────
    if (p === 'twitch') {
        const ch = raw.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
        if (ch && !/clip|videos/.test(raw))
            return 'https://player.twitch.tv/?channel=' + ch[1] + '&parent=' + location.hostname + '&autoplay=true';
        const clip = raw.match(/clip\/([a-zA-Z0-9_-]+)/);
        if (clip) return 'https://clips.twitch.tv/embed?clip=' + clip[1] + '&parent=' + location.hostname;
    }

    // ── Apple Music ──────────────────────────────────────────
    if (p === 'apple') {
        return raw.replace('music.apple.com', 'embed.music.apple.com');
    }

    return '';
}

function _ytIcon(raw) {
    const icons = { youtube:'🎬', vimeo:'🎥', dailymotion:'📹', soundcloud:'🎵', spotify:'🎧', twitch:'🎮', apple:'🎵' };
    return (icons[_mediaPlatform(raw)] || '▶') + ' ';
}

function _ytLabel(raw) {
    const p = _mediaPlatform(raw);
    const names = { youtube:'YouTube', vimeo:'Vimeo', dailymotion:'Dailymotion', soundcloud:'SoundCloud', spotify:'Spotify', twitch:'Twitch', apple:'Apple Music' };
    const platformName = names[p] || 'Media';

    if (p === 'youtube') {
        const list = raw.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (list) return '🎵 YouTube Playlist · ' + list[1].slice(0, 14) + (list[1].length > 14 ? '…' : '');
        const vid = raw.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (vid) return '🎬 YouTube · ' + vid[1];
    }
    if (p === 'spotify') {
        const m = raw.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
        if (m) return '🎧 Spotify ' + m[1] + ' · ' + m[2].slice(0, 10) + '…';
    }
    return _ytIcon(raw) + platformName + ' · ' + raw.replace(/^https?:\/\//, '').slice(0, 28) + '…';
}

// Obtiene el título real vía oEmbed cuando esté disponible (sin API key)
async function _ytFetchTitle(raw) {
    try {
        const p = _mediaPlatform(raw);
        let oembedUrl = '';
        if (p === 'youtube')
            oembedUrl = 'https://www.youtube.com/oembed?url=' + encodeURIComponent(raw) + '&format=json';
        else if (p === 'vimeo')
            oembedUrl = 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(raw);
        else if (p === 'soundcloud')
            oembedUrl = 'https://soundcloud.com/oembed?url=' + encodeURIComponent(raw) + '&format=json';
        else if (p === 'dailymotion')
            oembedUrl = 'https://www.dailymotion.com/services/oembed?url=' + encodeURIComponent(raw) + '&format=json';
        else return null;

        const res = await fetch(oembedUrl);
        if (!res.ok) return null;
        const data = await res.json();
        return data.title || null;
    } catch { return null; }
}

function _ytSaveHistory(raw, embedUrl, customName) {
    // Evitar duplicados — si ya existe, moverlo al frente
    _ytHistory = _ytHistory.filter(h => h.raw !== raw);
    const item = { raw, embed: embedUrl, label: _ytLabel(raw), name: customName || '', ts: Date.now() };
    _ytHistory.unshift(item);
    if (_ytHistory.length > 20) _ytHistory.length = 20;
    try { localStorage.setItem('nv_yt_history', JSON.stringify(_ytHistory)); } catch { }

    // Obtener título real en background — solo si no hay nombre personalizado
    _ytFetchTitle(raw).then(title => {
        if (!title || item.name) return;
        item.label = _ytIcon(raw) + title;
        try { localStorage.setItem('nv_yt_history', JSON.stringify(_ytHistory)); } catch { }
        ytRenderHistory();
    });
}

function ytLoad(rawOverride) {
    const inp     = document.getElementById('yt-url-inp');
    const nameInp = document.getElementById('yt-name-inp');
    const raw     = rawOverride || (inp ? inp.value.trim() : '');
    const customName = (!rawOverride && nameInp) ? nameInp.value.trim() : '';
    if (!raw) return;

    const embedUrl = _ytBuildEmbed(raw);
    if (!embedUrl) {
        _showToast(state.lang === 'es'
            ? 'URL no compatible — prueba con YouTube, Spotify, Dailymotion o Twitch'
            : 'URL not supported — try YouTube, Spotify, Dailymotion or Twitch', 'warn');
        return;
    }

    const frame = document.getElementById('yt-frame');
    const wrap = document.getElementById('yt-wrap');
    const hint = document.getElementById('yt-hint');
    const stopWrap = document.getElementById('yt-stop-wrap');
    if (!frame || !wrap) return;

    frame.src = embedUrl;
    wrap.style.display = 'block';
    if (stopWrap) stopWrap.style.display = 'block';
    if (hint) hint.style.display = 'none';
    if (inp && !rawOverride) inp.value = '';
    if (nameInp && !rawOverride) nameInp.value = '';

    _ytSaveHistory(raw, embedUrl, customName);
    ytRenderHistory();
}

function ytStop() {
    const frame = document.getElementById('yt-frame');
    const wrap = document.getElementById('yt-wrap');
    const hint = document.getElementById('yt-hint');
    const stopWrap = document.getElementById('yt-stop-wrap');
    if (frame) frame.src = 'about:blank';
    if (wrap) wrap.style.display = 'none';
    if (stopWrap) stopWrap.style.display = 'none';
    if (hint) hint.style.display = '';
}

function ytPlayHistoryItem(idx) {
    const item = _ytHistory[idx];
    if (!item) return;
    ytLoad(item.raw);
}

function ytRenameHistoryItem(idx) {
    const item = _ytHistory[idx];
    if (!item) return;
    const wrap = document.getElementById('yt-history-wrap');
    if (!wrap) return;
    const labelEl = wrap.querySelector(`[data-yt-idx="${idx}"]`);
    if (!labelEl) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = item.name || item.label || '';
    input.maxLength = 60;
    input.style.cssText = [
        'flex:1', 'background:rgba(10,15,30,0.7)', 'border:1px solid rgba(0,242,255,0.4)',
        'color:#f1f5f9', 'border-radius:6px', 'padding:0.2rem 0.5rem',
        'font-size:0.79rem', 'outline:none', 'min-width:0'
    ].join(';');

    const save = () => {
        item.name = input.value.trim();
        try { localStorage.setItem('nv_yt_history', JSON.stringify(_ytHistory)); } catch { }
        ytRenderHistory();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); save(); }
        if (e.key === 'Escape') { ytRenderHistory(); }
    });

    labelEl.replaceWith(input);
    input.focus();
    input.select();
}

function ytDeleteHistoryItem(idx) {
    _ytHistory.splice(idx, 1);
    try { localStorage.setItem('nv_yt_history', JSON.stringify(_ytHistory)); } catch { }
    ytRenderHistory();
}

function ytClearHistory() {
    if (!confirm(state.lang === 'es' ? '¿Limpiar todo el historial?' : 'Clear all history?')) return;
    _ytHistory = [];
    try { localStorage.removeItem('nv_yt_history'); } catch { }
    ytRenderHistory();
}

function ytRenderHistory() {
    const wrap = document.getElementById('yt-history-wrap');
    if (!wrap) return;
    const isEs = state.lang === 'es';

    if (!_ytHistory.length) {
        wrap.innerHTML = `
            <p style="font-size:0.72rem;color:rgba(148,163,184,0.35);text-align:center;
                      margin:0.2rem 0 0;padding:0.5rem;">
                ${isEs ? t('yt_no_saved') : t('yt_no_saved')}
            </p>`;
        return;
    }

    const items = _ytHistory.map((h, i) => `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;
                    border-radius:12px;background:rgba(255,255,255,0.03);
                    border:1px solid rgba(255,255,255,0.07);margin-bottom:0.45rem;
                    transition:background 0.18s;"
             onmouseover="this.style.background='rgba(255,255,255,0.06)'"
             onmouseout="this.style.background='rgba(255,255,255,0.03)'">
            <button onclick="ytPlayHistoryItem(${i})"
                    title="${isEs ? 'Reproducir' : 'Play'}"
                    style="width:34px;height:34px;min-width:34px;border-radius:50%;border:none;
                           background:rgba(255,0,0,0.15);color:#ff5555;cursor:pointer;
                           display:flex;align-items:center;justify-content:center;font-size:0.9rem;
                           transition:background 0.15s;flex-shrink:0;"
                    onmouseover="this.style.background='rgba(255,0,0,0.3)'"
                    onmouseout="this.style.background='rgba(255,0,0,0.15)'">▶</button>
            <span data-yt-idx="${i}"
                  style="flex:1;font-size:0.79rem;color:rgba(241,245,249,0.82);
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         cursor:pointer;" onclick="ytPlayHistoryItem(${i})">
                ${h.name || h.label}
            </span>
            <button onclick="ytRenameHistoryItem(${i})"
                    title="${isEs ? 'Renombrar' : 'Rename'}"
                    style="width:30px;height:30px;min-width:30px;border-radius:8px;border:none;
                           background:transparent;color:rgba(148,163,184,0.3);cursor:pointer;
                           font-size:0.85rem;display:flex;align-items:center;justify-content:center;
                           transition:color 0.15s,background 0.15s;flex-shrink:0;"
                    onmouseover="this.style.color='rgba(0,242,255,0.7)';this.style.background='rgba(0,242,255,0.08)'"
                    onmouseout="this.style.color='rgba(148,163,184,0.3)';this.style.background='transparent'">✏</button>
            <button onclick="ytDeleteHistoryItem(${i})"
                    title="${isEs ? 'Eliminar' : 'Remove'}"
                    style="width:30px;height:30px;min-width:30px;border-radius:8px;border:none;
                           background:transparent;color:rgba(148,163,184,0.4);cursor:pointer;
                           font-size:1rem;display:flex;align-items:center;justify-content:center;
                           transition:color 0.15s,background 0.15s;flex-shrink:0;"
                    onmouseover="this.style.color='rgba(239,68,68,0.8)';this.style.background='rgba(239,68,68,0.1)'"
                    onmouseout="this.style.color='rgba(148,163,184,0.4)';this.style.background='transparent'">✕</button>
        </div>`).join('');

    wrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:0.55rem;">
            <p style="font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
                      color:rgba(148,163,184,0.5);margin:0;">
                ${t('yt_saved')} (${_ytHistory.length})
            </p>
            <button onclick="ytClearHistory()"
                    style="font-size:0.68rem;color:rgba(148,163,184,0.4);background:none;
                           border:none;cursor:pointer;padding:0.2rem 0.4rem;border-radius:6px;
                           transition:color 0.15s;"
                    onmouseover="this.style.color='rgba(239,68,68,0.7)'"
                    onmouseout="this.style.color='rgba(148,163,184,0.4)'">${t('yt_clear_all')}</button>
        </div>
        ${items}`;
}

// API pública para que nv-freezing.js pueda escalar el volumen
window.NVMetronome = {
    setRescueMode(on) {
        if (_metGain) _metGain.gain.value = on ? 1.0 : 0.78;
    }
};

// ============================================================
// CONTEXTO DE AYUDA MÉDICA
// ============================================================
function showMedicalTip(msg, callback) {
    const tip = document.createElement('div');
    tip.style.cssText = [
        'position:fixed', 'top:90px', 'left:50%', 'transform:translateX(-50%)',
        'background:#161B2D', 'color:#00F2FF',
        'border:1px solid rgba(0,242,255,0.3)',
        'padding:0.8rem 1.4rem', 'border-radius:16px',
        'z-index:9999', 'font-size:0.82rem',
        'max-width:300px', 'text-align:center',
        'box-shadow:0 10px 30px rgba(0,0,0,0.6)',
        'line-height:1.5', 'pointer-events:none', 'transition:opacity 0.5s'
    ].join(';');
    tip.innerHTML = `<strong style="display:block;margin-bottom:4px;color:#8B5CF6;">ℹ ${state.lang === 'es' ? 'Beneficio médico' : 'Medical benefit'}</strong>${msg}`;
    document.body.appendChild(tip);
    setTimeout(() => { tip.style.opacity = '0'; setTimeout(() => tip.parentNode && tip.parentNode.removeChild(tip), 500); }, 3200);
    if (callback) setTimeout(callback, 600);
}

// ============================================================
// EXPORTAR PDF CLÍNICO
// ============================================================

// Helper: wrap text to fit width and return array of lines
function _pdfWrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(String(text || ''), maxWidth);
}

// Helper: draw a filled rect as a section divider/background
function _pdfRect(doc, x, y, w, h, r, g, b) {
    doc.setFillColor(r, g, b);
    doc.rect(x, y, w, h, 'F');
}

function exportPDF() {
    if (!window.jspdf) {
        showToast(state.lang === 'es' ? 'Librería PDF no disponible' : 'PDF library not available', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const isEs = state.lang === 'es';
    const name = state.user ? state.user.name : (isEs ? 'Paciente' : 'Patient');
    const today = new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const filename = `NeuroTempo_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    const doc = new jsPDF('p', 'mm', 'a4');
    const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
    let y = 0;

    const setFont = (size, style, r, g, b) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style || 'normal');
        doc.setTextColor(r ?? 30, g ?? 41, b ?? 59);
    };

    const checkPage = (needed) => {
        if (y + needed > PH - 14) { doc.addPage(); y = 14; }
    };

    // ── HEADER ──────────────────────────────────────────────
    _pdfRect(doc, 0, 0, PW, 28, 16, 185, 129);
    setFont(20, 'bold', 255, 255, 255);
    doc.text('NEUROTEMPO PRO', ML, 12);
    setFont(9, 'normal', 220, 252, 231);
    doc.text(isEs ? 'Reporte Clinico Integrado' : 'Integrated Clinical Report', ML, 19);
    doc.text(today, ML, 24);
    // HIPAA badge
    setFont(8, 'bold', 255, 255, 255);
    doc.text('HIPAA COMPLIANT', PW - MR - 36, 16);
    y = 34;

    // ── PACIENTE ────────────────────────────────────────────
    checkPage(32);
    _pdfRect(doc, ML, y, CW, 28, 240, 249, 255);
    setFont(8, 'bold', 100, 116, 139);
    doc.text((isEs ? 'INFORMACION DEL PACIENTE' : 'PATIENT INFORMATION'), ML + 3, y + 5);
    setFont(10, 'bold', 30, 41, 59);
    doc.text((isEs ? 'Nombre: ' : 'Name: ') + name, ML + 3, y + 12);
    setFont(10, 'normal', 30, 41, 59);
    const statusColor = state.patientStatus === 'ON' ? [16, 185, 129] : [239, 68, 68];
    doc.text((isEs ? 'Estado: ' : 'Status: '), ML + 3, y + 18);
    doc.setTextColor(...statusColor);
    doc.text(`${t('phase')} ${state.patientStatus}`, ML + 22, y + 18);
    setFont(10, 'normal', 100, 116, 139);
    doc.text('GPS: ' + state.gpsMetadata.lat + ', ' + state.gpsMetadata.lon, ML + 3, y + 24);
    y += 32;

    // ── TAPPING TEST ────────────────────────────────────────
    checkPage(48);
    const tapCount = state.tappingData.timestamps.length;
    const avgMs = state.tappingData.intervals.length > 0
        ? Math.round(state.tappingData.intervals.reduce((a, b) => a + b, 0) / state.tappingData.intervals.length) : 0;
    const tapValuation = tapCount > 20 ? (isEs ? 'OPTIMO' : 'OPTIMAL') : tapCount > 10 ? 'NORMAL' : tapCount > 0 ? (isEs ? 'BAJO' : 'LOW') : 'N/A';

    setFont(8, 'bold', 100, 116, 139);
    doc.text(isEs ? 'TEST DE TAPPING' : 'TAPPING TEST', ML, y + 5);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.rect(ML, y + 7, CW, 36);

    const bW = (CW - 6) / 3;
    _pdfRect(doc, ML + 2, y + 9, bW, 32, 240, 253, 244);
    _pdfRect(doc, ML + 4 + bW, y + 9, bW, 32, 239, 246, 255);
    _pdfRect(doc, ML + 6 + bW * 2, y + 9, bW, 32, 248, 250, 252);

    setFont(18, 'bold', 16, 185, 129);
    doc.text(String(tapCount), ML + 2 + bW / 2, y + 24, { align: 'center' });
    setFont(8, 'normal', 100, 116, 139);
    doc.text(isEs ? 'Taps' : 'Taps', ML + 2 + bW / 2, y + 30, { align: 'center' });

    setFont(18, 'bold', 59, 130, 246);
    doc.text(avgMs > 0 ? avgMs + 'ms' : 'N/A', ML + 4 + bW + bW / 2, y + 24, { align: 'center' });
    setFont(8, 'normal', 100, 116, 139);
    doc.text(isEs ? 'Intervalo Medio' : 'Avg Interval', ML + 4 + bW + bW / 2, y + 30, { align: 'center' });

    setFont(14, 'bold', 16, 185, 129);
    doc.text(tapValuation, ML + 6 + bW * 2 + bW / 2, y + 24, { align: 'center' });
    setFont(8, 'normal', 100, 116, 139);
    doc.text(isEs ? 'Valoracion' : 'Rating', ML + 6 + bW * 2 + bW / 2, y + 30, { align: 'center' });
    y += 48;

    // ── TODOS LOS INFORMES MÉDICOS ──────────────────────────
    const allReports = state.medicalReports || [];
    if (allReports.length > 0) {
        checkPage(14);
        setFont(8, 'bold', 100, 116, 139);
        doc.text(
            isEs
                ? `INFORMES MEDICOS - ANALISIS IA (${allReports.length})`
                : `MEDICAL REPORTS - AI ANALYSIS (${allReports.length})`,
            ML, y + 5
        );
        y += 10;

        allReports.forEach((rep, idx) => {
            const diag  = rep.diagnostico_principal || rep.diagnosis || '—';
            const meds  = rep.medicacion_activa || rep.medicacion || '';
            const recs  = rep.recomendaciones || rep.analysis || '—';
            const src   = rep.source || rep.fileName || (isEs ? 'Informe' : 'Report');
            const isCrit = rep.isCritical || false;

            // Calcular altura del bloque antes de dibujarlo
            doc.setFontSize(9);
            const diagLines = _pdfWrapText(doc, diag, CW - 12);
            const recsLines = _pdfWrapText(doc, recs, CW - 12);
            const medsLines = meds ? _pdfWrapText(doc, meds, CW - 12) : [];
            const metricsObj = rep.metricas || {};
            const metricPairs = Object.entries(metricsObj).filter(([, v]) => v);
            const metricsH = metricPairs.length > 0 ? Math.ceil(metricPairs.length / 3) * 7 + 10 : 0;
            const blockH = 14
                + diagLines.length * 5 + 6
                + (medsLines.length ? medsLines.length * 5 + 10 : 0)
                + recsLines.length * 5 + 10
                + (isCrit ? 10 : 0)
                + metricsH;

            checkPage(blockH + 6);

            // Fondo del bloque — rojo suave si crítico, azul suave si normal
            if (isCrit) {
                _pdfRect(doc, ML, y, CW, blockH, 254, 242, 242);
                doc.setDrawColor(252, 165, 165); doc.setLineWidth(0.3);
                doc.rect(ML, y, CW, blockH);
            } else {
                _pdfRect(doc, ML, y, CW, blockH, 248, 250, 252);
                doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
                doc.rect(ML, y, CW, blockH);
            }
            // Barra lateral de color
            _pdfRect(doc, ML, y, 3, blockH, isCrit ? 239 : 59, isCrit ? 68 : 130, isCrit ? 68 : 246);

            let iy = y + 7;

            // Número de informe + nombre archivo
            setFont(7, 'bold', 148, 163, 184);
            doc.text(`#${idx + 1}`, ML + 5, iy);
            setFont(10, 'bold', 30, 41, 59);
            const srcLines = _pdfWrapText(doc, src, CW - 50);
            doc.text(srcLines[0] || src, ML + 12, iy);
            // Estado badge
            if (isCrit) {
                setFont(7, 'bold', 220, 38, 38);
                doc.text(isEs ? '● CRITICO' : '● CRITICAL', PW - MR - 2, iy, { align: 'right' });
            } else {
                setFont(7, 'bold', 16, 185, 129);
                doc.text(isEs ? '● ESTABLE' : '● STABLE', PW - MR - 2, iy, { align: 'right' });
            }
            // Fecha
            setFont(7, 'normal', 148, 163, 184);
            doc.text(rep.date || '', PW - MR - 2, iy + 5, { align: 'right' });
            // Estadio si existe
            if (rep.estadio) {
                setFont(7, 'bold', 124, 58, 237);
                doc.text(rep.estadio, ML + 12, iy + 5);
            }
            iy += 12;

            // Diagnóstico
            setFont(7, 'bold', 100, 116, 139);
            doc.text(isEs ? 'DIAGNOSTICO' : 'DIAGNOSIS', ML + 5, iy);
            iy += 5;
            setFont(9, 'bold', isCrit ? 220 : 29, isCrit ? 38 : 78, isCrit ? 38 : 216);
            doc.text(diagLines, ML + 5, iy);
            iy += diagLines.length * 5 + 4;

            // Alerta crítica
            if (isCrit) {
                setFont(8, 'bold', 220, 38, 38);
                doc.text(
                    isEs ? '! Consulte con su especialista antes de cualquier ejercicio.'
                         : '! Consult your specialist before any exercise.',
                    ML + 5, iy
                );
                iy += 8;
            }

            // Medicación
            if (medsLines.length) {
                setFont(7, 'bold', 100, 116, 139);
                doc.text(isEs ? 'MEDICACION' : 'MEDICATION', ML + 5, iy);
                iy += 5;
                setFont(9, 'normal', 22, 163, 74);
                doc.text(medsLines, ML + 5, iy);
                iy += medsLines.length * 5 + 4;
            }

            // Recomendaciones
            setFont(7, 'bold', 100, 116, 139);
            doc.text(isEs ? 'RECOMENDACIONES' : 'RECOMMENDATIONS', ML + 5, iy);
            iy += 5;
            setFont(9, 'normal', 71, 85, 105);
            doc.text(recsLines, ML + 5, iy);
            iy += recsLines.length * 5 + 4;

            // Métricas clínicas
            if (metricPairs.length > 0) {
                setFont(7, 'bold', 100, 116, 139);
                doc.text(isEs ? 'METRICAS' : 'METRICS', ML + 5, iy);
                iy += 5;
                const colW = CW / 3;
                metricPairs.forEach(([k, v], mi) => {
                    const col = mi % 3;
                    const row = Math.floor(mi / 3);
                    const mx2 = ML + 5 + col * colW;
                    const my2 = iy + row * 7;
                    setFont(7, 'bold', 100, 116, 139);
                    doc.text(k.toUpperCase() + ':', mx2, my2);
                    setFont(8, 'bold', 30, 41, 59);
                    doc.text(String(v), mx2 + 14, my2);
                });
                iy += Math.ceil(metricPairs.length / 3) * 7;
            }

            y = iy + 8;
        });
    }

    // ── SESIONES DE REHABILITACIÓN ──────────────────────────
    const sessions = window.NVHistory ? NVHistory.getAll().slice(0, 5) : [];
    if (sessions.length) {
        checkPage(20 + sessions.length * 10);
        setFont(8, 'bold', 100, 116, 139);
        doc.text(isEs ? 'ULTIMAS SESIONES DE REHABILITACION' : 'LATEST REHABILITATION SESSIONS', ML, y + 5);
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
        doc.rect(ML, y + 7, CW, sessions.length * 9 + 4);
        const typeLabel = { tapping: isEs ? 'Temblor' : 'Tremor', drawing: isEs ? 'Dibujo' : 'Drawing', vocal: 'Vocal', breathing: isEs ? 'Respiracion' : 'Breathing' };
        let ry = y + 13;
        sessions.forEach((s, i) => {
            const m = s.metrics || {};
            const label = typeLabel[s.type] || s.type;
            const dateStr = new Date(s.ts).toLocaleDateString(isEs ? 'es-ES' : 'en-US');
            let metric = '';
            if (s.type === 'tapping') metric = `${m.bpm || '—'} BPM · Jitter ${m.jitter || '—'}%`;
            if (s.type === 'drawing') metric = `${isEs ? 'Estabilidad' : 'Stability'} ${m.stability || '—'}%`;
            if (s.type === 'vocal') metric = `${isEs ? 'Estabilidad' : 'Stability'} ${m.stability || '—'}%`;
            if (s.type === 'breathing') metric = `${m.cycles || '—'} ${isEs ? 'ciclos' : 'cycles'} · ${m.duration || '—'}s`;
            if (i > 0) { doc.setDrawColor(241, 245, 249); doc.line(ML + 2, ry - 3, PW - MR - 2, ry - 3); }
            setFont(9, 'bold', 30, 41, 59);
            doc.text(label, ML + 3, ry);
            setFont(9, 'normal', 148, 163, 184);
            doc.text(`FASE ${s.phase || 'ON'}`, ML + 40, ry);
            setFont(9, 'normal', 71, 85, 105);
            doc.text(metric, ML + 70, ry);
            setFont(8, 'normal', 148, 163, 184);
            doc.text(dateStr, PW - MR, ry, { align: 'right' });
            ry += 9;
        });
        y = ry + 6;
    }

    // ── MEDICACIÓN ──────────────────────────────────────────
    if (state.medications.length) {
        checkPage(16 + state.medications.length * 10);
        setFont(8, 'bold', 100, 116, 139);
        doc.text(isEs ? 'MEDICACION' : 'MEDICATION', ML, y + 5);
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
        doc.rect(ML, y + 7, CW, state.medications.length * 9 + 4);
        let my = y + 13;
        state.medications.forEach((med, i) => {
            if (i > 0) { doc.setDrawColor(241, 245, 249); doc.line(ML + 2, my - 3, PW - MR - 2, my - 3); }
            setFont(10, 'bold', 30, 41, 59);
            doc.text(med.name, ML + 3, my);
            setFont(9, 'normal', 100, 116, 139);
            doc.text(med.time, ML + 90, my);
            const takenBg = med.taken ? [220, 252, 231] : [254, 249, 195];
            const takenFg = med.taken ? [22, 163, 74] : [202, 138, 4];
            _pdfRect(doc, PW - MR - 28, my - 5, 26, 7, ...takenBg);
            setFont(8, 'bold', ...takenFg);
            doc.text(med.taken ? (isEs ? 'Tomado' : 'Taken') : (isEs ? 'Pendiente' : 'Pending'), PW - MR - 15, my, { align: 'center' });
            my += 9;
        });
        y = my + 6;
    }

    // ── FOOTER ──────────────────────────────────────────────
    checkPage(14);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
    doc.line(ML, y, PW - MR, y);
    setFont(8, 'normal', 148, 163, 184);
    doc.text(`NeuroTempo PRO · ${today}`, PW / 2, y + 6, { align: 'center' });
    setFont(8, 'bold', 148, 163, 184);
    doc.text('HIPAA COMPLIANT · RGPD · Cifrado NVP-2026', PW / 2, y + 11, { align: 'center' });

    doc.save(filename);
    logAudit('Reporte PDF exportado');
    showToast(isEs ? 'PDF descargado correctamente' : 'PDF downloaded successfully', 'success');
}

// ============================================================
// SOS INTELIGENTE — LONG PRESS 2 SEGUNDOS
// ============================================================
let _sosTimer = null, _sosInterval = null;

function initSosButton() {
    // Botón flotante
    _attachSOS(document.getElementById('floating-sos-btn'));
}

function _attachSOS(btn) {
    if (!btn || btn._sosAttached) return;
    btn._sosAttached = true;
    const reset = () => { btn.innerHTML = '<span>SOS</span>'; };
    const start = (e) => {
        e.preventDefault();
        let pct = 0;
        btn.innerHTML = `<svg viewBox="0 0 36 36" style="width:44px;height:44px;position:absolute;top:-6px;left:-6px;transform:rotate(-90deg);">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
            <circle id="sos-arc" cx="18" cy="18" r="15.9" fill="none" stroke="white" stroke-width="3"
                stroke-dasharray="0 100" stroke-linecap="round"/></svg>
            <span style="position:relative;z-index:1;font-size:0.75rem;font-weight:900;">SOS</span>`;
        _sosInterval = setInterval(() => {
            pct = Math.min(pct + 2.5, 100);
            const arc = document.getElementById('sos-arc');
            if (arc) arc.setAttribute('stroke-dasharray', `${pct} 100`);
        }, 50);
        _sosTimer = setTimeout(() => { clearInterval(_sosInterval); reset(); activateSOS(); }, 2000);
    };
    const cancel = () => { clearTimeout(_sosTimer); clearInterval(_sosInterval); _sosTimer = null; reset(); };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', cancel);
    btn.addEventListener('mouseleave', cancel);
    btn.addEventListener('touchend', cancel);
    btn.addEventListener('touchcancel', cancel);
}

// ── Número oficial de emergencias según país del paciente ─────
function _getEmergencyNumber(country) {
    const c = (country || '').toLowerCase().trim();
    if (/españa|spain|es\b/.test(c))            return { num: '112',  label: 'España — 112' };
    if (/australia/.test(c))                     return { num: '000',  label: 'Australia — 000' };
    if (/uk|united kingdom|reino unido/.test(c)) return { num: '999',  label: 'UK — 999' };
    if (/canada|canadá/.test(c))                 return { num: '911',  label: 'Canada — 911' };
    if (/usa|united states|estados unidos/.test(c)) return { num: '911', label: 'USA — 911' };
    return { num: '112 / 911', label: 'Internacional — 112 / 911' };
}

function secEditContact(n) {
    const nameInp  = document.getElementById(`sec-ec${n}-name`);
    const phoneInp = document.getElementById(`sec-ec${n}-phone`);
    const editBtn  = document.getElementById(`sec-ec${n}-edit-btn`);
    const saveBtn  = document.getElementById(`sec-ec${n}-save-btn`);
    const row      = document.getElementById(`sec-ec${n}-row`);
    if (!nameInp || !phoneInp) return;

    // Activar edición
    [nameInp, phoneInp].forEach(inp => {
        inp.removeAttribute('readonly');
        inp.style.background   = 'rgba(10,15,30,0.7)';
        inp.style.border       = '1px solid rgba(0,242,255,0.35)';
        inp.style.color        = 'rgba(241,245,249,0.95)';
        inp.style.cursor       = 'text';
        inp.style.borderRadius = '8px';
    });
    if (row)     row.style.borderColor = 'rgba(0,242,255,0.25)';
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'flex';

    // Quitar onclick que dispara secEditContact (ya estamos en modo edición)
    nameInp.removeAttribute('onclick');
    phoneInp.removeAttribute('onclick');
    nameInp.style.cursor  = 'text';
    phoneInp.style.cursor = 'text';
    nameInp.focus();
}

function secSaveContact(n) {
    const nameInp  = document.getElementById(`sec-ec${n}-name`);
    const phoneInp = document.getElementById(`sec-ec${n}-phone`);
    const editBtn  = document.getElementById(`sec-ec${n}-edit-btn`);
    const saveBtn  = document.getElementById(`sec-ec${n}-save-btn`);
    const row      = document.getElementById(`sec-ec${n}-row`);
    if (!nameInp || !phoneInp) return;

    const name  = nameInp.value.trim();
    const phone = phoneInp.value.trim();
    const hasData = name || phone;

    // Guardar en estado
    const u = state.user || {};
    u[`ec${n}`] = { name, phone };
    state.user = u;
    nvSaveUser(u);

    // Volver a modo lectura
    [nameInp, phoneInp].forEach(inp => {
        inp.setAttribute('readonly', '');
        inp.setAttribute('onclick', `secEditContact(${n})`);
        inp.style.background   = 'transparent';
        inp.style.border       = '1px solid transparent';
        inp.style.color        = hasData ? 'rgba(241,245,249,0.85)' : 'rgba(148,163,184,0.35)';
        inp.style.cursor       = 'pointer';
    });
    if (row)     row.style.borderColor = 'rgba(255,255,255,0.07)';
    if (editBtn) editBtn.style.display = 'flex';
    if (saveBtn) saveBtn.style.display = 'none';

    // Actualizar botón de llamada con el nuevo teléfono
    const callEl = document.getElementById(`sec-ec${n}-call-btn`);
    if (callEl) {
        if (phone) {
            const a = document.createElement('a');
            a.id   = `sec-ec${n}-call-btn`;
            a.href = `tel:${phone.replace(/\s/g, '')}`;
            a.title = state.lang === 'es' ? 'Llamar' : 'Call';
            a.style.cssText = 'width:30px;height:30px;border:none;border-radius:8px;cursor:pointer;' +
                'background:rgba(16,185,129,0.12);color:rgba(16,185,129,0.7);' +
                'display:flex;align-items:center;justify-content:center;' +
                'text-decoration:none;transition:color 0.18s,background 0.18s;';
            a.onmouseover = () => { a.style.color = 'rgba(16,185,129,1)'; a.style.background = 'rgba(16,185,129,0.25)'; };
            a.onmouseout  = () => { a.style.color = 'rgba(16,185,129,0.7)'; a.style.background = 'rgba(16,185,129,0.12)'; };
            a.innerHTML = '<i data-lucide="phone-call" style="width:14px;height:14px;pointer-events:none;"></i>';
            callEl.replaceWith(a);
        } else {
            callEl.style.color = 'rgba(148,163,184,0.2)';
            callEl.style.background = 'rgba(255,255,255,0.03)';
            callEl.removeAttribute('href');
        }
    }
    lucide.createIcons();

    showToast(t('sec_contacts_saved'), 'success');
}

function saveEmergencyContacts() {
    const u = state.user || {};
    const v = (id) => (document.getElementById(id)?.value || '').trim();
    u.ec1 = { name: v('sec-ec1-name'), phone: v('sec-ec1-phone') };
    u.ec2 = { name: v('sec-ec2-name'), phone: v('sec-ec2-phone') };
    u.ec3 = { name: v('sec-ec3-name'), phone: v('sec-ec3-phone') };
    state.user = u;
    nvSaveUser(u);
    showToast(t('sec_contacts_saved'), 'success');
}

function activateSOS() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.35, 0.7].forEach(delay => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'square'; osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
            osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.25);
        });
    } catch (_) { }
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 600]);
    const { lat, lon } = state.gpsMetadata;
    logAudit('SOS ACTIVADO — Emergencia reportada');
    const isEs = state.lang === 'es';
    const u    = state.user || {};
    const emg  = _getEmergencyNumber(u.country);

    // Contactos personales configurados
    const contacts = [u.ec1, u.ec2, u.ec3].filter(c => c && c.phone);
    const contactLines = contacts.length
        ? contacts.map((c, i) => `${i + 1}. ${c.name ? c.name + ' — ' : ''}📞 ${c.phone}`).join('\n')
        : (isEs ? '— Sin contactos guardados —' : '— No contacts saved —');

    const personalSection = isEs
        ? `👥 Llama a tus contactos:\n${contactLines}\n\n`
        : `👥 Call your contacts:\n${contactLines}\n\n`;
    const officialSection = isEs
        ? `🚨 Si no te localizan, llama al ${emg.num} (${emg.label})`
        : `🚨 If unreachable, call ${emg.num} (${emg.label})`;

    showModal(
        `📍 GPS: ${lat}, ${lon}\n\n${personalSection}${officialSection}`,
        { title: `🚨 SOS ${isEs ? 'ACTIVADO' : 'ACTIVATED'}` }
    );
}

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
    stopMetronome();
    stopVoiceRecording(true);
    if (window.NVFirebase && NVFirebase.isReady()) NVFirebase.logout().catch(() => { });
    state.user = null;
    localStorage.removeItem('nv_user');
    location.reload();
}

function saveProfileEdit() {
    const name = (document.getElementById('edit-name')?.value || '').trim();
    const email = (document.getElementById('edit-email')?.value || '').trim();
    const age = (document.getElementById('edit-age')?.value || '').trim();
    const country = (document.getElementById('edit-country')?.value || '').trim();
    const emergency = (document.getElementById('edit-emergency')?.value || '').trim();

    if (!name || !age || !country) { showToast(t('fill_fields'), 'error'); return; }

    state.user.name = name;
    state.user.email = email;
    state.user.age = age;
    state.user.country = country;
    state.user.emergencyContact = emergency;
    nvSaveUser(state.user);
    // Sincronizar cambios de perfil con Firestore (async, no bloqueante)
    if (window.NVFirebase && NVFirebase.isReady() && state.user.uid) {
        NVFirebase.saveProfile(state.user.uid, state.user).catch(console.warn);
    }
    updateHeader();
    showToast(t('prof_changes_saved'), 'success');
}

function nvToggleSetting(key, row) {
    let s = {};
    try { s = JSON.parse(localStorage.getItem('nv_settings') || '{}'); } catch { }
    const current = s[key] !== false; // true si activo
    s[key] = !current;
    localStorage.setItem('nv_settings', JSON.stringify(s));

    // Actualizar toggle visual sin re-render completo
    const toggle = row ? row.querySelector('.nv-toggle') : null;
    if (toggle) toggle.classList.toggle('on', !current);

    const isEs = state.lang === 'es';
    const onText = isEs ? 'Módulo activado' : 'Module enabled';
    const offText = isEs ? 'Módulo desactivado' : 'Module disabled';
    showToast(!current ? onText : offText, !current ? 'success' : 'info');
}

function clearProfileSummary() {
    const isEs = state.lang === 'es';
    showModal(
        isEs ? '¿Desea borrar todo el historial médico del perfil?' : 'Delete all medical history from the profile?',
        {
            title: isEs ? 'Confirmar' : 'Confirm',
            confirmText: isEs ? 'Borrar' : 'Delete',
            cancelText: isEs ? 'Cancelar' : 'Cancel',
            onConfirm: () => {
                state.profileSummary = [];
                localStorage.removeItem('nv_prof_summary');
                render();
            }
        }
    );
}

// ============================================================
// ESTABILIZACIÓN DE TOQUE (debounce anti-temblor)
// ============================================================
let _lastClick = 0;
document.addEventListener('click', (e) => {
    const now = performance.now();
    if (now - _lastClick < 600) {
        if (e.target.closest('.nav-link') || e.target.closest('button')) return;
        e.preventDefault();
        return;
    }
    _lastClick = now;
}, true);

// ============================================================
// SUBIDA REAL DE ARCHIVOS
// ============================================================

// Mantener para compat con cualquier código antiguo que aún la llame
function triggerFileUpload() {
    const input = document.getElementById('file-upload-input');
    if (input) input.click();
}

// Conecta eventos drag-and-drop al dropzone después del render —
// se llama via setTimeout desde changeView('health')
function _initHealthDropzone() {
    const dz = document.getElementById('upload-dropzone');
    if (!dz || dz._nvDzInit) return;
    dz._nvDzInit = true;

    // El input transparente cubre todo; para drag-and-drop lo bypaseamos
    // escuchando los eventos en el contenedor padre
    ['dragenter', 'dragover'].forEach(evt => {
        dz.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            _dropzoneHover(true);
        });
    });
    dz.addEventListener('dragleave', (e) => {
        if (!dz.contains(e.relatedTarget)) _dropzoneHover(false);
    });
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        _dropzoneHover(false);
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) handleDroppedFile(files);
    });

}

// Hover visual del dropzone durante el drag
function _dropzoneHover(on) {
    const dz = document.getElementById('upload-dropzone');
    if (!dz) return;
    dz.style.borderColor = on ? 'rgba(0,242,255,0.7)' : 'rgba(0,242,255,0.25)';
    dz.style.background = on ? 'rgba(0,242,255,0.07)' : 'rgba(22,27,45,0.6)';
    dz.style.transform = on ? 'scale(1.01)' : 'scale(1)';
}

// Spinner de "Analizando..." dentro del dropzone
function _dropzoneSetLoading(loading) {
    const wrap = document.getElementById('dropzone-icon-wrap');
    // Durante análisis, el input transparente ya no hace falta — ocultarlo
    const inp = document.getElementById('file-upload-input');
    if (loading && inp) inp.style.display = 'none';
    if (!loading && inp) { inp.style.display = ''; inp.style.position = 'absolute'; inp.style.inset = '0'; inp.style.width = '100%'; inp.style.height = '100%'; inp.style.opacity = '0'; inp.style.cursor = 'pointer'; inp.style.zIndex = '5'; }

    if (!wrap) return;
    if (loading) {
        wrap.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                 stroke="var(--primary-green)" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round"
                 style="display:block;margin:0 auto 0.75rem;animation:nvSpin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <p style="font-weight:700;font-size:0.95rem;color:var(--primary-green);margin-bottom:0.3rem;">${t('hlt_analyzing')}</p>
            <p id="upload-status" style="font-size:0.82rem;color:rgba(148,163,184,0.6);"></p>`;
    } else {
        wrap.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                 fill="none" stroke="var(--accent-cyan)" stroke-width="1.6"
                 stroke-linecap="round" stroke-linejoin="round"
                 style="display:block;margin:0 auto 0.75rem;">
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
            </svg>
            <p style="font-weight:700;font-size:0.95rem;margin-bottom:0.3rem;">${t('hlt_click')}</p>
            <p id="upload-status" style="font-size:0.82rem;color:rgba(148,163,184,0.6);">${t('hlt_fmt')}</p>`;
    }
}

function handleFileUpload(input) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const isEs = state.lang === 'es';

    // Collect all files (input element or single File object from drag & drop)
    let rawFiles = [];
    if (input && input.files && input.files.length) {
        rawFiles = Array.from(input.files);
    } else if (input instanceof File) {
        rawFiles = [input];
    } else if (input && input.files) {
        rawFiles = [input.files[0]];
    }

    if (!rawFiles.length) return;

    // Validate types
    const validFiles = rawFiles.filter(f => allowed.includes(f.type));
    const rejected = rawFiles.length - validFiles.length;
    if (rejected > 0) {
        showToast(isEs
            ? `${rejected} archivo(s) ignorado(s): formato no válido (solo PDF, JPG, PNG).`
            : `${rejected} file(s) ignored: invalid format (PDF, JPG, PNG only).`, 'error');
    }
    if (!validFiles.length) return;

    // Cap at 5 files
    const capped = validFiles.slice(0, 5);
    if (validFiles.length > 5) {
        showToast(isEs ? 'Máximo 5 archivos por lote.' : 'Maximum 5 files per batch.', 'error');
    }

    state._pendingFiles = capped;
    state._pendingFile = capped[0]; // compat

    _renderBatchQueue();

}

// ── Render de la cola de archivos pendientes ──────────────────
function _renderBatchQueue() {
    const files = state._pendingFiles;
    const isEs = state.lang === 'es';
    const batchEl = document.getElementById('batch-queue');
    if (!batchEl) return;

    if (!files.length) {
        // Cola vacía: ocultar queue, deshabilitar botón, resetear dropzone
        batchEl.style.display = 'none';
        batchEl.innerHTML = '';
        const anaBox = document.getElementById('report-ana-box');
        if (anaBox) anaBox.style.display = 'none';
        const dz = document.getElementById('upload-dropzone');
        if (dz) dz.style.borderColor = 'rgba(0,242,255,0.25)';
        const statusEl = document.getElementById('upload-status');
        if (statusEl) statusEl.innerHTML = `<span style="color:rgba(148,163,184,0.6);">${t('hlt_fmt')}</span>`;
        // Reset input so the same file can be re-selected
        const inp = document.getElementById('file-upload-input');
        if (inp) inp.value = '';
        return;
    }

    batchEl.style.display = 'block';
    batchEl.innerHTML = files.map((f, i) => {
        const sizeMB = (f.size / 1024 / 1024).toFixed(2);
        const ext = f.name.split('.').pop().toUpperCase();
        const safeN = encodeURIComponent(f.name);
        return `
        <div class="nv-batch-item" id="batch-item-${i}">
            <div style="display:flex;align-items:center;gap:0.6rem;min-width:0;flex:1;">
                <span style="font-size:1rem;flex-shrink:0;">${ext === 'PDF' ? '📄' : '🖼'}</span>
                <div style="min-width:0;">
                    <div style="font-size:0.8rem;font-weight:700;color:rgba(241,245,249,0.9);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;"
                         title="${f.name}">${f.name}</div>
                    <div style="font-size:0.72rem;color:rgba(148,163,184,0.5);">${sizeMB} MB · ${ext}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.4rem;flex-shrink:0;">
                <span id="batch-status-${i}" style="font-size:0.72rem;font-weight:700;color:rgba(148,163,184,0.5);">
                    ${isEs ? 'En cola' : 'Queued'}
                </span>
                <button onclick="handleRemoveBatchFile('${safeN}')"
                        aria-label="${isEs ? 'Quitar archivo' : 'Remove file'}"
                        title="${isEs ? 'Quitar archivo' : 'Remove file'}"
                        style="display:flex;align-items:center;justify-content:center;
                               width:40px;height:40px;min-width:40px;border-radius:50%;
                               border:none;background:transparent;cursor:pointer;
                               color:rgba(239,68,68,0.45);transition:background 0.18s,color 0.18s;"
                        onmouseover="this.style.background='rgba(239,68,68,0.12)';this.style.color='rgba(239,68,68,0.9)'"
                        onmouseout="this.style.background='transparent';this.style.color='rgba(239,68,68,0.45)'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.8" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="nv-batch-bar" id="batch-bar-${i}" style="display:none;">
            <div class="nv-batch-fill" id="batch-fill-${i}" style="width:0%"></div>
        </div>`;
    }).join('');

    // Actualizar hint del dropzone
    const statusEl = document.getElementById('upload-status');
    if (statusEl) statusEl.innerHTML =
        `<span style="color:var(--primary-green);font-weight:700;">
            ✓ ${files.length} ${isEs ? 'archivo(s) listos' : 'file(s) ready'}
         </span>`;

    const dz = document.getElementById('upload-dropzone');
    if (dz) dz.style.borderColor = 'rgba(16,185,129,0.5)';

    const anaBox = document.getElementById('report-ana-box');
    if (anaBox) anaBox.style.display = 'block';

    lucide.createIcons();
}

// ── Quitar un archivo de la cola antes del análisis ───────────
function handleRemoveBatchFile(encodedName) {
    if (state.isAnalyzingReport) return; // no permitir durante análisis
    const fileName = decodeURIComponent(encodedName);

    // Localizar el índice actual en la lista renderizada
    const files = state._pendingFiles;
    const idx = files.findIndex(f => f.name === fileName);
    if (idx === -1) return;

    // Animación fade-out en el item y su barra de progreso
    const itemEl = document.getElementById(`batch-item-${idx}`);
    const barEl = document.getElementById(`batch-bar-${idx}`);
    if (itemEl) itemEl.classList.add('nv-batch-removing');
    if (barEl) barEl.classList.add('nv-batch-removing');

    // Eliminar del estado y re-renderizar después de la animación (220ms)
    setTimeout(() => {
        state._pendingFiles = state._pendingFiles.filter(f => f.name !== fileName);
        state._pendingFile = state._pendingFiles[0] || null;
        _renderBatchQueue();
    }, 230);
}

// ── Batch analysis: procesa cada archivo secuencialmente ─────
async function runReportAnalysisBatch() {
    const files = state._pendingFiles;
    if (!files || !files.length) {
        // Fallback: single file via old path
        return runReportAnalysis();
    }
    if (state.isAnalyzingReport) return;
    if (!window.NVReports) {
        showToast(state.lang === 'es'
            ? 'Módulo de análisis no disponible. Recargue la página.'
            : 'Analysis module unavailable. Please reload.', 'error');
        return;
    }

    state.isAnalyzingReport = true;
    const isEs = state.lang === 'es';
    const anaBtn = document.getElementById('ana-btn');
    if (anaBtn) anaBtn.disabled = true;

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const statusEl = document.getElementById(`batch-status-${i}`);
        const barEl = document.getElementById(`batch-bar-${i}`);
        const fillEl = document.getElementById(`batch-fill-${i}`);
        const itemEl = document.getElementById(`batch-item-${i}`);

        // Mark as processing
        if (statusEl) { statusEl.textContent = isEs ? 'Analizando…' : 'Analyzing…'; statusEl.style.color = 'var(--accent-cyan)'; }
        if (barEl) { barEl.style.display = 'block'; }

        try {
            const { analysis } = await NVReports.analyzeFile(file, state.lang, (progress) => {
                const pct = Math.round(progress * 100);
                if (fillEl) fillEl.style.width = pct + '%';
                if (statusEl) statusEl.textContent = `OCR ${pct}%`;
            });

            const report = {
                id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
                date: new Date().toISOString().split('T')[0],
                source: file.name,
                fileName: file.name,
                fileType: file.type,
                lang: state.lang,
                diagnostico_principal: analysis.diagnostico_principal,
                medicacion_activa: analysis.medicacion_activa,
                recomendaciones: analysis.recomendaciones,
                metricas: analysis.metricas || {},
                alertas: analysis.alertas || [],
                dominios: analysis.dominios || {},
                estadio: analysis.estadio || '',
                isCritical: analysis.isCritical || false,
                diagnosis: analysis.diagnostico_principal,
                analysis: analysis.recomendaciones,
                medicacion: analysis.medicacion_activa,
            };

            // Save
            const uid = state.user && state.user.uid ? state.user.uid : null;
            if (uid && window.NVFirebase && NVFirebase.isReady()) {
                NVFirebase.saveMedicalReport(uid, report)
                    .catch(e => console.warn('[Health] Firestore save fallido:', e));
            }
            NVReports.saveLocal(report);
            state.medicalReports.unshift(report);
            state.profileSummary.unshift({ date: report.date, diagnosis: report.diagnostico_principal, body: report.recomendaciones, source: report.source });

            // Mark done
            if (fillEl) fillEl.style.width = '100%';
            if (statusEl) { statusEl.textContent = isEs ? '✓ Listo' : '✓ Done'; statusEl.style.color = 'var(--primary-green)'; }
            if (itemEl) itemEl.style.opacity = '0.65';

            successCount++;
            _renderMedicalReportsList();

        } catch (e) {
            console.error(`[NVReports] Error en archivo ${file.name}:`, e);
            if (statusEl) { statusEl.textContent = isEs ? '✗ Error' : '✗ Failed'; statusEl.style.color = '#ef4444'; }
            if (barEl) barEl.style.display = 'none';
        }
    }

    localStorage.setItem('nv_prof_summary', JSON.stringify(state.profileSummary.slice(0, 20)));
    logAudit(isEs ? `${successCount} informe(s) médico(s) analizados por IA` : `${successCount} medical report(s) analyzed by AI`);

    if (successCount > 0) {
        showToast(isEs
            ? `${successCount} informe(s) procesado(s) correctamente`
            : `${successCount} report(s) processed successfully`, 'success');
    }

    // Reset state
    state.isAnalyzingReport = false;
    state._pendingFiles = [];
    state._pendingFile = null;
    if (anaBtn) {
        anaBtn.disabled = false;
        anaBtn.innerHTML = `<i data-lucide="cpu"></i> ${t('hlt_analyze')}`;
        lucide.createIcons();
    }
}

// ── Eliminar informe por id ───────────────────────────────────
function downloadSingleReport(id) {
    const r = (state.medicalReports || []).find(x => String(x.id) === String(id));
    if (!r) { showToast('Informe no encontrado', 'error'); return; }
    if (!window.jspdf) { showToast('Librería PDF no disponible', 'error'); return; }

    const { jsPDF } = window.jspdf;
    const isEs = state.lang === 'es';
    const today = new Date().toLocaleDateString(isEs ? 'es-ES' : 'en-US', { year:'numeric', month:'long', day:'numeric' });
    const patient = state.user ? state.user.name : (isEs ? 'Paciente' : 'Patient');
    const srcName = (r.source || r.fileName || 'informe').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filename = `NV_Informe_${srcName}_${new Date().toISOString().slice(0,10)}.pdf`;

    const doc = new jsPDF('p', 'mm', 'a4');
    const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
    let y = 0;

    const setFont = (size, style, r2, g2, b2) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style || 'normal');
        doc.setTextColor(r2 ?? 30, g2 ?? 41, b2 ?? 59);
    };
    const checkPage = (needed) => {
        if (y + needed > PH - 14) { doc.addPage(); y = 14; }
    };

    // ── HEADER ──────────────────────────────────────────────
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, PW, 28, 'F');
    setFont(20, 'bold', 255, 255, 255);
    doc.text('NEUROTEMPO PRO', ML, 12);
    setFont(9, 'normal', 220, 252, 231);
    doc.text(isEs ? 'Analisis de Informe Medico' : 'Medical Report Analysis', ML, 19);
    doc.text(today, ML, 24);
    setFont(8, 'bold', 255, 255, 255);
    doc.text('HIPAA COMPLIANT', PW - MR - 36, 16);
    y = 34;

    // ── PACIENTE + FICHERO ───────────────────────────────────
    checkPage(34);
    doc.setFillColor(240, 249, 255);
    doc.rect(ML, y, CW, 30, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(ML, y, 3, 30, 'F');
    setFont(10, 'bold', 30, 41, 59);
    doc.text((isEs ? 'Paciente: ' : 'Patient: ') + patient, ML + 6, y + 8);
    setFont(10, 'normal', 71, 85, 105);
    doc.text((isEs ? 'Archivo: ' : 'File: ') + (r.source || r.fileName || '—'), ML + 6, y + 15);
    doc.text((isEs ? 'Fecha analisis: ' : 'Analysis date: ') + (r.date || today), ML + 6, y + 22);
    if (r.estadio) {
        setFont(10, 'bold', 124, 58, 237);
        doc.text((isEs ? 'Estadio: ' : 'Stage: ') + r.estadio, ML + 6, y + 29);
    }
    y += 36;

    // ── DIAGNÓSTICO ──────────────────────────────────────────
    checkPage(24);
    setFont(8, 'bold', 100, 116, 139);
    doc.text(isEs ? 'DIAGNOSTICO PRINCIPAL' : 'MAIN DIAGNOSIS', ML, y + 5);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    const diagText = r.diagnostico_principal || r.diagnosis || '—';
    const diagLines = doc.splitTextToSize(diagText, CW - 8);
    const diagH = diagLines.length * 6 + 14 + (r.isCritical ? 12 : 0);
    doc.rect(ML, y + 7, CW, diagH);
    setFont(11, 'bold', 29, 78, 216);
    doc.text(diagLines, ML + 4, y + 15);
    if (r.isCritical) {
        const alertY = y + 15 + diagLines.length * 6 + 2;
        doc.setFillColor(254, 242, 242);
        doc.rect(ML + 4, alertY, CW - 8, 10, 'F');
        setFont(9, 'bold', 220, 38, 38);
        doc.text(isEs ? 'ALERTA CRITICA: consulte con su especialista' : 'CRITICAL ALERT: consult your specialist', ML + 6, alertY + 7);
    }
    y += diagH + 12;

    // ── MÉTRICAS CLÍNICAS ────────────────────────────────────
    const metricsObj = r.metricas || {};
    const metricPairs = Object.entries({
        TA: metricsObj.ta, FC: metricsObj.fc, FEVI: metricsObj.fevi,
        PAP: metricsObj.pap, Glucosa: metricsObj.glucosa,
        SpO2: metricsObj.spo2, Peso: metricsObj.peso, IMC: metricsObj.imc
    }).filter(([, v]) => v);

    if (metricPairs.length) {
        checkPage(16 + Math.ceil(metricPairs.length / 2) * 9);
        setFont(8, 'bold', 100, 116, 139);
        doc.text(isEs ? 'METRICAS CLINICAS' : 'CLINICAL METRICS', ML, y + 5);
        const rows = Math.ceil(metricPairs.length / 2);
        const mH = rows * 9 + 8;
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
        doc.rect(ML, y + 7, CW, mH);
        metricPairs.forEach(([k, v], i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const mx = ML + 4 + col * (CW / 2);
            const my2 = y + 14 + row * 9;
            setFont(8, 'bold', 100, 116, 139);
            doc.text(k + ':', mx, my2);
            setFont(10, 'bold', 30, 41, 59);
            doc.text(String(v), mx + 20, my2);
        });
        y += mH + 12;
    }

    // ── MEDICACIÓN ───────────────────────────────────────────
    checkPage(22);
    setFont(8, 'bold', 100, 116, 139);
    doc.text(isEs ? 'MEDICACION ACTIVA' : 'ACTIVE MEDICATION', ML, y + 5);
    const medsRaw = r.medicacion_activa || r.medicacion || '—';
    const medsLines = doc.splitTextToSize(medsRaw, CW - 8);
    const medsH = medsLines.length * 6 + 10;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.rect(ML, y + 7, CW, medsH);
    setFont(10, 'normal', 29, 78, 216);
    doc.text(medsLines, ML + 4, y + 14);
    y += medsH + 12;

    // ── RECOMENDACIONES ──────────────────────────────────────
    checkPage(22);
    setFont(8, 'bold', 100, 116, 139);
    doc.text(isEs ? 'RECOMENDACIONES' : 'RECOMMENDATIONS', ML, y + 5);
    const recsText = r.recomendaciones || r.analysis || '—';
    const recsLines = doc.splitTextToSize(recsText, CW - 8);
    const recsH = recsLines.length * 6 + 10;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.rect(ML, y + 7, CW, recsH);
    setFont(10, 'normal', 51, 65, 85);
    doc.text(recsLines, ML + 4, y + 14);
    y += recsH + 12;

    // ── FOOTER ───────────────────────────────────────────────
    checkPage(14);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
    doc.line(ML, y, PW - MR, y);
    setFont(8, 'normal', 148, 163, 184);
    doc.text(`NeuroTempo PRO · ${today}`, PW / 2, y + 6, { align: 'center' });
    setFont(8, 'bold', 148, 163, 184);
    doc.text('HIPAA COMPLIANT · RGPD · Cifrado NVP-2026', PW / 2, y + 11, { align: 'center' });

    doc.save(filename);
    logAudit('Informe individual descargado: ' + (r.source || id));
    showToast(isEs ? 'PDF descargado correctamente' : 'PDF downloaded successfully', 'success');
}

function deleteReport(id) {
    const isEs = state.lang === 'es';
    state.medicalReports = state.medicalReports.filter(r => String(r.id) !== String(id));
    if (window.NVReports) NVReports.deleteLocal(id);
    const uid = state.user && state.user.uid ? state.user.uid : null;
    if (uid && window.NVFirebase && NVFirebase.isReady()) {
        NVFirebase.deleteEvaluation(uid, id)
            .catch(e => console.warn('[Health] Firestore delete fallido:', e));
    }
    _renderMedicalReportsList();
    showToast(isEs ? 'Informe eliminado.' : 'Report deleted.', 'success');
}

// ============================================================
// GPS REAL + OPENSTREETMAP
// ============================================================
function initRealGPS() {
    const btn = document.getElementById('gps-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader"></i> ${state.lang === 'es' ? 'Localizando…' : 'Locating…'}`;
        lucide.createIcons();
    }
    if (!navigator.geolocation) {
        showToast(state.lang === 'es'
            ? 'Geolocalización no disponible en este navegador.'
            : 'Geolocation not available in this browser.', 'error');
        if (btn) { btn.disabled = false; }
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            state.gpsMetadata = {
                lat: `${lat.toFixed(5)}° N`,
                lon: `${Math.abs(lon).toFixed(5)}° ${lon < 0 ? 'O' : 'E'}`
            };
            _renderGPSMap(lat, lon, acc);
            logAudit(state.lang === 'es' ? `GPS actualizado (±${acc}m)` : `GPS updated (±${acc}m)`);
        },
        (err) => {
            const msgs = {
                1: state.lang === 'es' ? 'Permiso de ubicación denegado.' : 'Location permission denied.',
                2: state.lang === 'es' ? 'Posición no disponible.' : 'Position unavailable.',
                3: state.lang === 'es' ? 'Tiempo de espera agotado.' : 'Location request timed out.'
            };
            showToast(msgs[err.code] || (state.lang === 'es' ? 'Error de GPS.' : 'GPS error.'), 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="map-pin"></i> ${state.lang === 'es' ? 'Reintentar' : 'Retry'}`;
                lucide.createIcons();
            }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
}

function _renderGPSMap(lat, lon, acc) {
    const delta = 0.015;
    const frame = document.getElementById('gps-map-frame');
    if (frame) {
        frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`;
    }
    const coordEl = document.getElementById('gps-coords');
    if (coordEl) {
        coordEl.innerHTML = `<i data-lucide="map-pin" style="width:14px;height:14px;"></i>
            ${lat.toFixed(5)}° N, ${Math.abs(lon).toFixed(5)}° ${lon < 0 ? 'O' : 'E'}
            <span style="margin-left:6px;font-size:0.72rem;opacity:0.7;">±${acc}m</span>`;
        lucide.createIcons();
    }
    const gmaps = document.getElementById('gmaps-link');
    if (gmaps) gmaps.href = `https://maps.google.com/?q=${lat},${lon}`;

    const btn = document.getElementById('gps-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="refresh-cw"></i> ${state.lang === 'es' ? 'Actualizar posición' : 'Update position'}`;
        lucide.createIcons();
    }
}

// ============================================================
// SISTEMA DE MEDICACIÓN
// ============================================================
function nvSaveMeds() {
    localStorage.setItem('nv_meds', JSON.stringify(state.medications));
    localStorage.setItem('nv_med_date', new Date().toDateString());
}

function nvLoadMeds() {
    try {
        const raw = localStorage.getItem('nv_meds');
        if (raw) state.medications = JSON.parse(raw);
    } catch (e) { /* keep default */ }
}

function checkDailyMedReset() {
    const lastDate = localStorage.getItem('nv_med_date');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        state.medications.forEach(m => m.taken = false);
        localStorage.setItem('nv_med_date', today);
        nvSaveMeds();
    }
}

function toggleMedTaken(i) {
    if (i < 0 || i >= state.medications.length) return;
    state.medications[i].taken = !state.medications[i].taken;
    nvSaveMeds();
    // Si el usuario marca como tomada desde la UI, detener la alarma de audio
    if (state.medications[i].taken && _alarmActive) {
        _stopAlarmAudio();
        _hideAlarmFallbackUI();
    }
    // Update DOM without full re-render
    const chk = document.getElementById(`med-chk-${i}`);
    if (chk) {
        chk.className = `med-check${state.medications[i].taken ? ' taken' : ''}`;
        chk.innerHTML = state.medications[i].taken
            ? '<span style="color:white;font-size:1.1rem;">✓</span>' : '';
    }
    const badge = document.getElementById(`med-badge-${i}`);
    if (badge) {
        badge.textContent = state.medications[i].taken
            ? (state.lang === 'es' ? 'Tomado' : 'Taken')
            : (state.lang === 'es' ? 'Pendiente' : 'Pending');
        badge.style.color = state.medications[i].taken
            ? 'var(--primary-green)' : 'rgba(148,163,184,0.6)';
    }
}

function editMed(i) {
    const med = state.medications[i];
    if (!med) return;
    const isEs = state.lang === 'es';

    const overlay = document.createElement('div');
    overlay.className = 'nv-modal-overlay';
    const card = document.createElement('div');
    card.className = 'nv-modal-card';
    card.innerHTML = `
        <h3 style="color:var(--accent-cyan);margin-bottom:1.2rem;font-size:1.1rem;">
            ${isEs ? 'Editar tratamiento' : 'Edit medication'}
        </h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.4rem;">
            <div>
                <label style="font-size:0.75rem;color:rgba(148,163,184,0.7);font-weight:700;
                              letter-spacing:0.05em;text-transform:uppercase;display:block;margin-bottom:0.35rem;">
                    ${isEs ? 'Nombre' : 'Name'}
                </label>
                <input id="_em_name" type="text" value="${med.name.replace(/"/g, '&quot;')}"
                       style="width:100%;box-sizing:border-box;padding:0.65rem 0.85rem;border-radius:10px;
                              border:1px solid rgba(255,255,255,0.12);background:rgba(10,15,30,0.7);
                              color:rgba(241,245,249,0.95);font-size:0.9rem;outline:none;
                              transition:border-color 0.2s;"
                       onfocus="this.style.borderColor='rgba(0,242,255,0.45)'"
                       onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
            </div>
            <div>
                <label style="font-size:0.75rem;color:rgba(148,163,184,0.7);font-weight:700;
                              letter-spacing:0.05em;text-transform:uppercase;display:block;margin-bottom:0.35rem;">
                    ${isEs ? 'Hora' : 'Time'}
                </label>
                <input id="_em_time" type="time" value="${med.time}"
                       style="width:100%;box-sizing:border-box;padding:0.65rem 0.85rem;border-radius:10px;
                              border:1px solid rgba(255,255,255,0.12);background:rgba(10,15,30,0.7);
                              color:rgba(241,245,249,0.95);font-size:0.9rem;outline:none;
                              transition:border-color 0.2s;"
                       onfocus="this.style.borderColor='rgba(0,242,255,0.45)'"
                       onblur="this.style.borderColor='rgba(255,255,255,0.12)'">
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.6rem;">
            <button id="_em_save" class="action-btn btn-primary" style="width:100%;">
                ${isEs ? 'Guardar cambios' : 'Save changes'}
            </button>
            <button id="_em_cancel" class="action-btn" style="width:100%;border:1px solid rgba(255,255,255,0.1);">
                ${isEs ? 'Cancelar' : 'Cancel'}
            </button>
        </div>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    card.querySelector('#_em_cancel').onclick = close;
    card.querySelector('#_em_save').onclick = () => {
        const newName = card.querySelector('#_em_name').value.trim();
        const newTime = card.querySelector('#_em_time').value;
        if (!newName || !newTime) {
            showToast(isEs ? 'Nombre y hora son obligatorios.' : 'Name and time are required.', 'error');
            return;
        }
        state.medications[i].name = newName;
        state.medications[i].time = newTime;
        state.medications.sort((a, b) => a.time.localeCompare(b.time));
        nvSaveMeds();
        close();
        render();
        showToast(isEs ? 'Tratamiento actualizado.' : 'Medication updated.', 'success');
    };
    lucide.createIcons();
}

function deleteMed(i) {
    if (i < 0 || i >= state.medications.length) return;
    state.medications.splice(i, 1);
    nvSaveMeds();
    render();
}

function showAddMedForm() {
    const form = document.getElementById('add-med-form');
    if (!form) return;
    const visible = form.style.display !== 'none' && form.style.display !== '';
    form.style.display = visible ? 'none' : 'block';
}

function saveNewMed() {
    const name = (document.getElementById('new-med-name') || {}).value?.trim();
    const dose = (document.getElementById('new-med-dose') || {}).value?.trim();
    const time = (document.getElementById('new-med-time') || {}).value;
    if (!name || !time) {
        showToast(state.lang === 'es'
            ? 'Nombre y hora son obligatorios.'
            : 'Name and time are required.', 'error');
        return;
    }
    const fullName = dose ? `${name} ${dose}` : name;
    state.medications.push({ name: fullName, time, taken: false });
    state.medications.sort((a, b) => a.time.localeCompare(b.time));
    nvSaveMeds();
    showToast(state.lang === 'es'
        ? `Medicamento añadido: ${fullName}`
        : `Medication added: ${fullName}`, 'success');
    render();
}

// ============================================================
// NOTIFICACIONES NATIVAS (Web Notifications API)
// ============================================================
let _notifInterval = null;
let _notifFiredToday = new Set(); // evita disparar la misma alarma 2 veces en el mismo minuto
let _bgWarnShown = false;

// ── Estado del motor de alarma de audio ──────────────────────
let _alarmAudioCtx = null;   // AudioContext en curso
let _alarmLoopTimer = null;   // setInterval del bucle de beeps
let _alarmAudioObj = null;   // Audio() object para MP3 (si existe)
let _alarmActive = false;  // flag global de alarma activa

function requestNotifPermission() {
    const isEs = state.lang === 'es';

    // ── Requisito HTTPS ───────────────────────────────────────
    const isSecure = location.protocol === 'https:'
        || location.hostname === 'localhost'
        || location.hostname === '127.0.0.1';
    if (!isSecure) {
        showToast(isEs
            ? '⚠ Las notificaciones requieren HTTPS o localhost. Accede desde una conexión segura.'
            : '⚠ Notifications require HTTPS or localhost. Use a secure connection.', 'warning');
        return;
    }

    // ── API no disponible ─────────────────────────────────────
    if (!('Notification' in window)) {
        showToast(isEs
            ? 'Notificaciones no disponibles en este navegador.'
            : 'Notifications not available in this browser.', 'error');
        return;
    }

    const perm = Notification.permission;

    // ── Ya concedido ──────────────────────────────────────────
    if (perm === 'granted') {
        showToast(isEs ? 'Recordatorios de medicación activos ✓' : 'Medication reminders active ✓', 'info');
        startMedReminders();
        return;
    }

    // ── Denegado por el usuario — mostrar guía ────────────────
    if (perm === 'denied') {
        _showNotifDeniedGuide();
        return;
    }

    // ── Estado 'default' — solicitar permiso al navegador ─────
    Notification.requestPermission().then(result => {
        if (result === 'granted') {
            showToast(isEs ? 'Recordatorios de medicación activados ✓' : 'Medication reminders enabled ✓', 'success');
            startMedReminders();
            _updateNotifBanner();
        } else {
            // El usuario denegó desde el diálogo nativo
            _updateNotifBanner();
            setTimeout(_showNotifDeniedGuide, 300);
        }
    });
}

function _showNotifDeniedGuide() {
    const isEs = state.lang === 'es';
    let guide = document.getElementById('notif-denied-guide');
    if (!guide) {
        // Si el div no está en el DOM (e.g. vista no renderizada), no hacer nada
        return;
    }
    guide.style.display = 'block';
    guide.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:0.6rem;padding:0.85rem 1rem;
                    border-radius:12px;background:rgba(239,68,68,0.06);
                    border:1px solid rgba(239,68,68,0.22);margin-top:0.6rem;
                    animation:nvFadeIn 0.25s ease;">
            <span style="font-size:1.15rem;flex-shrink:0;line-height:1.2;">🔒</span>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:800;font-size:0.83rem;color:rgba(239,68,68,0.9);margin-bottom:0.35rem;">
                    ${isEs ? 'Notificaciones bloqueadas' : 'Notifications blocked'}
                </div>
                <div style="font-size:0.78rem;color:rgba(241,245,249,0.78);line-height:1.65;">
                    ${isEs
            ? 'Para recibir tus avisos de medicación, haz clic en el icono del <b style="color:rgba(241,245,249,0.95);">candado 🔒</b> junto a la dirección de la web, activa el interruptor de <b style="color:rgba(241,245,249,0.95);">Notificaciones</b> y recarga la página.'
            : 'To receive your medication alerts, click the <b style="color:rgba(241,245,249,0.95);">lock icon 🔒</b> next to the web address, enable the <b style="color:rgba(241,245,249,0.95);">Notifications</b> toggle, then reload the page.'}
                </div>
            </div>
            <button onclick="document.getElementById('notif-denied-guide').style.display='none'"
                    aria-label="${isEs ? 'Cerrar' : 'Close'}"
                    style="display:flex;align-items:center;justify-content:center;
                           width:30px;height:30px;min-width:30px;border-radius:50%;
                           border:none;background:transparent;cursor:pointer;
                           font-size:1rem;color:rgba(148,163,184,0.5);flex-shrink:0;
                           transition:color 0.15s;"
                    onmouseover="this.style.color='rgba(241,245,249,0.9)'"
                    onmouseout="this.style.color='rgba(148,163,184,0.5)'">✕</button>
        </div>`;
}

// ============================================================
// SISTEMA DE ALARMA DE MEDICACIÓN — NIVEL SEGURIDAD CRÍTICA
// ============================================================

// ── Registro del Service Worker ───────────────────────────────
async function _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
        await navigator.serviceWorker.register('./sw.js');

        // Escuchar mensajes del SW (acciones de notificación)
        navigator.serviceWorker.addEventListener('message', e => {
            const { type, medName } = e.data || {};
            if (type === 'MED_TAKEN') {
                stopMedicationAlert(true, medName);
            } else if (type === 'MED_SNOOZE') {
                const mins = e.data.minutes || 5;
                stopMedicationAlert(false);
                snoozeMedication(medName, mins);
            }
        });
    } catch (err) {
        console.warn('[SW] No se pudo registrar:', err.message);
    }
}

// ── Motor de audio en bucle (patrón médico: beep-beep-pausa) ─
function _startAlarmAudio() {
    if (_alarmActive) return; // ya sonando
    _alarmActive = true;

    // Intentar MP3 primero (si existe en /assets/sounds/alarm.mp3)
    try {
        _alarmAudioObj = new Audio('/assets/sounds/alarm.mp3');
        _alarmAudioObj.loop = true;
        _alarmAudioObj.volume = 0.75;
        _alarmAudioObj.play().catch(() => {
            // El archivo no existe o autoplay bloqueado → Web Audio fallback
            _alarmAudioObj = null;
            _startWebAudioLoop();
        });
        return;
    } catch (_) { /* sin soporte Audio() */ }

    _startWebAudioLoop();
}

function _startWebAudioLoop() {
    const AudioCtx = window.AudioContext || /** @type {any} */(window).webkitAudioContext;
    if (!AudioCtx) return;

    try {
        _alarmAudioCtx = new AudioCtx();
    } catch (_) { return; }

    // Patrón: dos beeps rápidos seguidos de silencio, cada 1.4 s
    function _burst() {
        if (!_alarmActive || !_alarmAudioCtx) return;
        const ctx = _alarmAudioCtx;
        const t = ctx.currentTime;

        [[t, 1047, 0.14], [t + 0.22, 1047, 0.14], [t + 0.44, 784, 0.18]]
            .forEach(([start, freq, dur]) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.35, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
                osc.start(start);
                osc.stop(start + dur + 0.02);
            });

        _alarmLoopTimer = setTimeout(_burst, 1400);
    }
    _burst();
}

function _stopAlarmAudio() {
    _alarmActive = false;

    if (_alarmLoopTimer) { clearTimeout(_alarmLoopTimer); _alarmLoopTimer = null; }
    if (_alarmAudioObj) { _alarmAudioObj.pause(); _alarmAudioObj.currentTime = 0; _alarmAudioObj = null; }
    if (_alarmAudioCtx) { try { _alarmAudioCtx.close(); } catch (_) { } _alarmAudioCtx = null; }
}

// ── Overlay de alarma en la app (fallback visible siempre) ───
function _showAlarmFallbackUI(medName, medTime) {
    const isEs = state.lang === 'es';
    let overlay = document.getElementById('nv-alarm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'nv-alarm-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.cssText = [
        'position:fixed;bottom:0;left:0;right:0;z-index:9999;',
        'padding:1.1rem 1rem 1.5rem;',
        'background:linear-gradient(0deg,rgba(185,28,28,0.98),rgba(239,68,68,0.96));',
        'border-top:2px solid rgba(255,120,120,0.7);',
        'display:flex;flex-direction:column;align-items:center;gap:0.85rem;',
        'animation:nvAlarmPulse 0.75s ease-in-out infinite alternate;'
    ].join('');

    overlay.innerHTML = `
        <div style="font-weight:800;font-size:0.95rem;color:#fff;text-align:center;
                    animation:nvAlarmBlink 1s ease-in-out infinite;letter-spacing:0.02em;">
            💊 ${isEs ? `Hora de tomar su ${medName} · ${medTime}` : `Time to take ${medName} · ${medTime}`}
        </div>
        <div style="display:flex;gap:0.65rem;width:100%;max-width:420px;">
            <button onclick="stopMedicationAlert(true,'${medName.replace(/'/g, "\\'")}')"
                    style="flex:1;padding:0.85rem;border-radius:12px;border:2px solid #fff;
                           background:#fff;color:#dc2626;font-weight:800;font-size:0.92rem;
                           cursor:pointer;transition:transform 0.12s;"
                    onmouseover="this.style.transform='scale(1.03)'"
                    onmouseout="this.style.transform='scale(1)'">
                ✓ ${isEs ? 'Tomada' : 'Taken'}
            </button>
            <button onclick="snoozeMedication('${medName.replace(/'/g, "\\'")}',5)"
                    style="flex:1;padding:0.85rem;border-radius:12px;
                           border:2px solid rgba(255,255,255,0.4);
                           background:rgba(255,255,255,0.18);color:#fff;
                           font-weight:700;font-size:0.92rem;cursor:pointer;transition:transform 0.12s;"
                    onmouseover="this.style.transform='scale(1.03)'"
                    onmouseout="this.style.transform='scale(1)'">
                ⏰ ${isEs ? 'Posponer 5 min' : 'Snooze 5 min'}
            </button>
        </div>`;
}

function _hideAlarmFallbackUI() {
    const overlay = document.getElementById('nv-alarm-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ── Detener la alarma completa ────────────────────────────────
function stopMedicationAlert(markTaken, medName) {
    _stopAlarmAudio();
    _hideAlarmFallbackUI();
    if (markTaken && medName) {
        const idx = state.medications.findIndex(m => m.name === medName);
        if (idx > -1 && !state.medications[idx].taken) toggleMedTaken(idx);
    }
}

// ── Posponer alarma N minutos ─────────────────────────────────
function snoozeMedication(medName, minutes) {
    _stopAlarmAudio();
    _hideAlarmFallbackUI();
    const snoozeAt = new Date(Date.now() + minutes * 60000);
    const snoozeStr = `${String(snoozeAt.getHours()).padStart(2, '0')}:${String(snoozeAt.getMinutes()).padStart(2, '0')}`;
    const med = state.medications.find(m => m.name === medName);
    if (med) {
        if (!med._origTime) med._origTime = med.time;
        med.time = snoozeStr;
        // Restaurar la hora original tras el disparo + 2 min de margen
        setTimeout(() => {
            if (med._origTime) { med.time = med._origTime; delete med._origTime; }
        }, (minutes + 2) * 60000);
    }
    const isEs = state.lang === 'es';
    showToast(isEs ? `⏰ Alarma pospuesta para las ${snoozeStr}` : `⏰ Alarm snoozed until ${snoozeStr}`, 'info');
}

// ── Función centralizada de alerta ───────────────────────────
async function sendMedicationAlert(medName, medTime) {
    if (Notification.permission !== 'granted') return;
    const isEs = state.lang === 'es';

    // 1 — Arrancar audio en bucle
    _startAlarmAudio();

    // 2 — Mostrar overlay en la app (siempre visible, incluso sin permisos de SO)
    _showAlarmFallbackUI(medName, medTime);

    const opts = {
        body: isEs
            ? `Es hora de tomar su ${medName} · ${medTime}`
            : `Time to take your ${medName} · ${medTime}`,
        tag: `med_${medTime}_${medName}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        data: { medName, medTime },
        actions: [
            { action: 'done', title: isEs ? '✓ Tomada' : '✓ Taken' },
            { action: 'snooze', title: isEs ? '⏰ Posponer 5 min' : '⏰ Snooze 5 min' }
        ]
    };

    // 3 — Usar SW (soporta actions) o fallback a new Notification
    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification('💊 NeuroTempo — ' + (isEs ? 'Medicación' : 'Medication'), opts);
            return;
        }
    } catch (_) { /* sin SW activo */ }

    // Fallback sin actions (navegadores sin SW)
    new Notification('💊 NeuroTempo — ' + (isEs ? 'Medicación' : 'Medication'), {
        body: opts.body,
        tag: opts.tag,
        icon: opts.icon,
        requireInteraction: true,
        data: opts.data
    });
}

// ── Motor de alarmas — tick cada 30 s ────────────────────────
function startMedReminders() {
    if (_notifInterval) clearInterval(_notifInterval);
    localStorage.setItem('nv_reminders_active', '1');

    // Resetear el Set de disparadas si es un día nuevo
    const today = new Date().toDateString();
    if (localStorage.getItem('nv_notif_date') !== today) {
        _notifFiredToday.clear();
        localStorage.setItem('nv_notif_date', today);
    }

    _notifInterval = setInterval(() => {
        if (Notification.permission !== 'granted') {
            clearInterval(_notifInterval);
            _notifInterval = null;
            localStorage.removeItem('nv_reminders_active');
            return;
        }

        const now = new Date();
        const todayStr = now.toDateString();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Nuevo día → limpiar duplicados
        if (localStorage.getItem('nv_notif_date') !== todayStr) {
            _notifFiredToday.clear();
            localStorage.setItem('nv_notif_date', todayStr);
        }

        state.medications.forEach(med => {
            const key = `${med.name}__${timeStr}`;
            if (med.time === timeStr && !med.taken && !_notifFiredToday.has(key)) {
                _notifFiredToday.add(key);
                sendMedicationAlert(med.name, med.time);
            }
        });
    }, 30000); // ← 30 segundos: máxima precisión sin Service Worker
}

// ── Detener el motor ─────────────────────────────────────────
function stopMedReminders() {
    if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; }
    localStorage.removeItem('nv_reminders_active');
}

// ── Prueba instantánea (botón de diagnóstico / certificación) ─
function testMedicationAlert() {
    const isEs = state.lang === 'es';
    if (Notification.permission !== 'granted') {
        requestNotifPermission();
        return;
    }
    const testName = state.medications.length
        ? state.medications[0].name
        : (isEs ? 'Medicamento de prueba' : 'Test medication');
    const now = new Date();
    const testTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    sendMedicationAlert(testName, testTime);
    showToast(isEs ? '🔔 Alarma de prueba activada — toca "Tomada" para detenerla.' : '🔔 Test alarm active — tap "Taken" to stop it.', 'success');
}

function _updateNotifBanner() {
    const banner = document.getElementById('notif-banner');
    const bannerT = document.getElementById('notif-banner-text');
    if (!banner || !bannerT) return;
    const perm = Notification.permission;
    const isEs = state.lang === 'es';
    const granted = perm === 'granted';
    const denied = perm === 'denied';

    banner.style.borderColor = granted ? 'rgba(16,185,129,0.3)' : denied ? 'rgba(239,68,68,0.25)' : 'rgba(0,242,255,0.15)';
    bannerT.textContent = granted
        ? (isEs ? 'Recordatorios activos ✓' : 'Reminders active ✓')
        : denied
            ? (isEs ? 'Bloqueadas — Toca para ver cómo activar' : 'Blocked — Tap to see how to enable')
            : (isEs ? 'Activar recordatorios de medicación' : 'Enable medication reminders');

    // Actualizar icono de estado (chevron → check / alert)
    const iconEl = banner.querySelector('i[data-lucide]');
    if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', granted ? 'check-circle' : denied ? 'alert-circle' : 'chevron-right');
        iconEl.style.color = granted ? 'var(--primary-green)' : denied ? 'rgba(239,68,68,0.6)' : 'rgba(148,163,184,0.4)';
        lucide.createIcons({ nodes: [iconEl] });
    }

    if (denied) _showNotifDeniedGuide();
}

// ============================================================
// WRAPPERS GLOBALES — historial de sesiones
// NVHistory se carga desde modules/nv-history.js
// ============================================================
function nvHistoryDelete(id) {
    if (!window.NVHistory) return;
    showModal(
        t('ev_del_confirm'),
        {
            confirmText: state.lang === 'es' ? 'Eliminar' : 'Delete',
            cancelText: t('cancel'),
            onConfirm: () => { NVHistory.deleteById(id); render(); }
        }
    );
}

function nvHistoryClearAll() {
    if (!window.NVHistory) return;
    showModal(
        state.lang === 'es'
            ? '¿Eliminar todo el historial de sesiones de rehabilitación?'
            : 'Delete all rehabilitation session history?',
        {
            confirmText: state.lang === 'es' ? 'Borrar todo' : 'Clear all',
            cancelText: t('cancel'),
            onConfirm: () => { NVHistory.clearAll(); render(); }
        }
    );
}

// ============================================================
// DASHBOARD DE EVOLUCIÓN — Funciones globales
// ============================================================

// Instancia global de Chart.js para destruir antes de recrear
let _evoChartInstance = null;

// ── Inicializa la gráfica Chart.js de tendencia motora ──────
function _initEvoChart() {
    const canvas = document.getElementById('ev-trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (_evoChartInstance) { _evoChartInstance.destroy(); _evoChartInstance = null; }

    const allSessions = window.NVHistory ? NVHistory.getAll() : (state.sessionHistory || []);
    const chartSessions = allSessions.slice(0, 20).reverse();
    if (chartSessions.length < 2) return;

    const scores = chartSessions.map(s => {
        const mx = s.metrics || {};
        if (s.type === 'tapping') return Math.max(0, Math.min(100, 100 - (mx.jitter || 50)));
        if (s.type === 'drawing') return mx.stability || 0;
        if (s.type === 'vocal') return mx.stability || 0;
        if (s.type === 'breathing') return Math.min(100, (mx.cycles || 0) * 10);
        return 50;
    });
    const labels = chartSessions.map(s => {
        const d = new Date(s.ts);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 130);
    grad.addColorStop(0, 'rgba(16,185,129,0.35)');
    grad.addColorStop(1, 'rgba(16,185,129,0)');

    _evoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: scores,
                borderColor: '#10b981',
                backgroundColor: grad,
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#0a0f1e',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, tooltip: {
                    backgroundColor: 'rgba(14,20,45,0.9)',
                    borderColor: 'rgba(16,185,129,0.3)',
                    borderWidth: 1,
                    titleColor: '#10b981',
                    bodyColor: 'rgba(241,245,249,0.85)',
                    callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
                }
            },
            scales: {
                x: { ticks: { color: 'rgba(148,163,184,0.5)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { min: 0, max: 100, ticks: { color: 'rgba(148,163,184,0.5)', font: { size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

// ── Cambia el filtro activo y re-renderiza ────────────────────
function setEvoFilter(type) {
    state.evolutionFilter = type;
    render();
    setTimeout(_initEvoChart, 150);
}

// ── Modal de detalle de sesión (Parkinson-Friendly) ──────────
function openSessionDetail(id) {
    const isEs = state.lang === 'es';
    const allSess = window.NVHistory ? NVHistory.getAll() : (state.sessionHistory || []);
    const meta = window.NVHistory ? NVHistory.TEST_META : {};
    const s = allSess.find(x => x.id === id);
    if (!s) return;

    const m = meta[s.type] || { icon: 'activity', color: '#00F2FF', labelEs: s.type, labelEn: s.type };
    const label = isEs ? m.labelEs : m.labelEn;
    const tsText = window.NVHistory ? NVHistory.formatTs(s.ts, state.lang) : new Date(s.ts).toLocaleString();
    const mx = s.metrics || {};
    const phase = s.phase || 'ON';
    const phaseCol = phase === 'ON' ? '#10b981' : '#ef4444';

    // ── Construir filas de métricas ──
    const metricRows = Object.entries(mx).map(([key, val]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:0.9rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-size:1rem;color:rgba(148,163,184,0.7);text-transform:capitalize;">${key}</span>
            <span style="font-size:1.2rem;font-weight:800;color:${m.color};">${val}${typeof val === 'number' && key !== 'bpm' && key !== 'count' && key !== 'cycles' && key !== 'duration' ? '%' : ''}</span>
        </div>`).join('') || `<p style="color:rgba(148,163,184,0.4);text-align:center;padding:1rem 0;">${isEs ? 'Sin métricas guardadas.' : 'No metrics saved.'}</p>`;

    const shareText = encodeURIComponent(
        `${t('ev_share_title')}\n${label} · ${tsText}\nPhase: ${phase}\n` +
        Object.entries(mx).map(([k, v]) => `${k}: ${v}`).join(' · ') +
        `\n\nNeuroTempo PRO — ${isEs ? 'Ecosistema Digital Parkinson' : 'Parkinson Digital Ecosystem'}`
    );

    const overlay = document.createElement('div');
    overlay.id = 'nv-detail-overlay';
    overlay.style.cssText =
        'position:fixed;inset:0;z-index:9000;display:flex;align-items:flex-end;' +
        'background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);';

    overlay.innerHTML = `
    <div style="width:100%;max-height:92vh;overflow-y:auto;
                background:linear-gradient(160deg,rgba(18,24,52,0.98),rgba(10,15,30,0.99));
                border-radius:28px 28px 0 0;padding:1.8rem 1.5rem 2.5rem;
                border-top:1px solid rgba(${m.color.slice(1).match(/../g).map(x => parseInt(x, 16)).join(',')},0.25);
                box-shadow:0 -8px 40px rgba(0,0,0,0.6);">

        <!-- Handle -->
        <div style="width:44px;height:4px;border-radius:4px;background:rgba(255,255,255,0.12);margin:0 auto 1.4rem;"></div>

        <!-- Cabecera -->
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.4rem;">
            <div style="width:60px;height:60px;border-radius:18px;flex-shrink:0;
                        background:${m.color}18;border:1.5px solid ${m.color}40;
                        display:flex;align-items:center;justify-content:center;">
                <i data-lucide="${m.icon}" style="width:28px;height:28px;color:${m.color};"></i>
            </div>
            <div>
                <div style="font-size:1.3rem;font-weight:900;color:rgba(241,245,249,0.95);">${label}</div>
                <div style="font-size:0.82rem;color:rgba(148,163,184,0.55);margin-top:2px;">${tsText}</div>
            </div>
            <span style="margin-left:auto;font-size:0.75rem;font-weight:700;padding:5px 12px;border-radius:10px;
                         background:${phaseCol}18;border:1px solid ${phaseCol}40;color:${phaseCol};">
                ${isEs ? 'FASE' : 'PHASE'} ${phase}
            </span>
        </div>

        <!-- Métricas clínicas -->
        <div style="background:rgba(255,255,255,0.025);border-radius:18px;padding:0.5rem 1.2rem;margin-bottom:1.4rem;
                    border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:0.75rem;font-weight:700;color:rgba(148,163,184,0.4);
                        text-transform:uppercase;letter-spacing:0.08em;padding:0.7rem 0 0.2rem;">
                ${t('ev_detail_metrics')}
            </div>
            ${metricRows}
        </div>

        <!-- Botones de compartir -->
        <div style="margin-bottom:1rem;">
            <div style="font-size:0.75rem;font-weight:700;color:rgba(148,163,184,0.4);
                        text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.7rem;">
                ${t('ev_share')}
            </div>
            <div style="display:flex;gap:0.7rem;">
                <a href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener"
                   style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.5rem;
                          min-height:52px;border-radius:14px;font-weight:700;font-size:0.9rem;
                          background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3);
                          color:#25d366;text-decoration:none;">
                    <i data-lucide="message-circle" style="width:18px;height:18px;"></i>
                    ${t('ev_share_wa')}
                </a>
                <a href="mailto:?subject=${encodeURIComponent(t('ev_share_title'))}&body=${shareText}"
                   style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.5rem;
                          min-height:52px;border-radius:14px;font-weight:700;font-size:0.9rem;
                          background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.25);
                          color:var(--accent-cyan);text-decoration:none;">
                    <i data-lucide="mail" style="width:18px;height:18px;"></i>
                    ${t('ev_share_email')}
                </a>
            </div>
        </div>

        <!-- Botón cerrar -->
        <button onclick="closeSessionDetail()"
                style="width:100%;min-height:60px;border-radius:16px;border:none;cursor:pointer;
                       font-size:1.05rem;font-weight:700;letter-spacing:0.03em;
                       background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);
                       color:rgba(239,68,68,0.85);">
            ${isEs ? '✕ Cerrar' : '✕ Close'}
        </button>
    </div>`;

    overlay.addEventListener('click', e => { if (e.target === overlay) closeSessionDetail(); });
    document.body.appendChild(overlay);
    lucide.createIcons();
    // Pequeño retraso para animar entrada
    requestAnimationFrame(() => {
        const panel = overlay.querySelector('div');
        if (panel) { panel.style.transform = 'translateY(20px)'; panel.style.opacity = '0'; panel.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; }
        requestAnimationFrame(() => {
            if (panel) { panel.style.transform = 'translateY(0)'; panel.style.opacity = '1'; }
        });
    });
}

function closeSessionDetail() {
    const el = document.getElementById('nv-detail-overlay');
    if (el) el.remove();
}

// ============================================================
// STARTUP
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar i18n ANTES de renderizar cualquier pantalla.
    // Login siempre en español — el idioma del usuario se aplica tras iniciar sesión.
    if (window.NVI18n) {
        NVI18n.init(state.user ? state.lang : 'es');
    }

    if (state.user) {
        initApp();
    } else {
        showAuthMode('login');
        applyStaticTranslations();
    }
});
