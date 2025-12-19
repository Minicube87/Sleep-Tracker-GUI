/**
 * OpenAI Service Module
 * Encapsulates all OpenAI API interactions
 * 
 * Following DIP: httpClient is injected, not hardcoded
 * Following SRP: Only handles OpenAI communication
 * 
 * @module services/openaiService
 */

const config = require('../config');

/**
 * OpenAI API response type
 * @typedef {Object} OpenAIResponse
 * @property {boolean} success - Whether the request succeeded
 * @property {string} [content] - The response content
 * @property {string} [error] - Error message if failed
 * @property {number} [statusCode] - HTTP status code
 */

/**
 * Create an OpenAI service instance
 * @param {Function} httpClient - HTTP client (e.g., fetch or axios)
 * @param {string} apiKey - OpenAI API key
 * @returns {Object} Service instance
 */
function createOpenAIService(httpClient, apiKey) {
    if (!httpClient) {
        throw new Error('HTTP client is required');
    }
    
    if (!apiKey) {
        throw new Error('OpenAI API key is required');
    }
    
    /**
     * Send a chat completion request to OpenAI
     * @param {string} systemPrompt - The system prompt
     * @param {string} userPrompt - The user prompt
     * @returns {Promise<OpenAIResponse>}
     */
    async function sendChatCompletion(systemPrompt, userPrompt) {
        const requestBody = {
            model: config.openai.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: config.openai.maxTokens,
            temperature: config.openai.temperature
        };
        
        try {
            const response = await httpClient(config.openai.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                return {
                    success: false,
                    error: 'OpenAI API request failed',
                    statusCode: response.status
                };
            }
            
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) {
                return {
                    success: false,
                    error: 'Empty response from OpenAI',
                    statusCode: 200
                };
            }
            
            return {
                success: true,
                content,
                statusCode: 200
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Network error',
                statusCode: 500
            };
        }
    }
    
    /**
     * Health check for OpenAI API connection
     * @returns {Promise<boolean>}
     */
    async function healthCheck() {
        try {
            const response = await httpClient('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    return {
        sendChatCompletion,
        healthCheck
    };
}

module.exports = { createOpenAIService };
