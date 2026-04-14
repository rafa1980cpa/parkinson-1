/**
 * NeuroTempo PRO — Módulo Firebase
 * Auth (signIn · register · passwordReset · signOut)
 * Firestore (perfil de usuario · sub-colección evaluations)
 *
 * Degradación elegante: si Firebase SDK no está cargado o las
 * credenciales son placeholder, TODAS las operaciones continúan
 * sin error vía localStorage — el usuario no nota la diferencia.
 *
 * Requiere que firebase-config.js se cargue ANTES que este archivo.
 */
(function NVFirebaseModule() {
    'use strict';

    let _auth    = null;
    let _db      = null;
    let _storage = null;
    let _ready   = false;

    // ─────────────────────────────────────────────────────────
    // INICIALIZACIÓN
    // ─────────────────────────────────────────────────────────
    function _init() {
        // 1. SDK compat de Firebase debe estar en window
        if (typeof firebase === 'undefined') {
            console.warn('[NVFirebase] SDK no detectado — modo offline activo');
            return;
        }
        // 2. Config debe estar definida y no ser placeholder
        //    Soporta tanto 'firebaseConfig' (camelCase) como 'FIREBASE_CONFIG' (legacy)
        const cfg = (typeof firebaseConfig  !== 'undefined') ? firebaseConfig
                  : (typeof FIREBASE_CONFIG !== 'undefined') ? FIREBASE_CONFIG
                  : null;
        if (!cfg || !cfg.apiKey || cfg.apiKey.startsWith('YOUR_')) {
            console.warn('[NVFirebase] Credenciales no configuradas — modo offline activo');
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(cfg);
            }
            _auth    = firebase.auth();
            _db      = firebase.firestore();
            _storage = firebase.storage ? firebase.storage() : null;
            _ready   = true;

            // Persistencia offline: Firestore guarda en caché local
            _db.enablePersistence({ synchronizeTabs: true })
               .catch(err => {
                   // Fallo silencioso — la app funciona igual, sólo sin caché offline
                   if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
                       console.warn('[NVFirebase] Persistencia offline no disponible:', err.code);
                   }
               });

            console.info('[NVFirebase] Firebase listo ✓ — Auth + Firestore activos');
        } catch (e) {
            console.error('[NVFirebase] Error de inicialización:', e);
            _ready = false;
        }
    }

    // ─────────────────────────────────────────────────────────
    // ESTADO
    // ─────────────────────────────────────────────────────────
    function isReady() { return _ready; }

    function getCurrentUid() {
        if (!_ready || !_auth.currentUser) return null;
        return _auth.currentUser.uid;
    }

    // ─────────────────────────────────────────────────────────
    // AUTH — Login
    // Lanza Error con code Firebase en caso de fallo
    // ─────────────────────────────────────────────────────────
    async function login(email, password) {
        if (!_ready) throw { code: 'firebase_unavailable' };
        const cred = await _auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    }

    // ─────────────────────────────────────────────────────────
    // AUTH — Registro
    // ─────────────────────────────────────────────────────────
    async function register(email, password) {
        if (!_ready) throw { code: 'firebase_unavailable' };
        const cred = await _auth.createUserWithEmailAndPassword(email, password);
        return cred.user;
    }

    // ─────────────────────────────────────────────────────────
    // AUTH — Recuperación de contraseña
    // El email se envía en el idioma del usuario (languageCode)
    // ─────────────────────────────────────────────────────────
    async function sendPasswordReset(email) {
        if (!_ready) throw { code: 'firebase_unavailable' };
        _auth.languageCode = (typeof state !== 'undefined' ? state.lang : 'es');
        await _auth.sendPasswordResetEmail(email);
    }

    // ─────────────────────────────────────────────────────────
    // AUTH — Cerrar sesión
    // ─────────────────────────────────────────────────────────
    async function logout() {
        if (!_ready) return;
        await _auth.signOut();
    }

    // ─────────────────────────────────────────────────────────
    // AUTH — Observer de estado
    // ─────────────────────────────────────────────────────────
    function onAuthStateChanged(callback) {
        if (!_ready) return () => {};
        return _auth.onAuthStateChanged(callback);
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Guardar / actualizar perfil de usuario
    // Colección: users/{uid}
    // Marcado como _sensitive: true (HIPAA/RGPD)
    // ─────────────────────────────────────────────────────────
    async function saveProfile(uid, profile) {
        if (!_ready || !uid) return;
        await _db.collection('users').doc(uid).set({
            name:             profile.name             || '',
            email:            profile.email            || '',
            age:              profile.age              || '',
            country:          profile.country          || '',
            emergencyContact: profile.emergencyContact || '',
            lang:             profile.lang             || 'es',
            role:             'patient',
            _sensitive:       true,
            updatedAt:        firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Leer perfil de usuario
    // ─────────────────────────────────────────────────────────
    async function loadProfile(uid) {
        if (!_ready || !uid) return null;
        const snap = await _db.collection('users').doc(uid).get();
        return snap.exists ? snap.data() : null;
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Configuración de usuario (idioma, preferencias)
    // Ruta: users/{uid}/settings  (merge para no sobreescribir otros campos)
    // ─────────────────────────────────────────────────────────
    async function saveSettings(uid, settings) {
        if (!_ready || !uid) return;
        await _db.collection('users').doc(uid).set(
            { settings: { ...settings, updatedAt: firebase.firestore.FieldValue.serverTimestamp() } },
            { merge: true }
        );
    }

    async function loadSettings(uid) {
        if (!_ready || !uid) return null;
        const snap = await _db.collection('users').doc(uid).get();
        return snap.exists ? (snap.data().settings || null) : null;
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Guardar evaluación/sesión de rehabilitación
    // Sub-colección: users/{uid}/evaluations/{sessionId}
    // ─────────────────────────────────────────────────────────
    async function saveEvaluation(uid, session) {
        if (!_ready || !uid) return;
        await _db
            .collection('users').doc(uid)
            .collection('evaluations').doc(String(session.id))
            .set({
                ...session,
                uid,
                _sensitive: true,
                savedAt:    firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Eliminar evaluación
    // ─────────────────────────────────────────────────────────
    async function deleteEvaluation(uid, sessionId) {
        if (!_ready || !uid) return;
        await _db
            .collection('users').doc(uid)
            .collection('evaluations').doc(String(sessionId))
            .delete();
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Cargar evaluaciones (últimas 100, ordenadas por fecha)
    // ─────────────────────────────────────────────────────────
    async function getEvaluations(uid) {
        if (!_ready || !uid) return [];
        const snap = await _db
            .collection('users').doc(uid)
            .collection('evaluations')
            .orderBy('ts', 'desc')
            .limit(100)
            .get();
        return snap.docs.map(d => d.data());
    }

    // ─────────────────────────────────────────────────────────
    // FIREBASE STORAGE — Subir archivo de informe médico
    // Ruta: reports/{uid}/{timestamp}_{filename}
    //
    // REGLAS STORAGE recomendadas (Firebase Console → Storage → Rules):
    //   rules_version = '2';
    //   service firebase.storage {
    //     match /b/{bucket}/o {
    //       match /reports/{uid}/{allPaths=**} {
    //         allow read, write: if request.auth != null && request.auth.uid == uid;
    //       }
    //     }
    //   }
    // ─────────────────────────────────────────────────────────
    async function uploadReportFile(uid, file) {
        if (!_ready || !uid || !_storage) return null;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const ref = _storage.ref(`reports/${uid}/${Date.now()}_${safeName}`);
        const snapshot = await ref.put(file);
        return await snapshot.ref.getDownloadURL();
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Guardar informe médico analizado por IA
    // Sub-colección: users/{uid}/medical_reports/{reportId}
    // ─────────────────────────────────────────────────────────
    async function saveMedicalReport(uid, report) {
        if (!_ready || !uid) return;
        await _db
            .collection('users').doc(uid)
            .collection('medical_reports').doc(String(report.id))
            .set({
                ...report,
                uid,
                _sensitive: true,
                savedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    // ─────────────────────────────────────────────────────────
    // FIRESTORE — Leer informes médicos (últimos 50, por fecha desc)
    // ─────────────────────────────────────────────────────────
    async function getMedicalReports(uid) {
        if (!_ready || !uid) return [];
        const snap = await _db
            .collection('users').doc(uid)
            .collection('medical_reports')
            .orderBy('savedAt', 'desc')
            .limit(50)
            .get();
        return snap.docs.map(d => d.data());
    }

    // ─────────────────────────────────────────────────────────
    // SYNC OFFLINE → ONLINE
    // Cuando la conexión vuelve, sube evaluaciones que solo están
    // en localStorage (registradas sin internet) a Firestore.
    // Firestore también replica automáticamente sus writes encolados.
    // ─────────────────────────────────────────────────────────
    async function syncPendingLocalSessions() {
        if (!_ready) return;
        const uid = getCurrentUid();
        if (!uid) return;

        // Carga las evaluaciones locales
        let local = [];
        try { local = JSON.parse(localStorage.getItem('nv_session_history') || '[]'); } catch {}
        if (!local.length) return;

        // Carga las que ya existen en Firestore
        let remoteIds = new Set();
        try {
            const snap = await _db
                .collection('users').doc(uid)
                .collection('evaluations')
                .orderBy('ts', 'desc').limit(100).get();
            snap.docs.forEach(d => remoteIds.add(d.id));
        } catch { return; } // sin red — Firestore lo reintentará solo

        // Sube únicamente las que faltan en la nube
        const missing = local.filter(s => !remoteIds.has(String(s.id)));
        if (!missing.length) return;

        console.info(`[NVFirebase] Subiendo ${missing.length} sesiones pendientes...`);
        await Promise.allSettled(
            missing.map(s => saveEvaluation(uid, s))
        );
        console.info('[NVFirebase] Sync offline→online completado ✓');
    }

    // ─────────────────────────────────────────────────────────
    // DETECTOR DE CONECTIVIDAD — activa sync al reconectar
    // ─────────────────────────────────────────────────────────
    function _wireConnectivity() {
        window.addEventListener('online', () => {
            _showConnBanner(true);
            // Dar 2 s para que Firestore reactive su canal
            setTimeout(syncPendingLocalSessions, 2000);
        });
        window.addEventListener('offline', () => {
            _showConnBanner(false);
        });
    }

    // Banner sutil de estado de red (aparece solo si hay cambio real)
    function _showConnBanner(isOnline) {
        const existing = document.getElementById('nv-conn-banner');
        if (existing) existing.remove();

        const isEs = (typeof state !== 'undefined' ? state.lang : 'es') === 'es';
        const d = document.createElement('div');
        d.id = 'nv-conn-banner';
        d.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:9999;' +
            'padding:0.45rem 1rem;text-align:center;font-size:0.78rem;font-weight:700;' +
            'transition:opacity 0.4s;' +
            (isOnline
                ? 'background:rgba(16,185,129,0.92);color:#fff;'
                : 'background:rgba(239,68,68,0.92);color:#fff;');
        d.textContent = isOnline
            ? (isEs ? '✓ Conexión restaurada — datos sincronizados' : '✓ Connection restored — data synced')
            : (isEs ? '⚠ Sin conexión — los datos se guardan localmente' : '⚠ No connection — data saved locally');
        document.body.appendChild(d);

        // El banner de "online" desaparece solo; el de "offline" permanece
        if (isOnline) {
            setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 450); }, 3500);
        }
    }

    // ─────────────────────────────────────────────────────────
    // SPOTIFY AUTH — tokens por usuario (campo spotify_auth en users/{uid})
    // ─────────────────────────────────────────────────────────
    async function saveSpotifyAuth(uid, data) {
        if (!_ready || !uid) return;
        await _db.collection('users').doc(uid)
            .set({ spotify_auth: { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true });
    }

    async function loadSpotifyAuth(uid) {
        if (!_ready || !uid) return null;
        try {
            const snap = await _db.collection('users').doc(uid).get();
            return snap.exists ? (snap.data().spotify_auth || null) : null;
        } catch { return null; }
    }

    async function clearSpotifyAuth(uid) {
        if (!_ready || !uid) return;
        await _db.collection('users').doc(uid)
            .set({ spotify_auth: firebase.firestore.FieldValue.delete() }, { merge: true }).catch(() => {});
    }

    // Inicializar al cargar
    _init();
    document.addEventListener('DOMContentLoaded', _wireConnectivity);

    // ── API pública ───────────────────────────────────────────
    window.NVFirebase = {
        isReady,
        getCurrentUid,
        // Auth
        login,
        register,
        sendPasswordReset,
        logout,
        onAuthStateChanged,
        // Firestore — Perfil y evaluaciones
        saveProfile,
        loadProfile,
        saveSettings,
        loadSettings,
        saveEvaluation,
        deleteEvaluation,
        getEvaluations,
        // Firestore — Informes médicos
        saveMedicalReport,
        getMedicalReports,
        // Storage — Archivos de informes
        uploadReportFile,
        // Sync
        syncPendingLocalSessions,
        // Spotify Auth por usuario
        saveSpotifyAuth,
        loadSpotifyAuth,
        clearSpotifyAuth,
    };

})();
