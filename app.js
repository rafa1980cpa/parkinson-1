/**
 * NeuroVital PRO - Master Plan Execution Boris
 */

const translations = {
    es: {
        tagline: "Solución Integral Digital para Parkinson",
        therapy: "Terapias",
        voice_ritmo: "Voz y Ritmo",
        salud_agenda: "Salud y Agenda",
        seguridad: "Seguridad",
        tongue_twister: "Trabalenguas Boris",
        resp_ctrl: "Control Respiratorio Boris",
        smart_agenda: "Agenda Inteligente Boris",
        export_pdf: "EXPORTAR PDF Boris",
        fall_detect: "SIMULAR CAÍDA Boris",
        voice_cmd: "COMANDOS DE VOZ Boris",
        status_on: "ESTADO: ON Boris",
        status_off: "ESTADO: OFF Boris",
        call_112: "LLAMADA 112 EN MARCHA... Boris"
    }
};

const state = {
    lang: 'es',
    currentView: 'therapy',
    patientName: "Rafael",
    patientStatus: 'ON',
    medications: [
        { name: 'Levodopa', time: '08:00', icon: 'pill' },
        { name: 'Ropinirol', time: '13:00', icon: 'tablets' }
    ],
    isRecording: false,
    fallCountdown: 0,
    voiceListening: false,
    respirationStep: 0
};

const t = () => translations[state.lang];

