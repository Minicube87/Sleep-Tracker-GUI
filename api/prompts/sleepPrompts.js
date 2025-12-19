/**
 * Sleep Prompts Module
 * Contains all prompt templates for sleep analysis
 * 
 * Following OCP: Prompts can be modified without changing business logic
 * Following SRP: Only handles prompt generation
 * 
 * @module prompts/sleepPrompts
 */

/**
 * System prompt for the sleep analyst AI
 * Defines the AI's role and response format
 */
const SYSTEM_PROMPT = `Du bist ein Schlaf-Biohacking-Experte und Analyst für Schlafqualität.

Du analysierst Schlaf-Daten und gibst strukturierte Analysen in folgendem TEXT-Format zurück (NICHT JSON):

---

📊 Rohdaten – [DATUM]

Gesamtschlaf: [STUNDEN] h [MINUTEN] min
Wach: [MINUTEN] min
REM: [STUNDEN] h [MINUTEN] min
Kern: [STUNDEN] h [MINUTEN] min
Tief: [STUNDEN] h [MINUTEN] min
Zeitraum: [VON] – [BIS]

💯 Biohacker-Schlafscore

[TABELLE MIT SCORES]

➡️ Gesamt: [PUNKTE] / 50 = [PROZENT] % ([BEWERTUNG])

🧠 Analyse

[DETAILLIERTE ANALYSE - enthusiastisch, motivierend, konkret]

⚠️ Was verbessert werden könnte

[KONSTRUKTIVE TIPPS]

📈 9-Tage-Trend

[WENN VERFÜGBAR: Tabelle mit Verlauf]
[WENN NICHT VERFÜGBAR: "Zu wenig Daten vorhanden"]

🔥 Bottom Line

[ZUSAMMENFASSUNG IN 2-3 SÄTZEN]

---

WICHTIG:
- Antworte IMMER in DIESEM FORMAT (kein JSON!)
- Nutze deutsche Sprache
- Sei enthusiastisch und motivierend (wie im Beispiel)
- Verwende Emojis großzügig
- Scores: Gesamtschlaf (7.5-9h ideal), Tiefschlaf (1.5-2h ideal), REM (1.5-2.5h ideal), Wachphasen (<15min ideal), Kontinuität (ruhig ideal)
- Jeder Score 0-10 Punkte
- Gesamtscore aus 5 Kategorien = max 50 Punkte`;

/**
 * Format a duration object to a readable string
 * @param {Object} duration - Duration with hours and/or minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(duration) {
    if (!duration) return '0h 0min';
    
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    
    return `${hours}h ${minutes}min`;
}

/**
 * Build the user prompt from sleep data
 * @param {Object} data - Sanitized sleep data
 * @returns {string} Formatted user prompt
 */
function buildUserPrompt(data) {
    const awakeMinutes = data.awake?.minutes || 0;
    const sleepSpan = `${data.sleepTime?.from || '00:00'} - ${data.sleepTime?.to || '00:00'}`;
    
    return `Analysiere folgende Schlaf-Daten vom ${data.date}:

- Gesamtschlaf: ${formatDuration(data.totalSleep)}
- Wach (Awake): ${awakeMinutes}min
- REM-Schlaf: ${formatDuration(data.rem)}
- Kern-Schlaf (Light): ${formatDuration(data.light)}
- Tief-Schlaf (Deep): ${formatDuration(data.deep)}
- Zeitspanne: ${sleepSpan}`;
}

/**
 * Get the complete prompts for a sleep analysis request
 * @param {Object} data - Sanitized sleep data
 * @returns {Object} Object containing systemPrompt and userPrompt
 */
function getSleepAnalysisPrompts(data) {
    return {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(data)
    };
}

module.exports = {
    SYSTEM_PROMPT,
    buildUserPrompt,
    getSleepAnalysisPrompts,
    formatDuration
};
