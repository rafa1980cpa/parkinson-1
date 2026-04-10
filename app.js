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
        <div class="neuro-card" style="text-align: center;">
            <h3>Módulos de Terapia</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="action-btn btn-large" onclick="openTwister()">🎙️ Evaluación de Disartria</button>
                <button class="action-btn btn-large" onclick="startResp()">🫁 ${t().resp_ctrl}</button>
                <button class="action-btn btn-large" onclick="openMotrizTest()">✍️ Test Motriz (Tapping/Espiral)</button>
            </div>
        </div>
        <div id="motriz-box" class="neuro-card" style="display:none; text-align: center;">
            <h3>Evaluación Motriz Diaria</h3>
            <p style="margin-bottom: 1rem;">Dibuja una espiral siguiendo la línea de puntos para medir la estabilidad (Telemetría de temblor en tiempo real).</p>
            <div style="width: 100%; height: 250px; background: white; border-radius: 20px; border: 2px dashed #ccc; overflow: hidden; position: relative;">
                <canvas id="spiral-canvas" style="width:100%; height:100%; display:block;"></canvas>
            </div>
            <button class="action-btn btn-large" style="width:100%; margin-top: 1rem; background: var(--secondary-blue); color: white;" onclick="alert('Guardando resultados y procesando métricas con Edge AI...')">Terminar Evaluación</button>
        </div>
        <div id="twister-box" class="neuro-card" style="display:none; background: var(--secondary-blue); color:white; text-align: center;">
            <h3>${t().tongue_twister}</h3>
            <p style="font-size: 1.2rem; line-height: 1.5; padding: 1rem;">"Pablito clavó un clavito en la calva de un calvito."</p>
            <button class="action-btn btn-large" style="width:100%; border:none; background:white; color:var(--secondary-blue);" onclick="toggleVoice()">🎙️ Grabar</button>
        </div>
        <div id="resp-box" class="neuro-card" style="display:none; text-align: center;">
            <h3>${t().resp_ctrl}</h3>
            <div id="resp-circle" style="width:100px; height:100px; background: var(--primary-green); border-radius:50%; margin: 2rem auto; transition: transform 2s ease-in-out;"></div>
            <p id="resp-text" style="text-align:center; font-weight:800; font-size: 1.5rem;">INSPIRA...</p>
        </div>
    `,
    health: () => `
        <div class="neuro-card" style="text-align: center; padding: 2rem 1rem;">
            <h3>¿Cómo te sientes hoy?</h3>
            <div style="display:flex; gap:1rem; margin-top: 1rem;">
                <button class="action-btn btn-large" style="flex:1; background:${state.patientStatus==='ON'?'var(--primary-green)':'#eee'}; color:${state.patientStatus==='ON'?'white':'#666'}" onclick="state.patientStatus='ON';render();">
                    <br>ESTADO: ON
                </button>
                <button class="action-btn btn-large" style="flex:1; background:${state.patientStatus==='OFF'?'var(--accent-red)':'#eee'}; color:${state.patientStatus==='OFF'?'white':'#666'}" onclick="state.patientStatus='OFF';render();">
                    <br>ESTADO: OFF
                </button>
            </div>
        </div>
        <div class="neuro-card">
            <h3>Próxima Medicación</h3>
            ${state.medications.slice(0,1).map(m => `
                <div style="background:#f8f9fa; padding:1.5rem; border-radius:15px; text-align: center;">
                    <h2 style="margin:0; font-size:2rem; color:var(--text-dark);">${m.time}</h2>
                    <p style="font-size:1.2rem; margin-bottom: 1rem;">${m.name}</p>
                    <button class="action-btn btn-large" style="width:100%; background:var(--primary-green); color:white;">REGISTRAR TOMA</button>
                </div>
            `).join('')}
        </div>
        <div class="neuro-card">
            <button class="action-btn btn-large" style="width:100%; border: 2px solid var(--secondary-blue); color:var(--secondary-blue);" onclick="exportPDF()">${t().export_pdf}</button>
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
function openMotrizTest() {
    const box = document.getElementById('motriz-box');
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if (box.style.display === 'block') {
            setTimeout(() => {
                const canvas = document.getElementById('spiral-canvas');
                if (!canvas) return;
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                const ctx = canvas.getContext('2d');
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                
                // Draw guide spiral
                ctx.beginPath();
                ctx.strokeStyle = '#ecf0f1';
                ctx.setLineDash([5, 5]);
                for (let i=0; i<400; i+=2) {
                    const angle = 0.1 * i;
                    const x = canvas.width/2 + (1+angle)*Math.cos(angle)*3;
                    const y = canvas.height/2 + (1+angle)*Math.sin(angle)*3;
                    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.strokeStyle = 'var(--primary-green)';
                
                let isDrawing = false;
                const getCoords = (evt) => {
                    const rect = canvas.getBoundingClientRect();
                    const e = evt.touches ? evt.touches[0] : evt;
                    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
                };
                
                const startDraw = (e) => { isDrawing = true; const pos = getCoords(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.pos_y || pos.y); };
                const draw = (e) => { if (!isDrawing) return; const pos = getCoords(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
                
                canvas.onmousedown = startDraw; canvas.onmousemove = draw; canvas.onmouseup = () => isDrawing = false; canvas.onmouseleave = () => isDrawing = false;
                canvas.ontouchstart = (e) => { e.preventDefault(); startDraw(e); };
                canvas.ontouchmove = (e) => { e.preventDefault(); draw(e); };
                canvas.ontouchend = () => isDrawing = false;

            }, 200);
        }
    }
}

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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Navegador no soporta API de Voz Nativa. Edge AI bloqueado.");
        return;
    }
    if (state.voiceListening) return;

    state.voiceListening = true;
    render();
    
    const recognition = new SpeechRecognition();
    recognition.lang = state.lang === 'es' ? 'es-ES' : 'en-US';
    recognition.interimResults = false;
    
    recognition.onresult = (e) => {
        const cmd = e.results[0][0].transcript.toLowerCase();
        state.voiceListening = false;
        
        let recognized = true;
        if (cmd.includes("medica") || cmd.includes("salud")) changeView('health');
        else if (cmd.includes("emergencia") || cmd.includes("ayuda") || cmd.includes("socorro")) triggerFallSim();
        else if (cmd.includes("ritmo") || cmd.includes("música")) changeView('ras');
        else if (cmd.includes("terapia") || cmd.includes("ejercicio")) changeView('therapy');
        else recognized = false;
        
        alert(recognized ? "Comando procesado: " + cmd : "No entendí el comando: " + cmd);
        render();
    };
    
    recognition.onerror = () => { state.voiceListening = false; render(); };
    recognition.onend = () => { state.voiceListening = false; render(); };
    recognition.start();
}

