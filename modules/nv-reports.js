/**
 * NeuroVida PRO — Motor de Análisis Clínico (v2 — Nivel Certificación)
 * ─────────────────────────────────────────────────────────────────────
 * OCR:  PDF.js (PDFs) + Tesseract.js spa+eng (imágenes)
 * NLP:  Extracción multi-dominio local — Neuro · Cardio · Psico · Métricas
 * Sync: Firestore medical_reports/{uid}/reports  (zero-storage)
 *
 * API pública: window.NVReports
 *   analyzeFile(file, lang, onProgress?) → { rawText, analysis }
 *   analyzeText(text, lang)              → AnalysisResult
 *   saveLocal(report)
 *   getAllLocal()
 *   syncFromFirestore(uid)               → report[]
 */
(function NVReportsModule() {
    'use strict';

    const STORAGE_KEY = 'nv_medical_reports';
    const MAX_REPORTS = 50;

    // ─────────────────────────────────────────────────────────
    // PRE-PROCESAMIENTO DE TEXTO OCR
    // Limpia ruido típico de imágenes escaneadas antes del NLP
    // ─────────────────────────────────────────────────────────
    function _cleanOcrText(raw) {
        return (raw || '')
            // Conservar letras, dígitos, puntuación médica y acentos
            .replace(/[^\w\s\.\,\:\;\-\/\%\(\)\+\=\<\>áéíóúüñÁÉÍÓÚÜÑ°]/gi, ' ')
            .replace(/\s{2,}/g, ' ')          // colapsar espacios múltiples
            .replace(/(\d)\s+([,\.\/])\s+(\d)/g, '$1$2$3')  // "12 . 5" → "12.5"
            .replace(/([a-záéíóú])\s+([a-záéíóú])/gi, (m, a, b) =>
                a.length === 1 || b.length === 1 ? a + b : m)  // pegar letras sueltas OCR
            .trim();
    }

    // Ayuda: extraer primer match de una lista de regexes
    function _firstMatch(text, patterns, groupIndex = 1) {
        for (const p of patterns) {
            const m = text.match(p);
            if (m && (m[groupIndex] || '').trim().length > 3) {
                return m[groupIndex].trim().replace(/\s+/g, ' ').slice(0, 200);
            }
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN DE MÉTRICAS VITALES Y ANALÍTICA
    // ─────────────────────────────────────────────────────────
    function _extractMetrics(text) {
        const m = {};

        // Tensión / Presión Arterial  →  TA 120/80 · PA 130/90
        const taRx = text.match(/(?:TA|PA|T\.?A\.?|P\.?A\.?|tens[ió]n\s*arterial|presi[oó]n\s*arterial|blood\s*pressure)[:\s]*(\d{2,3}[\/\-]\d{2,3})/i);
        if (taRx) m.ta = taRx[1];

        // Frecuencia Cardiaca  →  FC 72 lpm  · HR 80 bpm
        const fcRx = text.match(/(?:FC|HR|frecuencia\s*cardiaca|heart\s*rate|pulso)[:\s]*(\d{2,3})\s*(?:lpm|bpm|\/min)?/i);
        if (fcRx) m.fc = fcRx[1] + ' lpm';

        // FEVI  →  FEVI 22%  · FE 35%  · fracción de eyección 40%
        const feviRx = text.match(/(?:FEVI|FE\b|fracci[oó]n\s*de\s*eyecci[oó]n|ejection\s*fraction)[:\s=]*(\d{1,3})\s*%?/i);
        if (feviRx) m.fevi = feviRx[1] + '%';

        // PAP  →  PAP 45 mmHg
        const papRx = text.match(/(?:PAP|presi[oó]n\s*(?:arterial\s*)?pulmonar|pulmonary\s*(?:arterial\s*)?pressure)[:\s]*(\d{1,3})\s*(?:mmHg)?/i);
        if (papRx) m.pap = papRx[1] + ' mmHg';

        // Creatinina  →  Cr 1.8 mg/dL
        const crRx = text.match(/(?:\bCr\b|creatinina|creatinine)[:\s]*(\d+[,\.]\d+)\s*(?:mg\/d[Ll]|μmol\/L)?/i);
        if (crRx) m.cr = crRx[1].replace(',', '.') + ' mg/dL';

        // Hemoglobina  →  Hb 10.2 g/dL
        const hbRx = text.match(/(?:\bHb\b|\bHgb\b|hemoglobina|hemoglobin)[:\s]*(\d+[,\.]\d+)\s*(?:g\/d[Ll])?/i);
        if (hbRx) m.hb = hbRx[1].replace(',', '.') + ' g/dL';

        // Glucosa  →  Glucosa 148 mg/dL
        const glucRx = text.match(/(?:glucosa|glucemia|glucose|\bGlu\b)[:\s]*(\d{2,3})\s*(?:mg\/d[Ll])?/i);
        if (glucRx) m.glucosa = glucRx[1] + ' mg/dL';

        // Colesterol total
        const colRx = text.match(/(?:colesterol\s*total|total\s*cholesterol|CT)[:\s]*(\d{3,4})\s*(?:mg\/d[Ll])?/i);
        if (colRx) m.colesterol = colRx[1] + ' mg/dL';

        // Saturación O₂
        const satRx = text.match(/(?:SatO2|SpO2|saturaci[oó]n|oxygen\s*sat)[:\s]*(\d{2,3})\s*%?/i);
        if (satRx) m.sato2 = satRx[1] + '%';

        return m;
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN DE ESTADIO / GRADO
    // ─────────────────────────────────────────────────────────
    function _extractStadio(text) {
        // "Estadio 3", "Estadio III", "Stage 3", "Hoehn y Yahr III", "H&Y 3"
        const m = text.match(
            /(?:estadio|stage|estadío|etapa|hoehn\s*(?:y|and|&|\/)\s*yahr|h[&y]+)[:\s]*([IVXivx]{1,4}|\d)/i
        );
        if (!m) return null;
        const raw = m[1].toUpperCase();
        const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
        const num = roman[raw] || parseInt(raw) || raw;
        return `Estadio ${num}`;
    }

    // ─────────────────────────────────────────────────────────
    // DOMINIO NEUROLÓGICO
    // ─────────────────────────────────────────────────────────
    function _extractNeuro(text, lower, isEs) {
        const findings = [];

        // Parkinson + Estadio
        if (lower.includes('parkinson')) {
            const stadio = _extractStadio(text);
            findings.push(isEs
                ? `Enfermedad de Parkinson${stadio ? ' · ' + stadio : ''}`
                : `Parkinson's Disease${stadio ? ' · ' + stadio : ''}`);
        }

        // Temblor
        if (/temblor\s*(?:en\s*reposo|intenci[oó]n|esencial|essential|resting\s*tremor)/i.test(text)) {
            findings.push(isEs ? 'Temblor' : 'Tremor');
        }

        // Bradicinesia / rigidez
        if (/bradicinesia|bradykinesia|rigidez\s*muscular|cogwheel\s*rigidity/i.test(text)) {
            findings.push(isEs ? 'Bradicinesia / Rigidez' : 'Bradykinesia / Rigidity');
        }

        // Marcha / Gait
        if (/alteraci[oó]n\s*de\s*la\s*marcha|gait\s*(?:disturbance|disorder|freezing)|congelaci[oó]n\s*de\s*la\s*marcha/i.test(text)) {
            findings.push(isEs ? 'Alteración de la Marcha' : 'Gait Disturbance');
        }

        // Demencia / Deterioro cognitivo
        if (/demencia|deterioro\s*cognitivo|cognitive\s*(?:impairment|decline)|dementia/i.test(text)) {
            findings.push(isEs ? 'Deterioro Cognitivo' : 'Cognitive Impairment');
        }

        // Disartria / disfagia
        if (/disartria|disfagia|dysarthria|dysphagia/i.test(text)) {
            findings.push(isEs ? 'Disartria / Disfagia' : 'Dysarthria / Dysphagia');
        }

        // Esclerosis lateral amiotrófica
        if (/ela\b|esclerosis\s*lateral\s*amiotr[oó]fica|amyotrophic\s*lateral\s*sclerosis|als\b/i.test(text)) {
            findings.push(isEs ? 'ELA' : 'ALS');
        }

        // Ictus / ACV
        if (/ictus|accidente\s*cerebrovascular|acv\b|stroke|ataque\s*cerebral/i.test(text)) {
            findings.push(isEs ? 'ACV / Ictus' : 'Stroke / CVA');
        }

        return findings;
    }

    // ─────────────────────────────────────────────────────────
    // DOMINIO CARDIOLÓGICO
    // ─────────────────────────────────────────────────────────
    function _extractCardio(text, lower, isEs, metrics) {
        const findings = [];
        let isCritical = false;

        // FEVI reducida → CRÍTICO si < 40%
        if (metrics.fevi) {
            const feviVal = parseInt(metrics.fevi);
            findings.push(`${isEs ? 'FEVI' : 'LVEF'}: ${metrics.fevi}`);
            if (feviVal < 40) isCritical = true;
        }

        // IAM / Infarto
        if (/\biam\b|infarto\s*(?:agudo\s*de\s*)?miocardio|myocardial\s*infarction|heart\s*attack/i.test(text)) {
            findings.push(isEs ? 'IAM (Infarto de Miocardio)' : 'Myocardial Infarction');
            isCritical = true;
        }

        // Cardiopatía isquémica
        if (/cardiopat[ií]a\s*(?:isqu[eé]mica|dilatada|hipert[oó]fica)|ischemic\s*heart\s*disease|ihd\b/i.test(text)) {
            findings.push(isEs ? 'Cardiopatía Isquémica' : 'Ischemic Heart Disease');
            isCritical = true;
        }

        // Insuficiencia Cardiaca
        if (/insuficiencia\s*cardiaca|heart\s*failure|ic\s*(?:con|con\s*fevi)/i.test(text)) {
            findings.push(isEs ? 'Insuficiencia Cardiaca' : 'Heart Failure');
            isCritical = true;
        }

        // Hipertensión Pulmonar / PAP elevada
        if (metrics.pap) {
            const papVal = parseInt(metrics.pap);
            findings.push(`PAP: ${metrics.pap}`);
            if (papVal > 25) isCritical = true;
        } else if (/hipertensi[oó]n\s*pulmonar|pulmonary\s*hypertension/i.test(text)) {
            findings.push(isEs ? 'Hipertensión Pulmonar' : 'Pulmonary Hypertension');
            isCritical = true;
        }

        // Arritmia / FA
        if (/fibrilaci[oó]n\s*auricular|atrial\s*fibrillation|\bfa\b|arritmia|arrhythmia/i.test(text)) {
            findings.push(isEs ? 'Fibrilación Auricular / Arritmia' : 'Atrial Fibrillation / Arrhythmia');
        }

        // Valvulopatía
        if (/valvulopat[ií]a|estenosis\s*(?:a[oó]rtica|mitral)|regurgitaci[oó]n|valve\s*disease/i.test(text)) {
            findings.push(isEs ? 'Valvulopatía' : 'Valvular Disease');
        }

        return { findings, isCritical };
    }

    // ─────────────────────────────────────────────────────────
    // DOMINIO PSICOLÓGICO
    // ─────────────────────────────────────────────────────────
    function _extractPsico(text, isEs) {
        const findings = [];

        if (/s[íi]ndrome\s*depresivo|depresi[oó]n\s*mayor|depresive\s*disorder|major\s*depression|\bdepresión\b/i.test(text)) {
            findings.push(isEs ? 'Síndrome Depresivo' : 'Depressive Disorder');
        }
        if (/ansiedad\s*(?:generalizada|cr[oó]nica)?|anxiety\s*disorder|\btag\b/i.test(text)) {
            findings.push(isEs ? 'Trastorno de Ansiedad' : 'Anxiety Disorder');
        }
        if (/alucinaci[oó]n|psicosis|psychosis|hallucination/i.test(text)) {
            findings.push(isEs ? 'Psicosis / Alucinaciones' : 'Psychosis / Hallucinations');
        }
        if (/insomnio|trastorno\s*del\s*sue[nñ]o|sleep\s*disorder/i.test(text)) {
            findings.push(isEs ? 'Trastorno del Sueño' : 'Sleep Disorder');
        }
        return findings;
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN DE MEDICACIÓN — ampliada (Parkinson + Cardio)
    // ─────────────────────────────────────────────────────────
    function _extractMedication(text, lower, isEs) {
        const allMeds = [
            // Antiparkinsonianos
            'levodopa', 'carbidopa', 'levodopa/carbidopa', 'levodopa carbidopa',
            'ropinirol', 'ropinirole', 'pramipexol', 'pramipexole',
            'rotigotina', 'rotigotine', 'entacapona', 'entacapone',
            'tolcapona', 'tolcapone', 'opicapona', 'opicapone',
            'rasagilina', 'rasagiline', 'selegilina', 'selegiline',
            'amantadina', 'amantadine', 'trihexifenidilo', 'trihexyphenidyl',
            'duodopa', 'sinemet', 'madopar', 'stalevo', 'comtan', 'azilect',
            'neupro', 'requip', 'mirapex',
            // Cardio
            'bisoprolol', 'carvedilol', 'metoprolol', 'atenolol',
            'enalapril', 'lisinopril', 'ramipril', 'perindopril',
            'losartan', 'valsartan', 'candesartan', 'telmisartan',
            'amlodipino', 'amlodipine', 'nifedipino', 'nifedipine',
            'furosemida', 'furosemide', 'torasemida', 'torasemide',
            'espironolactona', 'spironolactone', 'eplerenona', 'eplerenone',
            'digoxina', 'digoxin', 'amiodarona', 'amiodarone',
            'acenocumarol', 'warfarina', 'warfarin', 'apixaban', 'rivaroxaban',
            'dabigatran', 'clopidogrel', 'ticagrelor', 'aspirina', 'aspirin',
            'atorvastatina', 'atorvastatin', 'rosuvastatina', 'rosuvastatin',
            'ezetimiba', 'ezetimibe', 'sacubitrilo', 'empagliflozina',
            'dapagliflozina',
            // Psicotrópicos
            'sertralina', 'sertraline', 'escitalopram', 'fluoxetina', 'fluoxetine',
            'venlafaxina', 'venlafaxine', 'clonazepam', 'lorazepam', 'quetiapina',
            'quetiapine', 'risperidona', 'risperidone', 'donepezilo', 'donepezil',
            'rivastigmina', 'rivastigmine', 'memantina', 'memantine',
        ];

        const found = new Map();
        for (const med of allMeds) {
            const safeKey = med.replace(/[\/\-]/g, '\\/');
            if (new RegExp(`\\b${safeKey}\\b`, 'i').test(lower)) {
                const ctx = text.match(new RegExp(`.{0,30}\\b${safeKey}\\b.{0,50}`, 'i'));
                const label = ctx ? ctx[0].trim().replace(/\s+/g, ' ').slice(0, 80) : med;
                const dedupeKey = med.split('/')[0].toLowerCase();
                if (!found.has(dedupeKey)) found.set(dedupeKey, label);
            }
        }

        if (found.size > 0) return [...found.values()].slice(0, 6).join(' | ');

        // Fallback: capturar líneas de medicación por patrones genéricos
        return _firstMatch(text, [
            /(?:medicaci[oó]n|medicamento|medication|prescripci[oó]n|tratamiento\s*con)[:\s]+([^\n]{15,200})/i,
            /(?:f[aá]rmacos?|drugs?|prescribed)[:\s]+([^\n]{15,200})/i,
        ]) || (isEs ? 'Sin medicación identificada en el texto' : 'No medication identified in the text');
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN DE RECOMENDACIONES
    // ─────────────────────────────────────────────────────────
    function _extractRecommendations(text, isEs) {
        return _firstMatch(text, [
            /(?:recomendaciones?|recomendamos|se\s*recomienda)[:\s]+([^\n]{30,300})/i,
            /(?:recommendations?|we\s*recommend|it\s*is\s*recommended)[:\s]+([^\n]{30,300})/i,
            /(?:plan\s*de\s*tratamiento|treatment\s*plan)[:\s]+([^\n]{30,300})/i,
            /(?:pr[oó]xima\s*revisi[oó]n|follow[-\s]?up|next\s*appointment)[^\n]{0,120}/i,
            /(?:indicaciones|instrucciones|instructions)[:\s]+([^\n]{25,250})/i,
        ]) || (isEs
            ? 'Mantener tratamiento actual bajo supervisión especializada. Rehabilitación motora de baja intensidad. Revisión en 3 meses.'
            : 'Continue current treatment under specialist supervision. Low-intensity motor rehabilitation. Review in 3 months.');
    }

    // ─────────────────────────────────────────────────────────
    // MOTOR PRINCIPAL — analyzeText
    // ─────────────────────────────────────────────────────────
    function analyzeText(rawText, lang) {
        const isEs  = lang !== 'en';
        const clean = _cleanOcrText(rawText);
        const text  = clean;
        const lower = clean.toLowerCase();

        console.log('[NVReports] Texto limpio para análisis:', clean.slice(0, 300));

        // ── 1. Métricas ──────────────────────────────────────
        const metricas = _extractMetrics(text);

        // ── 2. Dominios clínicos ─────────────────────────────
        const neuroFindings = _extractNeuro(text, lower, isEs);
        const { findings: cardioFindings, isCritical } = _extractCardio(text, lower, isEs, metricas);
        const psicoFindings = _extractPsico(text, isEs);

        // ── 3. Diagnóstico principal ─────────────────────────
        // Intentar patrones estructurados primero
        let diagnosis = _firstMatch(text, [
            /(?:diagn[oó]stico\s*principal|diagn[oó]stico\s*definitivo|diagn[oó]stico)[:\s]+([^\n\.]{10,200})/i,
            /(?:primary\s*diagnosis|diagnosis|assessment|clinical\s*impression)[:\s]+([^\n\.]{10,200})/i,
            /(?:se\s*diagnostica|compatible\s*con|consistent\s*with|suggestive\s*of)[:\s]+([^\n\.]{10,160})/i,
            /(?:impresi[oó]n\s*cl[ií]nica|conclusiones?)[:\s]+([^\n\.]{10,160})/i,
        ]);

        // Si no hay patrón estructurado, componer desde dominios
        if (!diagnosis) {
            const allFindings = [...neuroFindings, ...cardioFindings, ...psicoFindings];
            if (allFindings.length > 0) {
                diagnosis = allFindings.slice(0, 4).join(' · ');
            }
        }

        // Añadir estadio si se detectó separadamente
        const stadio = _extractStadio(text);
        if (stadio && diagnosis && !diagnosis.toLowerCase().includes('estadio') && !diagnosis.toLowerCase().includes('stage')) {
            diagnosis = diagnosis + ' · ' + stadio;
        }

        // Fallback final: revisar keywords básicas (segunda pasada)
        if (!diagnosis) {
            const kwMap = [
                { kw: /parkinson/i,             es: 'Enfermedad de Parkinson',    en: "Parkinson's Disease" },
                { kw: /alzheimer/i,              es: 'Enfermedad de Alzheimer',    en: "Alzheimer's Disease" },
                { kw: /esclerosis\s*m[uú]ltiple|multiple\s*sclerosis/i, es: 'Esclerosis Múltiple', en: 'Multiple Sclerosis' },
                { kw: /insuficiencia\s*cardiaca|heart\s*failure/i,       es: 'Insuficiencia Cardiaca', en: 'Heart Failure' },
                { kw: /temblor\s*esencial|essential\s*tremor/i,          es: 'Temblor Esencial', en: 'Essential Tremor' },
                { kw: /depresi[oó]n|depression/i,                        es: 'Síndrome Depresivo', en: 'Depressive Disorder' },
            ];
            for (const { kw, es, en } of kwMap) {
                if (kw.test(lower)) { diagnosis = isEs ? es : en; break; }
            }
        }

        if (!diagnosis) {
            diagnosis = clean.length > 50
                ? (isEs ? 'Informe procesado — diagnóstico no estructurado' : 'Report processed — unstructured diagnosis')
                : (isEs ? 'Texto insuficiente para análisis — use imagen de mayor calidad' : 'Insufficient text — use a higher quality image');
        }

        // ── 4. Medicación ────────────────────────────────────
        const medicacion = _extractMedication(text, lower, isEs);

        // ── 5. Recomendaciones + Alertas cardiacas ───────────
        let recomendaciones = _extractRecommendations(text, isEs);

        // ALERTA CRÍTICA: compromiso cardiaco
        const alertas = [];
        if (metricas.fevi && parseInt(metricas.fevi) < 40) {
            const feviVal = metricas.fevi;
            alertas.push(isEs
                ? `⚠ ALERTA: Compromiso cardiaco severo (FEVI ${feviVal}). Ejercicios de rehabilitación deben ser de baja intensidad y supervisados por cardiología.`
                : `⚠ ALERT: Severe cardiac compromise (LVEF ${feviVal}). Rehabilitation exercises must be low-intensity and supervised by cardiology.`);
        }
        if (alertas.length > 0) {
            recomendaciones = alertas.join(' ') + ' | ' + recomendaciones;
        }

        // ── 6. Validación de salida ──────────────────────────
        // Si diagnóstico es genérico pero hay texto real, forzar segunda búsqueda
        const isGenericDiagnosis = diagnosis.includes('no estructurado') || diagnosis.includes('unstructured')
            || diagnosis.includes('insuficiente') || diagnosis.includes('insufficient');
        if (isGenericDiagnosis && clean.length > 100) {
            // Extraer las primeras líneas con contenido como diagnóstico fallback
            const firstLines = clean.split('\n').filter(l => l.trim().length > 15).slice(0, 3).join(' · ');
            if (firstLines.length > 20) {
                diagnosis = firstLines.slice(0, 200);
            }
        }

        return {
            diagnostico_principal: diagnosis,
            medicacion_activa:     medicacion,
            recomendaciones,
            metricas,
            alertas,
            dominios: {
                neuro:  neuroFindings.join(', ')  || '',
                cardio: cardioFindings.join(', ') || '',
                psico:  psicoFindings.join(', ')  || '',
            },
            estadio:    stadio || '',
            isCritical,
            rawTextLen: clean.length,
        };
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN PDF — pdf.js
    // ─────────────────────────────────────────────────────────
    async function extractPdfText(file) {
        if (typeof pdfjsLib === 'undefined') throw { code: 'pdfjs_missing' };
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

        let arrayBuffer;
        try { arrayBuffer = await file.arrayBuffer(); }
        catch (_) { throw { code: 'file_read_error' }; }

        let pdf;
        try { pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; }
        catch (e) {
            if ((e.message || '').toLowerCase().includes('password')) throw { code: 'pdf_protected' };
            throw { code: 'pdf_parse_error', msg: e.message };
        }

        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 20);
        for (let i = 1; i <= maxPages; i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            // Preservar saltos de línea para mejor parsing de secciones
            fullText += content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('') + '\n';
        }
        return fullText.trim();
    }

    // ─────────────────────────────────────────────────────────
    // OCR IMÁGENES — Tesseract.js  (spa + eng)
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
        try { await _loadTesseract(); }
        catch (_) {
            console.warn('[NVReports] Tesseract.js no disponible');
            return '';
        }
        // Usar spa+eng para documentos médicos en español con siglas en inglés
        const worker = await Tesseract.createWorker(['spa', 'eng'], 1, {
            logger: m => {
                if (onProgress && m.status === 'recognizing text') onProgress(m.progress);
            }
        });
        // Modo PSM 1 (orientación automática) para mejores resultados en imágenes escaneadas
        await worker.setParameters({ tessedit_pageseg_mode: '1' });
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();
        return (text || '').trim();
    }

    // ─────────────────────────────────────────────────────────
    // PIPELINE COMPLETO
    // ─────────────────────────────────────────────────────────
    async function analyzeFile(file, lang, onProgress) {
        const isEs  = lang !== 'en';
        const isPdf = file.type === 'application/pdf';
        const isImg = /image\/(jpeg|jpg|png|webp|tiff)/i.test(file.type);

        let rawText = '';
        try {
            if (isPdf)      rawText = await extractPdfText(file);
            else if (isImg) rawText = await extractImageText(file, onProgress);
        } catch (e) {
            if (e && e.code === 'pdf_protected') {
                throw { code: 'pdf_protected', msg: isEs
                    ? 'El PDF está protegido con contraseña.'
                    : 'The PDF is password-protected.' };
            }
            console.warn('[NVReports] Extracción de texto fallida:', e);
        }

        console.log('[NVReports] Texto extraído (' + rawText.length + ' chars):', rawText.slice(0, 500));
        const analysis = analyzeText(rawText, lang);
        return { rawText, analysis };
    }

    // ─────────────────────────────────────────────────────────
    // PERSISTENCIA LOCAL
    // ─────────────────────────────────────────────────────────
    function _loadLocal() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    }
    function _persistLocal(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_REPORTS)));
    }
    function saveLocal(report) {
        const reports = _loadLocal();
        const idx = reports.findIndex(r => String(r.id) === String(report.id));
        if (idx >= 0) reports.splice(idx, 1);
        reports.unshift(report);
        _persistLocal(reports);
    }
    function getAllLocal() { return _loadLocal(); }

    // ─────────────────────────────────────────────────────────
    // SYNC FIRESTORE
    // ─────────────────────────────────────────────────────────
    async function syncFromFirestore(uid) {
        if (!uid || !window.NVFirebase || !NVFirebase.isReady()) return _loadLocal();
        try {
            const remote = await NVFirebase.getMedicalReports(uid);
            if (remote && remote.length) {
                const local     = _loadLocal();
                const remoteIds = new Set(remote.map(r => String(r.id)));
                const localOnly = local.filter(r => !remoteIds.has(String(r.id)));
                const merged    = [...remote, ...localOnly].sort((a, b) => Number(b.id) - Number(a.id));
                _persistLocal(merged);
                return merged;
            }
        } catch (e) { console.warn('[NVReports] Sync Firestore fallido:', e); }
        return _loadLocal();
    }

    // ── API pública ───────────────────────────────────────────
    window.NVReports = {
        analyzeFile, analyzeText,
        extractPdfText, extractImageText,
        saveLocal, getAllLocal, syncFromFirestore,
    };

})();
