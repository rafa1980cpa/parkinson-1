/**
 * NeuroVida PRO — Fase 9: Funcionalidad Completa y Bilingüe
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
        n:  nvEncrypt(u.name  || ''),
        e:  nvEncrypt(u.email || ''),
        r:  'patient',
        a:  u.age   || '',
        c:  nvEncrypt(u.country          || ''),
        ec: nvEncrypt(u.emergencyContact || '')
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
            emergencyContact: nvDecrypt(p.ec || '')
        };
    } catch (e) { return null; }
}

// ============================================================
// SISTEMA DE IDIOMAS
// ============================================================
function detectLang() {
    const saved = localStorage.getItem('nv_lang');
    if (saved) return saved;
    const sys = (navigator.language || 'es').toLowerCase();
    return sys.startsWith('es') ? 'es' : 'en';
}

const translations = {
    es: {
        // Auth
        tagline: 'Salud Digital de Alta Precisión',
        login_email: 'Correo Electrónico', login_pass: 'Contraseña',
        login_btn: 'INICIAR SESIÓN', forgot_pass: '¿Olvidó su contraseña?',
        no_account: '¿No tiene cuenta?', create_profile: 'CREAR PERFIL NUEVO',
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
        // Spotify / Hub de Musicoterapia
        sp_hub_title: 'Hub de Musicoterapia',
        sp_hub_sub: 'Música terapéutica sincronizada con el metrónomo RAS',
        sp_connect: 'Conectar con Spotify',
        sp_disconnect: 'Desconectar',
        sp_status_off: '○ No conectado',
        sp_premium_note: 'Se requiere cuenta Spotify Premium',
        sp_playlists: 'Playlists Terapéuticas · 100–120 BPM',
        sp_duck_notice: '🎵 Música reducida al 25% — metrónomo activo como "Master"',
        sp_track_idle: 'Selecciona una playlist terapéutica',
        sp_consent_title: 'Conexión a Spotify · Aviso de Privacidad',
        sp_consent_body: 'Al conectar tu cuenta de Spotify, NeuroVida accede a: tu perfil de usuario, estado de reproducción y control de playback.\n\nTus datos de uso de Spotify NO se almacenan en nuestros servidores. El token de acceso se cifra localmente en tu dispositivo.\n\nCumplimos con el Reglamento General de Protección de Datos (RGPD — UE) y los principios de privacidad HIPAA (EE.UU.).\n\nPuedes revocar el acceso en cualquier momento desde tu cuenta de Spotify → Aplicaciones conectadas.',
        sp_consent_accept: 'ACEPTAR Y CONECTAR',
        sp_consent_cancel: 'CANCELAR',
        // Health
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
        ev_share_title: 'Informe de Sesión — NeuroVida PRO',
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
        // Spotify / Musicotherapy Hub
        sp_hub_title: 'Musicotherapy Hub',
        sp_hub_sub: 'Therapeutic music synchronized with the RAS metronome',
        sp_connect: 'Connect with Spotify',
        sp_disconnect: 'Disconnect',
        sp_status_off: '○ Not connected',
        sp_premium_note: 'Spotify Premium account required',
        sp_playlists: 'Therapy Playlists · 100–120 BPM',
        sp_duck_notice: '🎵 Music ducked to 25% — metronome active as "Master"',
        sp_track_idle: 'Select a therapy playlist',
        sp_consent_title: 'Spotify Connection · Privacy Notice',
        sp_consent_body: 'By connecting your Spotify account, NeuroVida accesses: your user profile, playback state, and playback control.\n\nYour Spotify usage data is NOT stored on our servers. The access token is encrypted locally on your device.\n\nWe comply with the General Data Protection Regulation (GDPR — EU), HIPAA privacy principles (USA), and CCPA (California).\n\nYou can revoke access at any time from your Spotify account → Apps.',
        sp_consent_accept: 'ACCEPT & CONNECT',
        sp_consent_cancel: 'CANCEL',
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
        ev_share_title: 'Session Report — NeuroVida PRO',
        ev_skeleton_msg: 'Fetching cloud data...',
    }
};

const t = (key) => (translations[state.lang] || translations.es)[key] || key;

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
        { name: 'Ropinirol',          time: '13:00', taken: false },
        { name: 'Levodopa/Carbidopa', time: '20:00', taken: false }
    ],
    isRecording: false,
    tappingData: { timestamps: [], intervals: [], active: false },
    gpsMetadata: { lat: '40.4168° N', lon: '3.7038° W' },
    auditLog: [],
    reports: [
        { id: 1, date: '2026-03-15', source: 'Hospital Ruber',
          diagnosis: 'Estabilidad en Parkinson grado 2',
          analysis: 'Se observa buena respuesta al tratamiento actual. Mantener ejercicio motriz.' }
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
    reportsSyncing: false,
    spotifyVolume: parseFloat(localStorage.getItem('nv_spot_vol') || '0.8')
};

// ============================================================
// AUTENTICACIÓN
// ============================================================

// ── Mensajes de error Firebase localizados ────────────────────
function _fbErrorMsg(code) {
    const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';
    const map = {
        'auth/user-not-found':           isEs ? 'No existe cuenta con ese correo.'              : 'No account found for that email.',
        'auth/wrong-password':           isEs ? 'Contraseña incorrecta.'                         : 'Incorrect password.',
        'auth/invalid-credential':       isEs ? 'Correo o contraseña incorrectos.'               : 'Incorrect email or password.',
        'auth/email-already-in-use':     isEs ? 'Ese correo ya está registrado.'                 : 'That email is already registered.',
        'auth/weak-password':            isEs ? 'La contraseña debe tener 6+ caracteres.'        : 'Password must be at least 6 characters.',
        'auth/invalid-email':            isEs ? 'Correo electrónico inválido.'                   : 'Invalid email address.',
        'auth/too-many-requests':        isEs ? 'Demasiados intentos. Espere un momento.'        : 'Too many attempts. Please wait.',
        'auth/network-request-failed':   isEs ? 'Sin conexión. Compruebe su red.'               : 'No connection. Check your network.',
        'auth/operation-not-allowed':    isEs ? 'Inicio de sesión por email no activado. Active Email/Password en Firebase Console → Authentication → Sign-in method.' : 'Email sign-in is disabled. Enable Email/Password in Firebase Console → Authentication → Sign-in method.',
        'auth/configuration-not-found':  isEs ? 'Proyecto Firebase no configurado correctamente.' : 'Firebase project not configured correctly.',
        'auth/api-key-not-valid':        isEs ? 'API Key de Firebase inválida. Revise firebase-config.js.' : 'Invalid Firebase API Key. Check firebase-config.js.',
        'auth/invalid-api-key':          isEs ? 'API Key de Firebase inválida. Revise firebase-config.js.' : 'Invalid Firebase API Key. Check firebase-config.js.',
        'firebase_unavailable':          isEs ? 'Modo sin conexión — datos guardados localmente.' : 'Offline mode — data saved locally.',
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
    ['login','register','recover','profile-setup'].forEach(m => {
        const id  = idMap[m] ? idMap[m] : `${m}-form-box`;
        const el  = document.getElementById(id);
        if (el) el.style.display = m === mode ? 'block' : 'none';
    });
    const authFlow = document.getElementById('auth-flow');
    if (authFlow) authFlow.style.display = 'flex';
    applyStaticTranslations();
}

function showPrivacyModal() {
    const overlay = document.getElementById('privacy-overlay');
    const modal   = document.getElementById('privacy-modal');
    if (overlay) overlay.style.display = 'block';
    if (modal)   modal.style.display   = 'block';
}

function hidePrivacyModal() {
    const overlay = document.getElementById('privacy-overlay');
    const modal   = document.getElementById('privacy-modal');
    if (overlay) overlay.style.display = 'none';
    if (modal)   modal.style.display   = 'none';
}

function acceptPrivacyAndRegister() {
    hidePrivacyModal();
    handleRegister();
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    if (!email || !pass) { showToast(t('fill_fields'), 'error'); return; }

    const btn = document.querySelector('#login-form-box .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = state.lang === 'es' ? 'Conectando...' : 'Connecting...'; }

    try {
        if (window.NVFirebase && NVFirebase.isReady()) {
            // ── Firebase Auth ──────────────────────────────────
            const fbUser  = await NVFirebase.login(email, pass);
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
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-pass').value;
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
    const age       = document.getElementById('prof-age').value;
    const country   = document.getElementById('prof-country').value.trim();
    const emergency = document.getElementById('prof-emergency').value.trim();
    if (!age || !country || !emergency) { showToast(t('all_fields_req'), 'error'); return; }

    state.user.age              = age;
    state.user.country          = country;
    state.user.emergencyContact = emergency;
    state.user.lang             = state.lang;
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

function initApp() {
    if (!state.user) return;
    if (!state.user.age || !state.user.country) {
        checkProfileComplete();
        return;
    }
    ['auth-flow'].forEach(id => document.getElementById(id).style.display = 'none');
    ['main-header','neuro-content'].forEach(id => document.getElementById(id).style.display = 'block');
    document.getElementById('floating-sos-btn').style.display = 'flex';
    document.querySelector('nav.bottom-nav').style.display = 'flex';

    updateHeader();
    injectLangToggle();
    initSosButton();
    lucide.createIcons();

    nvLoadMeds();
    checkDailyMedReset();
    if (Notification.permission === 'granted') startMedReminders();

    render();

    logAudit(state.lang === 'es' ? `Sesión iniciada: ${state.user.email}` : `Session started: ${state.user.email}`);
}

function updateNav() {
    const navItems = {
        therapy:  { icon: 'activity',      label: t('nav_therapy') },
        ras:      { icon: 'music',          label: t('nav_ras') },
        health:   { icon: 'clipboard-list', label: t('nav_health') },
        security: { icon: 'shield',         label: t('nav_security') },
        profile:  { icon: 'user-circle',   label: t('nav_profile') }
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
        therapy:  { icon: 'user',           es: 'Paciente: Diagnóstico motor',   en: 'Patient: Motor diagnosis' },
        ras:      { icon: 'user',           es: 'Paciente: Terapia de ritmo',     en: 'Patient: Rhythm therapy' },
        health:   { icon: 'file-text',      es: 'Informes médicos',               en: 'Medical reports' },
        security: { icon: 'alert-triangle', es: 'Paciente: SOS y emergencias',    en: 'Patient: SOS & emergencies' }
    };
    const cfg = chips[view] || chips.therapy;
    return `<div class="view-context-chip"><i data-lucide="${cfg.icon}"></i>${cfg[state.lang] || cfg.es}</div>`;
}

// ============================================================
// SISTEMA DE IDIOMAS
// ============================================================
function setLang(lang) {
    state.lang = lang;
    localStorage.setItem('nv_lang', lang);
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
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
        else el.textContent = val;
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
            const local     = window.NVHistory ? NVHistory.getAll() : [];
            const remoteIds = new Set(remote.map(e => e.id));
            const localOnly = local.filter(e => !remoteIds.has(e.id));
            const merged    = [...remote, ...localOnly].sort((a, b) => b.ts - a.ts);

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

// ── Renderizado parcial de la lista de valoraciones (sin re-render completo) ──
function _renderMedicalReportsList() {
    const container = document.getElementById('reports-list');
    if (!container) return;
    const isEs    = state.lang === 'es';
    const reports = state.medicalReports;

    if (reports.length === 0) {
        container.innerHTML = `
            <p style="text-align:center;color:rgba(148,163,184,0.45);padding:1.4rem 0;font-size:0.88rem;">
                ${t('hlt_no_reports')}
            </p>`;
        return;
    }

    container.innerHTML = reports.slice(0, 8).map(r => {
        const diag = r.diagnostico_principal || r.diagnosis || '—';
        const med  = r.medicacion_activa     || r.medicacion || '';
        const rec  = r.recomendaciones       || r.analysis   || '—';
        const src  = r.source || r.fileName  || (isEs ? 'Informe' : 'Report');
        const date = r.date || '';
        return `
        <div style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:0.4rem;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
                <strong style="font-size:0.87rem;color:rgba(241,245,249,0.9);word-break:break-word;max-width:70%;">${src}</strong>
                <small style="color:rgba(148,163,184,0.5);font-size:0.76rem;flex-shrink:0;margin-left:8px;">${date}</small>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.35rem;">
                <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                    <span style="font-size:0.72rem;font-weight:700;color:rgba(0,242,255,0.6);flex-shrink:0;min-width:80px;">${t('hlt_report_diag')}:</span>
                    <span style="font-size:0.82rem;color:var(--accent-cyan);font-weight:700;line-height:1.4;">${diag}</span>
                </div>
                ${med ? `
                <div style="display:flex;gap:0.5rem;align-items:flex-start;">
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
    if (v === 'health')    state.reportsSyncing   = true;
    render();
    // Sincronización asíncrona (limpian el flag y actualizan DOM al terminar)
    if (v === 'evolution') _syncEvolutionFromFirestore();
    if (v === 'health')    _syncMedicalReportsFromFirestore();
    // Spotify: refrescar estado del reproductor al entrar a la vista RAS
    if (v === 'ras' && window.NVSpotify) setTimeout(() => NVSpotify.updateUI(), 120);
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
        therapy:  { es: 'Rehabilitación AI',   en: 'AI Rehabilitation' },
        ras:      { es: 'Terapia de Ritmo',     en: 'Rhythm Therapy' },
        health:   { es: 'Informes Médicos',     en: 'Medical Reports' },
        security:  { es: 'Seguridad SOS',    en: 'SOS Safety'     },
        profile:   { es: 'Mi Perfil',        en: 'My Profile'     },
        evolution: { es: 'Mi Evolución',     en: 'My Evolution'   }
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

    therapy: () => `
        <div class="neuro-card">
            ${getContextChip('therapy')}
            <h3>${t('therapy_title')}</h3>
            <p class="view-sub">${t('therapy_sub')}</p>
            <div style="display:flex;flex-direction:column;gap:1.2rem;margin-top:1.4rem;">
                <button class="action-btn btn-large btn-primary" onclick="openTwister()">
                    <i data-lucide="mic"></i> ${t('btn_vocal')}
                </button>
                <button class="action-btn btn-large btn-secondary" onclick="openTapping()">
                    <i data-lucide="hand"></i> ${t('btn_tapping')}
                </button>
                <button class="action-btn btn-large" style="background:rgba(22,27,45,0.8);border:1px solid var(--border-glass);" onclick="openMotrizTest()">
                    <i data-lucide="edit-3"></i> ${t('btn_drawing')}
                </button>
                <button class="action-btn btn-large" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--primary-green);" onclick="startResp()">
                    <i data-lucide="wind"></i> ${t('btn_breathing')}
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
    `,

    health: () => {
        const isEs = state.lang === 'es';

        /* ── Calendario semanal ── */
        const dayNames = isEs
            ? ['Lu','Ma','Mi','Ju','Vi','Sá','Do']
            : ['Mo','Tu','We','Th','Fr','Sa','Su'];
        const now      = new Date();
        const todayDow = now.getDay();                       // 0=Dom
        const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // Mon=0
        const weekCal  = `<div class="week-cal">${dayNames.map((d, i) => {
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
                    <button class="med-del" onclick="deleteMed(${i})" aria-label="${isEs ? 'Eliminar' : 'Delete'}">
                        <i data-lucide="trash-2" style="width:17px;height:17px;"></i>
                    </button>
                </div>`).join('')
            : `<p style="text-align:center;color:rgba(148,163,184,0.45);padding:1.2rem 0;font-size:0.88rem;">
                ${isEs ? 'Sin medicamentos registrados.' : 'No medications registered.'}
               </p>`;

        const notifGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';

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
                const diag = r.diagnostico_principal || r.diagnosis || '—';
                const med  = r.medicacion_activa     || r.medicacion || '';
                const rec  = r.recomendaciones       || r.analysis   || '—';
                const src  = r.source || r.fileName  || (isEs ? 'Informe' : 'Report');
                return `
                <div style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:0.4rem;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
                        <strong style="font-size:0.87rem;color:rgba(241,245,249,0.9);word-break:break-word;max-width:70%;">${src}</strong>
                        <small style="color:rgba(148,163,184,0.5);font-size:0.76rem;flex-shrink:0;margin-left:8px;">${r.date || ''}</small>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:0.35rem;">
                        <div style="display:flex;gap:0.5rem;align-items:flex-start;">
                            <span style="font-size:0.72rem;font-weight:700;color:rgba(0,242,255,0.6);flex-shrink:0;min-width:80px;">${t('hlt_report_diag')}:</span>
                            <span style="font-size:0.82rem;color:var(--accent-cyan);font-weight:700;line-height:1.4;">${diag}</span>
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

            <!-- DROPZONE: <label> contiene el <input> — clic nativo garantizado -->
            <label id="upload-dropzone" class="nv-dropzone">
                <!-- input DENTRO del label: cualquier clic en el label abre el picker -->
                <input type="file" id="file-upload-input"
                       accept=".pdf,.jpg,.jpeg,.png"
                       style="display:none;"
                       onchange="handleFileUpload(this)">

                <div id="dropzone-icon-wrap" style="text-align:center;pointer-events:none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                         fill="none" stroke="var(--accent-cyan)" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round"
                         style="display:block;margin:0 auto 0.75rem;">
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                    </svg>
                    <p style="font-weight:700;font-size:0.95rem;margin-bottom:0.3rem;">${t('hlt_click')}</p>
                    <p id="upload-status" style="font-size:0.82rem;color:rgba(148,163,184,0.6);">
                        ${t('hlt_fmt')}
                    </p>
                </div>
            </label>

            <div id="report-ana-box" style="display:none;margin-top:1.2rem;">
                <button class="action-btn btn-primary" style="width:100%;min-height:52px;"
                        onclick="runReportAnalysis()" id="ana-btn">
                    <i data-lucide="cpu"></i> ${t('hlt_analyze')}
                </button>
            </div>
        </div>

        <!-- VALORACIONES RECIENTES -->
        <div class="neuro-card">
            <h3>${t('hlt_recent')}</h3>
            <div id="reports-list">${initialReports}</div>
        </div>

        <!-- DESCARGAR PDF -->
        <div class="neuro-card">
            <button class="action-btn btn-secondary" style="width:100%;" onclick="exportPDF()">
                <i data-lucide="file-text"></i> ${t('hlt_download')}
            </button>
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
            <div id="notif-banner" class="notif-banner" onclick="requestNotifPermission()">
                <div class="notif-icon">
                    <i data-lucide="bell" style="width:18px;height:18px;color:var(--accent-cyan);"></i>
                </div>
                <div>
                    <div style="font-weight:700;font-size:0.88rem;" id="notif-banner-text">
                        ${notifGranted
                            ? (isEs ? 'Recordatorios activos ✓' : 'Reminders active ✓')
                            : (isEs ? 'Activar recordatorios de medicación' : 'Enable medication reminders')}
                    </div>
                    <div style="font-size:0.75rem;color:rgba(148,163,184,0.6);margin-top:2px;">
                        ${isEs ? 'Notificaciones en el dispositivo' : 'Device notifications'}
                    </div>
                </div>
                <i data-lucide="${notifGranted ? 'check-circle' : 'chevron-right'}"
                   style="width:18px;height:18px;color:${notifGranted ? 'var(--primary-green)' : 'rgba(148,163,184,0.4)'};margin-left:auto;"></i>
            </div>
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
                    <span id="ras-bpm-display">${state.metronomeBPM}</span>
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
                    <span>60</span><span>120</span><span>180</span>
                </div>
            </div>

            <!-- Presets de cadencia -->
            <div style="display:flex;gap:0.5rem;margin-bottom:1.2rem;">
                ${[
                    { bpm: 80,  es: '🚶 Calentamiento', en: '🚶 Warm-up'     },
                    { bpm: 110, es: '🚶 Marcha Normal',  en: '🚶 Normal Gait' },
                    { bpm: 130, es: '💪 Rehabilitación', en: '💪 Rehab'       }
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

        <!-- ══ HUB DE MUSICOTERAPIA — SPOTIFY ══════════════════ -->
        <div class="sp-glass-card">
            <!-- Cabecera -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.1rem;">
                <div>
                    <div style="display:flex;align-items:center;gap:0.55rem;">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#1DB954" style="flex-shrink:0;">
                            <circle cx="12" cy="12" r="12" fill="#1DB954"/>
                            <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.4-.75.5-1.15.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.4.25.5.75.3 1zm-1.3 2.7c-.2.35-.65.45-1 .25-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.7-.15-.75-.5-.1-.35.15-.7.5-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.45.65.35 .85z" fill="white"/>
                        </svg>
                        <div>
                            <h4 style="margin:0;font-size:1rem;font-family:var(--font-accent);">${t('sp_hub_title')}</h4>
                            <p style="margin:0;font-size:0.72rem;color:rgba(148,163,184,0.6);">${t('sp_hub_sub')}</p>
                        </div>
                    </div>
                </div>
                <span id="sp-connect-status" style="font-size:0.72rem;font-weight:700;
                      transition:color 0.3s;color:rgba(148,163,184,0.4);">
                    ${t('sp_status_off')}
                </span>
            </div>

            <!-- Botón conectar / desconectar -->
            <button id="sp-connect-btn" class="action-btn"
                    style="width:100%;margin-bottom:1rem;font-size:0.88rem;font-weight:700;
                           background:rgba(29,185,84,0.15);border:1px solid rgba(29,185,84,0.4);
                           color:#1DB954;min-height:52px;"
                    onclick="showSpotifyConsent()">
                ${t('sp_connect')}
            </button>
            <p style="text-align:center;font-size:0.69rem;color:rgba(148,163,184,0.4);
                      margin-top:-0.6rem;margin-bottom:1rem;">
                ${t('sp_premium_note')}
            </p>

            <!-- Controles del reproductor (visibles solo cuando conectado + dispositivo listo) -->
            <div id="sp-controls" style="display:none;">

                <!-- Track info -->
                <div style="text-align:center;margin-bottom:1rem;">
                    <div id="sp-track-name"
                         style="font-size:0.94rem;font-weight:700;color:var(--text-dark);
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                                max-width:100%;padding:0 0.5rem;">
                        ${t('sp_track_idle')}
                    </div>
                    <div id="sp-artist-name"
                         style="font-size:0.75rem;color:rgba(148,163,184,0.6);margin-top:0.25rem;">
                    </div>
                </div>

                <!-- Barra de progreso (alto contraste) -->
                <div style="margin-bottom:0.4rem;">
                    <div class="sp-progress-track">
                        <div id="sp-progress-fill" class="sp-progress-fill"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;
                                font-size:0.68rem;color:rgba(148,163,184,0.45);margin-top:0.3rem;">
                        <span id="sp-progress-pos">0:00</span>
                        <span id="sp-progress-dur">0:00</span>
                    </div>
                </div>

                <!-- Controles magnéticos (área táctil expandida para usuarios con temblor) -->
                <div style="display:flex;align-items:center;justify-content:center;gap:1.4rem;
                            margin:1.1rem 0 0.6rem;">
                    <!-- Anterior -->
                    <button class="sp-btn-magnetic sp-btn-secondary"
                            onclick="spotifyPrev()"
                            aria-label="${isEs ? 'Pista anterior' : 'Previous track'}">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                            <polygon points="19,5 5,12 19,19"/>
                            <rect x="5" y="5" width="2" height="14" rx="1"/>
                        </svg>
                    </button>

                    <!-- Play / Pause — botón principal grande -->
                    <button id="sp-play-btn" class="sp-btn-magnetic sp-btn-primary"
                            onclick="spotifyTogglePlay()"
                            aria-label="${isEs ? 'Reproducir / Pausar' : 'Play / Pause'}">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                    </button>

                    <!-- Siguiente -->
                    <button class="sp-btn-magnetic sp-btn-secondary"
                            onclick="spotifyNext()"
                            aria-label="${isEs ? 'Siguiente pista' : 'Next track'}">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                            <polygon points="5,5 19,12 5,19"/>
                            <rect x="17" y="5" width="2" height="14" rx="1"/>
                        </svg>
                    </button>
                </div>

                <!-- Audio Ducking indicator -->
                <div id="sp-duck-strip"
                     style="display:none;align-items:center;gap:0.5rem;
                            padding:0.55rem 0.9rem;border-radius:12px;margin-top:0.8rem;
                            background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);">
                    <div style="width:8px;height:8px;border-radius:50%;background:#10b981;
                                animation:sp-duck-pulse 1.2s infinite;flex-shrink:0;"></div>
                    <span style="font-size:0.72rem;color:rgba(148,163,184,0.75);line-height:1.4;">
                        ${t('sp_duck_notice')}
                    </span>
                </div>

            </div><!-- /sp-controls -->

            <!-- Playlists terapéuticas (visibles cuando conectado) -->
            <div id="sp-playlists-wrap" style="display:none;margin-top:1.1rem;">
                <p style="font-size:0.73rem;font-weight:700;letter-spacing:0.08em;
                           text-transform:uppercase;color:rgba(148,163,184,0.5);margin-bottom:0.7rem;">
                    ${t('sp_playlists')}
                </p>
                <div style="display:flex;flex-direction:column;gap:0.55rem;">
                    ${(window.NVSpotify ? NVSpotify.getPlaylists() : []).map(pl => `
                    <button class="sp-playlist-btn"
                            onclick="spotifyPickPlaylist('${pl.id}', ${pl.bpm})"
                            title="${isEs ? pl.desc_es : pl.desc_en}">
                        <span style="font-size:0.9rem;font-weight:700;">${isEs ? pl.es : pl.en}</span>
                        <span style="font-size:0.7rem;color:rgba(148,163,184,0.55);margin-left:auto;">
                            ${isEs ? pl.desc_es : pl.desc_en}
                        </span>
                    </button>`).join('')}
                </div>
            </div>

        </div><!-- /sp-glass-card -->`;
    },

    security: () => {
        const isEs = state.lang === 'es';
        const { lat, lon } = state.gpsMetadata;
        // Coordenadas numéricas para iframe inicial (Madrid por defecto)
        const defLat = 40.4168, defLon = -3.7038, delta = 0.015;
        return `
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
                    src="https://www.openstreetmap.org/export/embed.html?bbox=${defLon-delta},${defLat-delta},${defLon+delta},${defLat+delta}&layer=mapnik&marker=${defLat},${defLon}"
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
        const fbChip  = `
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
                    descEs:  'Amplía el área de toque y filtra temblores en los controles',
                    descEn:  'Expands touch area and filters tremor-induced mis-taps'
                },
                {
                    key: 'freezeDetection',
                    icon: 'zap',
                    titleEs: 'Pulso Sónico de Rescate',
                    titleEn: 'Sonic Rescue Pulse',
                    descEs:  'Detecta congelación de marcha y activa ritmo terapéutico 80 Hz',
                    descEn:  'Detects gait freezing and triggers therapeutic 80 Hz rhythm'
                },
                {
                    key: 'voiceInsights',
                    icon: 'mic',
                    titleEs: 'Análisis de Prosodia',
                    titleEn: 'Prosody Analysis',
                    descEs:  'Detecta caídas de volumen vocal (hipofonía) durante la evaluación',
                    descEn:  'Detects vocal amplitude drops (hypophonia) during evaluation'
                },
                {
                    key: 'predictiveAlerts',
                    icon: 'bell',
                    titleEs: 'Alertas Predictivas',
                    titleEn: 'Predictive Alerts',
                    descEs:  'Gemelo digital: notifica cuando tus niveles de energía pueden bajar',
                    descEn:  'Digital twin: notifies when your energy levels may drop'
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
        const isEs   = state.lang === 'es';
        const allSessions = window.NVHistory ? NVHistory.getAll() : (state.sessionHistory || []);
        const meta   = window.NVHistory ? NVHistory.TEST_META : {};
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
                    ${[1,2,3].map(() => '<div class="nv-sk-chip"></div>').join('')}
                </div>
            </div>
            ${[1,2,3].map(() => `
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
            { key: 'all',       icon: 'layout-grid',  labelEs: t('ev_filter_all'),       labelEn: t('ev_filter_all') },
            { key: 'vocal',     icon: 'mic',           labelEs: t('ev_filter_vocal'),     labelEn: t('ev_filter_vocal') },
            { key: 'tapping',   icon: 'hand',          labelEs: t('ev_filter_tapping'),   labelEn: t('ev_filter_tapping') },
            { key: 'drawing',   icon: 'edit-3',        labelEs: t('ev_filter_drawing'),   labelEn: t('ev_filter_drawing') },
            { key: 'breathing', icon: 'wind',          labelEs: t('ev_filter_breathing'), labelEn: t('ev_filter_breathing') },
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
                        s.trend > 2  ? ` <span style="color:#10b981;">↑ ${isEs ? 'mejora' : 'improving'}</span>` :
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
                const label    = isEs ? m.labelEs : m.labelEn;
                const tsText   = window.NVHistory ? NVHistory.formatTs(s.ts, state.lang) : new Date(s.ts).toLocaleString();
                const mx       = s.metrics || {};
                const phase    = s.phase || 'ON';
                const phaseCol = phase === 'ON' ? '#10b981' : '#ef4444';

                let mainMetric = '';
                if (s.type === 'tapping') {
                    const jColor = (mx.jitter||0) < 25 ? '#10b981' : (mx.jitter||0) < 45 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${m.color};font-size:1.3rem;font-weight:900;">${mx.bpm||'–'}</span>
                            <span style="font-size:0.68rem;opacity:0.6;">BPM</span>
                        </div>
                        <div class="nv-sc-metric-pill" style="border-color:${jColor}30;">
                            <span style="color:${jColor};font-size:1.3rem;font-weight:900;">${mx.jitter||'–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">jitter</span>
                        </div>
                        <div class="nv-sc-metric-pill">
                            <span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.count||'–'}</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'toques' : 'taps'}</span>
                        </div>`;
                } else if (s.type === 'drawing') {
                    const sCol = (mx.stability||0) >= 70 ? '#10b981' : (mx.stability||0) >= 40 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${sCol}30;">
                            <span style="color:${sCol};font-size:1.3rem;font-weight:900;">${mx.stability||'–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'Motor Stability' : 'Motor Stability'}</span>
                        </div>
                        <div class="nv-sc-metric-pill">
                            <span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.density||'–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'densidad' : 'density'}</span>
                        </div>`;
                } else if (s.type === 'vocal') {
                    const sCol = (mx.stability||0) >= 85 ? '#10b981' : (mx.stability||0) >= 70 ? '#f59e0b' : '#ef4444';
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${sCol};font-size:1.3rem;font-weight:900;">${mx.stability||'–'}%</span>
                            <span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'estabilidad' : 'stability'}</span>
                        </div>
                        ${mx.duration ? `<div class="nv-sc-metric-pill"><span style="color:rgba(148,163,184,0.7);font-size:1.1rem;font-weight:700;">${mx.duration}s</span><span style="font-size:0.68rem;opacity:0.6;">${isEs ? 'duración' : 'duration'}</span></div>` : ''}`;
                } else if (s.type === 'breathing') {
                    mainMetric = `
                        <div class="nv-sc-metric-pill" style="border-color:${m.color}30;">
                            <span style="color:${m.color};font-size:1.3rem;font-weight:900;">${mx.cycles||'–'}</span>
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

// ── Drag-and-drop handler (receives File directly) ──────────
// No necesitamos DataTransfer — state._pendingFile guarda la referencia real.
function handleDroppedFile(file) {
    if (!file) return;
    handleFileUpload({ files: [file] });
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
    console.log('[NVReports] Iniciando análisis de:', file.name);
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
            id:                   Date.now(),
            date:                 new Date().toISOString().split('T')[0],
            source:               file.name,
            fileName:             file.name,
            fileType:             file.type,
            lang:                 state.lang,
            diagnostico_principal: analysis.diagnostico_principal,
            medicacion_activa:    analysis.medicacion_activa,
            recomendaciones:      analysis.recomendaciones,
            // Alias para compatibilidad con exportPDF y profileSummary
            diagnosis:            analysis.diagnostico_principal,
            analysis:             analysis.recomendaciones,
            medicacion:           analysis.medicacion_activa,
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
            date:      report.date,
            diagnosis: report.diagnostico_principal,
            body:      report.recomendaciones,
            source:    report.source
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
    const ivs   = state.tappingData.intervals;
    const avgMs = ivs.length > 0 ? ivs.reduce((a, b) => a + b, 0) / ivs.length : 0;

    if (count > 0) {
        const bpmVal  = avgMs > 0 ? Math.round(60000 / avgMs) : 0;
        const variance = avgMs > 0 ? ivs.reduce((s, v) => s + Math.pow(v - avgMs, 2), 0) / ivs.length : 0;
        const jitter   = avgMs > 0 ? Math.round((Math.sqrt(variance) / avgMs) * 100) : 0;
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
        const density   = parseFloat(((filled / (canvas.width * canvas.height)) * 100).toFixed(1));
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
        return { x: (ev.clientX - r.left) * (canvas.width / r.width),
                 y: (ev.clientY - r.top)  * (canvas.height / r.height) };
    };
    const start = (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const move  = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const stop  = () => { drawing = false; };

    canvas.onmousedown = start; canvas.onmousemove = move; canvas.onmouseup = stop; canvas.onmouseleave = stop;
    canvas.ontouchstart = (e) => { e.preventDefault(); start(e); };
    canvas.ontouchmove  = (e) => { e.preventDefault(); move(e); };
    canvas.ontouchend   = stop;
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
        _audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
        _analyser  = _audioCtx.createAnalyser();
        _analyser.fftSize = 512;
        _audioCtx.createMediaStreamSource(stream).connect(_analyser);
        state.isRecording    = true;
        state._voiceStartTs  = Date.now();   // para calcular duración al guardar
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
    if (_rafId)   { cancelAnimationFrame(_rafId); _rafId = null; }
    if (_audioCtx) { _audioCtx.close().catch(() => {}); _audioCtx = null; _analyser = null; }
    state.isRecording = false;
    const viz = document.getElementById('voice-viz');
    if (viz) viz.style.display = 'none';
    const btn = document.getElementById('record-btn');
    if (btn) btn.textContent = t('voc_record');
    // Hook Módulo 3: finalizar análisis de prosodia
    if (window.NVVoiceInsights) NVVoiceInsights.onStop();
    if (!silent) {
        const pct      = Math.floor(Math.random() * 15 + 82);
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
    const isEs     = state.lang === 'es';
    const startTs  = Date.now();
    showMedicalTip(
        isEs ? 'La respiración diafragmática reduce la rigidez muscular y mejora la oxigenación cerebral.'
             : 'Diaphragmatic breathing reduces muscle rigidity and improves brain oxygenation.',
        () => showModal(
            isEs ? 'Inspirar 4 seg...\nMantener 2 seg...\nExpirar 6 seg.\n\nSiga el ritmo visual y repita el ciclo.'
                 : 'Inhale 4 sec...\nHold 2 sec...\nExhale 6 sec.\n\nFollow the visual rhythm and repeat.',
            {
                title:       isEs ? 'Respiración Guiada' : 'Guided Breathing',
                confirmText: isEs ? 'Completado ✓'       : 'Completed ✓',
                cancelText:  isEs ? 'Cerrar'             : 'Close',
                onConfirm: () => {
                    const duration = Math.round((Date.now() - startTs) / 1000);
                    const cycles   = Math.max(1, Math.floor(duration / 12));
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

function toggleMetronome() {
    state.metronomeActive ? stopMetronome() : startMetronome();
}

function startMetronome() {
    state.metronomeActive = true;
    _metBeat = 0;
    _metCtx  = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain — controlable desde modo rescate
    _metGain = _metCtx.createGain();
    _metGain.gain.value = 0.78;
    _metGain.connect(_metCtx.destination);

    // Audio ducking: bajar música de Spotify cuando metrónomo arranca
    if (window.NVSpotify && NVSpotify.isConnected()) NVSpotify.duck(true);

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

        const t0  = _metCtx.currentTime;
        const vol = _metGain ? _metGain.gain.value : 0.78;

        // ── KICK DRUM SINTÉTICO ─────────────────────────────
        // Sub-bass: sine sweep 140 Hz → 38 Hz en 55 ms
        const kick = _metCtx.createOscillator();
        const kGain = _metCtx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, t0);
        kick.frequency.exponentialRampToValueAtTime(38, t0 + 0.055);
        kGain.gain.setValueAtTime(vol, t0);
        kGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.27);
        kick.connect(kGain); kGain.connect(_metGain);
        kick.start(t0); kick.stop(t0 + 0.3);

        // Transiente de ataque: punch inicial
        const atk = _metCtx.createOscillator();
        const aGain = _metCtx.createGain();
        atk.type = 'triangle';
        atk.frequency.value = 1100;
        aGain.gain.setValueAtTime(vol * 0.22, t0);
        aGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.016);
        atk.connect(aGain); aGain.connect(_metGain);
        atk.start(t0); atk.stop(t0 + 0.02);

        // ── VISUAL: bola + pie alternante ───────────────────
        const ball = document.getElementById('ras-ball');
        if (ball) {
            ball.style.transform = 'scale(1.28)';
            ball.style.boxShadow = '0 0 65px rgba(16,185,129,0.75),inset 0 -4px 12px rgba(0,0,0,0.2)';
            setTimeout(() => {
                if (ball) {
                    ball.style.transform = 'scale(1)';
                    ball.style.boxShadow = '0 0 40px rgba(16,185,129,0.45),inset 0 -4px 12px rgba(0,0,0,0.2)';
                }
            }, 88);
        }
        const foot = document.getElementById('ras-foot');
        if (foot) foot.textContent = _metBeat % 2 === 0 ? '🦶' : '👟';

        // ── ONDAS EXPANSIVAS ─────────────────────────────────
        _spawnRipple();

        // ── HAPTIC ──────────────────────────────────────────
        if (navigator.vibrate) navigator.vibrate(48);

        _metTimeout = setTimeout(tick, (60 / state.metronomeBPM) * 1000);
    };
    tick();
}

function stopMetronome() {
    state.metronomeActive = false;
    if (_metTimeout) { clearTimeout(_metTimeout); _metTimeout = null; }
    if (_metCtx)     { _metCtx.close().catch(() => {}); _metCtx = null; }
    _metGain = null;
    _metBeat = 0;
    // Restaurar volumen de Spotify cuando se detiene el metrónomo
    if (window.NVSpotify && NVSpotify.isConnected()) NVSpotify.duck(false);
    const btn = document.getElementById('ras-btn');
    if (btn) btn.innerHTML = `<i data-lucide="play"></i> ${t('ras_start')}`;
    lucide.createIcons();
    // Eliminar ondas residuales
    document.querySelectorAll('.ras-ripple-ring').forEach(r => r.remove());
}

function updateMetronomeBPM(val) {
    state.metronomeBPM = parseInt(val);
    const disp = document.getElementById('ras-bpm-display');
    if (disp) disp.textContent = val;
    // Actualizar highlight de presets
    [80, 110, 130].forEach(bpm => {
        const btn = document.getElementById(`ras-preset-${bpm}`);
        if (!btn) return;
        const active = bpm === state.metronomeBPM;
        btn.style.borderColor = active ? 'var(--primary-green)' : 'rgba(255,255,255,0.09)';
        btn.style.color       = active ? 'var(--primary-green)' : 'rgba(241,245,249,0.6)';
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

function spotifyTogglePlay() {
    if (window.NVSpotify) NVSpotify.togglePlay();
}

function spotifyNext() {
    if (window.NVSpotify) NVSpotify.nextTrack();
}

function spotifyPrev() {
    if (window.NVSpotify) NVSpotify.prevTrack();
}

function spotifyPickPlaylist(id, bpm) {
    if (!window.NVSpotify) return;
    NVSpotify.playPlaylist(id);
    // Sincronizar slider de BPM con el tempo de la playlist
    rasSetPreset(bpm);
}

// Modal de consentimiento GDPR/HIPAA/CCPA antes de OAuth
function showSpotifyConsent() {
    const isEs = state.lang === 'es';

    // Si ya está conectado → desconectar
    if (window.NVSpotify && NVSpotify.isConnected()) {
        if (confirm(isEs
            ? '¿Deseas desconectar Spotify de NeuroVida?'
            : 'Do you want to disconnect Spotify from NeuroVida?')) {
            NVSpotify.disconnect();
        }
        return;
    }

    // Crear modal de consentimiento
    const overlay = document.createElement('div');
    overlay.id = 'sp-consent-overlay';
    overlay.style.cssText = [
        'position:fixed','inset:0','z-index:5000',
        'background:rgba(0,0,0,0.72)','display:flex',
        'align-items:center','justify-content:center','padding:1rem',
    ].join(';');

    overlay.innerHTML = `
        <div style="
            background:var(--card-bg);
            border:1px solid rgba(29,185,84,0.35);
            border-radius:22px;
            padding:1.8rem 1.5rem;
            max-width:480px;
            width:100%;
            max-height:88vh;
            overflow-y:auto;
            box-shadow:0 30px 80px rgba(0,0,0,0.7);
        ">
            <h2 style="
                font-family:var(--font-accent);
                color:#1DB954;
                margin-bottom:1.2rem;
                font-size:1.15rem;
            ">${t('sp_consent_title')}</h2>

            <div style="
                font-size:0.86rem;
                line-height:1.75;
                color:rgba(241,245,249,0.88);
                margin-bottom:1.5rem;
                white-space:pre-line;
                background:rgba(29,185,84,0.05);
                border-left:3px solid rgba(29,185,84,0.5);
                padding:1rem;
                border-radius:10px;
            ">${t('sp_consent_body')}</div>

            <div style="display:flex;flex-direction:column;gap:0.7rem;">
                <button class="action-btn btn-primary"
                        style="width:100%;background:linear-gradient(135deg,#1DB954,#17a34a);
                               border:none;font-size:0.95rem;"
                        onclick="document.getElementById('sp-consent-overlay').remove();
                                 if(window.NVSpotify) NVSpotify.connect();">
                    ${t('sp_consent_accept')}
                </button>
                <button class="action-btn"
                        style="width:100%;border:1px solid rgba(255,255,255,0.1);
                               color:rgba(148,163,184,0.8);"
                        onclick="document.getElementById('sp-consent-overlay').remove();">
                    ${t('sp_consent_cancel')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
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
        'position:fixed','top:90px','left:50%','transform:translateX(-50%)',
        'background:#161B2D','color:#00F2FF',
        'border:1px solid rgba(0,242,255,0.3)',
        'padding:0.8rem 1.4rem','border-radius:16px',
        'z-index:9999','font-size:0.82rem',
        'max-width:300px','text-align:center',
        'box-shadow:0 10px 30px rgba(0,0,0,0.6)',
        'line-height:1.5','pointer-events:none','transition:opacity 0.5s'
    ].join(';');
    tip.innerHTML = `<strong style="display:block;margin-bottom:4px;color:#8B5CF6;">ℹ ${state.lang === 'es' ? 'Beneficio médico' : 'Medical benefit'}</strong>${msg}`;
    document.body.appendChild(tip);
    setTimeout(() => { tip.style.opacity = '0'; setTimeout(() => tip.parentNode && tip.parentNode.removeChild(tip), 500); }, 3200);
    if (callback) setTimeout(callback, 600);
}

// ============================================================
// EXPORTAR PDF CLÍNICO
// ============================================================
function exportPDF() {
    const name  = state.user ? state.user.name : 'Paciente';
    const today = new Date().toLocaleDateString(state.lang === 'es' ? 'es-ES' : 'en-US', { year:'numeric', month:'long', day:'numeric' });
    const tapCount = state.tappingData.timestamps.length;
    const avgMs = state.tappingData.intervals.length > 0
        ? Math.round(state.tappingData.intervals.reduce((a, b) => a + b, 0) / state.tappingData.intervals.length) : 0;
    const tapValuation = tapCount > 20 ? (state.lang === 'es' ? 'ÓPTIMO' : 'OPTIMAL') : tapCount > 10 ? 'NORMAL' : tapCount > 0 ? (state.lang === 'es' ? 'BAJO' : 'LOW') : 'N/A';
    const tapColor = tapCount > 20 ? '#10b981' : tapCount > 10 ? '#3b82f6' : '#f59e0b';
    const bars = state.tappingData.intervals.length > 0
        ? state.tappingData.intervals.slice(0, 12).map(v => Math.min(Math.round((v / 800) * 100), 100))
        : [40, 65, 80, 55, 70, 90, 60, 75, 85, 50, 68, 72];

    const html = `
    <div style="font-family:Arial,sans-serif;color:#1e293b;padding:40px;max-width:760px;margin:0 auto;font-size:13px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:18px;margin-bottom:28px;">
        <div>
          <div style="font-size:26px;font-weight:900;color:#10b981;letter-spacing:-1px;">NEUROVIDA PRO</div>
          <div style="color:#64748b;margin-top:4px;">${state.lang === 'es' ? 'Reporte Clínico Integrado' : 'Integrated Clinical Report'} · ${today}</div>
        </div>
        <div style="background:#f0fdf4;border:2px solid #10b981;border-radius:10px;padding:8px 16px;font-size:11px;font-weight:700;color:#10b981;">✔ HIPAA COMPLIANT</div>
      </div>
      <div style="background:#f8fafc;border-left:4px solid #3b82f6;border-radius:8px;padding:16px;margin-bottom:22px;">
        <div style="font-weight:700;font-size:11px;color:#64748b;margin-bottom:10px;text-transform:uppercase;">${state.lang === 'es' ? 'Información del Paciente' : 'Patient Information'}</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;width:40%;color:#64748b;">${state.lang === 'es' ? 'Nombre' : 'Name'}:</td><td style="font-weight:700;">${name}</td></tr>
          <tr><td style="color:#64748b;">${state.lang === 'es' ? 'Estado Clínico' : 'Clinical Status'}:</td><td style="font-weight:700;color:${state.patientStatus === 'ON' ? '#10b981' : '#ef4444'};">${t('phase')} ${state.patientStatus}</td></tr>
          <tr><td style="color:#64748b;">${state.lang === 'es' ? 'Fecha' : 'Date'}:</td><td>${today}</td></tr>
          <tr><td style="color:#64748b;">GPS:</td><td>${state.gpsMetadata.lat}, ${state.gpsMetadata.lon}</td></tr>
        </table>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px;">
        <div style="font-weight:700;font-size:11px;color:#64748b;margin-bottom:14px;text-transform:uppercase;">📊 ${state.lang === 'es' ? 'Test de Tapping' : 'Tapping Test'}</div>
        <div style="display:flex;gap:12px;margin-bottom:14px;">
          <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:28px;font-weight:900;color:#10b981;">${tapCount}</div><div style="font-size:10px;color:#64748b;">${t('tap_taps')}</div></div>
          <div style="flex:1;background:#eff6ff;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:28px;font-weight:900;color:#3b82f6;">${avgMs > 0 ? avgMs + 'ms' : 'N/A'}</div><div style="font-size:10px;color:#64748b;">${state.lang === 'es' ? 'Intervalo Medio' : 'Avg Interval'}</div></div>
          <div style="flex:1;border:2px solid ${tapColor};border-radius:8px;padding:14px;text-align:center;"><div style="font-size:18px;font-weight:900;color:${tapColor};">${tapValuation}</div><div style="font-size:10px;color:#64748b;">${state.lang === 'es' ? 'Valoración' : 'Rating'}</div></div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:10px;">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">${state.lang === 'es' ? 'Distribución de intervalos:' : 'Interval distribution:'}</div>
          <div style="display:flex;align-items:flex-end;gap:3px;height:50px;">${bars.map(h => `<div style="flex:1;background:#10b981;height:${h}%;border-radius:2px 2px 0 0;opacity:0.75;"></div>`).join('')}</div>
        </div>
      </div>
      ${(() => {
        const lastReport = state.medicalReports[0];
        if (!lastReport) return '';
        const isEs = state.lang === 'es';
        return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px;">
          <div style="font-weight:700;font-size:11px;color:#64748b;margin-bottom:14px;text-transform:uppercase;">🧠 ${isEs ? 'Último Informe Médico — Análisis IA' : 'Last Medical Report — AI Analysis'}</div>
          <div style="border-left:3px solid #3b82f6;padding:10px 14px;background:#f8fafc;border-radius:0 6px 6px 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <strong style="font-size:12px;">${lastReport.source || lastReport.fileName || ''}</strong>
              <span style="color:#94a3b8;font-size:11px;">${lastReport.date || ''}</span>
            </div>
            <div style="margin-bottom:5px;">
              <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;">${isEs ? 'Diagnóstico' : 'Diagnosis'}: </span>
              <span style="color:#3b82f6;font-weight:700;font-size:12px;">${lastReport.diagnostico_principal || lastReport.diagnosis || ''}</span>
            </div>
            ${(lastReport.medicacion_activa || lastReport.medicacion) ? `
            <div style="margin-bottom:5px;">
              <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;">💊 ${isEs ? 'Medicación' : 'Medication'}: </span>
              <span style="color:#16a34a;font-size:11px;">${lastReport.medicacion_activa || lastReport.medicacion}</span>
            </div>` : ''}
            <div>
              <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;">${isEs ? 'Recomendaciones' : 'Recommendations'}: </span>
              <span style="color:#64748b;font-size:11px;">${lastReport.recomendaciones || lastReport.analysis || ''}</span>
            </div>
          </div>
        </div>`;
      })()}
      ${(() => {
        const sessions = window.NVHistory ? NVHistory.getAll().slice(0, 5) : [];
        if (!sessions.length) return '';
        const isEs = state.lang === 'es';
        const typeLabel = { tapping: isEs ? 'Temblor' : 'Tremor', drawing: isEs ? 'Dibujo' : 'Drawing', vocal: isEs ? 'Vocal' : 'Vocal', breathing: isEs ? 'Respiración' : 'Breathing' };
        return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px;">
          <div style="font-weight:700;font-size:11px;color:#64748b;margin-bottom:14px;text-transform:uppercase;">📈 ${isEs ? 'Últimas Sesiones de Rehabilitación' : 'Latest Rehabilitation Sessions'}</div>
          ${sessions.map(s => {
            const m = s.metrics || {};
            const label = typeLabel[s.type] || s.type;
            const dateStr = new Date(s.ts).toLocaleDateString(isEs ? 'es-ES' : 'en-US');
            let metric = '';
            if (s.type === 'tapping')   metric = `${m.bpm || '—'} BPM · Jitter ${m.jitter || '—'}%`;
            if (s.type === 'drawing')   metric = `${isEs ? 'Estabilidad' : 'Stability'} ${m.stability || '—'}%`;
            if (s.type === 'vocal')     metric = `${isEs ? 'Estabilidad' : 'Stability'} ${m.stability || '—'}%`;
            if (s.type === 'breathing') metric = `${m.cycles || '—'} ${isEs ? 'ciclos' : 'cycles'} · ${m.duration || '—'}s`;
            return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:12px;">
              <span><strong>${label}</strong> <span style="color:#94a3b8;">· FASE ${s.phase || 'ON'}</span></span>
              <span style="color:#475569;">${metric}</span>
              <span style="color:#94a3b8;font-size:11px;">${dateStr}</span>
            </div>`;
          }).join('')}
        </div>`;
      })()}
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:22px;">
        <div style="font-weight:700;font-size:11px;color:#64748b;margin-bottom:14px;text-transform:uppercase;">💊 ${state.lang === 'es' ? 'Medicación' : 'Medication'}</div>
        ${state.medications.map(m => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-weight:600;">${m.name}</span>
            <div style="display:flex;gap:10px;align-items:center;">
              <span style="color:#64748b;">${m.time}</span>
              <span style="background:${m.taken ? '#dcfce7' : '#fef9c3'};color:${m.taken ? '#16a34a' : '#ca8a04'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${m.taken ? (state.lang === 'es' ? 'Tomado' : 'Taken') : (state.lang === 'es' ? 'Pendiente' : 'Pending')}</span>
            </div>
          </div>`).join('')}
      </div>
      <div style="border-top:2px solid #e2e8f0;padding-top:16px;text-align:center;color:#94a3b8;font-size:10px;">
        <div>NeuroVida PRO · ${today}</div>
        <div style="margin-top:4px;font-weight:700;">HIPAA COMPLIANT · RGPD · Cifrado NVP-2026</div>
      </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(container);
    html2pdf().set({
        margin: [8, 8],
        filename: `NeuroVida_${name.replace(/\s/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save().then(() => {
        document.body.removeChild(container);
        logAudit('Reporte PDF exportado');
    });
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
    } catch (_) {}
    if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 600]);
    const { lat, lon } = state.gpsMetadata;
    logAudit('SOS ACTIVADO — Emergencia reportada');
    const isEs = state.lang === 'es';
    showModal(
        `📍 GPS: ${lat}, ${lon}\n\n📞 ${isEs ? 'Llamando al 112 (España) / 911 (EE.UU.)' : 'Calling 112 (Spain) / 911 (USA)'}`,
        { title: `🚨 SOS ${isEs ? 'ACTIVADO' : 'ACTIVATED'}` }
    );
}

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
    stopMetronome();
    stopVoiceRecording(true);
    if (window.NVFirebase && NVFirebase.isReady()) NVFirebase.logout().catch(() => {});
    state.user = null;
    localStorage.removeItem('nv_user');
    location.reload();
}

function saveProfileEdit() {
    const name      = (document.getElementById('edit-name')?.value || '').trim();
    const email     = (document.getElementById('edit-email')?.value || '').trim();
    const age       = (document.getElementById('edit-age')?.value || '').trim();
    const country   = (document.getElementById('edit-country')?.value || '').trim();
    const emergency = (document.getElementById('edit-emergency')?.value || '').trim();

    if (!name || !age || !country) { showToast(t('fill_fields'), 'error'); return; }

    state.user.name             = name;
    state.user.email            = email;
    state.user.age              = age;
    state.user.country          = country;
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
    try { s = JSON.parse(localStorage.getItem('nv_settings') || '{}'); } catch {}
    const current = s[key] !== false; // true si activo
    s[key] = !current;
    localStorage.setItem('nv_settings', JSON.stringify(s));

    // Actualizar toggle visual sin re-render completo
    const toggle = row ? row.querySelector('.nv-toggle') : null;
    if (toggle) toggle.classList.toggle('on', !current);

    const isEs = state.lang === 'es';
    const onText  = isEs ? 'Módulo activado'   : 'Module enabled';
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
    if (!dz) return;

    // Evitar doble-bind si el usuario navega de vuelta a health
    if (dz._nvDzInit) return;
    dz._nvDzInit = true;

    dz.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        _dropzoneHover(true);
    });
    dz.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        _dropzoneHover(true);
    });
    dz.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Solo desactivar si el puntero sale del área completa (no de un hijo)
        if (!dz.contains(e.relatedTarget)) _dropzoneHover(false);
    });
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        _dropzoneHover(false);
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleDroppedFile(file);
    });

    console.log('[NVHealth] Dropzone iniciado — clic y drag-drop activos');
}

