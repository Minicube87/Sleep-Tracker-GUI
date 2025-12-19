/**
 * Sleep Data Validator Module
 * Pure validation functions - only checks, no mutations
 * 
 * @module validators/sleepValidator
 */

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 */

/**
 * Required fields for sleep data
 * @constant {string[]}
 */
const REQUIRED_FIELDS = ['date', 'totalSleep', 'rem', 'light', 'deep', 'sleepTime'];

/**
 * Check if a value is a non-null object
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if a time duration has valid values
 * @param {Object} duration - Duration object with hours and/or minutes
 * @returns {boolean}
 */
function hasValidDuration(duration) {
    if (!isObject(duration)) {
        return false;
    }
    
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    
    return hours > 0 || minutes > 0;
}

/**
 * Validate that all required fields are present
 * @param {Object} data - Sleep data to validate
 * @returns {ValidationResult}
 */
function validateRequiredFields(data) {
    const errors = [];
    
    if (!isObject(data)) {
        return { valid: false, errors: ['Invalid request data'] };
    }
    
    for (const field of REQUIRED_FIELDS) {
        if (!data[field]) {
            errors.push(`Field required: ${field}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate sleep durations
 * @param {Object} data - Sanitized sleep data
 * @returns {ValidationResult}
 */
function validateDurations(data) {
    const errors = [];
    
    if (!hasValidDuration(data.totalSleep)) {
        errors.push('Total sleep duration is required');
    }
    
    if (!hasValidDuration(data.rem)) {
        errors.push('REM sleep duration is required');
    }
    
    if (!hasValidDuration(data.light)) {
        errors.push('Light sleep duration is required');
    }
    
    if (!hasValidDuration(data.deep)) {
        errors.push('Deep sleep duration is required');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate time span
 * @param {Object} data - Sanitized sleep data
 * @returns {ValidationResult}
 */
function validateTimeSpan(data) {
    const errors = [];
    
    if (!data.sleepTime?.from || data.sleepTime.from === '00:00') {
        // 00:00 might be valid, so we check if it was explicitly set
        if (!data.sleepTime?.from) {
            errors.push('Sleep start time is required');
        }
    }
    
    if (!data.sleepTime?.to) {
        errors.push('Sleep end time is required');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate sleep phase consistency
 * Checks if individual phases roughly add up to total sleep
 * @param {Object} data - Sanitized sleep data
 * @returns {ValidationResult}
 */
function validatePhaseConsistency(data) {
    const errors = [];
    const warnings = [];
    
    const totalMinutes = (data.totalSleep?.hours || 0) * 60 + (data.totalSleep?.minutes || 0);
    const remMinutes = (data.rem?.hours || 0) * 60 + (data.rem?.minutes || 0);
    const lightMinutes = (data.light?.hours || 0) * 60 + (data.light?.minutes || 0);
    const deepMinutes = (data.deep?.hours || 0) * 60 + (data.deep?.minutes || 0);
    const awakeMinutes = data.awake?.minutes || 0;
    
    const phasesTotal = remMinutes + lightMinutes + deepMinutes + awakeMinutes;
    
    // Allow 10% tolerance
    const tolerance = totalMinutes * 0.1;
    
    if (Math.abs(phasesTotal - totalMinutes) > tolerance && totalMinutes > 0) {
        warnings.push('Sleep phases do not add up to total sleep time');
    }
    
    return {
        valid: true, // This is a warning, not an error
        errors,
        warnings
    };
}

/**
 * Perform full validation on sleep data
 * @param {Object} data - Sanitized sleep data
 * @returns {ValidationResult}
 */
function validateSleepData(data) {
    const allErrors = [];
    const allWarnings = [];
    
    // Run all validations
    const requiredResult = validateRequiredFields(data);
    allErrors.push(...requiredResult.errors);
    
    // Only continue if required fields are present
    if (requiredResult.valid) {
        const durationsResult = validateDurations(data);
        allErrors.push(...durationsResult.errors);
        
        const timeSpanResult = validateTimeSpan(data);
        allErrors.push(...timeSpanResult.errors);
        
        const consistencyResult = validatePhaseConsistency(data);
        allWarnings.push(...(consistencyResult.warnings || []));
    }
    
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
    };
}

module.exports = {
    validateSleepData,
    validateRequiredFields,
    validateDurations,
    validateTimeSpan,
    validatePhaseConsistency,
    REQUIRED_FIELDS
};
