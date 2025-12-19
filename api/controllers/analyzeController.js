/**
 * Sleep Analysis Controller
 * Handles incoming sleep analysis requests
 * 
 * Following SRP: Only handles HTTP request/response
 * Following DIP: Uses injected services and modules
 * 
 * @module controllers/analyzeController
 */

const { sanitizeSleepData } = require('../sanitizers/inputSanitizer');
const { validateSleepData } = require('../validators/sleepValidator');
const { createOpenAIService } = require('../services/openaiService');
const { getSleepAnalysisPrompts } = require('../prompts/sleepPrompts');
const { HttpError, createErrorResponse } = require('../middleware/errorHandler');

/**
 * Main analysis handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeHandler(req, res) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json(
            createErrorResponse(405, 'Method not allowed')
        );
    }
    
    try {
        // Get API key from environment
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json(
                createErrorResponse(500, 'API configuration missing', 'MISSING_API_KEY')
            );
        }
        
        // Sanitize input data
        const sanitizedData = sanitizeSleepData(req.body);
        
        // Validate input data
        const validation = validateSleepData(sanitizedData);
        
        if (!validation.valid) {
            return res.status(400).json(
                createErrorResponse(400, validation.errors.join(', '), 'INVALID_INPUT')
            );
        }
        
        // Generate prompts
        const { systemPrompt, userPrompt } = getSleepAnalysisPrompts(sanitizedData);
        
        // Create OpenAI service and call API
        const openaiService = createOpenAIService(fetch, apiKey);
        const result = await openaiService.sendChatCompletion(systemPrompt, userPrompt);
        
        if (!result.success) {
            return res.status(result.statusCode || 500).json(
                createErrorResponse(result.statusCode || 500, result.error, 'OPENAI_ERROR')
            );
        }
        
        // Parse and structure the response
        const structuredAnalysis = parseAnalysisText(result.content);
        
        // Return successful response
        return res.status(200).json({
            success: true,
            message: 'Analyse erfolgreich erstellt',
            timestamp: new Date().toISOString(),
            ...structuredAnalysis
        });
        
    } catch (error) {
        console.error('[AnalyzeController] Error:', error.message);
        
        return res.status(500).json(
            createErrorResponse(500, 'Interner Fehler bei der Analyse', 'ANALYSIS_ERROR')
        );
    }
}

/**
 * Parse and structure the analysis text from OpenAI
 * Extracts score and key information
 * @param {string} analysisText - Raw analysis text from OpenAI
 * @returns {Object} Structured analysis object
 */
function parseAnalysisText(analysisText) {
    // Extract score from format: "➡️ Gesamt: 47 / 50 = 94 % (A+ Performance-Schlaf)"
    const scoreMatch = analysisText.match(
        /➡️\s*Gesamt:\s*(\d+)\s*\/\s*50\s*=\s*([\d.]+)\s*%\s*\(([^)]+)\)/
    );
    
    let score = 'Siehe Analyse';
    if (scoreMatch) {
        score = `${scoreMatch[2]}% (${scoreMatch[3]})`;
    }
    
    return {
        analysis: analysisText,
        score,
        trend: 'Siehe Analyse',
        recommendation: 'Siehe Analyse'
    };
}

module.exports = analyzeHandler;
module.exports.parseAnalysisText = parseAnalysisText;
