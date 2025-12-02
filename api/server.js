require("dotenv").config({ path: require('path').join(__dirname, '..', '.env') });
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// CORS aktivieren
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  next();
});

// Importiere die Hauptfunktion
const analyzeHandler = require("./analyze");

// Route für /api/analyze
app.post("/api/analyze", analyzeHandler);

// GET / für Health Check
app.get("/", (req, res) => {
  res.send("Sleep Tracker API is running. Use POST /api/analyze to analyze sleep data.");
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`OPENAI_API_KEY loaded: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`);
});
