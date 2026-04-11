/**
 * NeuroVida PRO - Perfeccionamiento de Ecosistema (Fase 7)
 * Foco: Autenticación Profesional, Análisis de Informes AI y Estabilidad UX
 */

const translations = {
    es: {
        tagline: "Salud Digital de Alta Precisión",
        therapy: "Terapias",
        voice_ritmo: "Voz y Ritmo",
        salud_agenda: "Salud y Agenda",
        seguridad: "Seguridad",
        tongue_twister: "Evaluación de Disartria",
        resp_ctrl: "Control Respiratorio",
        smart_agenda: "Agenda Inteligente",
        export_pdf: "GENERAR REPORTE CLÍNICO",
        fall_detect: "SIMULAR CAÍDA (SOS)",
        voice_cmd: "ASISTENTE DE VOZ",
        status_on: "ESTADO: ON",
        status_off: "ESTADO: OFF",
        call_112: "CONECTANDO CON SERVICIOS DE EMERGENCIA...",
        gps_accuracy: "Precisión GPS: +/- 4 metros",
        sync_ok: "Dispositivos Sincronizados",
        ana_informe: "ANALIZAR INFORME MÉDICO"
    }
};

const state = {
    user: JSON.parse(localStorage.getItem('nv_user')) || null,
    lang: 'es',
    currentView: 'therapy',
    patientStatus: 'ON',
    medications: [
        { name: 'Levodopa/Carbidopa', time: '08:00', taken: true },
        { name: 'Ropinirol', time: '13:00', taken: false },
        { name: 'Levodopa/Carbidopa', time: '20:00', taken: false }
    ],
    isRecording: false,
    fallCountdown: 0,
    voiceListening: false,
    respirationStep: 0,
    tappingData: { timestamps: [], intervals: [], active: false },
    gpsMetadata: { lat: "40.4168° N", lon: "3.7038° W", precision: "4m", lastUpdate: "Recién actualizado" },
    auditLog: [],
    reports: [
        { id: 1, date: '2026-03-15', source: 'Hospital Ruber', diagnosis: 'Estabilidad en Parkinson grado 2', analysis: 'Se observa buena respuesta al tratamiento actual. Mantener ejercicio motriz.' }
    ],
    isAnalyzingReport: false
};

const t = () => translations[state.lang];

// --- SISTEMA DE AUTENTICACIÓN ---

function showAuthMode(mode) {
    document.getElementById('login-form-box').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('register-form-box').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('recover-form-box').style.display = mode === 'recover' ? 'block' : 'none';
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
        alert("Por favor, rellene todos los campos.");
        return;
    }

    // Simulación de validación
    const userData = { email, name: "Rafael", role: "patient" };
    state.user = userData;
    localStorage.setItem('nv_user', JSON.stringify(userData));
    initApp();
}

function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const role = document.getElementById('reg-role').value;

    if (!name || !email || !pass) {
        alert("Todos los campos son obligatorios para crear el perfil.");
        return;
    }

    const userData = { name, email, role };
    state.user = userData;
    localStorage.setItem('nv_user', JSON.stringify(userData));
    alert("Perfil creado con éxito. Bienvenido a NeuroVida.");
    initApp();
}

function handleRecover() {
    const email = document.getElementById('recover-email').value;
    if (!email) {
        alert("Introduzca su correo para continuar.");
        return;
    }
    alert("Código de recuperación enviado a: " + email + "\nRevise su bandeja de entrada.");
    showAuthMode('login');
}

function initApp() {
    if (!state.user) return;
    
    document.getElementById('auth-flow').style.display = 'none';
    document.getElementById('main-header').style.display = 'block';
    document.getElementById('neuro-content').style.display = 'block';
    document.getElementById('floating-sos-btn').style.display = 'flex';
    document.querySelector('nav.bottom-nav').style.display = 'flex';
    
    document.getElementById('user-role-tag').innerText = `Perfil: ${state.user.role === 'patient' ? 'Paciente' : 'Cuidador'}`;
    
    if (state.user.role === 'caretaker') {
        renderCaretakerDashboard();
    } else {
        render();
    }
    logAudit(`Sesión iniciada: ${state.user.email}`);
}

