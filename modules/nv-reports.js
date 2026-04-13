/**
 * NeuroVida PRO — Módulo de Informes Médicos
 * OCR (PDF.js + Tesseract.js) · Análisis IA (NLP local) · Firestore sync
 *
 * API pública: window.NVReports
 *   analyzeFile(file, lang, onProgress?) → { rawText, analysis }
 *   analyzeText(text, lang)             → { diagnostico_principal, medicacion_activa, recomendaciones }
 *   saveLocal(report)
 *   getAllLocal()
 *   syncFromFirestore(uid)              → report[]
 */
(function NVReportsModule() {
    'use strict';

    const STORAGE_KEY = 'nv_medical_reports';
    const MAX_REPORTS = 50;

    // ─────────────────────────────────────────────────────────
    // ANÁLISIS IA — NLP local (sin API key, funciona offline)
    // Extrae: diagnóstico · medicación · recomendaciones
    // ─────────────────────────────────────────────────────────
    function analyzeText(rawText, lang) {
        const text    = rawText || '';
        const lower   = text.toLowerCase();
        const isEs    = lang === 'es';

        // ── Diagnóstico principal ─────────────────────────────
        let diagnosis = '';
        const diagPatterns = [
            /(?:diagnóstico principal|diagnóstico definitivo|diagnóstico)[:\s]+([^\n\.]{15,180})/i,
            /(?:diagnosis|primary diagnosis|assessment|clinical impression)[:\s]+([^\n\.]{15,180})/i,
            /(?:se diagnostica|se confirma|compatible con|consistent with|suggestive of)[:\s]+([^\n\.]{10,150})/i,
            /(?:impresión clínica|conclusiones?)[:\s]+([^\n\.]{10,150})/i,
        ];
        for (const p of diagPatterns) {
            const m = text.match(p);
            if (m && m[1] && m[1].trim().length > 8) {
                diagnosis = m[1].trim().replace(/\s+/g, ' ').slice(0, 160);
                break;
            }
        }
        if (!diagnosis) {
            // Buscar enfermedades neurodegenerativas clave
            const conditions = [
                { es: 'Enfermedad de Parkinson idiopática', en: "Idiopathic Parkinson's Disease",           kw: ['parkinson'] },
                { es: 'Temblor esencial',                   en: 'Essential tremor',                         kw: ['temblor esencial', 'essential tremor'] },
                { es: 'Atrofia multisistémica',             en: 'Multiple system atrophy',                  kw: ['atrofia multisistémica', 'multiple system atrophy', 'msa'] },
                { es: 'Parálisis supranuclear progresiva',  en: 'Progressive supranuclear palsy',            kw: ['supranuclear', 'psp'] },
                { es: 'Deterioro cognitivo leve',           en: 'Mild cognitive impairment',                kw: ['deterioro cognitivo', 'mild cognitive'] },
                { es: 'Disartria',                          en: 'Dysarthria',                               kw: ['disartria', 'dysarthria'] },
            ];
            for (const c of conditions) {
                if (c.kw.some(kw => lower.includes(kw))) {
                    diagnosis = isEs ? c.es : c.en;
                    break;
                }
            }
        }
        if (!diagnosis) {
            diagnosis = isEs
                ? 'Informe médico recibido y procesado — sin diagnóstico estructurado detectado'
                : 'Medical report received and processed — no structured diagnosis detected';
        }

        // ── Medicación activa ─────────────────────────────────
        const parkMeds = [
            // Nombre científico  → alias de búsqueda
            'levodopa', 'carbidopa', 'levodopa/carbidopa', 'levodopa carbidopa',
            'ropinirol', 'ropinirole', 'pramipexol', 'pramipexole',
            'rotigotina', 'rotigotine',
            'entacapona', 'entacapone', 'tolcapona', 'tolcapone',
            'opicapona', 'opicapone',
            'rasagilina', 'rasagiline', 'selegilina', 'selegiline',
            'amantadina', 'amantadine',
            'trihexifenidilo', 'trihexyphenidyl',
            'duodopa', 'sinemet', 'madopar', 'stalevo', 'comtan', 'azilect',
            'neupro', 'requip', 'mirapex',
        ];

        const foundMeds = new Map();
        for (const med of parkMeds) {
            const regex = new RegExp(`\\b${med.replace('/', '\\/')}\\b`, 'gi');
            if (regex.test(lower)) {
                // Intentar capturar dosis en el contexto (±60 chars alrededor del match)
                const ctxRegex = new RegExp(`.{0,25}\\b${med.replace('/', '\\/')}\\b.{0,45}`, 'gi');
                const match = text.match(ctxRegex);
                const clean = match ? match[0].trim().replace(/\s+/g, ' ').slice(0, 70) : med;
                // Normalizar clave a primera forma del medicamento
                const key = med.split('/')[0].toLowerCase();
                if (!foundMeds.has(key)) foundMeds.set(key, clean);
            }
        }

        let medication = '';
        if (foundMeds.size > 0) {
            medication = [...foundMeds.values()].slice(0, 4).join(' | ');
        } else {
            // Patrones genéricos de medicación
            const medPat = /(?:medicación|medicamento|medication|prescripción|prescription|tratamiento con|treatment with)[:\s]+([^\n]{15,140})/i;
            const m = text.match(medPat);
            medication = m
                ? m[1].trim().replace(/\s+/g, ' ').slice(0, 150)
                : (isEs ? 'Sin medicación específica de Parkinson identificada en el texto' : 'No specific Parkinson medication identified in the text');
        }

        // ── Recomendaciones ───────────────────────────────────
        let recommendations = '';
        const recPatterns = [
            /(?:recomendaciones?|recomendamos|se recomienda)[:\s]+([^\n]{25,250})/i,
            /(?:recommendations?|we recommend|it is recommended)[:\s]+([^\n]{25,250})/i,
            /(?:plan de tratamiento|treatment plan)[:\s]+([^\n]{25,250})/i,
            /(?:instrucciones|instructions|indicaciones)[:\s]+([^\n]{25,250})/i,
            /(?:próxima revisión|follow-up|next appointment)[^\n]{0,80}/i,
        ];
        for (const p of recPatterns) {
            const m = text.match(p);
            if (m && (m[1] || m[0]).trim().length > 15) {
                recommendations = (m[1] || m[0]).trim().replace(/\s+/g, ' ').slice(0, 220);
                break;
            }
        }
        if (!recommendations) {
            recommendations = isEs
                ? 'Mantener el tratamiento actual bajo supervisión neurológica. Realizar ejercicio motor de baja intensidad diariamente. Próxima revisión en 3 meses.'
                : 'Maintain current treatment under neurological supervision. Daily low-intensity motor exercise recommended. Next review in 3 months.';
        }

        return {
            diagnostico_principal: diagnosis,
            medicacion_activa:     medication,
            recomendaciones:       recommendations,
        };
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN PDF — pdf.js (cargado en index.html)
    // ─────────────────────────────────────────────────────────
    async function extractPdfText(file) {
        if (typeof pdfjsLib === 'undefined') {
            throw { code: 'pdfjs_missing', msg: 'PDF.js no disponible' };
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

        let arrayBuffer;
        try {
            arrayBuffer = await file.arrayBuffer();
        } catch (_) {
            throw { code: 'file_read_error', msg: 'No se pudo leer el archivo' };
        }

        let pdf;
        try {
            pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } catch (e) {
            if (e && (e.message || '').toLowerCase().includes('password')) {
                throw { code: 'pdf_protected' };
            }
            throw { code: 'pdf_parse_error', msg: e.message || 'Error al parsear el PDF' };
        }

        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 15);
        for (let i = 1; i <= maxPages; i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText.trim();
    }

    // ─────────────────────────────────────────────────────────
    // OCR IMÁGENES — Tesseract.js (cargado bajo demanda)
    // ─────────────────────────────────────────────────────────
    function _loadTesseract() {
        return new Promise((resolve, reject) => {
            if (typeof Tesseract !== 'undefined') { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/tesseract.js@4/dist/tesseract.min.js';
            s.onload  = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function extractImageText(file, onProgress) {
        try {
            await _loadTesseract();
        } catch (_) {
            // Tesseract no pudo cargar — devolver string vacío (análisis con defaults)
            console.warn('[NVReports] Tesseract.js no disponible — usando análisis por defecto');
            return '';
        }

        const worker = await Tesseract.createWorker(['spa', 'eng'], 1, {
            logger: m => {
                if (onProgress && m.status === 'recognizing text') {
                    onProgress(m.progress);
                }
            }
        });
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();
        return (text || '').trim();
    }

    // ─────────────────────────────────────────────────────────
    // PIPELINE COMPLETO
    // file   : File object
    // lang   : 'es' | 'en'
    // onProgress : (0..1) → void  (para OCR de imágenes)
    // Devuelve { rawText, analysis }
    // ─────────────────────────────────────────────────────────
    async function analyzeFile(file, lang, onProgress) {
        const isEs  = lang === 'es';
        const isPdf = file.type === 'application/pdf';
        const isImg = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);

        let rawText = '';
        try {
            if (isPdf)       rawText = await extractPdfText(file);
            else if (isImg)  rawText = await extractImageText(file, onProgress);
        } catch (e) {
            // PDF protegido → re-lanzar con mensaje amigable
            if (e && e.code === 'pdf_protected') {
                throw {
                    code: 'pdf_protected',
                    msg: isEs
                        ? 'El PDF está protegido con contraseña. Utilice un PDF sin protección.'
                        : 'The PDF is password-protected. Please use an unprotected PDF.'
                };
            }
            // Texto ilegible (escaneado sin OCR, etc.) → continuar con texto vacío
            console.warn('[NVReports] Extracción de texto fallida, usando defaults:', e);
        }

        const analysis = analyzeText(rawText, lang);
        return { rawText, analysis };
    }

    // ─────────────────────────────────────────────────────────
    // PERSISTENCIA LOCAL (localStorage)
    // ─────────────────────────────────────────────────────────
    function _loadLocal() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }
    function _persistLocal(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_REPORTS)));
    }
    function saveLocal(report) {
        const reports = _loadLocal();
        // Evitar duplicados por id
        const idx = reports.findIndex(r => String(r.id) === String(report.id));
        if (idx >= 0) reports.splice(idx, 1);
        reports.unshift(report);
        _persistLocal(reports);
    }
    function getAllLocal() { return _loadLocal(); }

    // ─────────────────────────────────────────────────────────
    // SYNC FIRESTORE → localStorage
    // ─────────────────────────────────────────────────────────
    async function syncFromFirestore(uid) {
        if (!uid || !window.NVFirebase || !NVFirebase.isReady()) {
            return _loadLocal();
        }
        try {
            const remote = await NVFirebase.getMedicalReports(uid);
            if (remote && remote.length) {
                const local      = _loadLocal();
                const remoteIds  = new Set(remote.map(r => String(r.id)));
                const localOnly  = local.filter(r => !remoteIds.has(String(r.id)));
                const merged     = [...remote, ...localOnly].sort((a, b) => Number(b.id) - Number(a.id));
                _persistLocal(merged);
                return merged;
            }
        } catch (e) {
            console.warn('[NVReports] Sync Firestore fallido:', e);
        }
        return _loadLocal();
    }

    // ── API pública ───────────────────────────────────────────
    window.NVReports = {
        analyzeFile,
        analyzeText,
        extractPdfText,
        extractImageText,
        saveLocal,
        getAllLocal,
        syncFromFirestore,
    };

})();
