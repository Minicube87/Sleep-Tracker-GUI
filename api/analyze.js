/**
 * Sleep Analysis Route Handler
 * Thin wrapper for backward compatibility
 * 
 * All business logic has been moved to:
 * - controllers/analyzeController.js
 * - services/openaiService.js
 * - validators/sleepValidator.js
 * - sanitizers/inputSanitizer.js
 * - prompts/sleepPrompts.js
 * 
 * @module analyze
 */

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

// Export the controller as the main handler
module.exports = require('./controllers/analyzeController');
