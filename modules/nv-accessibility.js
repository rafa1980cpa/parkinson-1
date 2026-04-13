/**
 * NeuroVida — Módulo 1: Botones Magnéticos (Accesibilidad Anti-Temblor)
 * Magnetic touch attraction + intelligent tremor debounce
 *
 * Activable desde Ajustes Avanzados (nv_settings.magneticButtons)
 */
(function NVAccessibility() {
    'use strict';

    const DEBOUNCE_MS = 650;   // ventana de temblor — ignora retaps dentro de este tiempo
    const MAGNET_PX   = 32;    // radio de atracción más allá del borde del botón

    // WeakMap → auto-GC cuando el elemento se elimina del DOM
    const _lastTap = new WeakMap();

    // ── Lectura de ajustes ────────────────────────────────────
    function isEnabled() {
        try {
            const s = JSON.parse(localStorage.getItem('nv_settings') || '{}');
            return s.magneticButtons !== false; // activo por defecto
        } catch { return true; }
    }

    // ─────────────────────────────────────────────────────────
    // 1. DEBOUNCE INTELIGENTE ANTI-TEMBLOR
    //    Captura en fase de captura (true) → bloquea antes de que
    //    los handlers del DOM puedan reaccionar.
    // ─────────────────────────────────────────────────────────
    document.addEventListener('click', function nvDebounce(e) {
        if (!isEnabled()) return;
        const btn = e.target.closest(
            '.action-btn, .nav-link, .btn-sos, [role="button"], button'
        );
        if (!btn) return;

        const now  = Date.now();
        const last = _lastTap.get(btn) || 0;
        if (now - last < DEBOUNCE_MS) {
            e.stopImmediatePropagation();
            e.preventDefault();
        } else {
            _lastTap.set(btn, now);
        }
    }, true /* capture phase */);

    // ─────────────────────────────────────────────────────────
    // 2. ATRACCIÓN MAGNÉTICA EN TOUCH
    //    Si el dedo está cerca del botón (dentro de MAGNET_PX),
    //    añade clase visual y dispara click al soltar.
    // ─────────────────────────────────────────────────────────
    let _snapping = null;

    function nearestMagneticBtn(touchX, touchY) {
        const btns = Array.from(document.querySelectorAll(
            '.action-btn:not([disabled]), .nav-link:not([disabled])'
        ));
        let best = null, bestDist = Infinity;

        btns.forEach(btn => {
            const r  = btn.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;
            const dist = Math.hypot(touchX - cx, touchY - cy);
            const threshold = Math.max(r.width, r.height) / 2 + MAGNET_PX;
            if (dist < threshold && dist < bestDist) {
                bestDist = dist;
                best = btn;
            }
        });
        return best;
    }

    document.addEventListener('touchmove', function nvMagnetMove(e) {
        if (!isEnabled()) return;
        const t = e.touches[0];
        if (!t) return;

        const target = nearestMagneticBtn(t.clientX, t.clientY);

        // Quitar snap del botón anterior
        if (_snapping && _snapping !== target) {
            _snapping.classList.remove('nv-magnetic-snap');
            _snapping = null;
        }
        // Aplicar snap al nuevo
        if (target && target !== _snapping) {
            target.classList.add('nv-magnetic-snap');
            _snapping = target;
        }
    }, { passive: true });

    document.addEventListener('touchend', function nvMagnetEnd(e) {
        if (!isEnabled() || !_snapping) return;
        const t = e.changedTouches[0];
        if (!t) { _clearSnap(); return; }

        const r   = _snapping.getBoundingClientRect();
        const dist = Math.hypot(
            t.clientX - (r.left + r.width  / 2),
            t.clientY - (r.top  + r.height / 2)
        );
        const threshold = Math.max(r.width, r.height) / 2 + MAGNET_PX;

        if (dist < threshold) {
            // El toque cayó cerca — atraemos y disparamos click
            const btn = _snapping;
            _clearSnap();
            // rAF para no solapar con el evento touchend nativo
            requestAnimationFrame(() => btn.click());
        } else {
            _clearSnap();
        }
    }, { passive: true });

    document.addEventListener('touchcancel', _clearSnap, { passive: true });

    function _clearSnap() {
        if (_snapping) { _snapping.classList.remove('nv-magnetic-snap'); _snapping = null; }
    }

    // API pública
    window.NVAccessibility = { isEnabled };

})();