// --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---

function render() {
    const main = document.getElementById('neuro-content');
    if (!main || !state.user) return;
    
    main.innerHTML = (views[state.currentView] || views.therapy)();
    lucide.createIcons(); // Fix icons appearing bug
    updateNav();
}

function updateNav() {
    const icons = { 'therapy': 'activity', 'ras': 'music', 'health': 'clipboard-list', 'security': 'shield' };
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    nav.innerHTML = Object.entries(icons).map(([view, icon]) => `
        <div class="nav-link ${state.currentView === view ? 'active' : ''}" onclick="changeView('${view}')">
            <i data-lucide="${icon}"></i>
        </div>
    `).join('');
    lucide.createIcons();
}

function changeView(v) { 
    state.currentView = v; 
    if (state.user.role === 'caretaker') renderCaretakerDashboard();
    else render(); 
}

// --- VISTAS DINÁMICAS ---

const views = {
    therapy: () => `
        <div class="neuro-card">
            <h3>Centro de Rehabilitación AI</h3>
            <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                <button class="action-btn btn-large btn-primary" onclick="openTwister()">
                    <i data-lucide="mic"></i> Evaluación Vocal
                </button>
                <button class="action-btn btn-large btn-secondary" onclick="openTapping()">
                    <i data-lucide="hand"></i> Test de Temblor
                </button>
                <button class="action-btn btn-large" style="background: #f1f5f9;" onclick="openMotrizTest()">
                    <i data-lucide="edit-3"></i> Test de Dibujo
                </button>
                <button class="action-btn btn-large" style="background: rgba(16, 185, 129, 0.1); color: var(--primary-green);" onclick="startResp()">
                    <i data-lucide="wind"></i> Respiración Guiada
                </button>
            </div>
        </div>

        <!-- Hidden boxes for tests -->
        <div id="motriz-box" class="neuro-card" style="display:none; position:relative; overflow:hidden;">
            <h3>Escritura de Precisión</h3>
            <div style="width:100%; height:250px; background:white; border-radius:15px; border:2px dashed #eee;">
                <canvas id="spiral-canvas" style="width:100%; height:100%"></canvas>
            </div>
            <button class="action-btn btn-primary" style="width:100%; margin-top:1rem;" onclick="closeMotriz()">Finalizar</button>
        </div>

        <div id="twister-box" class="neuro-card" style="display:none; background: #1a1b26; color:white;">
            <h3>Analizador de Prosodia</h3>
            <p style="text-align:center; padding:1rem;">"Pablito clavó un clavito en la calva de un calvito."</p>
            <div id="voice-viz" style="display:none; margin: 1rem 0;">
                <div class="waveform-container">
                    ${Array(12).fill('<div class="bar anim-bar"></div>').join('')}
                </div>
            </div>
            <button id="record-btn" class="action-btn btn-primary" style="width:100%" onclick="toggleVoiceRecording()">Grabar</button>
        </div>
    `,
    health: () => `
        <div class="neuro-card">
            <h3>Subir Informe Médico</h3>
            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1.2rem;">Sincronice sus informes PDF para una valoración AI de su estado.</p>
            <div style="border: 2px dashed #cbd5e1; padding: 2rem; border-radius: 16px; text-align: center; background: #f8fafc; cursor: pointer;" onclick="simulateReportAction()">
                <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--secondary-blue); margin-bottom: 0.5rem;"></i>
                <p style="font-weight: 700;">Haga clic para subir PDF</p>
                <small id="upload-status">Soportado: PDF, JPG, PNG</small>
            </div>
            <div id="report-ana-box" style="display: none; margin-top: 1.5rem;">
                <button class="action-btn btn-primary" style="width:100%;" onclick="runReportAnalysis()" id="ana-btn">
                   <i data-lucide="cpu"></i> ${state.isAnalyzingReport ? 'PROCESANDO...' : t().ana_informe}
                </button>
            </div>
        </div>

        <div class="neuro-card">
            <h3>Valoraciones Recientes</h3>
            <div id="reports-list">
                ${state.reports.map(r => `
                    <div style="padding: 1rem; border-bottom: 1px solid #eee; margin-bottom: 0.5rem;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                            <strong>${r.source}</strong>
                            <small>${r.date}</small>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--secondary-blue); font-weight: 700;">${r.diagnosis}</p>
                        <p style="font-size: 0.8rem; background: #f1f5f9; padding: 0.8rem; border-radius: 8px; margin-top: 5px;">${r.analysis}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="neuro-card">
            <button class="action-btn btn-secondary" style="width:100%" onclick="exportPDF()">
                <i data-lucide="file-text"></i> DESCARGAR REPORTE INTEGRAL
            </button>
        </div>
    `,
    ras: () => `
        <div class="neuro-card">
            <h3>Terapia de Ritmo</h3>
            <div style="text-align:center; padding: 2rem 0;">
                <div class="bpm-ball anim-beat" style="background: var(--primary-green);"></div>
                <h2 style="font-size: 3rem; margin: 0;">112 BPM</h2>
            </div>
            <button class="action-btn btn-primary" style="width:100%">Iniciar Sincronización</button>
        </div>
    `,
    security: () => `
        <div class="neuro-card" style="border: 2px solid var(--accent-red); background: rgba(239, 68, 68, 0.02);">
            <h3>Seguridad SOS</h3>
            <button class="action-btn btn-large btn-primary" style="background: var(--accent-red); width: 100%; margin-bottom: 1rem;" onclick="triggerFallSim()">
                <i data-lucide="alert-triangle"></i> SIMULAR EMERGENCIA
            </button>
            <button class="action-btn" style="width: 100%; border: 1.5px solid #e2e8f0; color: #64748b;" onclick="handleLogout()">
                <i data-lucide="log-out"></i> CERRAR SESIÓN
            </button>
        </div>
    `
};

// --- LÓGICA DE NEGOCIO ---

function logAudit(action) {
    state.auditLog.unshift({ action, time: new Date().toLocaleTimeString() });
    console.log(`[AUDIT] ${action}`);
}

function simulateReportAction() {
    document.getElementById('upload-status').innerText = "informe_neurologia.pdf (1.2 MB) cargado ✅";
    document.getElementById('report-ana-box').style.display = 'block';
    lucide.createIcons();
}

function runReportAnalysis() {
    if (state.isAnalyzingReport) return;
    state.isAnalyzingReport = true;
    render();
    
    setTimeout(() => {
        state.isAnalyzingReport = false;
        state.reports.unshift({
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            source: 'Análisis IA NeuroVida',
            diagnosis: 'Detección de leve bradicinesia',
            analysis: 'El informe procesado indica una respuesta estable al Ropinirol. Se sugiere aumentar el Test de Tapping diario.'
        });
        alert("Análisis Completado. Su valoración médica ha sido actualizada.");
        logAudit("Informe médico analizado por IA");
        render();
    }, 3000);
}

// --- TESTS Y SIMULACIONES ---

function openTapping() {
    document.getElementById('tapping-box').style.display = 'block';
    state.tappingData = { timestamps: [], intervals: [], active: true };
}

function closeTapping() {
    document.getElementById('tapping-box').style.display = 'none';
    state.tappingData.active = false;
    alert("Test de Tapping guardado.");
}

// Global Touch Area for Tapping
document.addEventListener('mousedown', (e) => {
    if (!state.tappingData.active || e.target.id !== 'tap-area') return;
    const now = performance.now();
    if (state.tappingData.timestamps.length > 0) {
        state.tappingData.intervals.push(now - state.tappingData.timestamps[state.tappingData.timestamps.length - 1]);
    }
    state.tappingData.timestamps.push(now);
    updateTappingStats();
});

function updateTappingStats() {
    const stats = document.getElementById('tap-stats');
    if (!stats) return;
    const count = state.tappingData.timestamps.length;
    stats.innerText = `Toques: ${count}`;
}

function openMotrizTest() {
    document.getElementById('motriz-box').style.display = 'block';
    setTimeout(initSpiral, 100);
}

function closeMotriz() { document.getElementById('motriz-box').style.display = 'none'; }

function initSpiral() {
    const canvas = document.getElementById('spiral-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3; ctx.strokeStyle = '#10b981';
    let drawing = false;
    
    const start = (e) => { drawing = true; ctx.beginPath(); const p=getPos(e); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if(!drawing) return; const p=getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const stop = () => drawing = false;
    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const ev = e.touches ? e.touches[0] : e;
        return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    canvas.onmousedown = start; canvas.onmousemove = move; canvas.onmouseup = stop;
    canvas.ontouchstart = (e) => { e.preventDefault(); start(e); };
    canvas.ontouchmove = (e) => { e.preventDefault(); move(e); };
    canvas.ontouchend = stop;
}

function toggleVoiceRecording() {
    state.isRecording = !state.isRecording;
    const viz = document.getElementById('voice-viz');
    const btn = document.getElementById('record-btn');
    if (state.isRecording) {
        viz.style.display = 'block';
        btn.innerText = 'Detener';
    } else {
        viz.style.display = 'none';
        btn.innerText = 'Grabar';
        alert("Audio procesado. Prosodia 88% estable.");
    }
}

function startResp() {
    alert("Inspirar... Expirar... Siga el ritmo del círculo verde.");
}

function exportPDF() {
    alert("Generando Reporte Médico PDF...");
}

function triggerFallSim() {
    state.fallCountdown = 10;
    alert("¡CAÍDA DETECTADA! Llamando a emergencias en 10 segundos.");
}

function logAudit(action) {
    state.auditLog.unshift({ action, time: new Date().toLocaleTimeString() });
}

// --- DASHBOARD CUIDADOR ---

function renderCaretakerDashboard() {
    const main = document.getElementById('neuro-content');
    main.innerHTML = `
        <div class="neuro-card" style="background: linear-gradient(135deg, var(--secondary-blue), #1d4ed8); color:white;">
            <h3>Panel del Cuidador</h3>
            <p>Monitoreo Real de Rafael</p>
        </div>
        <div class="neuro-card">
            <h3>Estado Motor</h3>
            <h1 style="color: var(--primary-green); text-align:center;">FASE ON</h1>
        </div>
        <div class="neuro-card">
            <h3>Última Actividad (Auditoría)</h3>
            <div style="font-size: 0.8rem;">
                ${state.auditLog.slice(0, 5).map(l => `<div style="padding:5px 0; border-bottom:1px solid #eee;"><strong>${l.time}</strong> - ${l.action}</div>`).join('')}
            </div>
        </div>
        <button class="action-btn" style="width:100%" onclick="handleLogout()">CERRAR SESIÓN</button>
    `;
    lucide.createIcons();
    updateNav();
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('nv_user');
    location.reload();
}

// --- ESTABILIZACIÓN DE TOQUE ---

let lastClick = 0;
document.addEventListener('click', (e) => {
    const now = performance.now();
    if (now - lastClick < 600) {
        // Permitir botones de nav y auth
        if(e.target.closest('.nav-link') || e.target.closest('button')) return;
        e.preventDefault();
        return;
    }
    lastClick = now;
}, true);

// --- STARTUP ---

window.addEventListener('DOMContentLoaded', () => {
    if (state.user) {
        initApp();
    } else {
        showAuthMode('login');
    }
});
