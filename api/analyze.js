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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
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
        
        console.log('Sending request to OpenAI...');
        console.log('API Key present:', !!apiKey);
        console.log('System prompt length:', systemPrompt.length);
        console.log('User prompt:', userPrompt);
        
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
function validateSleepInput(data) {
    if (!data) {
        return { valid: false, error: 'Keine Daten empfangen' };
    }
    
    const required = ['date', 'totalSleep', 'rem', 'light', 'deep', 'sleepTime'];
    for (const field of required) {
        if (!data[field]) {
            return { valid: false, error: `Feld erforderlich: ${field}` };
        }
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
        console.log('Fetching OpenAI API:', url);
        console.log('Payload:', JSON.stringify(payload));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Full OpenAI response:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            throw new Error(
                `OpenAI API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`
            );
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected OpenAI response format: ' + JSON.stringify(data));
        }
        
        const content = data.choices[0].message.content;
        console.log('OpenAI Response text:', content);
        
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
