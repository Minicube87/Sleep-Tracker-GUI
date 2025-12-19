/**
 * Application Configuration
 * Single source of truth for all configuration values
 * 
 * @module config
 */

const path = require('path');

// Load environment variables in non-production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });
}

/**
 * Server configuration
 */
const server = Object.freeze({
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
});

/**
 * OpenAI API configuration
 */
const openai = Object.freeze({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 1500,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 1,
    apiUrl: 'https://api.openai.com/v1/chat/completions'
});

/**
 * Rate limiting configuration
 */
const rateLimit = Object.freeze({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,
    message: 'Too many requests from this IP. Please wait before trying again.'
});

/**
 * CORS configuration
 */
const cors = Object.freeze({
    allowedOrigins: [
        'https://minicube87.github.io',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ],
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
});

/**
 * Validation limits
 */
const validation = Object.freeze({
    maxStringLength: 500,
    hours: { min: 0, max: 24 },
    minutes: { min: 0, max: 59 },
    awakeMinutes: { min: 0, max: 480 },
    sleepPhaseHours: { min: 0, max: 12 }
});

/**
 * Validate required configuration
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
    const errors = [];
    
    if (!openai.apiKey) {
        errors.push('OPENAI_API_KEY is required');
    }
    
    if (errors.length > 0) {
        console.error('Configuration errors:', errors);
        // Don't throw in development, just warn
        if (server.env === 'production') {
            throw new Error(`Configuration invalid: ${errors.join(', ')}`);
        }
    }
}

module.exports = {
    server,
    openai,
    rateLimit,
    cors,
    validation,
    validateConfig
};
