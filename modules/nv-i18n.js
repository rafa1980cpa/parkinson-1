/**
 * NeuroTempo PRO — Módulo i18n
 * ─────────────────────────────────────────────────────────────────────
 * Sistema de internacionalización basado en archivos JSON externos.
 * Carga locales/es.json + locales/en.json de forma síncrona (XHR)
 * para que t() sea siempre síncrono sin riesgo de race conditions.
 *
 * API pública: window.NVI18n
 *   init(lang)                          → carga ambos JSON, devuelve Promise
 *   t(key, vars?)                       → string traducido
 *   getLang()                           → 'es' | 'en'
 *   setLang(lang, uid?)                 → cambia idioma + persiste Firestore
 *   getTranslatedClinicalStatus(s, l)   → estado clínico ES→EN o EN→ES
 *   getTranslatedClinicalText(text, l)  → traducción de texto libre clínico
 *   getTranslatedMedInstruction(t, l)   → instrucciones de medicación
 */
(function () {
    'use strict';

    // ── Cache de traducciones ──────────────────────────────────
    const _data = { es: null, en: null };
    let _lang = 'es';
    let _initialized = false;

    // ── Carga síncrona de un JSON ──────────────────────────────
    function _loadJsonSync(url) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, false); // synchronous — archivos pequeños (<6 KB)
            xhr.send(null);
            if (xhr.status === 200 || xhr.status === 0 /* file:// */) {
                return JSON.parse(xhr.responseText);
            }
        } catch (e) {
            console.warn('[NVI18n] No se pudo cargar:', url, e.message);
        }
        return {};
    }

    /**
     * Inicializa el módulo cargando ambos idiomas.
     * Debe llamarse antes del primer render.
     * @param {string} lang  'es' | 'en'
     * @returns {Promise<void>}
     */
    function init(lang) {
        _lang = lang || 'es';
        if (!_initialized) {
            _data.es = _loadJsonSync('/locales/es.json');
            _data.en = _loadJsonSync('/locales/en.json');
            _initialized = true;
        }
        return Promise.resolve();
    }

    /**
     * Devuelve la cadena traducida para la clave dada.
     * Interpolación: t('hello', { name: 'Ana' }) con "Hola {name}" → "Hola Ana"
     * @param {string} key
     * @param {Object} [vars]
     */
    function t(key, vars) {
        const dict = (_data[_lang] && Object.keys(_data[_lang]).length)
            ? _data[_lang]
            : (_data.es || {});
        let str = dict[key];
        if (str === undefined) return key; // devuelve la clave como fallback visible
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                str = str.replace(`{${k}}`, v);
            }
        }
        return str;
    }

    /** Devuelve el idioma activo. */
    function getLang() { return _lang; }

    /**
     * Cambia el idioma activo, lo persiste en localStorage y,
     * opcionalmente, en Firestore si se proporciona uid.
     * Dispara el evento personalizado 'nv:langchange'.
     */
    async function setLang(lang, uid) {
        _lang = lang;
        localStorage.setItem('nv_lang', lang);

        // Persistencia en Firestore
        if (uid && window.NVFirebase && NVFirebase.isReady()) {
            try {
                await NVFirebase.saveSettings(uid, { lang });
                console.log('[NVI18n] Idioma guardado en Firestore:', lang);
            } catch (e) {
                console.warn('[NVI18n] No se pudo guardar en Firestore:', e.message);
            }
        }

        // Notificar a la app para re-render
        window.dispatchEvent(new CustomEvent('nv:langchange', { detail: { lang } }));
    }

    // ══════════════════════════════════════════════════════════════
    // MAPEO CLÍNICO BIDIRECCIONAL  (ES ↔ EN)
    // Fuente de verdad: salida del motor NLP (siempre español)
    // ══════════════════════════════════════════════════════════════

    /** Mapeo ES → EN para términos clínicos */
    const _ES_EN = {
        // Neurológico
        'Enfermedad de Parkinson':              "Parkinson's Disease",
        'Bradicinesia':                         'Bradykinesia',
        'Bradicinesia / Rigidez':               'Bradykinesia / Rigidity',
        'Temblor':                              'Tremor',
        'Temblor Esencial':                     'Essential Tremor',
        'Rigidez':                              'Rigidity',
        'Alteración de la Marcha':              'Gait Alteration',
        'Congelación de la Marcha':             'Freezing of Gait',
        'Congelación de Marcha (FOG)':          'Freezing of Gait (FOG)',
        'Deterioro Cognitivo':                  'Cognitive Impairment',
        'Disartria / Disfagia':                 'Dysarthria / Dysphagia',
        'ACV / Ictus':                          'Stroke / CVA',
        'ELA':                                  'ALS',
        'Esclerosis Múltiple':                  'Multiple Sclerosis',
        'Enfermedad de Alzheimer':              "Alzheimer's Disease",
        'Epilepsia':                            'Epilepsy',
        'Migraña':                              'Migraine',
        // Cardiológico
        'Insuficiencia Cardíaca':               'Heart Failure',
        'Insuficiencia Cardiaca':               'Heart Failure',
        'ICFEr (Insuficiencia Cardiaca)':       'HFrEF (Heart Failure)',
        'Insuficiencia Cardiaca descompensada': 'Decompensated Heart Failure',
        'Cardiopatía Isquémica':                'Ischemic Heart Disease',
        'Cardiopatía Coronaria':                'Coronary Artery Disease',
        'IAM (Infarto de Miocardio)':           'Myocardial Infarction (AMI)',
        'Infarto de Miocardio':                 'Myocardial Infarction',
        'Infarto de Miocardio anterior':        'Anterior Myocardial Infarction',
        'Cardiopatía con FEVI reducida':        'Reduced EF Cardiomyopathy',
        'IC con FEr (por medicación)':          'HFrEF (per medication)',
        'Fibrilación Auricular / Arritmia':     'Atrial Fibrillation / Arrhythmia',
        'Hipertensión Pulmonar':                'Pulmonary Hypertension',
        'Valvulopatía':                         'Valvular Disease',
        'Hipertensión':                         'Hypertension',
        'Disfunción Ventricular Izquierda':     'Left Ventricular Dysfunction',
        'disfunción ventricular':               'ventricular dysfunction',
        'disfunción ventricular grave':         'severe ventricular dysfunction',
        // Psicológico
        'Síndrome Depresivo':                   'Depressive Syndrome',
        'Depresión Mayor':                      'Major Depression',
        'Trastorno de Ansiedad':                'Anxiety Disorder',
        'Psicosis / Alucinaciones':             'Psychosis / Hallucinations',
        'Trastorno del Sueño':                  'Sleep Disorder',
        // Alertas
        'Alerta Crítica':                       'Critical Alert',
        'Estado Crítico':                       'Critical State',
        // Otros
        'Enfermedad Renal Crónica':             'Chronic Kidney Disease',
        'Insuficiencia Renal':                  'Renal Failure',
        'Diabetes Mellitus':                    'Diabetes Mellitus',
        'Diabetes Tipo 2':                      'Type 2 Diabetes',
        'Hipotiroidismo':                       'Hypothyroidism',
        'Hipertiroidismo':                      'Hyperthyroidism',
        'Anemia':                               'Anemia',
        'EPOC':                                 'COPD',
        'Asma':                                 'Asthma',
        'Osteoporosis':                         'Osteoporosis',
        'Osteoartritis':                        'Osteoarthritis',
        'Artritis Reumatoide':                  'Rheumatoid Arthritis',
        'Apnea del Sueño':                      'Sleep Apnea',
        'Parkinson (por medicación)':           "Parkinson's (per medication)",
    };

    /** Mapeo ES → EN para frases en texto libre clínico */
    const _ES_EN_PHRASES = [
        // Alertas críticas
        [/🚨\s*ALERTA CRÍTICA:/g,               '🚨 CRITICAL ALERT:'],
        [/⚠\s*Alerta:/g,                         '⚠ Alert:'],
        [/⚠\s*ALERTA CRÍTICA:/g,                 '⚠ CRITICAL ALERT:'],
        // Frases de seguridad
        [/Consulte con su especialista ANTES de iniciar cualquier ejercicio\./gi,
         'Consult your specialist BEFORE starting any exercise.'],
        [/Consulte con su especialista antes de iniciar ejercicios de alta intensidad\./gi,
         'Consult your specialist before starting high-intensity exercise.'],
        [/Toda actividad física debe ser supervisada por cardiología\./gi,
         'All physical activity must be supervised by cardiology.'],
        [/Antecedente de infarto de miocardio detectado\./gi,
         'History of myocardial infarction detected.'],
        [/Riesgo vital\./gi,                     'Vital risk.'],
        [/Disfunción cardiaca severa\./gi,       'Severe cardiac dysfunction.'],
        [/Condición cardiovascular detectada/gi, 'Cardiovascular condition detected'],
        // Recomendaciones comunes
        [/Mantener tratamiento actual bajo supervisión especializada\./gi,
         'Continue current treatment under specialist supervision.'],
        [/Rehabilitación motora de baja intensidad\./gi,
         'Low-intensity motor rehabilitation.'],
        [/Rehabilitación física de baja intensidad bajo supervisión especializada\./gi,
         'Low-intensity physical rehabilitation under specialist supervision.'],
        [/Revisión en (\d+) meses/gi,           'Review in $1 months'],
        [/Revisión clínica programada en (\d+) meses/gi, 'Scheduled clinical review in $1 months'],
        [/con ecocardiografía de control/gi,    'with follow-up echocardiography'],
        [/Terapia rítmica con metrónomo para mejorar (?:la )?cadencia de (?:la )?marcha/gi,
         'Rhythmic therapy with metronome to improve gait cadence'],
        [/Adherencia estricta a (?:la )?medicación para evitar reingreso hospitalario/gi,
         'Strict medication adherence to avoid hospital readmission'],
        [/Adherencia estricta a la medicación para evitar reingreso hospitalario\./gi,
         'Strict medication adherence to avoid hospital readmission.'],
        // Recomendaciones — ejercicio y actividad física
        [/\bejercicio de alta intensidad\b/gi,  'high-intensity exercise'],
        [/\bejercicio físico\b/gi,              'physical exercise'],
        [/\bejercicio\b/gi,                     'exercise'],
        [/\bactividad física\b/gi,              'physical activity'],
        [/\bactividad moderada\b/gi,            'moderate activity'],
        // Recomendaciones — supervisión y seguimiento
        [/\bsupervisión especializada\b/gi,     'specialist supervision'],
        [/\bsupervisión médica\b/gi,            'medical supervision'],
        [/\bsupervisión\b/gi,                   'supervision'],
        [/\bseguimiento\b/gi,                   'follow-up'],
        [/\bcontrol periódico\b/gi,             'periodic monitoring'],
        [/\bmonitorización\b/gi,                'monitoring'],
        // Recomendaciones — revisiones / controles
        [/Revisión en (\d+) meses/gi,           'Clinical review in $1 months'],
        [/Revisión clínica en (\d+) meses/gi,   'Clinical review in $1 months'],
        [/Revisión clínica programada en (\d+) meses/gi, 'Scheduled clinical review in $1 months'],
        [/\brevisión\b/gi,                      'review'],
        [/\bconsulta de seguimiento\b/gi,       'follow-up consultation'],
        [/\bconsulta\b/gi,                      'consultation'],
        // Recomendaciones — medicación
        [/\badherencia a (?:la )?medicación\b/gi, 'medication adherence'],
        [/\btratamiento farmacológico\b/gi,     'pharmacological treatment'],
        [/\btratamiento actual\b/gi,            'current treatment'],
        [/\btratamiento\b/gi,                   'treatment'],
        [/\bajuste de dosis\b/gi,               'dose adjustment'],
        // Recomendaciones — rehabilitación
        [/\brehabilitación motora\b/gi,         'motor rehabilitation'],
        [/\brehabilitación física\b/gi,         'physical rehabilitation'],
        [/\brehabilitación\b/gi,                'rehabilitation'],
        [/\bfisioterapia\b/gi,                  'physiotherapy'],
        [/\blogopedia\b/gi,                     'speech therapy'],
        // Recomendaciones — nutrición y sueño
        [/\bdieta equilibrada\b/gi,             'balanced diet'],
        [/\bhidratación\b/gi,                   'hydration'],
        [/\bcalidad del sueño\b/gi,             'sleep quality'],
        [/\bhigiene del sueño\b/gi,             'sleep hygiene'],
        // Recomendaciones — especialistas
        [/\bneurología\b/gi,                    'Neurology'],
        [/\bcardiología\b/gi,                   'Cardiology'],
        [/\bpsiquiatría\b/gi,                   'Psychiatry'],
        [/\bpsicología\b/gi,                    'Psychology'],
        [/\bgeriatría\b/gi,                     'Geriatrics'],
        [/\bfisiatra\b/gi,                      'physiatrist'],
        [/\bespecialista\b/gi,                  'specialist'],
        // Análisis parcial
        [/📋 Análisis parcial realizado\./gi,   '📋 Partial analysis performed.'],
        [/Se recomienda revisión manual de:/gi, 'Manual review recommended for:'],
        // Métricas
        [/\bFEVI\b/g,                           'LVEF'],
    ];

    /**
     * Traduce un estado clínico compuesto (separado por · )
     * del español al idioma destino.
     * @param {string} status  Ej: "Enfermedad de Parkinson · Estadio 2/3 · FEVI: 22%"
     * @param {string} lang    'es' | 'en'
     * @returns {string}
     */
    function getTranslatedClinicalStatus(status, lang) {
        if (!status || lang === 'es') return status;

        return status
            .split(' · ')
            .map(part => {
                const trimmed = part.trim();

                // Lookup directo
                if (_ES_EN[trimmed]) return _ES_EN[trimmed];

                // "Estadio X" → "Stage X"
                const stadioM = trimmed.match(/^Estadio\s+(.+)$/i);
                if (stadioM) return `Stage ${stadioM[1]}`;

                // "FEVI: X%" → "LVEF: X%"
                if (/^FEVI[:\s]/i.test(trimmed)) return trimmed.replace(/^FEVI/i, 'LVEF');

                // "Parkinson (por medicación)" - handled above
                // Partial matches — split token-by-token for composite labels
                let out = trimmed;
                for (const [es, en] of Object.entries(_ES_EN)) {
                    if (out.includes(es)) out = out.replace(es, en);
                }
                return out;
            })
            .join(' · ');
    }

    /**
     * Traduce texto libre clínico (recomendaciones, alertas)
     * del español al idioma destino usando sustitución de frases.
     * @param {string} text
     * @param {string} lang
     * @returns {string}
     */
    function getTranslatedClinicalText(text, lang) {
        if (!text || lang === 'es') return text;
        let out = text;
        for (const [rx, rep] of _ES_EN_PHRASES) {
            out = out.replace(rx, rep);
        }
        return out;
    }

    /**
     * Traduce instrucciones de medicación estructuradas.
     * Los nombres de medicamentos no se traducen.
     * @param {string} text   Ej: "Tomar Levodopa 100mg tres veces al día"
     * @param {string} lang
     * @returns {string}
     */
    function getTranslatedMedInstruction(text, lang) {
        if (!text || lang === 'es') return text;
        return text
            .replace(/\bTomar\b/g,                          'Take')
            .replace(/\bAdministrar\b/g,                    'Administer')
            .replace(/\bAplicar\b/g,                        'Apply')
            .replace(/\bsegún necesidad\b/gi,               'as needed')
            .replace(/\bpor la mañana\b/gi,                 'in the morning')
            .replace(/\bpor la tarde\b/gi,                  'in the afternoon')
            .replace(/\bpor la noche\b/gi,                  'at night')
            .replace(/\bcon las comidas\b/gi,               'with meals')
            .replace(/\bal acostarse\b/gi,                  'at bedtime')
            .replace(/\ben ayunas\b/gi,                     'on an empty stomach')
            .replace(/\buna vez al día\b/gi,                'once daily')
            .replace(/\bdos veces al día\b/gi,              'twice daily')
            .replace(/\btres veces al día\b/gi,             'three times daily')
            .replace(/\bcuatro veces al día\b/gi,           'four times daily')
            .replace(/\bcada (\d+) horas?\b/gi,             'every $1 hours')
            .replace(/\badministración nocturna\b/gi,       'nightly schedule')
            .replace(/\bsegún protocolo de Neurología\b/gi,'per Neurology protocol')
            .replace(/\bSin medicación identificada en el texto\b/gi,
                     'No medication identified in the text');
    }

    /**
     * Punto de entrada unificado para traducir contenido dinámico del AssessmentCard.
     * Combina status clínico + texto libre clínico.
     * Usa el idioma activo (state.lang) si no se pasa lang explícito.
     * @param {string} text   Texto que puede ser estado clínico o texto libre
     * @param {string} [lang] 'es' | 'en' — opcional, por defecto usa _lang activo
     * @returns {string}
     */
    function translateDynamicContent(text, lang) {
        const l = lang || _lang;
        if (!text || l === 'es') return text;
        // 1. Intentar como estado clínico compuesto (contiene ·)
        const asStatus = getTranslatedClinicalStatus(text, l);
        // 2. Aplicar traducción de frases libres al resultado
        return getTranslatedClinicalText(asStatus, l);
    }

    // ── Exportar API pública ───────────────────────────────────
    window.NVI18n = {
        init,
        t,
        getLang,
        setLang,
        getTranslatedClinicalStatus,
        getTranslatedClinicalText,
        getTranslatedMedInstruction,
        translateDynamicContent,
    };

})();
