/**
 * NeuroVida — Módulo 2: Pulso Sónico de Rescate
 * Detección de congelación de marcha (Freezing of Gait - FOG)
 * vía DeviceMotion + Web Audio API terapéutico (80 Hz, 120 BPM)
 *
 * Activable desde Ajustes Avanzados (nv_settings.freezeDetection)
 */
(function NVFreezing() {
    'use strict';

    // ── Parámetros terapéuticos ───────────────────────────────
    const STILL_DELTA_THRESHOLD = 0.5;    // m/s² cambio entre frames → "inmóvil"
    const STILL_DURATION_MS     = 3000;   // ms de inmovilidad antes de activar rescate
    const RESCUE_FREQ_HZ        = 80;     // tono grave terapéutico (80 Hz)
    const RESCUE_BPM            = 120;    // cadencia terapéutica de marcha
    const RESCUE_PULSE_COUNT    = 16;     // 16 pulsos = ~8 segundos a 120 BPM

    // ── Estado interno ────────────────────────────────────────
    let _freezeTimer  = null;
    let _rescueActive = false;
    let _rescueCtx    = null;
    let _prevMag      = null;
    let _motionWired  = false;

    // ── Lectura de ajustes ────────────────────────────────────
    function isEnabled() {
        try {
            const s = JSON.parse(localStorage.getItem('nv_settings') || '{}');
            return s.freezeDetection !== false; // activo por defecto
        } catch { return true; }
    }

    function isMetronomeOn() {
        // Lee el estado global del metrónomo de app.js
        return typeof state !== 'undefined' && state.metronomeActive === true;
    }

    // ─────────────────────────────────────────────────────────
    // PARAR RESCATE
    // ─────────────────────────────────────────────────────────
    function stopRescue() {
        _rescueActive = false;
        if (_rescueCtx) {
            try { _rescueCtx.close(); } catch (_) {}
            _rescueCtx = null;
        }
        // Restaurar volumen normal del metrónomo
        if (window.NVMetronome) NVMetronome.setRescueMode(false);
        const banner = document.getElementById('nv-freeze-banner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 400);
        }
    }

    // ─────────────────────────────────────────────────────────
    // ACTIVAR PULSO DE RESCATE
    // Genera pulsos de 80 Hz a 120 BPM — tono grave y marcado
    // ─────────────────────────────────────────────────────────
    function _flashScreen() {
        const flash = document.createElement('div');
        flash.style.cssText =
            'position:fixed;inset:0;z-index:9000;pointer-events:none;' +
            'background:rgba(37,99,235,0.22);animation:nvRescueFlash 0.55s ease-out forwards;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 560);
    }

    function triggerRescue() {
        if (_rescueActive) return;
        _rescueActive = true;

        // Flash visual + boost de volumen del metrónomo
        _flashScreen();
        if (window.NVMetronome) NVMetronome.setRescueMode(true);

        try {
            _rescueCtx = new (window.AudioContext || window.webkitAudioContext)();
            const interval = (60 / RESCUE_BPM) * 1000; // ms entre pulsos
            let count = 0;

            const pulse = () => {
                if (!_rescueActive || count >= RESCUE_PULSE_COUNT) {
                    stopRescue();
                    return;
                }
                // Oscilador tipo sine — grave, penetrante pero no agresivo
                const osc  = _rescueCtx.createOscillator();
                const gain = _rescueCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = RESCUE_FREQ_HZ;
                gain.gain.setValueAtTime(0.92, _rescueCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, _rescueCtx.currentTime + 0.38);
                osc.connect(gain);
                gain.connect(_rescueCtx.destination);
                osc.start();
                osc.stop(_rescueCtx.currentTime + 0.4);
                count++;
                setTimeout(pulse, interval);
            };

            pulse();
        } catch (e) {
            console.warn('[NVFreezing] AudioContext error:', e);
        }

        _showBanner();
    }

    // ─────────────────────────────────────────────────────────
    // BANNER DE RESCATE
    // ─────────────────────────────────────────────────────────
    function _showBanner() {
        if (document.getElementById('nv-freeze-banner')) return;
        const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';

        const d = document.createElement('div');
        d.id = 'nv-freeze-banner';
        d.style.cssText =
            'position:fixed;top:78px;left:50%;transform:translateX(-50%);z-index:5500;' +
            'background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;' +
            'padding:1.1rem 1.4rem;border-radius:20px;max-width:340px;width:92%;' +
            'box-shadow:0 8px 35px rgba(37,99,235,0.6);text-align:center;' +
            'transition:opacity 0.4s;animation:fadeIn 0.4s ease;';

        d.innerHTML =
            `<div style="font-size:1.05rem;font-weight:700;margin-bottom:0.4rem;">` +
            `🎵 ${isEs ? 'Pulso de Rescate Activo' : 'Rescue Pulse Active'}</div>` +
            `<div style="font-size:0.82rem;opacity:0.9;line-height:1.5;font-weight:400;">` +
            (isEs
                ? 'Se ha detectado inmovilidad. Sincroniza tu paso con el ritmo.<br>Levanta el pie en cada pulso.'
                : 'Stillness detected. Sync your steps with the rhythm.<br>Lift your foot on each pulse.') +
            `</div>` +
            `<button onclick="window.NVFreezing&&NVFreezing.stopRescue()" ` +
            `style="margin-top:0.8rem;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);` +
            `color:white;padding:0.45rem 1.4rem;border-radius:12px;cursor:pointer;` +
            `font-weight:700;font-size:0.88rem;">OK</button>`;

        document.body.appendChild(d);
    }

    // ─────────────────────────────────────────────────────────
    // MANEJADOR DE MOTION EVENT
    // ─────────────────────────────────────────────────────────
    function _handleMotion(ev) {
        if (!isEnabled() || !isMetronomeOn()) {
            // Si el metrónomo está apagado, cancelar cualquier timer pendiente
            clearTimeout(_freezeTimer);
            _freezeTimer = null;
            return;
        }

        const acc = ev.accelerationIncludingGravity || ev.acceleration;
        if (!acc) return;

        // Magnitud del vector de aceleración
        const mag = Math.sqrt(
            Math.pow(acc.x || 0, 2) +
            Math.pow(acc.y || 0, 2) +
            Math.pow(acc.z || 0, 2)
        );

        if (_prevMag === null) { _prevMag = mag; return; }
        const delta = Math.abs(mag - _prevMag);
        _prevMag = mag;

        if (delta < STILL_DELTA_THRESHOLD) {
            // Cuerpo quieto — iniciar contador de congelación
            if (!_freezeTimer && !_rescueActive) {
                _freezeTimer = setTimeout(() => {
                    triggerRescue();
                    _freezeTimer = null;
                }, STILL_DURATION_MS);
            }
        } else {
            // Movimiento detectado — cancelar timer y parar rescate si activo
            clearTimeout(_freezeTimer);
            _freezeTimer = null;
            if (_rescueActive) stopRescue();
        }
    }

    // ─────────────────────────────────────────────────────────
    // INICIALIZACIÓN (gestión de permisos iOS 13+)
    // ─────────────────────────────────────────────────────────
    function _wire() {
        if (_motionWired) return;
        _motionWired = true;
        window.addEventListener('devicemotion', _handleMotion, { passive: true });
    }

    function init() {
        if (typeof DeviceMotionEvent === 'undefined') return; // no soportado

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS 13+ requiere permiso explícito — solicitar en primer tap del usuario
            document.addEventListener('click', function _askOnce() {
                DeviceMotionEvent.requestPermission()
                    .then(perm => { if (perm === 'granted') _wire(); })
                    .catch(() => {});
                document.removeEventListener('click', _askOnce);
            }, { once: true });
        } else {
            _wire();
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    // API pública
    window.NVFreezing = { stopRescue, triggerRescue, isEnabled };

})();