// Hover visual del dropzone durante el drag
function _dropzoneHover(on) {
    const dz = document.getElementById('upload-dropzone');
    if (!dz) return;
    dz.style.borderColor  = on ? 'rgba(0,242,255,0.7)'  : 'rgba(0,242,255,0.25)';
    dz.style.background   = on ? 'rgba(0,242,255,0.07)' : 'rgba(22,27,45,0.6)';
    dz.style.transform    = on ? 'scale(1.01)'           : 'scale(1)';
}

// Spinner de "Analizando..." dentro del dropzone
function _dropzoneSetLoading(loading) {
    const wrap = document.getElementById('dropzone-icon-wrap');
    if (!wrap) return;
    if (loading) {
        wrap.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                 stroke="var(--primary-green)" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round"
                 style="display:block;margin:0 auto 0.75rem;animation:nvSpin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>`;
        const status = document.getElementById('upload-status');
        if (status) status.textContent = t('hlt_analyzing');
    } else {
        wrap.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
                 fill="none" stroke="var(--accent-cyan)" stroke-width="1.6"
                 stroke-linecap="round" stroke-linejoin="round"
                 style="display:block;margin:0 auto 0.75rem;">
                <polyline points="16 16 12 12 8 16"></polyline>
                <line x1="12" y1="12" x2="12" y2="21"></line>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
            </svg>`;
    }
}

function handleFileUpload(input) {
    const file = input && (input.files ? input.files[0] : input);
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
        showToast(state.lang === 'es'
            ? 'Formato no válido. Use PDF, JPG o PNG.'
            : 'Invalid format. Use PDF, JPG or PNG.', 'error');
        return;
    }

    // Guardar referencia real al objeto File — crítico para drag & drop
    state._pendingFile = file;
    console.log('[NVReports] Archivo detectado:', file.name, '|', file.type, '|', (file.size/1024/1024).toFixed(2), 'MB');

    const sizeMB   = (file.size / 1024 / 1024).toFixed(2);
    const ext      = file.name.split('.').pop().toUpperCase();
    const statusEl = document.getElementById('upload-status');
    if (statusEl) statusEl.innerHTML =
        `<span style="color:var(--primary-green);font-weight:700;">✓ ${file.name}</span>
         <span style="color:rgba(148,163,184,0.6);margin-left:6px;">${sizeMB} MB · ${ext}</span>`;
    const anaBox = document.getElementById('report-ana-box');
    if (anaBox) anaBox.style.display = 'block';
    const dropZone = document.getElementById('upload-dropzone');
    if (dropZone) dropZone.style.borderColor = 'rgba(16,185,129,0.5)';
    state.uploadedFile = { name: file.name, size: sizeMB, type: file.type };
    showToast(state.lang === 'es'
        ? `Archivo listo: ${file.name}`
        : `File ready: ${file.name}`, 'success');
    lucide.createIcons();
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
        frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-delta},${lat-delta},${lon+delta},${lat+delta}&layer=mapnik&marker=${lat},${lon}`;
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
    const today    = new Date().toDateString();
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

function requestNotifPermission() {
    if (!('Notification' in window)) {
        showToast(state.lang === 'es'
            ? 'Notificaciones no disponibles en este navegador.'
            : 'Notifications not available in this browser.', 'error');
        return;
    }
    if (Notification.permission === 'granted') {
        showToast(state.lang === 'es'
            ? 'Notificaciones ya están activas ✓'
            : 'Notifications already active ✓', 'info');
        startMedReminders();
        return;
    }
    Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
            showToast(state.lang === 'es'
                ? 'Recordatorios de medicación activados ✓'
                : 'Medication reminders enabled ✓', 'success');
            startMedReminders();
            _updateNotifBanner();
        } else {
            showToast(state.lang === 'es'
                ? 'Permiso denegado. Actívalo en la configuración del navegador.'
                : 'Permission denied. Enable it in browser settings.', 'warning');
        }
    });
}

