/**
 * CORS Middleware Module
 * Handles Cross-Origin Resource Sharing configuration
 * 
 * @module middleware/cors
 */

const config = require('../config');

/**
 * Create CORS middleware with configured allowed origins
 * @returns {Function} Express middleware function
 */
function createCorsMiddleware() {
    const allowedOrigins = config.cors.allowedOrigins;
    
    return function corsMiddleware(req, res, next) {
        const origin = req.headers.origin;
        
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        
        next();
    };
}

module.exports = { createCorsMiddleware };
