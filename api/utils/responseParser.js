/**
 * Response Parser Module
 * Utilities for parsing and validating OpenAI responses
 * 
 * @module utils/responseParser
 */

/**
 * Parsed analysis result type
 * @typedef {Object} AnalysisResult
 * @property {boolean} valid - Whether parsing succeeded
 * @property {number} [score] - Sleep score (1-100)
 * @property {string} [analysis] - Analysis text
 * @property {string[]} [recommendations] - Array of recommendations
 * @property {string} [error] - Error message if parsing failed
 */

/**
 * Extract JSON from a response that may contain markdown code blocks
 * @param {string} content - Raw response content
 * @returns {string} Cleaned JSON string
 */
function extractJsonFromResponse(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    
    if (jsonMatch) {
        return jsonMatch[1].trim();
    }
    
    // Try to find JSON object directly
    const objectMatch = content.match(/\{[\s\S]*\}/);
    
    if (objectMatch) {
        return objectMatch[0];
    }
    
    return content;
}

/**
 * Validate the structure of a parsed analysis result
 * @param {Object} parsed - Parsed JSON object
 * @returns {boolean} Whether the structure is valid
 */
function isValidAnalysisStructure(parsed) {
    return (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed.score === 'number' &&
        parsed.score >= 1 &&
        parsed.score <= 100 &&
        typeof parsed.analysis === 'string' &&
        Array.isArray(parsed.recommendations)
    );
}

/**
 * Parse OpenAI response content into structured analysis result
 * @param {string} content - Raw response content from OpenAI
 * @returns {AnalysisResult}
 */
function parseAnalysisResponse(content) {
    try {
        const jsonString = extractJsonFromResponse(content);
        
        if (!jsonString) {
            return {
                valid: false,
                error: 'No JSON content found in response'
            };
        }
        
        const parsed = JSON.parse(jsonString);
        
        if (!isValidAnalysisStructure(parsed)) {
            return {
                valid: false,
                error: 'Invalid response structure'
            };
        }
        
        return {
            valid: true,
            score: parsed.score,
            analysis: parsed.analysis,
            recommendations: parsed.recommendations.filter(
                r => typeof r === 'string' && r.trim().length > 0
            )
        };
    } catch (error) {
        return {
            valid: false,
            error: `Failed to parse response: ${error.message}`
        };
    }
}

/**
 * Create a fallback response when parsing fails
 * @param {string} rawContent - The raw content that failed to parse
 * @returns {Object} A fallback response object
 */
function createFallbackResponse(rawContent) {
    return {
        score: 50,
        analysis: 'Die Analyse konnte nicht vollständig verarbeitet werden.',
        recommendations: ['Bitte versuche es erneut.'],
        raw: rawContent
    };
}

module.exports = {
    parseAnalysisResponse,
    extractJsonFromResponse,
    isValidAnalysisStructure,
    createFallbackResponse
};