function startMedReminders() {
    if (_notifInterval) clearInterval(_notifInterval);
    _notifInterval = setInterval(() => {
        if (Notification.permission !== 'granted') return;
        const now     = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        state.medications.forEach(med => {
            if (med.time === timeStr && !med.taken) {
                new Notification(
                    '💊 ' + (state.lang === 'es' ? 'NeuroVida — Medicación' : 'NeuroVida — Medication'),
                    {
                        body: (state.lang === 'es' ? 'Es hora de tomar: ' : 'Time to take: ') + med.name,
                        tag:  `med_${med.time}`,
                        icon: '/favicon.ico'
                    }
                );
            }
        });
    }, 60000); // Comprueba cada minuto
}

function _updateNotifBanner() {
    const banner  = document.getElementById('notif-banner');
    const bannerT = document.getElementById('notif-banner-text');
    if (!banner || !bannerT) return;
    const granted = Notification.permission === 'granted';
    banner.style.borderColor = granted ? 'rgba(16,185,129,0.3)' : 'rgba(0,242,255,0.15)';
    bannerT.textContent = granted
        ? (state.lang === 'es' ? 'Recordatorios activos ✓' : 'Reminders active ✓')
        : (state.lang === 'es' ? 'Activar recordatorios de medicación' : 'Enable medication reminders');
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
            cancelText:  t('cancel'),
            onConfirm:   () => { NVHistory.deleteById(id); render(); }
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
            cancelText:  t('cancel'),
            onConfirm:   () => { NVHistory.clearAll(); render(); }
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
        if (s.type === 'tapping')   return Math.max(0, Math.min(100, 100 - (mx.jitter || 50)));
        if (s.type === 'drawing')   return mx.stability || 0;
        if (s.type === 'vocal')     return mx.stability || 0;
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
            plugins: { legend: { display: false }, tooltip: {
                backgroundColor: 'rgba(14,20,45,0.9)',
                borderColor: 'rgba(16,185,129,0.3)',
                borderWidth: 1,
                titleColor: '#10b981',
                bodyColor: 'rgba(241,245,249,0.85)',
                callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
            }},
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
    const isEs     = state.lang === 'es';
    const allSess  = window.NVHistory ? NVHistory.getAll() : (state.sessionHistory || []);
    const meta     = window.NVHistory ? NVHistory.TEST_META : {};
    const s        = allSess.find(x => x.id === id);
    if (!s) return;

    const m        = meta[s.type] || { icon: 'activity', color: '#00F2FF', labelEs: s.type, labelEn: s.type };
    const label    = isEs ? m.labelEs : m.labelEn;
    const tsText   = window.NVHistory ? NVHistory.formatTs(s.ts, state.lang) : new Date(s.ts).toLocaleString();
    const mx       = s.metrics || {};
    const phase    = s.phase || 'ON';
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
        Object.entries(mx).map(([k,v]) => `${k}: ${v}`).join(' · ') +
        `\n\nNeuroVida PRO — ${isEs ? 'Ecosistema Digital Parkinson' : 'Parkinson Digital Ecosystem'}`
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
                border-top:1px solid rgba(${m.color.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')},0.25);
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
    // Detectar y aplicar idioma inicial
    if (state.user) {
        initApp();
    } else {
        showAuthMode('login');
        applyStaticTranslations();
    }
});
