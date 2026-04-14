/**
 * NeuroTempo PRO — Configuración de Firebase
 * ─────────────────────────────────────────────────────────────
 * INSTRUCCIONES DE CONFIGURACIÓN:
 *
 *  1. Ve a https://console.firebase.google.com
 *  2. Crea un proyecto o selecciona el existente (ej: "neurotempo-pro")
 *  3. Project Settings → General → Tus apps → Agregar app web (</>)
 *  4. Copia el objeto firebaseConfig que te muestra Google
 *  5. Pega los valores reales aquí reemplazando cada "YOUR_*"
 *
 * SERVICIOS NECESARIOS (habilitar en Firebase Console):
 *  · Authentication → Email/Password (activar)
 *  · Firestore Database → Crear en modo producción
 *
 * REGLAS FIRESTORE recomendadas (Firestore → Rules):
 * ─────────────────────────────────────────────────────────────
 *  rules_version = '2';
 *  service cloud.firestore {
 *    match /databases/{database}/documents {
 *      // Sólo el usuario autenticado puede leer/escribir sus propios datos
 *      match /users/{uid} {
 *        allow read, write: if request.auth != null && request.auth.uid == uid;
 *        match /evaluations/{evalId} {
 *          allow read, write: if request.auth != null && request.auth.uid == uid;
 *        }
 *      }
 *    }
 *  }
 * ─────────────────────────────────────────────────────────────
 */

// ── REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE ──
const firebaseConfig = {
  apiKey: "AIzaSyDWQD7BqwuZW4yOMN062Qbj0hTndkdN8oY",
  authDomain: "neurovida-1e1d1.firebaseapp.com",
  projectId: "neurovida-1e1d1",
  storageBucket: "neurovida-1e1d1.firebasestorage.app",
  messagingSenderId: "240406676028",
  appId: "1:240406676028:web:28673cf3b7e2eb057af939",
  measurementId: "G-NYZ3QDGWR3"
};

