/**
 * NeuroTempo — Módulo: Historial de Sesiones de Rehabilitación
 * Almacena, consulta y resume cada prueba completada.
 *
 * Schema de entrada:
 *   { id, ts, type, metrics, phase, lang }
 *
 * Tipos soportados (extensible):
 *   'tapping' | 'drawing' | 'vocal' | 'breathing'
 */
(function NVHistory() {
    'use strict';

    const STORAGE_KEY  = 'nv_session_history';
    const MAX_ENTRIES  = 300;   // ~10 meses de uso diario intensivo

    // ── Metadatos visuales por tipo de prueba ─────────────────
    const TEST_META = {
        tapping:   { icon: 'hand',      color: '#3b82f6', labelEs: 'Test de Temblor',     labelEn: 'Tremor Test'     },
        drawing:   { icon: 'edit-3',    color: '#8b5cf6', labelEs: 'Test de Dibujo',      labelEn: 'Drawing Test'    },
        vocal:     { icon: 'mic',       color: '#00F2FF', labelEs: 'Evaluación Vocal',     labelEn: 'Vocal Test'      },
        breathing: { icon: 'wind',      color: '#10b981', labelEs: 'Respiración Guiada',   labelEn: 'Guided Breathing'}
    };

    // ── Persistencia ──────────────────────────────────────────
    function _load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }

    function _persist(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_ENTRIES)));
    }

    // ─────────────────────────────────────────────────────────
    // GUARDAR SESIÓN
    // type  : string  — tipo de prueba
    // metrics: object — datos medidos (específicos del test)
    // ─────────────────────────────────────────────────────────
    function save(type, metrics) {
        const sessions = _load();
        const entry = {
            id:      Date.now(),
            ts:      Date.now(),
            type,
            metrics: { ...metrics },
            phase:   (typeof state !== 'undefined' ? state.patientStatus : 'ON'),
            lang:    (typeof state !== 'undefined' ? state.lang : 'es')
        };
        sessions.unshift(entry);
        _persist(sessions);

        // Sincronizar con estado en memoria si está disponible
        if (typeof state !== 'undefined') state.sessionHistory = sessions;

        // Sincronizar evaluación con Firestore (async, no bloqueante)
        const uid = (typeof state !== 'undefined' && state.user) ? state.user.uid : null;
        if (uid && window.NVFirebase && NVFirebase.isReady()) {
            NVFirebase.saveEvaluation(uid, entry).catch(err =>
                console.warn('[NVHistory] Sync Firestore fallido:', err)
            );
        }

        // Feedback visual de guardado
        _showSavedBadge();

        return entry;
    }

    // ─────────────────────────────────────────────────────────
    // LECTURA
    // ─────────────────────────────────────────────────────────
    function getAll()          { return _load(); }
    function getByType(type)   { return _load().filter(s => s.type === type); }

    function deleteById(id) {
        const sessions = _load().filter(s => s.id !== id);
        _persist(sessions);
        if (typeof state !== 'undefined') state.sessionHistory = sessions;

        // Eliminar de Firestore (async, no bloqueante)
        const uid = (typeof state !== 'undefined' && state.user) ? state.user.uid : null;
        if (uid && window.NVFirebase && NVFirebase.isReady()) {
            NVFirebase.deleteEvaluation(uid, id).catch(err =>
                console.warn('[NVHistory] Delete Firestore fallido:', err)
            );
        }
    }

    function clearAll() {
        localStorage.removeItem(STORAGE_KEY);
        if (typeof state !== 'undefined') state.sessionHistory = [];
    }

    // ─────────────────────────────────────────────────────────
    // RESUMEN SEMANAL
    // Devuelve métricas de los últimos 7 días vs los 7 anteriores
    // ─────────────────────────────────────────────────────────
    function getWeeklySummary() {
        const sessions = _load();
        const now       = Date.now();
        const weekAgo   = now - 7  * 24 * 60 * 60 * 1000;
        const twoWkAgo  = now - 14 * 24 * 60 * 60 * 1000;

        const thisWeek = sessions.filter(s => s.ts > weekAgo);
        const lastWeek = sessions.filter(s => s.ts > twoWkAgo && s.ts <= weekAgo);

        return Object.keys(TEST_META).map(type => {
            const tw = thisWeek.filter(s => s.type === type);
            const lw = lastWeek.filter(s => s.type === type);

            // Tendencia de métrica principal (positivo = mejora)
            let trend = null;
            if (type === 'drawing' && tw.length >= 2) {
                trend = (tw[0].metrics.stability || 0) - (tw[tw.length - 1].metrics.stability || 0);
            } else if (type === 'tapping' && tw.length >= 2) {
                // Jitter menor = mejor
                trend = (tw[tw.length - 1].metrics.jitter || 0) - (tw[0].metrics.jitter || 0);
            } else if (type === 'vocal' && tw.length >= 2) {
                trend = (tw[0].metrics.stability || 0) - (tw[tw.length - 1].metrics.stability || 0);
            }

            return {
                type,
                count:         tw.length,
                lastWeekCount: lw.length,
                trend          // número: positivo = mejora, negativo = empeora, null = sin datos
            };
        });
    }

    // ─────────────────────────────────────────────────────────
    // BADGE ANIMADO DE CONFIRMACIÓN
    // ─────────────────────────────────────────────────────────
    function _showSavedBadge() {
        const isEs  = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';
        const badge = document.createElement('div');
        badge.className = 'nv-saved-badge';
        badge.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                  stroke-linejoin="round" style="flex-shrink:0;">
                <polyline points="20 6 9 17 4 12"></polyline>
             </svg>` +
            `<span>${isEs ? 'Sesión guardada' : 'Session saved'}</span>`;
        document.body.appendChild(badge);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => badge.classList.add('show'));
        });
        setTimeout(() => {
            badge.classList.add('hide');
            setTimeout(() => badge.parentNode && badge.remove(), 420);
        }, 2400);
    }

    // ─────────────────────────────────────────────────────────
    // FORMATEAR TIMESTAMP → texto legible
    // ─────────────────────────────────────────────────────────
    function formatTs(ts, lang) {
        const d  = new Date(ts);
        const isEs = lang === 'es';
        const days = isEs
            ? ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
            : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const day   = days[d.getDay()];
        const date  = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hh    = String(d.getHours()).padStart(2, '0');
        const mm    = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${date}/${month} · ${hh}:${mm}`;
    }

    // ─────────────────────────────────────────────────────────
    // RENDERIZAR CARD DE SESIÓN (HTML string, para usar en vistas)
    // ─────────────────────────────────────────────────────────
    function renderSessionCard(session, lang) {
        const meta  = TEST_META[session.type] || TEST_META.vocal;
        const isEs  = lang === 'es';
        const label = isEs ? meta.labelEs : meta.labelEn;
        const ts    = formatTs(session.ts, lang);
        const m     = session.metrics;
        const phase = session.phase || 'ON';
        const phaseColor = phase === 'ON' ? '#10b981' : '#ef4444';

        // Métrica principal según tipo
        let mainMetric = '';
        if (session.type === 'tapping') {
            mainMetric = `<span style="color:var(--accent-cyan);font-size:1.4rem;font-weight:900;">${m.bpm || '–'}</span>
                          <span style="font-size:0.72rem;opacity:0.6;margin-left:3px;">BPM</span>
                          ${m.jitter !== undefined ? `<span style="margin-left:10px;color:${m.jitter < 25 ? '#10b981' : m.jitter < 45 ? '#f59e0b' : '#ef4444'};font-size:1.2rem;font-weight:700;">${m.jitter}%</span><span style="font-size:0.7rem;opacity:0.6;margin-left:2px;">jitter</span>` : ''}`;
        } else if (session.type === 'drawing') {
            mainMetric = `<span style="color:#8b5cf6;font-size:1.4rem;font-weight:900;">${m.stability || '–'}%</span>
                          <span style="font-size:0.72rem;opacity:0.6;margin-left:3px;">${isEs ? 'estabilidad' : 'stability'}</span>`;
        } else if (session.type === 'vocal') {
            mainMetric = `<span style="color:var(--accent-cyan);font-size:1.4rem;font-weight:900;">${m.stability || '–'}%</span>
                          <span style="font-size:0.72rem;opacity:0.6;margin-left:3px;">${isEs ? 'estabilidad' : 'stability'}</span>`;
        } else if (session.type === 'breathing') {
            mainMetric = `<span style="color:var(--primary-green);font-size:1.4rem;font-weight:900;">${m.cycles || '–'}</span>
                          <span style="font-size:0.72rem;opacity:0.6;margin-left:3px;">${isEs ? 'ciclos' : 'cycles'}</span>
                          ${m.duration ? `<span style="margin-left:8px;font-size:0.78rem;color:rgba(148,163,184,0.6);">${m.duration}s</span>` : ''}`;
        }

        return `
        <div class="nv-session-card" data-id="${session.id}">
            <div class="nv-sc-header">
                <div style="display:flex;align-items:center;gap:0.55rem;">
                    <div class="nv-sc-icon" style="background:${meta.color}18;border-color:${meta.color}30;">
                        <i data-lucide="${meta.icon}" style="width:15px;height:15px;color:${meta.color};"></i>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:0.85rem;">${label}</div>
                        <div style="font-size:0.72rem;color:rgba(148,163,184,0.5);margin-top:1px;">${ts}</div>
                    </div>
                </div>
                <span style="font-size:0.68rem;font-weight:700;padding:3px 9px;border-radius:10px;
                             background:${phaseColor}14;border:1px solid ${phaseColor}30;color:${phaseColor};">
                    ${isEs ? 'FASE' : 'PHASE'} ${phase}
                </span>
            </div>
            <div class="nv-sc-metrics">
                ${mainMetric}
            </div>
            <button class="nv-sc-delete" onclick="nvHistoryDelete(${session.id})"
                    title="${isEs ? 'Eliminar' : 'Delete'}">
                <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
            </button>
        </div>`;
    }

    // API pública
    window.NVHistory = {
        save, getAll, getByType, deleteById, clearAll,
        getWeeklySummary, renderSessionCard, formatTs, TEST_META
    };

})();
