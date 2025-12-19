/**
 * Error Handler Middleware Module
 * Centralized error handling for Express
 * 
 * @module middleware/errorHandler
 */

/**
 * HTTP Error class for structured error responses
 */
class HttpError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'HttpError';
    }
}

/**
 * Create a standardized error response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} details - Additional details (optional)
 * @returns {Object}
 */
function createErrorResponse(statusCode, message, details = null) {
    const response = {
        success: false,
        error: {
            code: statusCode,
            message
        }
    };
    
    if (details && process.env.NODE_ENV === 'development') {
        response.error.details = details;
    }
    
    return response;
}

/**
 * Express error handler middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
    // Default to 500 if no status code is set
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log error for debugging (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
        console.error(`[Error] ${statusCode}: ${message}`);
    }
    
    res.status(statusCode).json(
        createErrorResponse(statusCode, message, err.details)
    );
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json(
        createErrorResponse(404, `Route ${req.method} ${req.path} not found`)
    );
}

module.exports = {
    HttpError,
    errorHandler,
    notFoundHandler,
    createErrorResponse
};
