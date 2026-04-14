/**
 * NeuroTempo — Módulo 4: Notificaciones Predictivas (Gemelo Digital)
 * Estima bajadas de energía basadas en el tiempo desde la última medicación.
 * Muestra alerta no invasiva con respuesta "Bien" / "Regular".
 *
 * Activable desde Ajustes Avanzados (nv_settings.predictiveAlerts)
 */
(function NVPredictive() {
    'use strict';

    // ── Parámetros de predicción ──────────────────────────────
    const MED_ALERT_AFTER_H  = 3;               // horas desde última med → alerta
    const CHECK_INTERVAL_MS  = 20 * 60 * 1000;  // revisar cada 20 minutos
    const MIN_ALERT_GAP_MS   = 2  * 60 * 60 * 1000;  // no alertar más de 1x cada 2h

    // ── Claves localStorage ───────────────────────────────────
    const KEY_WELLNESS  = 'nv_wellness_log';
    const KEY_LAST_ALRT = 'nv_pred_last_alert';

    // ── Lectura de ajustes ────────────────────────────────────
    function isEnabled() {
        try {
            const s = JSON.parse(localStorage.getItem('nv_settings') || '{}');
            return s.predictiveAlerts !== false; // activo por defecto
        } catch { return true; }
    }

    // ─────────────────────────────────────────────────────────
    // CALCULAR HORA DE ÚLTIMA MEDICACIÓN TOMADA
    // ─────────────────────────────────────────────────────────
    function _getLastMedTime() {
        if (typeof state === 'undefined' || !Array.isArray(state.medications)) return null;

        const taken = state.medications.filter(m => m.taken && m.time);
        if (!taken.length) return null;

        const now = new Date();
        const timestamps = taken.map(m => {
            const [h, min] = m.time.split(':').map(Number);
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min, 0).getTime();
        });

        return new Date(Math.max(...timestamps));
    }

    // ─────────────────────────────────────────────────────────
    // GUARDAR RESPUESTA DE BIENESTAR
    // ─────────────────────────────────────────────────────────
    function _saveWellness(status) {
        let log = [];
        try { log = JSON.parse(localStorage.getItem(KEY_WELLNESS) || '[]'); } catch {}
        log.unshift({ ts: Date.now(), status });
        localStorage.setItem(KEY_WELLNESS, JSON.stringify(log.slice(0, 60)));
    }

    function getWellnessLog() {
        try { return JSON.parse(localStorage.getItem(KEY_WELLNESS) || '[]'); }
        catch { return []; }
    }

    // ─────────────────────────────────────────────────────────
    // RESPUESTA DEL USUARIO (Bien / Regular)
    // ─────────────────────────────────────────────────────────
    function respond(status) {
        _saveWellness(status);

        // Animar salida del banner
        const alert = document.getElementById('nv-wellness-alert');
        if (alert) {
            alert.style.transition = 'opacity 0.4s, transform 0.4s';
            alert.style.opacity    = '0';
            alert.style.transform  = 'translateX(110%)';
            setTimeout(() => alert.remove(), 420);
        }

        const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';
        if (typeof showToast === 'function') {
            showToast(
                status === 'good'
                    ? (isEs ? '¡Perfecto! Sigue así 💪' : 'Great! Keep it up 💪')
                    : (isEs
                        ? 'Registrado. Considera revisar tu medicación o descansar un momento.'
                        : 'Noted. Consider checking your medication or resting a moment.'),
                status === 'good' ? 'success' : 'info'
            );
        }
    }

    // ─────────────────────────────────────────────────────────
    // MOSTRAR ALERTA DE BIENESTAR (no invasiva, esquina inferior)
    // ─────────────────────────────────────────────────────────
    function _showWellnessAlert() {
        if (document.getElementById('nv-wellness-alert')) return;
        const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';

        const d = document.createElement('div');
        d.id = 'nv-wellness-alert';
        d.style.cssText =
            'position:fixed;bottom:120px;right:1rem;z-index:4500;' +
            'background:linear-gradient(145deg,#1e1b4b,#2e1065);' +
            'border:1px solid rgba(139,92,246,0.45);border-radius:22px;' +
            'padding:1.1rem 1.2rem;max-width:280px;width:calc(100vw - 90px);' +
            'box-shadow:0 10px 35px rgba(139,92,246,0.4);' +
            'animation:fadeIn 0.5s ease;';

        d.innerHTML =
            `<div style="display:flex;align-items:flex-start;gap:0.65rem;margin-bottom:0.85rem;">` +
            `<span style="font-size:1.5rem;line-height:1;">🧠</span>` +
            `<div>` +
            `<div style="font-weight:700;font-size:0.85rem;color:rgba(221,214,254,0.97);line-height:1.45;">` +
            (isEs
                ? 'Tu gemelo digital estima que tus niveles de energía pueden bajar pronto.'
                : 'Your digital twin estimates your energy levels may soon drop.') +
            `</div>` +
            `<div style="font-size:0.78rem;color:rgba(167,139,250,0.85);margin-top:0.3rem;">` +
            (isEs ? '¿Cómo te sientes ahora?' : 'How do you feel right now?') +
            `</div></div></div>` +
            `<div style="display:flex;gap:0.55rem;">` +
            /* Botón Bien */
            `<button onclick="window.NVPredictive&&NVPredictive.respond('good')" ` +
            `style="flex:1;padding:0.6rem 0;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.82rem;` +
            `background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#34d399;">` +
            (isEs ? '😊 Bien' : '😊 Good') + `</button>` +
            /* Botón Regular */
            `<button onclick="window.NVPredictive&&NVPredictive.respond('regular')" ` +
            `style="flex:1;padding:0.6rem 0;border-radius:12px;cursor:pointer;font-weight:700;font-size:0.82rem;` +
            `background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;">` +
            (isEs ? '😐 Regular' : '😐 So-so') + `</button>` +
            `</div>` +
            /* Botón cerrar discreto */
            `<button onclick="document.getElementById('nv-wellness-alert')&&document.getElementById('nv-wellness-alert').remove()" ` +
            `style="position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(167,139,250,0.5);` +
            `font-size:1rem;cursor:pointer;line-height:1;padding:0;">✕</button>`;

        document.body.appendChild(d);
        localStorage.setItem(KEY_LAST_ALRT, Date.now().toString());
    }

    // ─────────────────────────────────────────────────────────
    // LÓGICA DE COMPROBACIÓN PERIÓDICA
    // ─────────────────────────────────────────────────────────
    function check() {
        if (!isEnabled()) return;
        if (typeof state === 'undefined' || !state.user) return;

        // Respetar el intervalo mínimo entre alertas
        const lastAlert = parseInt(localStorage.getItem(KEY_LAST_ALRT) || '0', 10);
        if (Date.now() - lastAlert < MIN_ALERT_GAP_MS) return;

        const lastMed = _getLastMedTime();
        if (!lastMed) return;

        const hoursSince = (Date.now() - lastMed.getTime()) / (1000 * 60 * 60);
        if (hoursSince >= MED_ALERT_AFTER_H) {
            _showWellnessAlert();
        }
    }

    // ─────────────────────────────────────────────────────────
    // INICIALIZACIÓN
    // ─────────────────────────────────────────────────────────
    function init() {
        // Primera comprobación a los 90s (deja que la app cargue completamente)
        setTimeout(check, 90 * 1000);
        setInterval(check, CHECK_INTERVAL_MS);
    }

    document.addEventListener('DOMContentLoaded', init);

    // API pública
    window.NVPredictive = { respond, check, isEnabled, getWellnessLog };

})();
