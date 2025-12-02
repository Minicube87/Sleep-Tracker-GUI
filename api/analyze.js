/**
 * Sleep Tracker - Backend API Handler
 * Serverless function for Vercel deployment
 * Integrates with OpenAI Chat Completion API
 */

// Lade .env Variablen (lokal)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

// Use native fetch (Node.js 18+)
const fetch = globalThis.fetch;

/**
 * Main handler function for Vercel
 * Handles POST requests with sleep data
 */
module.exports = async (req, res) => {
    // CORS is handled by server.js middleware
    // This handler is called after CORS headers are already set
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    
    try {
        // Get API key from environment
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OPENAI_API_KEY not configured');
            return res.status(500).json({
                message: 'API-Konfiguration fehlt',
                code: 'MISSING_API_KEY'
            });
        }
        
        // Extract sleep data from request
        const sleepData = req.body;
        
        // Validate input
        const validation = validateSleepInput(sleepData);
        if (!validation.valid) {
            return res.status(400).json({
                message: validation.error,
                code: 'INVALID_INPUT'
            });
        }
        
        // Format data for analysis
        const formattedData = formatSleepData(sleepData);
        
        // Create prompt for OpenAI
        const systemPrompt = createSystemPrompt();
        const userPrompt = createUserPrompt(formattedData);
        
        // Minimal logging (no sensitive data)
        console.log('Processing sleep analysis request...');
        
        // Call OpenAI API
        const analysis = await callOpenAIAPI(apiKey, systemPrompt, userPrompt);
        console.log('Analysis received from OpenAI');
        
        // Parse and structure the response
        const structuredAnalysis = parseAnalysis(analysis);
        
        // Return response
        return res.status(200).json({
            success: true,
            message: 'Analyse erfolgreich erstellt',
            timestamp: new Date().toISOString(),
            rawData: formattedData,
            ...structuredAnalysis
        });
        
    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Interner Fehler bei der Analyse',
            code: 'ANALYSIS_ERROR'
        });
    }
};

/**
 * Validate sleep input data
 */
/**
 * Sanitize string input to prevent prompt injection
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    // Remove potential prompt injection patterns
    return str
        .replace(/ignore\s*(all|previous|above)/gi, '')
        .replace(/system\s*prompt/gi, '')
        .replace(/you\s*are\s*(now|a)/gi, '')
        .replace(/pretend\s*(to|you)/gi, '')
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim()
        .substring(0, 500); // Limit length
}

/**
 * Sanitize number input
 */
function sanitizeNumber(num, min = 0, max = 1440) {
    const parsed = parseInt(num, 10);
    if (isNaN(parsed)) return 0;
    return Math.max(min, Math.min(max, parsed));
}

/**
 * Sanitize time string (HH:MM format)
 */
function sanitizeTime(time) {
    if (typeof time !== 'string') return '00:00';
    const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    return match ? time : '00:00';
}

/**
 * Sanitize date string (YYYY-MM-DD format)
 */
function sanitizeDate(date) {
    if (typeof date !== 'string') return new Date().toISOString().split('T')[0];
    const match = date.match(/^\d{4}-\d{2}-\d{2}$/);
    return match ? date : new Date().toISOString().split('T')[0];
}

/**
 * Validate and sanitize sleep input data
 */
function validateSleepInput(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid request data' };
    }
    
    const required = ['date', 'totalSleep', 'rem', 'light', 'deep', 'sleepTime'];
    for (const field of required) {
        if (!data[field]) {
            return { valid: false, error: `Field required: ${field}` };
        }
    }
    
    // Sanitize all input data
    data.date = sanitizeDate(data.date);
    
    if (data.totalSleep) {
        data.totalSleep.hours = sanitizeNumber(data.totalSleep.hours, 0, 24);
        data.totalSleep.minutes = sanitizeNumber(data.totalSleep.minutes, 0, 59);
    }
    
    if (data.awake) {
        data.awake.minutes = sanitizeNumber(data.awake.minutes, 0, 480);
    }
    
    if (data.rem) {
        data.rem.hours = sanitizeNumber(data.rem.hours, 0, 12);
        data.rem.minutes = sanitizeNumber(data.rem.minutes, 0, 59);
    }
    
    if (data.light) {
        data.light.hours = sanitizeNumber(data.light.hours, 0, 12);
        data.light.minutes = sanitizeNumber(data.light.minutes, 0, 59);
    }
    
    if (data.deep) {
        data.deep.hours = sanitizeNumber(data.deep.hours, 0, 12);
        data.deep.minutes = sanitizeNumber(data.deep.minutes, 0, 59);
    }
    
    if (data.sleepTime) {
        data.sleepTime.from = sanitizeTime(data.sleepTime.from);
        data.sleepTime.to = sanitizeTime(data.sleepTime.to);
    }
    
    return { valid: true };
}