// Views
const views = {
    therapy: () => `
        <div class="neuro-card">
            <h3>Módulos de Terapia Boris</h3>
            <div class="therapy-grid">
                <button class="action-btn" onclick="openTwister()">${t().tongue_twister}</button>
                <button class="action-btn" onclick="startResp()">${t().resp_ctrl}</button>
                <button class="action-btn" onclick="alert('Spiral Trace...')">Escritura</button>
            </div>
        </div>
        <div id="twister-box" class="neuro-card" style="display:none; background: var(--secondary-blue); color:white;">
            <h3>${t().tongue_twister}</h3>
            <p style="font-size: 1.2rem; line-height: 1.5;">"Pablito clavó un clavito en la calva de un calvito."</p>
            <button class="action-btn" onclick="toggleVoice()">🎙️ Grabar Pronunciación</button>
        </div>
        <div id="resp-box" class="neuro-card" style="display:none;">
            <h3>${t().resp_ctrl}</h3>
            <div id="resp-circle" style="width:100px; height:100px; background: var(--primary-green); border-radius:50%; margin: 2rem auto; transition: transform 2s ease-in-out;"></div>
            <p id="resp-text" style="text-align:center; font-weight:800;">INSPIRA...</p>
        </div>
    `,
    health: () => `
        <div class="neuro-card">
            <h3>${t().smart_agenda}</h3>
            ${state.medications.map(m => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:1.5rem; border-radius:15px; margin-bottom:1rem;">
                    <div><h4 style="margin:0">${m.name}</h4><small>${m.time}</small></div>
                    <button class="action-btn" style="background:var(--primary-green); color:white;">TOMAR</button>
                </div>
            `).join('')}
        </div>
        <div class="neuro-card">
            <button class="action-btn" style="width:100%;" onclick="exportPDF()">${t().export_pdf}</button>
        </div>
        <div class="neuro-card">
            <h3>${t().status_on}/${t().status_off}</h3>
            <div style="display:flex; gap:1rem;">
                <button class="action-btn" style="flex:1; background:${state.patientStatus==='ON'?'var(--primary-green)':'#eee'}" onclick="state.patientStatus='ON';render();">ON Boris</button>
                <button class="action-btn" style="flex:1; background:${state.patientStatus==='OFF'?'var(--accent-red)':'#eee'}" onclick="state.patientStatus='OFF';render();">OFF Boris</button>
            </div>
        </div>
    `,
    ras: () => `
         <div class="neuro-card">
            <h3>Musicoterapia (RAS) Boris</h3>
            <p>Metrónomo activo para evitar el 'Freezing'. Boris.</p>
            <button class="action-btn" style="width:100%;">🎵 Activar Playlist Energía</button>
         </div>
         <div class="neuro-card">
            <h3>${t().voice_cmd}</h3>
            <div style="text-align:center; padding:1rem;">
                <button class="btn-sos" style="width:100px; height:100px; border-radius:50%;" onclick="toggleVoiceCmd()">
                    <i data-lucide="mic" style="width:40px; height:40px;"></i>
                </button>
                <p style="margin-top:1rem;">${state.voiceListening ? 'ESCUCHANDO...' : 'PULSA PARA HABLAR'}</p>
            </div>
         </div>
    `,
    security: () => `
        <div class="neuro-card">
            <h3>Seguridad Boris</h3>
            <button class="action-btn" style="width:100%; border:2px solid var(--accent-red); color:var(--accent-red);" onclick="triggerFallSim()">${t().fall_detect}</button>
            <div id="fall-alert" style="display:${state.fallCountdown > 0 ? 'block' : 'none'}; background: var(--accent-red); color:white; padding:2rem; border-radius:20px; margin-top:1rem; text-align:center;">
                <h1 style="font-size:3rem; margin:0;">${state.fallCountdown}s</h1>
                <p>CAÍDA DETECTADA. LLAMANDO AL 112...</p>
                <button class="action-btn" style="background:white; color:var(--accent-red);" onclick="cancelFall()">CANCELAR Boris</button>
            </div>
        </div>
        <div class="neuro-card">
             <p>Modo Soledad: <strong>ACTIVO</strong> Boris</p>
             <small>GPS Activo: 40.4168° N, 3.7038° W Boris</small>
        </div>
    `
};

function render() {
    const main = document.getElementById('neuro-content');
    if (!main) return;
    main.innerHTML = (views[state.currentView] || views.therapy)();
    lucide.createIcons();
    updateNav();
}

function updateNav() {
    const icons = { 'therapy': 'brain', 'ras': 'music', 'health': 'calendar-check', 'security': 'shield' };
    const nav = document.querySelector('nav');
    if (!nav) return;
    nav.innerHTML = Object.entries(icons).map(([view, icon]) => `
        <div class="nav-link ${state.currentView === view ? 'active' : ''}" onclick="changeView('${view}')">
            <i data-lucide="${icon}"></i>
        </div>
    `).join('');
    lucide.createIcons();
}

function changeView(v) { state.currentView = v; render(); }

// Actions Boris
function openTwister() {
    const box = document.getElementById('twister-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function startResp() {
    const box = document.getElementById('resp-box');
    box.style.display = 'block';
    const circle = document.getElementById('resp-circle');
    const text = document.getElementById('resp-text');
    let phase = 0;
    const interval = setInterval(() => {
        if (state.currentView !== 'therapy') clearInterval(interval);
        phase = (phase + 1) % 2;
        circle.style.transform = phase === 0 ? 'scale(1.5)' : 'scale(1)';
        text.innerText = phase === 0 ? 'INSPIRA...' : 'EXPIRA...';
    }, 4000);
}

function exportPDF() {
    alert("Generando Reporte PDF para el Neurólogo... Boris");
    setTimeout(() => alert("PDF Exportado con éxito. Boris"), 1500);
}

function triggerFallSim() {
    state.fallCountdown = 30;
    render();
    const timer = setInterval(() => {
        if (state.fallCountdown <= 0) { clearInterval(timer); return; }
        state.fallCountdown--;
        if (document.getElementById('fall-alert')) {
            document.getElementById('fall-alert').querySelector('h1').innerText = state.fallCountdown + 's';
        }
        if (state.fallCountdown === 0) alert(t().call_112);
    }, 1000);
}

function cancelFall() { state.fallCountdown = 0; render(); }

function toggleVoiceCmd() {
    state.voiceListening = !state.voiceListening;
    render();
    if (state.voiceListening) {
        setTimeout(() => {
            alert("Comando reconocido: 'Abrir Medicación' Boris");
            state.voiceListening = false;
            changeView('health');
        }, 2000);
    }
}

function toggleVoice() { alert("Micrófono activo... Boris"); }

window.addEventListener('DOMContentLoaded', render);
