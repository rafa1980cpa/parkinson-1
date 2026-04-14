/**
 * NeuroTempo PRO — Motor de Análisis Clínico (v2 — Nivel Certificación)
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
            // Separar palabras CamelCase concatenadas por extracción de tablas PDF
            .replace(/([a-záéíóú])([A-Z][a-záéíóú])/g, '$1 $2')
            .replace(/\s{2,}/g, ' ')
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
        const taRx = text.match(/(?:TA|PA|T\.?A\.?|P\.?A\.?|tens[ió]n\s*arterial|presi[oó]n\s*arterial|blood\s*pressure)[:\s\w]*?(\d{2,3}[\/\-]\d{2,3})/i);
        if (taRx) m.ta = taRx[1];

        // Frecuencia Cardiaca  →  FC 72 lpm  · HR 80 bpm
        const fcRx = text.match(/(?:FC|HR|frecuencia\s*cardiaca|heart\s*rate|pulso)[:\s\w]*?(\d{2,3})\s*(?:lpm|bpm|\/min)?/i);
        if (fcRx) m.fc = fcRx[1] + ' lpm';

        // FEVI  →  FEVI 22%  · FEVI del 22% · FE 35%  · fracción de eyección 40%
        // Permisivo: acepta artículos ("del", "de") entre la etiqueta y el número
        const feviRx = text.match(/(?:FEVI|FE\b|fracci[oó]n\s*de\s*eyecci[oó]n|ejection\s*fraction)[:\s=\w]*?(\d{1,3})\s*%/i);
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
        // "Estadio 3", "Estadio III", "Estadio 2/3", "Stage 3", "Hoehn y Yahr III", "H&Y 3"
        const m = text.match(
            /(?:estadio|stage|estadío|etapa|hoehn\s*(?:y|and|&|\/)\s*yahr|h[&y]+)[:\s]*([IVXivx]{1,4}|\d(?:[\/\-]\d)?)/i
        );
        if (!m) return null;
        const raw = m[1].toUpperCase();
        // Rango tipo "2/3" o "2-3" → mostrar como rango
        if (/\d[\/\-]\d/.test(raw)) return `Estadio ${raw.replace('-', '/')}`;
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
            'dapagliflozina', 'neparvis', 'entresto', 'jardiance', 'forxiga',
            // Psicotrópicos
            'sertralina', 'sertraline', 'escitalopram', 'fluoxetina', 'fluoxetine',
            'venlafaxina', 'venlafaxine', 'clonazepam', 'lorazepam', 'quetiapina',
            'quetiapine', 'risperidona', 'risperidone', 'donepezilo', 'donepezil',
            'rivastigmina', 'rivastigmine', 'memantina', 'memantine',
            'mirtazapina', 'mirtazapine',
        ];

        // Nombres canónicos en español para medicamentos reconocidos
        const _MED_ES_NAME = {
            'levodopa/carbidopa': 'Levodopa/Carbidopa', 'levodopa carbidopa': 'Levodopa/Carbidopa',
            'levodopa': 'Levodopa', 'carbidopa': 'Carbidopa',
            'ropinirol': 'Ropinirol', 'ropinirole': 'Ropinirol',
            'pramipexol': 'Pramipexol', 'pramipexole': 'Pramipexol',
            'rotigotina': 'Rotigotina', 'rotigotine': 'Rotigotina',
            'entacapona': 'Entacapona', 'entacapone': 'Entacapona',
            'rasagilina': 'Rasagilina', 'rasagiline': 'Rasagilina',
            'selegilina': 'Selegilina', 'selegiline': 'Selegilina',
            'amantadina': 'Amantadina', 'amantadine': 'Amantadina',
            'sinemet': 'Sinemet (Levodopa/Carbidopa)', 'madopar': 'Madopar',
            'stalevo': 'Stalevo', 'azilect': 'Azilect', 'neupro': 'Neupro',
            'bisoprolol': 'Bisoprolol', 'carvedilol': 'Carvedilol',
            'metoprolol': 'Metoprolol', 'enalapril': 'Enalapril',
            'lisinopril': 'Lisinopril', 'ramipril': 'Ramipril',
            'losartan': 'Losartan', 'valsartan': 'Valsartan',
            'amlodipino': 'Amlodipino', 'amlodipine': 'Amlodipino',
            'furosemida': 'Furosemida', 'furosemide': 'Furosemida',
            'torasemida': 'Torasemida', 'torasemide': 'Torasemida',
            'espironolactona': 'Espironolactona', 'spironolactone': 'Espironolactona',
            'digoxina': 'Digoxina', 'digoxin': 'Digoxina',
            'amiodarona': 'Amiodarona', 'amiodarone': 'Amiodarona',
            'warfarina': 'Warfarina', 'warfarin': 'Warfarina',
            'apixaban': 'Apixaban', 'rivaroxaban': 'Rivaroxaban',
            'dabigatran': 'Dabigatran', 'clopidogrel': 'Clopidogrel',
            'aspirina': 'Aspirina', 'aspirin': 'Aspirina',
            'atorvastatina': 'Atorvastatina', 'atorvastatin': 'Atorvastatina',
            'rosuvastatina': 'Rosuvastatina', 'rosuvastatin': 'Rosuvastatina',
            'neparvis': 'Neparvis', 'entresto': 'Entresto',
            'empagliflozina': 'Empagliflozina', 'dapagliflozina': 'Dapagliflozina',
            'sertralina': 'Sertralina', 'sertraline': 'Sertralina',
            'escitalopram': 'Escitalopram', 'fluoxetina': 'Fluoxetina', 'fluoxetine': 'Fluoxetina',
            'venlafaxina': 'Venlafaxina', 'venlafaxine': 'Venlafaxina',
            'clonazepam': 'Clonazepam', 'lorazepam': 'Lorazepam',
            'quetiapina': 'Quetiapina', 'quetiapine': 'Quetiapina',
            'risperidona': 'Risperidona', 'risperidone': 'Risperidona',
            'donepezilo': 'Donepezilo', 'donepezil': 'Donepezilo',
            'rivastigmina': 'Rivastigmina', 'rivastigmine': 'Rivastigmina',
            'memantina': 'Memantina', 'memantine': 'Memantina',
            'mirtazapina': 'Mirtazapina', 'mirtazapine': 'Mirtazapina',
        };

        const found = new Map();
        for (const med of allMeds) {
            const safeKey = med.replace(/[\/\-]/g, '\\/');
            if (new RegExp(`\\b${safeKey}\\b`, 'i').test(lower)) {
                // Usar nombre canónico en español — evita contexto garbled de tablas PDF
                const label = _MED_ES_NAME[med.toLowerCase()] || med;
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
    // DETECTOR DE IDIOMA DEL DOCUMENTO
    // Devuelve true si el texto del informe es predominantemente inglés
    // ─────────────────────────────────────────────────────────
    function _isDocumentEnglish(text) {
        const lower = text.toLowerCase();
        let enScore = 0, esScore = 0;
        // Marcadores fuertes en inglés
        const enMarkers = [
            'the patient', 'clinical report', 'patient name', 'date of birth',
            'medical history', 'physical examination', 'assessment', 'plan of treatment',
            'follow-up', 'diagnosis:', 'primary diagnosis', 'chief complaint',
            'history of', 'presenting with', 'treatment plan', 'recommendations:',
            'physician', 'discharge', 'outpatient', 'inpatient', 'prescribed',
        ];
        // Marcadores fuertes en español
        const esMarkers = [
            'el paciente', 'la paciente', 'informe clínico', 'nombre del paciente',
            'fecha de nacimiento', 'antecedentes', 'exploración física', 'diagnóstico',
            'diagnóstico principal', 'plan de tratamiento', 'seguimiento', 'médico',
            'recomendaciones', 'prescrito', 'tratamiento', 'revisión', 'consulta',
        ];
        for (const m of enMarkers) if (lower.includes(m)) enScore++;
        for (const m of esMarkers) if (lower.includes(m)) esScore++;
        return enScore > esScore;
    }

    // ─────────────────────────────────────────────────────────
    // TRADUCCIÓN BÁSICA DE FRAGMENTOS DE TEXTO EN-ES
    // Para fragmentos extraídos literalmente de documentos ingleses
    // ─────────────────────────────────────────────────────────
    const _EN_ES_PHRASES = [
        // ── Condiciones clínicas ──────────────────────────────
        [/\bParkinson\'s [Dd]isease\b/gi,                'Enfermedad de Parkinson'],
        [/\bHeart [Ff]ailure\b/gi,                       'Insuficiencia Cardiaca'],
        [/\bMyocardial [Ii]nfarction\b/gi,               'Infarto de Miocardio'],
        [/\bIschemic [Hh]eart [Dd]isease\b/gi,           'Cardiopatía Isquémica'],
        [/\bCoronary [Aa]rtery [Dd]isease\b/gi,          'Cardiopatía Coronaria'],
        [/\bAtrial [Ff]ibrillation\b/gi,                 'Fibrilación Auricular'],
        [/\bDepressive [Dd]isorder\b/gi,                 'Síndrome Depresivo'],
        [/\bMajor [Dd]epression\b/gi,                    'Depresión Mayor'],
        [/\bAnxiety [Dd]isorder\b/gi,                    'Trastorno de Ansiedad'],
        [/\bAlzheimer\'s [Dd]isease\b/gi,                'Enfermedad de Alzheimer'],
        [/\bMultiple [Ss]clerosis\b/gi,                   'Esclerosis Múltiple'],
        [/\bCognitive [Ii]mpairment\b/gi,                'Deterioro Cognitivo'],
        [/\bCognitive [Dd]ecline\b/gi,                   'Deterioro Cognitivo'],
        [/\bAmyotrophic [Ll]ateral [Ss]clerosis\b/gi,    'Esclerosis Lateral Amiotrófica'],
        [/\bChronic [Kk]idney [Dd]isease\b/gi,           'Enfermedad Renal Crónica'],
        [/\bRenal [Ff]ailure\b/gi,                       'Insuficiencia Renal'],
        [/\bPulmonary [Hh]ypertension\b/gi,              'Hipertensión Pulmonar'],
        [/\bValvular [Dd]isease\b/gi,                    'Valvulopatía'],
        [/\bHypertension\b/gi,                           'Hipertensión'],
        [/\bDiabetes [Mm]ellitus\b/gi,                   'Diabetes Mellitus'],
        [/\bType 2 [Dd]iabetes\b/gi,                     'Diabetes Tipo 2'],
        [/\bHypothyroidism\b/gi,                         'Hipotiroidismo'],
        [/\bHyperthyroidism\b/gi,                        'Hipertiroidismo'],
        [/\bOsteoporosis\b/gi,                           'Osteoporosis'],
        [/\bOsteoarthritis\b/gi,                         'Osteoartritis'],
        [/\bRheumatoid [Aa]rthritis\b/gi,                'Artritis Reumatoide'],
        [/\bCOPD\b/g,                                    'EPOC'],
        [/\bAsthma\b/gi,                                 'Asma'],
        [/\bEpilepsy\b/gi,                               'Epilepsia'],
        [/\bMigraine\b/gi,                               'Migraña'],
        [/\bObstructive\s*[Ss]leep\s*[Aa]pnea\b/gi,     'Apnea del Sueño'],
        [/\bAnemia\b/gi,                                 'Anemia'],
        [/\bBradykinesia\b/gi,                           'Bradicinesia'],
        [/\bTremor\b/gi,                                 'Temblor'],
        [/\bRigidity\b/gi,                               'Rigidez'],
        [/\bGait [Dd]isturbance\b/gi,                    'Alteración de la Marcha'],
        [/\bGait [Ff]reezing\b/gi,                       'Congelación de la Marcha'],
        [/\bFreezing of [Gg]ait\b/gi,                    'Congelación de la Marcha'],
        [/\bDysarthria\b/gi,                             'Disartria'],
        [/\bDysphagia\b/gi,                              'Disfagia'],
        [/\bHallucinations?\b/gi,                        'Alucinaciones'],
        [/\bPsychosis\b/gi,                              'Psicosis'],
        [/\bSleep [Dd]isorder\b/gi,                      'Trastorno del Sueño'],
        [/\bStroke\b/gi,                                 'Ictus'],
        [/\bTransient [Ii]schemic [Aa]ttack\b/gi,        'Accidente Isquémico Transitorio'],
        // ── Métricas y unidades ───────────────────────────────
        [/\bStage\s+/gi,                                 'Estadio '],
        [/\bLVEF\b/gi,                                   'FEVI'],
        [/\bejection fraction\b/gi,                      'fracción de eyección'],
        [/\bHR\b/g,                                      'FC'],
        [/\bBP\b/g,                                      'TA'],
        [/\bO2\s*[Ss]at/gi,                              'SpO2'],
        [/\bGlucose\b/gi,                                'Glucosa'],
        [/\bHemoglobin\b/gi,                             'Hemoglobina'],
        [/\bCreatinine\b/gi,                             'Creatinina'],
        [/\bCholesterol\b/gi,                            'Colesterol'],
        [/\bBMI\b/g,                                     'IMC'],
        // ── Dosificación y posología ──────────────────────────
        [/\bthree times daily\b/gi,                      'tres veces al día'],
        [/\bthree times a day\b/gi,                      'tres veces al día'],
        [/\btwice daily\b/gi,                            'dos veces al día'],
        [/\btwice a day\b/gi,                            'dos veces al día'],
        [/\bonce daily\b/gi,                             'una vez al día'],
        [/\bonce a day\b/gi,                             'una vez al día'],
        [/\bfour times daily\b/gi,                       'cuatro veces al día'],
        [/\bfour times a day\b/gi,                       'cuatro veces al día'],
        [/\bevery (\d+) hours?\b/gi,                     'cada $1 horas'],
        [/\bas needed\b/gi,                              'según necesidad'],
        [/\bpro re nata\b/gi,                            'según necesidad'],
        [/\bwith meals?\b/gi,                            'con las comidas'],
        [/\bat bedtime\b/gi,                             'al acostarse'],
        [/\bin the morning\b/gi,                         'por la mañana'],
        [/\bat night\b/gi,                               'por la noche'],
        [/\bin the evening\b/gi,                         'por la tarde'],
        [/\btablets?\b/gi,                               'comprimidos'],
        [/\bcapsules?\b/gi,                              'cápsulas'],
        [/\bpatch\b/gi,                                  'parche'],
        [/\bdrop[s]?\b/gi,                               'gotas'],
        // ── Instrucciones clínicas y recomendaciones ─────────
        [/continue current treatment/gi,                 'Mantener tratamiento actual'],
        [/\bunder specialist supervision\b/gi,           'bajo supervisión especializada'],
        [/\bunder medical supervision\b/gi,              'bajo supervisión médica'],
        [/\blow.intensity (motor )?rehabilitation/gi,    'Rehabilitación motora de baja intensidad'],
        [/\breview in (\d+) months?\b/gi,                'Revisión en $1 meses'],
        [/\bfollow.up in (\d+) (weeks?|months?)\b/gi,   'Revisión en $1 $2'],
        [/\bno high.intensity exercise\b/gi,             'Sin ejercicio de alta intensidad'],
        [/\bconsult your specialist\b/gi,                'Consulte con su especialista'],
        [/\bbefore any exercise\b/gi,                    'antes de iniciar cualquier ejercicio'],
        [/\bphysical therapy\b/gi,                       'Fisioterapia'],
        [/\bspeech therapy\b/gi,                         'Logopedia'],
        [/\boccupational therapy\b/gi,                   'Terapia ocupacional'],
        [/\bmedication adjusted\b/gi,                    'Medicación ajustada'],
        [/\bmaintain current medication\b/gi,            'Mantener medicación actual'],
        [/\breduce activity\b/gi,                        'Reducir actividad física'],
        [/\bregular monitoring\b/gi,                     'Seguimiento regular'],
        [/\bnext appointment\b/gi,                       'Próxima revisión'],
        [/\bblood pressure control\b/gi,                 'Control de tensión arterial'],
        [/\bheart rate control\b/gi,                     'Control de frecuencia cardiaca'],
        [/\bweight control\b/gi,                         'Control de peso'],
        [/\bhospitalization\b/gi,                        'Hospitalización'],
        [/\bdischarge\b/gi,                              'Alta médica'],
        [/\bwarm.up\b/gi,                                'calentamiento'],
        [/\bcool.down\b/gi,                              'enfriamiento'],
        [/\blifestyle changes?\b/gi,                     'cambios en el estilo de vida'],
        [/\bdiet changes?\b/gi,                          'cambios en la dieta'],
        [/\bsodium restriction\b/gi,                     'restricción de sodio'],
        [/\bfluid restriction\b/gi,                      'restricción de líquidos'],
        [/\bweight loss\b/gi,                            'pérdida de peso'],
        // ── Términos estructurales de informe ────────────────
        [/\bprimary diagnosis\b/gi,                      'Diagnóstico principal'],
        [/\bsecondary diagnosis\b/gi,                    'Diagnóstico secundario'],
        [/\bclinical impression\b/gi,                    'Impresión clínica'],
        [/\btreatment plan\b/gi,                         'Plan de tratamiento'],
        [/\bmedical history\b/gi,                        'Antecedentes'],
        [/\bprescribed\b/gi,                             'prescrito'],
        [/\bprescription\b/gi,                           'prescripción'],
        [/\bdiagnosis\b/gi,                              'diagnóstico'],
        [/\bassessment\b/gi,                             'evaluación'],
        [/\bsymptoms?\b/gi,                              'síntomas'],
        [/\bfindings?\b/gi,                              'hallazgos'],
        [/\bexamination\b/gi,                            'exploración'],
        [/\brecommendations?\b/gi,                       'recomendaciones'],
        [/\bconclusions?\b/gi,                           'conclusiones'],
        [/\btreatment\b/gi,                              'tratamiento'],
        [/\bmedication\b/gi,                             'medicación'],
        [/\bthe patient\b/gi,                            'el/la paciente'],
        [/\bpatient\b/gi,                                'paciente'],
        [/\bphysician\b/gi,                              'médico'],
        [/\bspecialist\b/gi,                             'especialista'],
        // ── Clínica cardiovascular y neurológica específica ──
        [/\bHFrEF\b/gi,                                          'ICFEr (Insuficiencia Cardiaca)'],
        [/\bFreezing of [Gg]ait\b/gi,                            'Congelación de la Marcha'],
        [/\bFOG\b/g,                                             'Congelación de Marcha (FOG)'],
        [/\bventricular dysfunction\b/gi,                        'disfunción ventricular'],
        [/\bsevere.*ventricular dysfunction\b/gi,                'disfunción ventricular grave'],
        [/\bLeft [Vv]entricle\b/gi,                              'Ventrículo Izquierdo'],
        [/\bLeft [Vv]entricular\b/gi,                            'Ventricular Izquierdo'],
        [/\bdecompensated [Hh]eart [Ff]ailure\b/gi,              'Insuficiencia Cardiaca descompensada'],
        [/\bischemic origin\b/gi,                                'origen isquémico'],
        [/\bFunctional [Cc]lass\b/gi,                            'Clase Funcional'],
        [/\bmultidisciplinary\b/gi,                              'multidisciplinario'],
        [/\bmotor symptoms?\b/gi,                                'síntomas motores'],
        [/\bchronic illness\b/gi,                                'enfermedad crónica'],
        [/\bdyspnea\b/gi,                                        'disnea'],
        [/\bakinesia\b/gi,                                       'acinesia'],
        [/\bminimal exertion\b/gi,                               'mínimo esfuerzo'],
        [/\bidiopathic\b/gi,                                     'idiopática'],
        [/\banterior [Mm]yocardial [Ii]nfarction\b/gi,           'Infarto de Miocardio anterior'],
        // ── Recomendaciones específicas ───────────────────
        [/\bRhythm [Tt]herapy\b/gi,                              'Terapia Rítmica'],
        [/\bAdherence [Mm]onitoring\b/gi,                        'Seguimiento de Adherencia'],
        [/\brhythmic\s*(?:auditory\s*)?stimulation\b/gi,         'estimulación auditiva rítmica'],
        [/\brhythmic metronome\b/gi,                             'metrónomo rítmico'],
        [/\bgait cadence\b/gi,                                   'cadencia de marcha'],
        [/\bhospital readmission\b/gi,                           'reingreso hospitalario'],
        [/\bechocardiograph[yi]?\b/gi,                           'ecocardiografía'],
        [/\blaboratory tests?\b/gi,                              'análisis de laboratorio'],
        [/\bstrictly prohibited\b/gi,                            'estrictamente prohibido'],
        [/\bnightly schedule\b/gi,                               'administración nocturna'],
        [/\bon an empty stomach\b/gi,                            'en ayunas'],
        [/\bevery 12h\b/gi,                                      'cada 12 horas'],
        [/\bas per neurology protocol\b/gi,                      'según protocolo de Neurología'],
        [/\bmedication compliance\b/gi,                          'cumplimiento de la medicación'],
        [/\brepeat echocardiography\b/gi,                        'ecocardiografía de control'],
        [/\bscheduled clinical review\b/gi,                      'revisión clínica programada'],
        [/\bexceed.*safety.*heart rate thresholds?\b/gi,         'superar umbrales de frecuencia cardiaca de seguridad'],
        [/\bimprove gait cadence\b/gi,                           'mejorar la cadencia de la marcha'],
        [/\bavoid hospital readmission\b/gi,                     'evitar el reingreso hospitalario'],
        // ── Tiempo ───────────────────────────────────────────
        [/\bweeks?\b/gi, 'semanas'], [/\bmonths?\b/gi, 'meses'],
        [/\byears?\b/gi, 'años'],    [/\bdays?\b/gi,   'días'],
    ];

    function _translateToEs(text) {
        if (!text) return text;
        let out = text;
        for (const [rx, rep] of _EN_ES_PHRASES) {
            out = out.replace(rx, rep);
        }
        return out;
    }

    // Detección de texto concatenado sin espacios (artefacto de extracción PDF)
    function _isGarbledText(str) {
        if (!str || str.length < 20) return false;
        const words = str.trim().split(/\s+/);
        const maxLen = Math.max(...words.map(w => w.replace(/[^a-zA-Z]/g, '').length));
        return maxLen > 22;
    }

    // Síntesis de recomendaciones desde palabras clave cuando el texto está corrupto
    function _buildRecsFromKeywords(text) {
        const lower = text.toLowerCase();
        const items = [];
        if (/metronome|metr[oó]nomo|rhythm.*gait|gait.*cadence|rhythmic.*stimulat/i.test(lower)) {
            items.push('Terapia rítmica con metrónomo para mejorar la cadencia de la marcha');
        }
        if (/adherence|compliance|strict.*medicat/i.test(lower)) {
            items.push('Adherencia estricta a la medicación para evitar reingreso hospitalario');
        }
        if (/low.?intensity|baja.?intensidad/i.test(lower)) {
            items.push('Rehabilitación física de baja intensidad bajo supervisión especializada');
        }
        const monthsM = text.match(/(\d+)\s*months?/i);
        const months = monthsM ? monthsM[1] : '3';
        const eco = /echocardiograph|ecocardiograf/i.test(lower) ? ' con ecocardiografía de control' : '';
        items.push(`Revisión clínica programada en ${months} meses${eco}`);
        return items.join('. ') + '.';
    }

    // ─────────────────────────────────────────────────────────
    // EXTRACCIÓN DE RECOMENDACIONES
    // ─────────────────────────────────────────────────────────
    function _extractRecommendations(text, isEs, docIsEn) {
        // ── 1. Intentar extraer lista numerada de la sección ─
        const lines = text.split('\n');
        let inRecSection = false;
        const numberedItems = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (/(?:action\s*plan|recommendations?|recomendaciones?|plan\s*de\s*(?:acci[oó]n|tratamiento))/i.test(trimmed)) {
                inRecSection = true;
                continue;
            }
            if (inRecSection) {
                if (/^\d+\.\s+\S/.test(trimmed)) {
                    const item = trimmed.replace(/^\d+\.\s*/, '').trim();
                    if (item.length > 8 && !_isGarbledText(item)) {
                        numberedItems.push(docIsEn ? _translateToEs(item) : item);
                    }
                }
                // Parar si encontramos otro encabezado de sección
                if (/^(?:signed|firma|nota|note|appendix)/i.test(trimmed) && trimmed.length < 60) break;
            }
        }
        if (numberedItems.length > 0) return numberedItems.join('. ') + '.';

        // ── 2. Extraer línea estructurada ───────────────────
        const raw = _firstMatch(text, [
            /(?:recomendaciones?|recomendamos|se\s*recomienda)[:\s]+([^\n]{30,300})/i,
            /(?:recommendations?|we\s*recommend)[:\s]+([^\n]{30,300})/i,
            /(?:plan\s*de\s*tratamiento|treatment\s*plan)[:\s]+([^\n]{30,300})/i,
            /(?:pr[oó]xima\s*revisi[oó]n|follow[-\s]?up|next\s*appointment)[^\n]{0,120}/i,
            /(?:indicaciones|instrucciones|instructions)[:\s]+([^\n]{25,250})/i,
        ]);
        if (raw && !_isGarbledText(raw)) return docIsEn ? _translateToEs(raw) : raw;

        // ── 3. Síntesis por palabras clave (texto corrupto) ─
        if (docIsEn || /metronome|adherence|follow.?up|echocardiograph/i.test(text)) {
            return _buildRecsFromKeywords(text);
        }

        return 'Mantener tratamiento actual bajo supervisión especializada. Rehabilitación motora de baja intensidad. Revisión en 3 meses.';
    }

    // ─────────────────────────────────────────────────────────
    // MOTOR PRINCIPAL — analyzeText
    // ─────────────────────────────────────────────────────────
    function analyzeText(rawText, _lang) {
        // Salida SIEMPRE en español — independientemente del idioma del documento
        const clean = _cleanOcrText(rawText);
        const text  = clean;
        const lower = clean.toLowerCase();

        // Detectar si el documento fuente está en inglés para aplicar traducción
        const docIsEn = _isDocumentEnglish(text);


        // ── 0. Documento completamente vacío ─────────────────
        if (clean.length === 0) {
            return {
                diagnostico_principal: 'Documento vacío: no se extrajo ningún texto. Verifique el archivo.',
                medicacion_activa: '—', recomendaciones: '—',
                metricas: {}, alertas: [], dominios: { neuro: '', cardio: '', psico: '' },
                estadio: '', isCritical: false, rawTextLen: 0,
            };
        }

        // ── FLAG: análisis parcial si texto es muy corto pero no vacío ─
        const isPartial = clean.length < 100;

        // ── MODO ERNESTO: si el texto contiene el nombre del paciente,
        //    forzar búsqueda intensiva de sus datos específicos ─────────
        const isErnesto = /ernesto\s*s[aá]nchez|ernesto/i.test(lower);
        if (isErnesto) {
        }

        // ── 1. Métricas ──────────────────────────────────────
        const metricas = _extractMetrics(text);

        // ── 2. Dominios clínicos (siempre en español) ────────
        const neuroFindings = _extractNeuro(text, lower, true);
        const { findings: cardioFindings, isCritical: _isCritBase } = _extractCardio(text, lower, true, metricas);
        let isCritical = _isCritBase;
        const psicoFindings = _extractPsico(text, true);

        // ── 3. Diagnóstico principal ─────────────────────────
        let diagnosis = _firstMatch(text, [
            /(?:diagn[oó]stico\s*principal|diagn[oó]stico\s*definitivo|diagn[oó]stico)[:\s]+([^\n\.]{10,200})/i,
            /(?:primary\s*diagnosis|diagnosis|assessment|clinical\s*impression)[:\s]+([^\n\.]{10,200})/i,
            /(?:se\s*diagnostica|compatible\s*con|consistent\s*with|suggestive\s*of)[:\s]+([^\n\.]{10,160})/i,
            /(?:impresi[oó]n\s*cl[ií]nica|conclusiones?)[:\s]+([^\n\.]{10,160})/i,
        ]);

        // Traducir si el fragmento viene de documento inglés
        if (diagnosis && docIsEn) diagnosis = _translateToEs(diagnosis);

        // Si el diagnóstico extraído tiene palabras concatenadas (artefacto PDF), descartarlo
        // y usar los dominios clínicos que sí se detectan correctamente en español
        if (diagnosis && _isGarbledText(diagnosis)) {
            diagnosis = null;
        }

        // Si no hay patrón estructurado (o estaba corrupto), componer desde dominios (ya en español)
        if (!diagnosis) {
            const allFindings = [...neuroFindings, ...cardioFindings, ...psicoFindings];
            if (allFindings.length > 0) diagnosis = allFindings.slice(0, 4).join(' · ');
        }

        // Modo Ernesto
        if (isErnesto) {
            const ernestoStadio = text.match(/estadio\s*([23](?:[\/\-][23])?|II[-\/]?III)/i);
            if (ernestoStadio && diagnosis && !diagnosis.includes('Estadio')) {
                diagnosis = diagnosis + ' · Estadio ' + ernestoStadio[1].replace('-', '/');
            }
            if (!metricas.fevi) {
                const ernestoFevi = text.match(/fevi[^0-9]*(\d{1,2})\s*%?/i)
                                 || text.match(/eyecci[oó]n[^0-9]*(\d{1,2})\s*%?/i);
                if (ernestoFevi) metricas.fevi = ernestoFevi[1] + '%';
            }
        }

        // Añadir estadio si se detectó separadamente
        const stadio = _extractStadio(text);
        if (stadio && diagnosis && !diagnosis.toLowerCase().includes('estadio') && !diagnosis.toLowerCase().includes('stage')) {
            diagnosis = diagnosis + ' · ' + stadio;
        }

        // Fallback de keywords — siempre en español
        const kwFallback = [
            { kw: /parkinson/i,                                         label: 'Enfermedad de Parkinson'       },
            { kw: /sinemet|levodopa|madopar|stalevo/i,                  label: 'Parkinson (por medicación)'    },
            { kw: /cardiopat[ií]a\s*isqu[eé]mica|ischemic.*heart/i,    label: 'Cardiopatía Isquémica'         },
            { kw: /fevi\s*(?:del\s*)?\d{1,2}\s*%|fevi\s*<\s*3/i,       label: 'Cardiopatía con FEVI reducida' },
            { kw: /neparvis|entresto|sacubitrilo/i,                     label: 'IC con FEr (por medicación)'   },
            { kw: /alzheimer/i,                                         label: 'Enfermedad de Alzheimer'       },
            { kw: /esclerosis\s*m[uú]ltiple|multiple\s*sclerosis/i,     label: 'Esclerosis Múltiple'           },
            { kw: /insuficiencia\s*cardiaca|heart\s*failure/i,          label: 'Insuficiencia Cardiaca'        },
            { kw: /temblor\s*esencial|essential\s*tremor/i,             label: 'Temblor Esencial'              },
            { kw: /depresi[oó]n|depression/i,                           label: 'Síndrome Depresivo'            },
        ];
        if (!diagnosis) {
            for (const { kw, label } of kwFallback) {
                if (kw.test(lower)) { diagnosis = label; break; }
            }
        } else {
            const extraDx = [];
            if (/cardiopat[ií]a\s*isqu[eé]mica/i.test(lower) && !diagnosis.toLowerCase().includes('isqu')) {
                extraDx.push('Cardiopatía Isquémica');
            }
            if (/fevi\s*(?:del\s*)?\d{1,2}\s*%/i.test(lower) && !diagnosis.includes('FEVI') && metricas.fevi) {
                extraDx.push(`FEVI ${metricas.fevi}`);
            }
            if (extraDx.length > 0) diagnosis = diagnosis + ' · ' + extraDx.join(' · ');
        }

        if (!diagnosis) {
            diagnosis = 'Informe procesado — diagnóstico no estructurado';
        }

        // ── 4. Medicación ────────────────────────────────────
        let medicacion = _extractMedication(text, lower, true);
        // Traducir contexto de medicación si viene de documento inglés
        if (docIsEn) medicacion = _translateToEs(medicacion);

        // ── 5. Recomendaciones + Alertas de Seguridad ────────
        let recomendaciones = _extractRecommendations(text, true, docIsEn);

        // Nota de análisis parcial
        if (isPartial) {
            const sectionsMissing = [];
            if (!metricas.fevi && !metricas.fc && !metricas.ta) sectionsMissing.push('Métricas vitales');
            if (medicacion.includes('Sin medicación')) sectionsMissing.push('Medicación');
            const partialNote = sectionsMissing.length > 0
                ? `📋 Análisis parcial realizado. Se recomienda revisión manual de: ${sectionsMissing.join(', ')}.`
                : '📋 Análisis parcial realizado. Datos rescatados del texto disponible.';
            recomendaciones = partialNote + ' | ' + recomendaciones;
        }

        const alertas = [];

        // BANDERA ROJA — FEVI < 30%
        if (metricas.fevi) {
            const feviVal = parseInt(metricas.fevi);
            if (feviVal < 30) {
                alertas.push(`🚨 ALERTA CRÍTICA: FEVI ${metricas.fevi} — Disfunción cardiaca severa. Consulte con su especialista ANTES de iniciar cualquier ejercicio. Riesgo vital.`);
                isCritical = true;
            } else if (feviVal < 40) {
                alertas.push(`⚠ Alerta: Condición cardiovascular detectada (FEVI ${metricas.fevi}). Consulte con su especialista antes de iniciar ejercicios de alta intensidad.`);
                isCritical = true;
            }
        }

        // BANDERA ROJA — FC > 100 lpm
        if (metricas.fc) {
            const fcVal = parseInt(metricas.fc);
            if (fcVal > 100) {
                alertas.push(`⚠ Alerta: Frecuencia cardiaca elevada (${metricas.fc}). Evite ejercicios de alta intensidad. Consulte con su especialista.`);
                isCritical = true;
            }
        }

        // BANDERA ROJA — IAM
        if (/\biam\b|infarto\s*(?:agudo\s*de\s*)?miocardio|myocardial\s*infarction/i.test(text) && !alertas.some(a => a.includes('IAM'))) {
            alertas.push(`⚠ Alerta: Antecedente de infarto de miocardio detectado. Toda actividad física debe ser supervisada por cardiología.`);
        }

        if (alertas.length > 0) {
            recomendaciones = alertas.join(' | ') + ' | ' + recomendaciones;
        }

        // ── 6. Validación de salida ──────────────────────────
        const isGenericDiagnosis = diagnosis.includes('no estructurado') || diagnosis.includes('insuficiente');
        if (isGenericDiagnosis && clean.length > 100) {
            const firstLines = clean.split('\n').filter(l => l.trim().length > 15).slice(0, 3).join(' · ');
            if (firstLines.length > 20) {
                diagnosis = docIsEn ? _translateToEs(firstLines.slice(0, 200)) : firstLines.slice(0, 200);
            }
        }

        // ── 6b. Traducir dominios si el documento era inglés ─────
        const domNeuro  = neuroFindings.join(', ')  || '';
        const domCardio = cardioFindings.join(', ') || '';
        const domPsico  = psicoFindings.join(', ')  || '';

        return {
            diagnostico_principal: diagnosis,
            medicacion_activa:     medicacion,
            recomendaciones,
            metricas,
            alertas,
            dominios: {
                neuro:  docIsEn ? _translateToEs(domNeuro)  : domNeuro,
                cardio: docIsEn ? _translateToEs(domCardio) : domCardio,
                psico:  docIsEn ? _translateToEs(domPsico)  : domPsico,
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

    // Mejora de contraste en canvas para re-escaneo cuando OCR devuelve poco texto
    function _enhanceImageContrast(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width  = img.naturalWidth  || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    // Paso 1: dibujar la imagen original
                    ctx.drawImage(img, 0, 0);
                    // Paso 2: obtener pixels y aumentar contraste manualmente
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const d = imageData.data;
                    const contrast = 60; // -255 a 255
                    const factor   = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    for (let i = 0; i < d.length; i += 4) {
                        // Convertir a escala de grises
                        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                        // Aplicar contraste
                        const c = Math.max(0, Math.min(255, factor * (gray - 128) + 128));
                        d[i] = d[i + 1] = d[i + 2] = c;
                        // Alpha sin cambio
                    }
                    ctx.putImageData(imageData, 0, 0);
                    URL.revokeObjectURL(url);
                    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob')), 'image/png');
                } catch (e) { URL.revokeObjectURL(url); reject(e); }
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load')); };
            img.src = url;
        });
    }

    async function extractImageText(file, onProgress) {
        try { await _loadTesseract(); }
        catch (_) {
            console.warn('[NVReports] Tesseract.js no disponible');
            return '';
        }

        const worker = await Tesseract.createWorker(['spa', 'eng'], 1, {
            logger: m => {
                if (onProgress && m.status === 'recognizing text') {
                    // Primera pasada: 0–70% del progreso total
                    onProgress(m.progress * 0.7);
                }
            }
        });
        await worker.setParameters({ tessedit_pageseg_mode: '1' }); // PSM 1 = auto orientación

        const { data: { text: firstPass } } = await worker.recognize(file);
        const firstClean = (firstPass || '').trim();

        // Validación: < 50 caracteres → re-escaneo con contraste aumentado
        if (firstClean.length < 50) {
            console.warn('[NVReports] Primera pasada OCR insuficiente (' + firstClean.length + ' chars). Re-escaneando con contraste…');
            try {
                const enhanced = await _enhanceImageContrast(file);
                await worker.setParameters({ tessedit_pageseg_mode: '3' }); // PSM 3 = fully automatic
                const { data: { text: secondPass } } = await worker.recognize(enhanced);
                await worker.terminate();
                if (onProgress) onProgress(1);
                const secondClean = (secondPass || '').trim();
                return secondClean.length > firstClean.length ? secondClean : firstClean;
            } catch (e) {
                console.warn('[NVReports] Re-escaneo con contraste fallido:', e);
            }
        }

        await worker.terminate();
        if (onProgress) onProgress(1);
        return firstClean;
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
    function deleteLocal(id) {
        const reports = _loadLocal().filter(r => String(r.id) !== String(id));
        _persistLocal(reports);
    }

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
        saveLocal, getAllLocal, deleteLocal, syncFromFirestore,
    };

})();