function toggleVoice() { alert("Micrófono activo... Boris"); }

// Auth Flow Simulation
function loginAs(role) {
    document.getElementById('login-flow').style.display = 'none';
    document.getElementById('main-header').style.display = 'block';
    document.getElementById('neuro-content').style.display = 'block';
    
    const isPatient = role === 'patient';
    state.patientName = isPatient ? "Rafael" : "Cuidador (Viendo a Rafael)";
    document.querySelector('.status-tag').innerText = "Perfil: " + state.patientName;
    
    // Si es cuidador, se podría mostrar una vista diferente, pero por ahora mostramos el health dashboard
    if(role === 'caretaker') {
        changeView('health');
    } else {
        render(); // Renderiza la vista por defecto
    }
}

// Inicialización para esconder el main si todavía no hay login
window.addEventListener('DOMContentLoaded', () => {
    // Hide navigation initially
    const nav = document.querySelector('nav.bottom-nav');
    if(nav) nav.style.display = 'none';
    
    // We only render things once logged in, but we export the render function
});

// Estabilización de Toque (Touch Stabilization)
// Ignora clics adicionales en un intervalo de 800ms para evitar toques accidentales por temblor
let lastTouchTime = 0;
document.addEventListener('click', (e) => {
    const now = new Date().getTime();
    if (now - lastTouchTime < 800) {
        // Excepción para el login: permitir clicar rápido al inicio si es necesario, aunque es mejor global
        const target = e.target;
        if(target && target.tagName !== 'BUTTON' && !target.closest('button')) {
             return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        console.log('Touch prevented (Stabilization Active)');
        return false;
    }
    lastTouchTime = now;
}, true);
