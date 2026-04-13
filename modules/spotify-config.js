/**
 * NeuroVida PRO — Configuración de Spotify
 * ─────────────────────────────────────────────────────────────
 * INSTRUCCIONES DE CONFIGURACIÓN:
 *
 *  1. Ve a https://developer.spotify.com/dashboard
 *  2. Crea una App → Anota el "Client ID"
 *  3. En "Edit Settings" → Redirect URIs → agrega la URL exacta
 *     donde está alojada tu app (ej: http://localhost:5500/index.html)
 *  4. Pega el Client ID abajo
 *
 * NOTA: Esta integración usa OAuth2 PKCE — el Client Secret
 *       NO es necesario en el frontend (flujo 100% seguro).
 *
 * SCOPES requeridos (se piden automáticamente):
 *   streaming · user-read-email · user-read-private
 *   user-read-playback-state · user-modify-playback-state
 *
 * REQUISITO DEL USUARIO FINAL:
 *   Cuenta Spotify Premium (requerida por Web Playback SDK)
 * ─────────────────────────────────────────────────────────────
 */

// ── REEMPLAZA CON TU SPOTIFY CLIENT ID ───────────────────────
window.NV_SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
