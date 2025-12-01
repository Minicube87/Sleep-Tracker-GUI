/**
 * Sleep Tracker - Backend API Handler
 * Serverless function for Vercel deployment
 * Integrates with OpenAI Chat Completion API
 */

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
        
        // Call OpenAI API
        const analysis = await callOpenAIAPI(apiKey, systemPrompt, userPrompt);
        
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

Du analysierst Schlaf-Daten und gibst strukturierte Analysen in folgendem JSON-Format zurück:

\`\`\`json
{
  "score": "Eine Bewertung von 1-100 mit Emoji (z.B. 75/100 ⭐⭐⭐)",
  "analysis": "Detaillierte Analyse der Schlafqualität (max 150 Worte). Erkläre kurz, was die Zahlen bedeuten.",
  "trend": "Trend-Analyse für die letzten 9 Tage basierend auf den vorliegenden Daten (max 100 Worte). Wenn nur ein Tag vorliegt, erkläre, dass zu wenig Daten für Trend-Analyse vorhanden sind.",
  "recommendation": "3-5 konkrete, umsetzbaren Empfehlungen zur Verbesserung (max 150 Worte). Format: Nummerierte Liste."
}
\`\`\`

WICHTIG:
- Antworte IMMER mit gültigem JSON
- Nutze deutsche Sprache
- Beachte die Zeichenlimits
- Sei konstruktiv und motivierend
- Berücksichtige REM, Light und Deep Sleep Verhältnisse
- Ein guter REM-Anteil ist ~20-25% der Gesamtschlafdauer
- Deep Sleep sollte ~13-23% sein
- Länger als 10min Wach ist suboptimal`;
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
- Zeitspanne: ${formattedData.sleepSpan}

Gebe die Analyse als JSON im vorgegeben Format zurück.`;
}

/**
 * Call OpenAI Chat Completion API
 */
async function callOpenAIAPI(apiKey, systemPrompt, userPrompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const payload = {
        model: 'gpt-4o-mini',
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
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
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
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
            );
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected OpenAI response format');
        }
        
        const content = data.choices[0].message.content;
        console.log('OpenAI Response:', content);
        
        return content;
        
    } catch (error) {
        console.error('OpenAI API call failed:', error);
        throw new Error(`OpenAI API-Fehler: ${error.message}`);
    }
}

/**
 * Parse and structure the analysis from OpenAI
 */
function parseAnalysis(analysisText) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.warn('No JSON found in response, using raw text');
            return {
                analysis: analysisText,
                score: 'N/A',
                trend: 'N/A',
                recommendation: 'N/A'
            };
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
            score: parsed.score || 'N/A',
            analysis: parsed.analysis || '',
            trend: parsed.trend || '',
            recommendation: parsed.recommendation || ''
        };
        
    } catch (error) {
        console.error('Failed to parse analysis:', error);
        return {
            analysis: analysisText,
            score: 'N/A',
            trend: 'N/A',
            recommendation: 'N/A'
        };
    }
}

// Export for testing
module.exports.formatSleepData = formatSleepData;
module.exports.validateSleepInput = validateSleepInput;
