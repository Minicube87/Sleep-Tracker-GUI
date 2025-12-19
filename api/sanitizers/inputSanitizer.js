/**
 * Input Sanitization Module
 * Pure functions for sanitizing user input
 * Prevents prompt injection and ensures data integrity
 * 
 * @module sanitizers/inputSanitizer
 */

const { validation } = require('../config');

/**
 * Patterns that could indicate prompt injection attempts
 * @constant {RegExp[]}
 */
const INJECTION_PATTERNS = [
    /ignore\s*(all|previous|above)/gi,
    /system\s*prompt/gi,
    /you\s*are\s*(now|a)/gi,
    /pretend\s*(to|you)/gi,
    /act\s*as\s*(if|a)/gi,
    /forget\s*(everything|all|previous)/gi,
    /new\s*instruction/gi,
    /override/gi
];

/**
 * Control characters regex (excluding common whitespace)
 * @constant {RegExp}
 */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitize string input to prevent prompt injection
 * @param {*} str - Input to sanitize
 * @param {number} [maxLength] - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeString(str, maxLength = validation.maxStringLength) {
    if (typeof str !== 'string') {
        return '';
    }
    
    let sanitized = str;
    
    // Remove potential injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }
    
    // Remove control characters
    sanitized = sanitized.replace(CONTROL_CHARS, '');
    
    // Trim and limit length
    return sanitized.trim().substring(0, maxLength);
}

/**
 * Sanitize number input with bounds checking
 * @param {*} num - Input to sanitize
 * @param {number} [min=0] - Minimum allowed value
 * @param {number} [max=1440] - Maximum allowed value
 * @returns {number} Sanitized number
 */
function sanitizeNumber(num, min = 0, max = 1440) {
    const parsed = parseInt(num, 10);
    
    if (isNaN(parsed)) {
        return min;
    }
    
    return Math.max(min, Math.min(max, parsed));
}

/**
 * Sanitize time string to HH:MM format
 * @param {*} time - Input to sanitize
 * @returns {string} Valid time string or default '00:00'
 */
function sanitizeTime(time) {
    if (typeof time !== 'string') {
        return '00:00';
    }
    
    const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    return match ? time : '00:00';
}

/**
 * Sanitize date string to YYYY-MM-DD format
 * @param {*} date - Input to sanitize
 * @returns {string} Valid date string or today's date
 */
function sanitizeDate(date) {
    const today = new Date().toISOString().split('T')[0];
    
    if (typeof date !== 'string') {
        return today;
    }
    
    const match = date.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!match) {
        return today;
    }
    
    // Validate it's a real date
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
        return today;
    }
    
    return date;
}

/**
 * Sanitize a complete sleep data object
 * Returns a new object (pure function, no mutation)
 * @param {Object} data - Raw sleep data
 * @returns {Object} Sanitized sleep data
 */
function sanitizeSleepData(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    
    const { hours, minutes, sleepPhaseHours, awakeMinutes } = validation;
    
    return {
        date: sanitizeDate(data.date),
        totalSleep: {
            hours: sanitizeNumber(data.totalSleep?.hours, hours.min, hours.max),
            minutes: sanitizeNumber(data.totalSleep?.minutes, minutes.min, minutes.max)
        },
        awake: {
            minutes: sanitizeNumber(data.awake?.minutes, awakeMinutes.min, awakeMinutes.max)
        },
        rem: {
            hours: sanitizeNumber(data.rem?.hours, sleepPhaseHours.min, sleepPhaseHours.max),
            minutes: sanitizeNumber(data.rem?.minutes, minutes.min, minutes.max)
        },
        light: {
            hours: sanitizeNumber(data.light?.hours, sleepPhaseHours.min, sleepPhaseHours.max),
            minutes: sanitizeNumber(data.light?.minutes, minutes.min, minutes.max)
        },
        deep: {
            hours: sanitizeNumber(data.deep?.hours, sleepPhaseHours.min, sleepPhaseHours.max),
            minutes: sanitizeNumber(data.deep?.minutes, minutes.min, minutes.max)
        },
        sleepTime: {
            from: sanitizeTime(data.sleepTime?.from),
            to: sanitizeTime(data.sleepTime?.to)
        }
    };
}

module.exports = {
    sanitizeString,
    sanitizeNumber,
    sanitizeTime,
    sanitizeDate,
    sanitizeSleepData
};
