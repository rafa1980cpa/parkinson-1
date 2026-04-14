'use strict';
// NeuroVida PRO — Service Worker v2
// Notificaciones con acciones + caché offline (Cache-First shell)

const CACHE_NAME  = 'neurovida-v1';
const SHELL_URLS  = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/logoapp.png',
    '/modules/nv-firebase.js',
    '/modules/nv-reports.js',
    '/modules/nv-history.js',
    '/modules/nv-accessibility.js',
    '/modules/nv-freezing.js',
    '/modules/nv-voice-insights.js',
    '/modules/nv-predictive.js',
    '/modules/firebase-config.js',
];

// ── Install: precarga el shell ────────────────────────────────
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: borra cachés antiguas ──────────────────────────
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: Cache-First para shell, Network-First para el resto ─
self.addEventListener('fetch', e => {
    const { request } = e;
    const url = new URL(request.url);

    // Solo interceptar peticiones del mismo origen (no Firebase, CDN, etc.)
    if (url.origin !== self.location.origin) return;
    if (request.method !== 'GET') return;

    e.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;                          // shell → inmediato
            return fetch(request).then(res => {
                // Cachear respuestas válidas del shell
                if (res && res.status === 200 && SHELL_URLS.some(u => url.pathname === u || url.pathname.endsWith(u))) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(request, clone));
                }
                return res;
            }).catch(() => caches.match('/index.html')); // offline fallback → app shell
        })
    );
});

// ── Notificaciones con acciones ───────────────────────────────
function _postToApp(e, msg) {
    e.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then(cs => {
                if (!cs.length) return self.clients.openWindow('/');
                const focused = cs.find(c => c.focused) || cs[0];
                return focused.postMessage(msg);
            })
    );
}

self.addEventListener('notificationclick', e => {
    const { action, notification } = e;
    const { medName, medTime }     = notification.data || {};
    notification.close();

    if (action === 'done') {
        _postToApp(e, { type: 'MED_TAKEN',  medName, medTime });
    } else if (action === 'snooze') {
        _postToApp(e, { type: 'MED_SNOOZE', medName, medTime, minutes: 5 });
    } else {
        e.waitUntil(
            self.clients
                .matchAll({ type: 'window', includeUncontrolled: true })
                .then(cs => {
                    const c = cs.find(c => 'focus' in c);
                    return c ? c.focus() : self.clients.openWindow('/');
                })
        );
    }
});
