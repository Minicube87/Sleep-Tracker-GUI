/**
 * API Module Index
 * Re-exports all modules for convenient importing
 * 
 * @module api
 * @example
 * const { config, createOpenAIService, validateSleepData } = require('./api');
 */

// Configuration
const config = require('./config');

// Sanitizers
const { sanitizeSleepData, sanitizeString, sanitizeNumber, sanitizeTime, sanitizeDate } = require('./sanitizers/inputSanitizer');

// Validators
const { validateSleepData, validateRequiredFields, validateDurations } = require('./validators/sleepValidator');

// Services
const { createOpenAIService } = require('./services/openaiService');

// Prompts
const { getSleepAnalysisPrompts, SYSTEM_PROMPT, buildUserPrompt } = require('./prompts/sleepPrompts');

// Middleware
const { createCorsMiddleware } = require('./middleware/cors');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { HttpError, errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Utils
const { parseAnalysisResponse, extractJsonFromResponse } = require('./utils/responseParser');

module.exports = {
    // Config
    config,
    
    // Sanitizers
    sanitizeSleepData,
    sanitizeString,
    sanitizeNumber,
    sanitizeTime,
    sanitizeDate,
    
    // Validators
    validateSleepData,
    validateRequiredFields,
    validateDurations,
    
    // Services
    createOpenAIService,
    
    // Prompts
    getSleepAnalysisPrompts,
    SYSTEM_PROMPT,
    buildUserPrompt,
    
    // Middleware
    createCorsMiddleware,
    createRateLimiter,
    HttpError,
    errorHandler,
    notFoundHandler,
    
    // Utils
    parseAnalysisResponse,
    extractJsonFromResponse
};
