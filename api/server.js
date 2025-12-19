/**
 * Sleep Tracker API Server
 * Main entry point for the Express application
 * 
 * @module server
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');

// Configuration
const config = require('./config');

// Middleware
const { createCorsMiddleware } = require('./middleware/cors');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route handlers
const analyzeHandler = require('./analyze');

// Initialize Express app
const app = express();

// Body parser
app.use(express.json());

// CORS handling
app.use(createCorsMiddleware());

// Rate limiter for API routes
const limiter = createRateLimiter();

// Health check endpoint (not rate limited)
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Sleep Tracker API',
        version: '1.0.0',
        endpoints: {
            analyze: 'POST /api/analyze'
        }
    });
});

// Main analysis endpoint
app.post('/api/analyze', limiter, analyzeHandler);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const { port, host } = config.server;

app.listen(port, host, () => {
    console.log(`[Server] Running on http://${host}:${port}`);
    console.log(`[Server] API Key: ${process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing!'}`);
    console.log(`[Server] Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 60000} minutes`);
});
