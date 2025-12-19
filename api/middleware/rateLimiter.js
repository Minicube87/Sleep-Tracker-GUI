/**
 * Rate Limiter Middleware Module
 * Configures request rate limiting per IP
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Create rate limiter middleware with configured settings
 * @param {Object} options - Override options
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options = {}) {
    const settings = {
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: config.rateLimit.message,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === '/', // Don't limit health check
        ...options
    };
    
    return rateLimit(settings);
}

module.exports = { createRateLimiter };