/**
 * Format sleep data into readable format
 */
function formatSleepData(sleepData) {
    return {
        date: sleepData.date,
        totalSleep: `${sleepData.totalSleep.hours}h ${sleepData.totalSleep.minutes}min`,
        awake: `${sleepData.awake.minutes}min`,
        rem: `${sleepData.rem.hours}h ${sleepData.rem.minutes}min`,
        light: `${sleepData.light.hours}h ${sleepData.light.minutes}min`,
        deep: `${sleepData.deep.hours}h ${sleepData.deep.minutes}min`,
        sleepSpan: `${sleepData.sleepTime.from} - ${sleepData.sleepTime.to}`
    };
}

/**
 * Create system prompt for OpenAI
 * Defines the analysis format and rules
 */
function createSystemPrompt() {
    return `Du bist ein Schlaf-Biohacking-Experte und Analyst für Schlafqualität.

Du analysierst Schlaf-Daten und gibst strukturierte Analysen in folgendem TEXT-Format zurück (NICHT JSON):

---

📊 Rohdaten – [DATUM]

Gesamtschlaf: [STUNDEN] h [MINUTEN] min
Wach: [MINUTEN] min
REM: [STUNDEN] h [MINUTEN] min
Kern: [STUNDEN] h [MINUTEN] min
Tief: [STUNDEN] h [MINUTEN] min
Zeitraum: [VON] – [BIS]

💯 Biohacker-Schlafscore

[TABELLE MIT SCORES]

➡️ Gesamt: [PUNKTE] / 50 = [PROZENT] % ([BEWERTUNG])

🧠 Analyse

[DETAILLIERTE ANALYSE - enthusiastisch, motivierend, konkret]

⚠️ Was verbessert werden könnte

[KONSTRUKTIVE TIPPS]

📈 9-Tage-Trend

[WENN VERFÜGBAR: Tabelle mit Verlauf]
[WENN NICHT VERFÜGBAR: "Zu wenig Daten vorhanden"]

🔥 Bottom Line

[ZUSAMMENFASSUNG IN 2-3 SÄTZEN]

---

WICHTIG:
- Antworte IMMER in DIESEM FORMAT (kein JSON!)
- Nutze deutsche Sprache
- Sei enthusiastisch und motivierend (wie im Beispiel)
- Verwende Emojis großzügig
- Scores: Gesamtschlaf (7.5-9h ideal), Tiefschlaf (1.5-2h ideal), REM (1.5-2.5h ideal), Wachphasen (<15min ideal), Kontinuität (ruhig ideal)
- Jeder Score 0-10 Punkte
- Gesamtscore aus 5 Kategorien = max 50 Punkte`;
}

/**
 * Create user prompt with sleep data
 */
function createUserPrompt(formattedData) {
    return `Analysiere folgende Schlaf-Daten vom ${formattedData.date}:

- Gesamtschlaf: ${formattedData.totalSleep}
- Wach (Awake): ${formattedData.awake}
- REM-Schlaf: ${formattedData.rem}
- Kern-Schlaf (Light): ${formattedData.light}
- Tief-Schlaf (Deep): ${formattedData.deep}
- Zeitspanne: ${formattedData.sleepSpan}`;
}

/**
 * Call OpenAI Chat Completion API
 */
async function callOpenAIAPI(apiKey, systemPrompt, userPrompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const payload = {
        model: 'gpt-4-turbo',
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userPrompt
            }
        ],
        temperature: 1,
        max_completion_tokens: 1500
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(
                `OpenAI API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`
            );
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected OpenAI response format: ' + JSON.stringify(data));
        }
        
        const content = data.choices[0].message.content;
        console.log('Analysis completed successfully');
        
        return content;
        
    } catch (error) {
        console.error('OpenAI API call failed:', error);
        throw new Error(`OpenAI API-Fehler: ${error.message}`);
    }
}

/**
 * Parse and structure the analysis from OpenAI
 * Extracts score from the analysis text
 */
function parseAnalysis(analysisText) {
    // Extract score from format: "➡️ Gesamt: 47 / 50 = 94 % (A+ Performance-Schlaf)"
    const scoreMatch = analysisText.match(/➡️\s*Gesamt:\s*(\d+)\s*\/\s*50\s*=\s*([\d.]+)\s*%\s*\(([^)]+)\)/);
    
    let score = 'Siehe Analyse oben';
    if (scoreMatch) {
        score = `${scoreMatch[2]}% (${scoreMatch[3]})`;
    }
    
    return {
        analysis: analysisText,
        score: score,
        trend: 'Siehe Analyse oben',
        recommendation: 'Siehe Analyse oben'
    };
}

// Export for testing
module.exports.formatSleepData = formatSleepData;
module.exports.validateSleepInput = validateSleepInput;
