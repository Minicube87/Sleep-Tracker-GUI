/**
 * Sleep Tracker - Frontend Application
 * Mobile-optimized vanilla JavaScript
 * No external dependencies required
 */

// DOM Elements
const sleepForm = document.getElementById('sleepForm');
const submitBtn = document.getElementById('submitBtn');
const formSection = document.getElementById('formSection');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const backBtn = document.getElementById('backBtn');
const errorBackBtn = document.getElementById('errorBackBtn');

// ===========================
// EVENT LISTENERS
// ===========================

sleepForm.addEventListener('submit', handleFormSubmit);
backBtn.addEventListener('click', resetForm);
errorBackBtn.addEventListener('click', resetForm);

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// ===========================
// FORM SUBMISSION HANDLER
// ===========================

async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Validate form
        if (!sleepForm.checkValidity()) {
            throw new Error('Bitte fülle alle Felder aus');
        }
        
        // Collect form data
        const formData = collectFormData();
        
        // Validate collected data
        validateSleepData(formData);
        
        // Show loading state
        showLoadingState();
        
        // Send data to backend
        const response = await sendToBackend(formData);
        
        // Display results
        displayResults(response);
        
    } catch (error) {
        console.error('Error:', error);
        showErrorState(error.message);
    }
}

// ===========================
// DATA COLLECTION
// ===========================

function collectFormData() {
    return {
        date: document.getElementById('date').value,
        totalSleep: {
            hours: parseInt(document.getElementById('totalSleepHours').value) || 0,
            minutes: parseInt(document.getElementById('totalSleepMinutes').value) || 0,
        },
        awake: {
            minutes: parseInt(document.getElementById('awake').value) || 0,
        },
        rem: {
            hours: parseInt(document.getElementById('remHours').value) || 0,
            minutes: parseInt(document.getElementById('remMinutes').value) || 0,
        },
        light: {
            hours: parseInt(document.getElementById('lightHours').value) || 0,
            minutes: parseInt(document.getElementById('lightMinutes').value) || 0,
        },
        deep: {
            hours: parseInt(document.getElementById('deepHours').value) || 0,
            minutes: parseInt(document.getElementById('deepMinutes').value) || 0,
        },
        sleepTime: {
            from: document.getElementById('sleepStart').value,
            to: document.getElementById('sleepEnd').value,
        },
    };
}

// ===========================
// DATA VALIDATION
// ===========================

function validateSleepData(data) {
    // Check if all times are provided
    const { totalSleep, rem, light, deep } = data;
    
    if (!totalSleep.hours && !totalSleep.minutes) {
        throw new Error('Gesamtschlaf erforderlich');
    }
    
    if (!rem.hours && !rem.minutes) {
        throw new Error('REM-Schlaf erforderlich');
    }
    
    if (!light.hours && !light.minutes) {
        throw new Error('Kern-Schlaf erforderlich');
    }
    
    if (!deep.hours && !deep.minutes) {
        throw new Error('Tief-Schlaf erforderlich');
    }
    
    // Validate time span
    const fromTime = data.sleepTime.from;
    const toTime = data.sleepTime.to;
    
    if (!fromTime || !toTime) {
        throw new Error('Zeitspanne erforderlich');
    }
}

// ===========================
// BACKEND COMMUNICATION
// ===========================

async function sendToBackend(formData) {
    // Determine API URL based on environment
    let apiUrl = determineApiUrl();
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `API-Fehler: ${response.status}`
            );
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Backend error:', error);
        throw new Error(`Verbindungsfehler: ${error.message}`);
    }
}

// ===========================
// API URL DETERMINATION
// ===========================

function determineApiUrl() {
    const { hostname, port, protocol } = window.location;
    
    // Production: Vercel or same-host deployment
    if (protocol === 'https:' || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
        return '/api/analyze';
    }
    
    // Local development: Frontend on different port than backend
    // Frontend on 8000 (Python server) → Backend on 3000 (Node server)
    if (port === '8000') {
        return 'http://localhost:3000/api/analyze';
    }
    
    // Raspberry Pi or same-host deployment
    // Frontend served from same port/host as backend
    if (hostname === 'raspberrypi.local' || hostname === 'raspberrypi' || 
        (!port || port === '80' || port === '443')) {
        return '/api/analyze';
    }
    
    // Default: try relative path
    return '/api/analyze';
}

// ===========================
// UI STATE MANAGEMENT
// ===========================

function showLoadingState() {
    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingState.classList.remove('hidden');
    submitBtn.disabled = true;
}

function displayResults(response) {
    loadingState.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    submitBtn.disabled = false;
    
    // Clear previous results
    resultsContent.innerHTML = '';
    
    // Extract and display different parts of the analysis
    const { analysis, score, trend, recommendation, rawData } = response;
    
    // Display raw data
    if (rawData) {
        resultsContent.innerHTML += createResultCard(
            '📊 Rohdaten',
            formatRawData(rawData),
            'data'
        );
    }
    
    // Display score
    if (score) {
        resultsContent.innerHTML += createResultCard(
            '⭐ Score',
            score,
            'score'
        );
    }
    
    // Display main analysis
    if (analysis) {
        resultsContent.innerHTML += createResultCard(
            '📈 Analyse',
            analysis,
            'analysis'
        );
    }
    
    // Display trend
    if (trend) {
        resultsContent.innerHTML += createResultCard(
            '📊 9-Tage-Trend',
            trend,
            'trend'
        );
    }
    
    // Display recommendation
    if (recommendation) {
        resultsContent.innerHTML += createResultCard(
            '💡 Empfehlungen',
            recommendation,
            'recommendation'
        );
    }
}

function createResultCard(title, content, className = '') {
    const sanitizedContent = escapeHtml(content);
    return `
        <div class="result-card ${className}">
            <h3>${title}</h3>
            <p>${sanitizedContent}</p>
        </div>
    `;
}

function formatRawData(data) {
    if (typeof data === 'string') return data;
    
    const parts = [];
    for (const [key, value] of Object.entries(data)) {
        parts.push(`${key}: ${JSON.stringify(value)}`);
    }
    return parts.join('\n');
}

function showErrorState(message) {
    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    loadingState.classList.add('hidden');
    errorMessage.textContent = message;
    submitBtn.disabled = false;
}

function resetForm() {
    formSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingState.classList.add('hidden');
    sleepForm.reset();
    document.getElementById('date').valueAsDate = new Date();
    submitBtn.disabled = false;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

// ===========================
// INITIALIZATION
// ===========================

console.log('Sleep Tracker - Frontend loaded');
