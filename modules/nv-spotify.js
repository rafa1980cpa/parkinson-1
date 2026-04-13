/**
 * NeuroVida PRO — Módulo de Musicoterapia (Spotify)
 * ─────────────────────────────────────────────────────────────
 * OAuth2 PKCE (sin server · sin Client Secret en frontend)
 * Web Playback SDK — reproducción in-browser (Premium requerido)
 * Audio Ducking — música -75% cuando metrónomo RAS está activo
 * Playlists Curadas — 100-120 BPM para Gait Training (Parkinson)
 *
 * Requiere: spotify-config.js cargado ANTES que este archivo
 * API pública: window.NVSpotify
 * ─────────────────────────────────────────────────────────────
 */
(function NVSpotifyModule() {
    'use strict';

    // ─────────────────────────────────────────────────────────
    // CONFIGURACIÓN
    // ─────────────────────────────────────────────────────────
    const CLIENT_ID    = window.NV_SPOTIFY_CLIENT_ID || '';
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    const SCOPES       = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
    ].join(' ');

    // ─────────────────────────────────────────────────────────
    // PLAYLISTS CURADAS — 100-120 BPM para Parkinson Gait Training
    // Basadas en playlists editoriales de Spotify de tempo constante.
    // Para verificar/reemplazar: busca en Spotify "steady tempo walk"
    // y extrae el ID de la URL: open.spotify.com/playlist/{ID}
    // ─────────────────────────────────────────────────────────
    const THERAPY_PLAYLISTS = [
        {
            id:  '37i9dQZF1DX76Wlfdnj7AP',
            es:  '🚶 Marcha Suave · 100 BPM',
            en:  '🚶 Gentle Walk · 100 BPM',
            bpm: 100,
            desc_es: 'Tempo constante para inicio de sesión',
            desc_en: 'Steady tempo for session warm-up',
        },
        {
            id:  '37i9dQZF1DXdxkgWABHf0N',
            es:  '🦶 Marcha Normal · 110 BPM',
            en:  '🦶 Normal Gait · 110 BPM',
            bpm: 110,
            desc_es: 'Cadencia óptima para sincronización neuromotora',
            desc_en: 'Optimal cadence for neuromotor synchronization',
        },
        {
            id:  '37i9dQZF1DX2A29LI7xHn1',
            es:  '💪 Rehabilitación · 120 BPM',
            en:  '💪 Rehabilitation · 120 BPM',
            bpm: 120,
            desc_es: 'Alta cadencia para sesiones intensivas',
            desc_en: 'High cadence for intensive sessions',
        },
    ];

    // ─────────────────────────────────────────────────────────
    // ESTADO INTERNO
    // ─────────────────────────────────────────────────────────
    let _player        = null;
    let _deviceId      = null;
    let _token         = null;
    let _tokenExp      = 0;
    let _refreshToken  = null;
    let _isPlaying     = false;
    let _currentTrack  = null;
    let _normalVolume  = 0.8;
    let _ducked        = false;
    let _progressTimer = null;
    let _positionMs    = 0;
    let _durationMs    = 0;

    // ─────────────────────────────────────────────────────────
    // PKCE — Generación de verifier y challenge
    // ─────────────────────────────────────────────────────────
    async function _generatePKCE() {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const verifier = Array.from(arr, b => ('0' + b.toString(16)).slice(-2)).join('');

        const encoded = new TextEncoder().encode(verifier);
        const hash    = await crypto.subtle.digest('SHA-256', encoded);
        const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        return { verifier, challenge };
    }

    // ─────────────────────────────────────────────────────────
    // OAUTH2 PKCE — Iniciar flujo
    // ─────────────────────────────────────────────────────────
    async function connect() {
        if (!CLIENT_ID || CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
            _showToast(
                typeof state !== 'undefined' && state.lang === 'es'
                    ? 'Spotify no configurado. Edita modules/spotify-config.js con tu Client ID.'
                    : 'Spotify not configured. Edit modules/spotify-config.js with your Client ID.',
                'warn'
            );
            return false;
        }
        const { verifier, challenge } = await _generatePKCE();
        sessionStorage.setItem('nv_spotify_verifier', verifier);

        const params = new URLSearchParams({
            response_type:         'code',
            client_id:             CLIENT_ID,
            scope:                 SCOPES,
            redirect_uri:          REDIRECT_URI,
            code_challenge_method: 'S256',
            code_challenge:        challenge,
        });
        window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
        return true;
    }

    // ─────────────────────────────────────────────────────────
    // OAUTH2 PKCE — Intercambio de code por tokens
    // ─────────────────────────────────────────────────────────
    async function _exchangeCode(code) {
        const verifier = sessionStorage.getItem('nv_spotify_verifier');
        if (!verifier) throw new Error('PKCE verifier not found in session');

        const body = new URLSearchParams({
            grant_type:    'authorization_code',
            code,
            redirect_uri:  REDIRECT_URI,
            client_id:     CLIENT_ID,
            code_verifier: verifier,
        });

        const res = await fetch('https://accounts.spotify.com/api/token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    body.toString(),
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error('Token exchange failed ' + res.status + ': ' + err);
        }
        return res.json();
    }

    // ─────────────────────────────────────────────────────────
    // TOKEN — Refresh
    // ─────────────────────────────────────────────────────────
    async function _refreshAccessToken() {
        if (!_refreshToken || !CLIENT_ID) return false;
        const body = new URLSearchParams({
            grant_type:    'refresh_token',
            refresh_token: _refreshToken,
            client_id:     CLIENT_ID,
        });
        try {
            const res = await fetch('https://accounts.spotify.com/api/token', {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    body.toString(),
            });
            if (!res.ok) return false;
            _applyTokenData(await res.json());
            return true;
        } catch { return false; }
    }

    function _applyTokenData(data) {
        _token        = data.access_token;
        // 1 min de margen para evitar expiración en mitad de operación
        _tokenExp     = Date.now() + (data.expires_in * 1000) - 60000;
        if (data.refresh_token) _refreshToken = data.refresh_token;
        _saveTokens();
    }

    // ─────────────────────────────────────────────────────────
    // TOKEN — Persistencia (cifrado con nvEncrypt del core)
    // ─────────────────────────────────────────────────────────
    function _saveTokens() {
        const enc = typeof nvEncrypt === 'function' ? nvEncrypt : (s) => btoa(s);
        try {
            localStorage.setItem('nv_spot_at',  enc(_token        || ''));
            localStorage.setItem('nv_spot_rt',  enc(_refreshToken || ''));
            localStorage.setItem('nv_spot_exp', String(_tokenExp));
            localStorage.setItem('nv_spot_vol', String(_normalVolume));
        } catch {}
        // Marcar conexión en Firestore (solo el estado, no el token)
        try {
            const uid = window.NVFirebase && NVFirebase.isReady && NVFirebase.isReady()
                ? NVFirebase.getCurrentUid() : null;
            if (uid) NVFirebase.saveProfile(uid, { spotifyConnected: true }).catch(() => {});
        } catch {}
    }

    function _loadTokens() {
        const dec = typeof nvDecrypt === 'function' ? nvDecrypt : (s) => { try { return atob(s); } catch { return s; } };
        try {
            _token        = dec(localStorage.getItem('nv_spot_at')  || '') || null;
            _refreshToken = dec(localStorage.getItem('nv_spot_rt')  || '') || null;
            _tokenExp     = parseInt(localStorage.getItem('nv_spot_exp') || '0');
            _normalVolume = parseFloat(localStorage.getItem('nv_spot_vol') || '0.8');
            if (!_token || _token.length < 10) { _token = null; }
            if (!_refreshToken || _refreshToken.length < 10) { _refreshToken = null; }
        } catch {}
    }

    async function _getValidToken() {
        if (_token && Date.now() < _tokenExp) return _token;
        if (_refreshToken) {
            const ok = await _refreshAccessToken();
            if (ok) return _token;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────
    // WEB PLAYBACK SDK — Carga dinámica
    // ─────────────────────────────────────────────────────────
    function _loadSDK() {
        return new Promise((resolve, reject) => {
            if (window.Spotify) { resolve(); return; }
            const prev = window.onSpotifyWebPlaybackSDKReady;
            window.onSpotifyWebPlaybackSDKReady = () => {
                if (prev) prev();
                resolve();
            };
            const s = document.createElement('script');
            s.src    = 'https://sdk.scdn.co/spotify-player.js';
            s.onerror = () => reject(new Error('Spotify SDK could not be loaded'));
            document.head.appendChild(s);
        });
    }

    async function _initPlayer() {
        if (_player) return;
        try {
            await _loadSDK();
        } catch (e) {
            console.warn('[NVSpotify] Web Playback SDK load failed:', e.message);
            return;
        }

        _player = new Spotify.Player({
            name: 'NeuroVida PRO — Terapia de Ritmo',
            getOAuthToken: async (cb) => {
                const tok = await _getValidToken();
                cb(tok || '');
            },
            volume: _normalVolume,
        });

        _player.addListener('ready', ({ device_id }) => {
            _deviceId = device_id;
            console.info('[NVSpotify] Reproductor listo ✓ — device:', device_id);
            _updateUI();
        });

        _player.addListener('not_ready', () => {
            console.warn('[NVSpotify] Dispositivo desconectado');
            _deviceId = null;
            _updateUI();
        });

        _player.addListener('player_state_changed', (playerState) => {
            if (!playerState) return;
            _isPlaying    = !playerState.paused;
            _currentTrack = playerState.track_window && playerState.track_window.current_track;
            _positionMs   = playerState.position || 0;
            _durationMs   = _currentTrack ? _currentTrack.duration_ms : 0;
            _updateUI();
            _updateProgress(_positionMs, _durationMs);
            // Arrancar o detener el timer de progreso local
            _isPlaying ? _startProgressTimer() : _stopProgressTimer();
        });

        _player.addListener('authentication_error', ({ message }) => {
            console.warn('[NVSpotify] Error de autenticación:', message);
            _token = null;
            _updateUI();
        });

        _player.addListener('account_error', ({ message }) => {
            const isEs = typeof state !== 'undefined' ? state.lang === 'es' : true;
            _showToast(
                isEs
                    ? 'Se requiere cuenta Spotify Premium para el reproductor integrado.'
                    : 'Spotify Premium account required for the integrated player.',
                'warn'
            );
            console.warn('[NVSpotify] Error de cuenta:', message);
        });

        await _player.connect();
    }

    // ─────────────────────────────────────────────────────────
    // TIMER DE PROGRESO LOCAL (entre eventos del SDK)
    // ─────────────────────────────────────────────────────────
    function _startProgressTimer() {
        _stopProgressTimer();
        const interval = 500;
        let last = Date.now();
        _progressTimer = setInterval(() => {
            const now = Date.now();
            _positionMs = Math.min(_positionMs + (now - last), _durationMs);
            last = now;
            _updateProgress(_positionMs, _durationMs);
        }, interval);
    }

    function _stopProgressTimer() {
        if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    }

    // ─────────────────────────────────────────────────────────
    // SPOTIFY WEB API — Llamadas autenticadas
    // ─────────────────────────────────────────────────────────
    async function _api(endpoint, method = 'GET', body = null) {
        const token = await _getValidToken();
        if (!token) return null;
        const opts = {
            method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type':  'application/json',
            },
        };
        if (body !== null) opts.body = JSON.stringify(body);
        try {
            const res = await fetch('https://api.spotify.com/v1' + endpoint, opts);
            if (res.status === 204) return {};
            if (!res.ok) {
                console.warn('[NVSpotify] API ' + method + ' ' + endpoint + ' → ' + res.status);
                return null;
            }
            return await res.json();
        } catch (e) {
            console.warn('[NVSpotify] API fetch error:', e.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    // CONTROLES DE REPRODUCCIÓN
    // ─────────────────────────────────────────────────────────
    async function playPlaylist(playlistId) {
        if (!_deviceId) {
            const isEs = typeof state !== 'undefined' ? state.lang === 'es' : true;
            _showToast(
                isEs ? 'Reproductor no listo. Espera unos segundos.' : 'Player not ready yet. Please wait.',
                'warn'
            );
            return;
        }
        await _api(`/me/player/play?device_id=${_deviceId}`, 'PUT', {
            context_uri: `spotify:playlist:${playlistId}`,
        });
    }

    async function togglePlay() {
        if (!_player) return;
        await _player.togglePlay().catch(() => {});
    }

    async function nextTrack() {
        if (!_player) return;
        await _player.nextTrack().catch(() => {});
    }

    async function prevTrack() {
        if (!_player) return;
        await _player.previousTrack().catch(() => {});
    }

    async function setVolume(vol) {
        _normalVolume = Math.max(0, Math.min(1, vol));
        const effective = _ducked ? _normalVolume * 0.25 : _normalVolume;
        if (_player) await _player.setVolume(effective).catch(() => {});
        localStorage.setItem('nv_spot_vol', String(_normalVolume));
    }

    // ─────────────────────────────────────────────────────────
    // AUDIO DUCKING — El metrónomo RAS es el "Master"
    // Cuando el metrónomo está activo: música baja al 25%
    // Cuando el metrónomo se detiene: música vuelve al 100%
    // ─────────────────────────────────────────────────────────
    async function duck(enable) {
        if (_ducked === enable) return;
        _ducked = enable;
        const effective = enable ? _normalVolume * 0.25 : _normalVolume;
        if (_player) await _player.setVolume(effective).catch(() => {});
        // Indicador visual de ducking
        const strip = document.getElementById('sp-duck-strip');
        if (strip) strip.style.display = (enable && _isPlaying) ? 'flex' : 'none';
    }

    // ─────────────────────────────────────────────────────────
    // DESCONEXIÓN
    // ─────────────────────────────────────────────────────────
    async function disconnect() {
        _stopProgressTimer();
        if (_player) { _player.disconnect(); _player = null; }
        _token = null; _refreshToken = null; _tokenExp = 0;
        _deviceId = null; _isPlaying = false; _currentTrack = null;
        _ducked = false;
        try {
            localStorage.removeItem('nv_spot_at');
            localStorage.removeItem('nv_spot_rt');
            localStorage.removeItem('nv_spot_exp');
        } catch {}
        _updateUI();
    }

    // ─────────────────────────────────────────────────────────
    // CALLBACK HANDLER — Procesar retorno de OAuth
    // ─────────────────────────────────────────────────────────
    async function handleCallback() {
        const url   = new URL(window.location.href);
        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            console.warn('[NVSpotify] OAuth error:', error);
            _cleanCallbackUrl();
            return false;
        }
        if (!code) return false;

        _cleanCallbackUrl();
        try {
            const data = await _exchangeCode(code);
            _applyTokenData(data);
            sessionStorage.removeItem('nv_spotify_verifier');
            await _initPlayer();
            return true;
        } catch (e) {
            console.error('[NVSpotify] Error al intercambiar código:', e.message);
            return false;
        }
    }

    function _cleanCallbackUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('error');
        url.searchParams.delete('state');
        history.replaceState({}, '', url.toString());
    }

    // ─────────────────────────────────────────────────────────
    // UI — Actualización de elementos del DOM
    // ─────────────────────────────────────────────────────────
    function _updateUI() {
        const isEs        = typeof state !== 'undefined' ? state.lang === 'es' : true;
        const isConn      = !!_token;
        const isReady     = isConn && !!_deviceId;

        // Estado de conexión
        const statusEl = document.getElementById('sp-connect-status');
        if (statusEl) {
            if (isReady) {
                statusEl.textContent = isEs ? '● Conectado' : '● Connected';
                statusEl.style.color = '#1DB954';
            } else if (isConn) {
                statusEl.textContent = isEs ? '◎ Iniciando reproductor...' : '◎ Starting player...';
                statusEl.style.color = 'rgba(148,163,184,0.7)';
            } else {
                statusEl.textContent = isEs ? '○ No conectado' : '○ Not connected';
                statusEl.style.color = 'rgba(148,163,184,0.4)';
            }
        }

        // Botón conectar / desconectar
        const connectBtn = document.getElementById('sp-connect-btn');
        if (connectBtn) {
            connectBtn.textContent = isConn
                ? (isEs ? 'Desconectar' : 'Disconnect')
                : (isEs ? 'Conectar con Spotify' : 'Connect with Spotify');
            connectBtn.style.background = isConn
                ? 'rgba(239,68,68,0.12)'
                : 'rgba(29,185,84,0.15)';
            connectBtn.style.borderColor = isConn
                ? 'rgba(239,68,68,0.35)'
                : 'rgba(29,185,84,0.4)';
            connectBtn.style.color = isConn
                ? '#ef4444'
                : '#1DB954';
        }

        // Controles del reproductor
        const controls = document.getElementById('sp-controls');
        if (controls) controls.style.display = isReady ? 'block' : 'none';

        // Playlists — visibles cuando conectado
        const pls = document.getElementById('sp-playlists-wrap');
        if (pls) pls.style.display = isConn ? 'block' : 'none';

        // Play / Pause icono
        const playBtn = document.getElementById('sp-play-btn');
        if (playBtn) {
            playBtn.innerHTML = _isPlaying
                ? `<svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
                : `<svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><polygon points="5,3 19,12 5,21"/></svg>`;
        }

        // Track info
        const trackEl  = document.getElementById('sp-track-name');
        const artistEl = document.getElementById('sp-artist-name');
        if (trackEl) {
            trackEl.textContent = _currentTrack
                ? (_currentTrack.name || '')
                : (isEs ? 'Selecciona una playlist terapéutica' : 'Select a therapy playlist');
        }
        if (artistEl) {
            artistEl.textContent = _currentTrack
                ? ((_currentTrack.artists || []).map(a => a.name).join(', '))
                : '';
        }

        // Duck strip
        const strip = document.getElementById('sp-duck-strip');
        if (strip) strip.style.display = (_ducked && _isPlaying) ? 'flex' : 'none';
    }

    function _updateProgress(posMs, durMs) {
        const bar = document.getElementById('sp-progress-fill');
        const pos = document.getElementById('sp-progress-pos');
        const dur = document.getElementById('sp-progress-dur');
        if (!bar) return;
        const pct = durMs > 0 ? ((posMs / durMs) * 100).toFixed(2) : 0;
        bar.style.width = pct + '%';
        if (pos) pos.textContent = _msToTime(posMs);
        if (dur) dur.textContent = _msToTime(durMs);
    }

    function _msToTime(ms) {
        const s = Math.floor((ms || 0) / 1000);
        return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    }

    // ─────────────────────────────────────────────────────────
    // UTILIDAD — Toast notification
    // ─────────────────────────────────────────────────────────
    function _showToast(msg, type = 'info') {
        const d = document.createElement('div');
        const colors = {
            info: { bg: 'rgba(59,130,246,0.92)', border: 'rgba(59,130,246,0.4)' },
            warn: { bg: 'rgba(245,158,11,0.92)',  border: 'rgba(245,158,11,0.4)'  },
            ok:   { bg: 'rgba(16,185,129,0.92)',  border: 'rgba(16,185,129,0.4)'  },
        };
        const c = colors[type] || colors.info;
        d.style.cssText = [
            'position:fixed', 'top:80px', 'left:50%', 'transform:translateX(-50%)',
            `background:${c.bg}`, `border:1px solid ${c.border}`,
            'color:#fff', 'padding:0.7rem 1.2rem', 'border-radius:14px',
            'z-index:9999', 'font-size:0.82rem', 'font-weight:600',
            'max-width:320px', 'text-align:center', 'line-height:1.4',
            'box-shadow:0 8px 24px rgba(0,0,0,0.5)', 'pointer-events:none',
        ].join(';');
        d.textContent = msg;
        document.body.appendChild(d);
        setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity 0.4s'; }, 2800);
        setTimeout(() => d.remove(), 3300);
    }

    // ─────────────────────────────────────────────────────────
    // STARTUP — Inicialización automática
    // ─────────────────────────────────────────────────────────
    async function _startup() {
        _loadTokens();

        // ¿Hay un code de OAuth en la URL? (retorno de Spotify)
        if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
            await handleCallback();
            return;
        }

        // ¿Hay tokens guardados válidos?
        if (_token && Date.now() < _tokenExp) {
            await _initPlayer();
            return;
        }

        // ¿Hay refresh token para renovar?
        if (_refreshToken) {
            const ok = await _refreshAccessToken();
            if (ok) await _initPlayer();
        }
    }

    // Funcionar tanto si DOMContentLoaded ya disparó como si no
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _startup);
    } else {
        _startup();
    }

    // ── API pública ───────────────────────────────────────────
    window.NVSpotify = {
        isConnected:   () => !!_token,
        isPlaying:     () => _isPlaying,
        isDeviceReady: () => !!_deviceId,
        getPlaylists:  () => THERAPY_PLAYLISTS,
        updateUI:      _updateUI,
        // Acciones
        connect,
        disconnect,
        togglePlay,
        nextTrack,
        prevTrack,
        playPlaylist,
        setVolume,
        // Integración metrónomo
        duck,
    };

})();
