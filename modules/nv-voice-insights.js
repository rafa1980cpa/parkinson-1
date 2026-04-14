/**
 * NeuroTempo — Módulo 3: Análisis de Prosodia — Detección de Hipofonía
 * Compara RMS de amplitud vocal al inicio vs final de la grabación.
 * Si la caída supera el 30%, muestra aviso motivacional clínico.
 *
 * Activable desde Ajustes Avanzados (nv_settings.voiceInsights)
 * Hooks requeridos en app.js: NVVoiceInsights.onStart(analyser) / onStop()
 */
(function NVVoiceInsights() {
    'use strict';

    // ── Parámetros de análisis ────────────────────────────────
    const DROP_THRESHOLD   = 0.30;   // 30% de caída de amplitud = hipofonía
    const SAMPLE_WINDOW_MS = 700;    // ventana de muestreo al inicio y al final
    const SAMPLE_RATE_MS   = 80;     // frecuencia de muestreo durante grabación

    // ── Estado interno ────────────────────────────────────────
    let _analyser   = null;
    let _samples    = [];         // { t: timestamp(ms), rms: number }
    let _intervalId = null;
    let _startedAt  = 0;

    // ── Lectura de ajustes ────────────────────────────────────
    function isEnabled() {
        try {
            const s = JSON.parse(localStorage.getItem('nv_settings') || '{}');
            return s.voiceInsights !== false; // activo por defecto
        } catch { return true; }
    }

    // ─────────────────────────────────────────────────────────
    // RMS (Root Mean Square) — medida real de potencia sonora
    // ─────────────────────────────────────────────────────────
    function _getRMS() {
        if (!_analyser) return 0;
        const buf = new Float32Array(_analyser.fftSize);
        _analyser.getFloatTimeDomainData(buf);
        const sumSq = buf.reduce((acc, v) => acc + v * v, 0);
        return Math.sqrt(sumSq / buf.length);
    }

    // ─────────────────────────────────────────────────────────
    // onStart — llamado por app.js al iniciar grabación
    // ─────────────────────────────────────────────────────────
    function onStart(analyserNode) {
        if (!isEnabled() || !analyserNode) return;
        _analyser   = analyserNode;
        _samples    = [];
        _startedAt  = Date.now();

        _intervalId = setInterval(() => {
            const rms = _getRMS();
            if (rms > 0.0001) {   // filtrar silencio absoluto
                _samples.push({ t: Date.now(), rms });
            }
        }, SAMPLE_RATE_MS);
    }

    // ─────────────────────────────────────────────────────────
    // onStop — llamado por app.js al detener grabación
    // ─────────────────────────────────────────────────────────
    function onStop() {
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
        if (!isEnabled() || _samples.length < 6) return; // grabación demasiado corta

        const now      = Date.now();
        const first_t  = _samples[0].t;

        // Muestras del inicio (primera ventana)
        const startSamples = _samples.filter(s => s.t <= first_t + SAMPLE_WINDOW_MS);
        // Muestras del final (última ventana antes del stop)
        const endSamples   = _samples.filter(s => s.t >= now - SAMPLE_WINDOW_MS);

        if (!startSamples.length || !endSamples.length) return;

        const avg = arr => arr.reduce((a, b) => a + b.rms, 0) / arr.length;
        const startRMS = avg(startSamples);
        const endRMS   = avg(endSamples);

        if (startRMS < 0.002) return;  // voz demasiado suave para analizar fiablemente

        const drop = (startRMS - endRMS) / startRMS;

        if (drop > DROP_THRESHOLD) {
            const dropPct = Math.min(Math.round(drop * 100), 99);
            // Pequeño delay para que el toast de "grabación guardada" no se solape
            setTimeout(() => _showHypophoniaTip(dropPct), 900);
        }

        // Limpiar
        _analyser = null;
        _samples  = [];
    }

    // ─────────────────────────────────────────────────────────
    // MODAL DE HIPOFONÍA — motivacional, nunca alarmista
    // ─────────────────────────────────────────────────────────
    function _showHypophoniaTip(dropPct) {
        const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';

        const title = isEs ? '💡 Consejo de Prosodia' : '💡 Prosody Tip';
        const msg   = isEs
            ? `Tu voz perdió un ${dropPct}% de intensidad al final de la frase.\n\n¡Intenta proyectar un poco más en el próximo ejercicio — imagina hablar con alguien al otro lado de la sala!`
            : `Your voice lost ${dropPct}% of intensity towards the end.\n\nTry projecting more in the next exercise — imagine speaking to someone across the room!`;

        if (typeof showModal === 'function') {
            showModal(msg, {
                title,
                cancelText: isEs ? 'Entendido ✓' : 'Got it ✓'
            });
        }
    }

    // API pública — usada desde app.js
    window.NVVoiceInsights = { onStart, onStop, isEnabled };

})();
