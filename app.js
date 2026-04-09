/**
 * LevityCare PRO - Ultra Premium Core Logic
 */

const state = {
    currentView: 'home',
    weightDischarge: 45,
    mobilityScore: 88,
    tremorLevel: 'Mínimo',
    activeRoutine: 'Caminata Lunar 1',
    medications: [
        { name: 'Levodopa', time: '08:00', taken: true },
        { name: 'Ropinirol', time: '14:00', taken: false },
        { name: 'Levodopa', time: '20:00', taken: false }
    ],
    trends: [65, 72, 68, 85, 92, 88, 94, 82, 88, 95, 98, 88],
    isListening: false
};

const views = {
    home: `
        <div class="premium-card span-4 score-hero">
            <h3>Vitalidad Diaria</h3>
            <div class="circular-gauge">
                <svg class="progress-ring" width="200" height="200">
                    <circle class="progress-ring__circle" stroke="var(--accent-primary)" stroke-width="12" fill="transparent" r="90" cx="100" cy="100"/>
                </svg>
                <span class="score-text" id="mobility-score-val">${state.mobilityScore}</span>
            </div>
            <p style="color: var(--text-dim)">Puntuación de Eficiencia Motora</p>
        </div>

        <div class="premium-card span-8">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h3>Descarga de Peso Adaptativa</h3>
                    <p style="color: var(--text-dim); margin-top: 0.5rem;">Ajuste dinámico basado en bradicinesia y ON/OFF.</p>
                </div>
                <div style="text-align: right">
                    <span style="font-size: 2.5rem; font-weight: 800; color: var(--accent-primary)" id="weight-val">${state.weightDischarge}%</span>
                </div>
            </div>
            <div class="slider-container">
                <input type="range" id="weight-slider" min="0" max="90" value="${state.weightDischarge}">
            </div>
            <div class="mini-chart" id="trend-bars">
                ${state.trends.map(h => `<div class="chart-bar" style="height: ${h}%"></div>`).join('')}
            </div>
        </div>

        <div class="premium-card span-6">
            <h3>Sensores Biométricos</h3>
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 16px;">
                    <span style="color: var(--text-dim)">Nivel de Temblor</span>
                    <span style="color: var(--accent-primary); font-weight: 700;">${state.tremorLevel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 16px;">
                    <span style="color: var(--text-dim)">Gait Stability</span>
                    <span style="color: #00ff88; font-weight: 700;">Alta</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 16px;">
                    <span style="color: var(--text-dim)">Fatiga Cardíaca</span>
                    <span style="font-weight: 700;">74 BPM</span>
                </div>
            </div>
        </div>

        <div class="premium-card span-6">
            <h3>Emergencia y Voz</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem; margin-bottom: 1.5rem;">Control instantáneo sin contacto físico.</p>
            <button class="btn-emergency" onclick="startVoiceCommand()">LLAMADA DE EMERGENCIA</button>
            <div id="voice-indicator" style="margin-top: 1rem; text-align: center; color: var(--accent-primary); font-size: 0.9rem; visibility: hidden;">
                ESCUCHANDO COMANDO...
            </div>
        </div>
    `,
    analytics: `
        <div class="premium-card span-12">
            <h2>Análisis Predictivo de IA</h2>
            <div style="height: 300px; margin-top: 2rem; border-bottom: 1px solid var(--surface-border); display: flex; align-items: flex-end; gap: 10px; padding-bottom: 10px;">
                ${Array(30).fill(0).map((_, i) => `<div class="chart-bar" style="height: ${30 + Math.random() * 60}%; opacity: 0.4;"></div>`).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; color: var(--text-dim);">
                <span>01 Apr</span>
                <span>Proyección 30 días: Mejora del 12% en longitud de paso</span>
                <span>30 Apr</span>
            </div>
        </div>
    `,
    exercise: `
        <div class="premium-card span-8">
            <h2>Rutas de Entrenamiento</h2>
            <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                <div class="premium-card" style="padding: 1.5rem; background: rgba(0, 242, 254, 0.05); border-color: var(--accent-primary);">
                    <h4>Caminata Lunar 1</h4>
                    <p style="color: var(--text-dim)">Enfoque: Bradiquinesia severa. Descarga: 60%.</p>
                    <button class="btn-action" style="margin-top: 1rem; padding: 0.8rem 1.5rem;">INICIAR RUTA</button>
                </div>
                <div class="premium-card" style="padding: 1.5rem;">
                    <h4>Equilibrio Orbital</h4>
                    <p style="color: var(--text-dim)">Enfoque: Estabilidad lateral. Descarga: 30%.</p>
                </div>
            </div>
        </div>
        <div class="premium-card span-4">
            <h2>Logros</h2>
            <div style="margin-top: 2rem; text-align: center;">
                <div style="font-size: 4rem;">🏆</div>
                <h3 style="margin-top: 1rem;">Guerrero del Movimiento</h3>
                <p style="color: var(--text-dim)">7 días consecutivos completados.</p>
            </div>
        </div>
    `,
    medication: `
        <div class="premium-card span-12">
            <h2>Rastreador de Medicación</h2>
            <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                ${state.medications.map(m => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: ${m.taken ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255,255,255,0.02)'}; border-radius: 20px; border: 1px solid ${m.taken ? '#00ff8844' : 'var(--surface-border)'}">
                        <div>
                            <h4 style="color: ${m.taken ? '#00ff88' : 'white'}">${m.name}</h4>
                            <p style="color: var(--text-dim)">Hora: ${m.time}</p>
                        </div>
                        <button class="btn-action" style="background: ${m.taken ? '#00ff88' : ''}; color: ${m.taken ? 'black' : ''}; padding: 0.6rem 1.2rem;">
                            ${m.taken ? 'COMPLETADO' : 'MARCAR COMO TOMADO'}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `,
    settings: `
        <div class="premium-card span-12">
            <h2>Configuración del Sistema</h2>
            <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div class="premium-card">
                    <h4>Sensibilidad de Voz</h4>
                    <input type="range" style="margin-top: 1rem;">
                </div>
                <div class="premium-card">
                    <h4>Modo de Pantalla</h4>
                    <button class="btn-action" style="margin-top: 1rem; width: 100%;">ALTO CONTRASTE</button>
                </div>
            </div>
        </div>
    `
};

function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = views[state.currentView];
    lucide.createIcons();
    
    if (state.currentView === 'home') {
        initHomeLogic();
    }
}

function initHomeLogic() {
    const slider = document.getElementById('weight-slider');
    const valText = document.getElementById('weight-val');
    const circle = document.querySelector('.progress-ring__circle');
    
    // Set initial ring offset
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (state.mobilityScore / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    slider.addEventListener('input', (e) => {
        state.weightDischarge = e.target.value;
        valText.innerText = `${state.weightDischarge}%`;
    });
}

function startVoiceCommand() {
    const indicator = document.getElementById('voice-indicator');
    indicator.style.visibility = 'visible';
    setTimeout(() => {
        alert("Comando de voz reconocido: Llamando a emergencias...");
        indicator.style.visibility = 'hidden';
    }, 2500);
}

// Navigation Logic
document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.currentView = item.dataset.view;
        render();
    });
});

// IA Simulation updates
setInterval(() => {
    if (state.currentView === 'home') {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach(bar => {
            bar.style.height = `${30 + Math.random() * 60}%`;
        });
    }
}, 3000);

window.addEventListener('DOMContentLoaded', render);
