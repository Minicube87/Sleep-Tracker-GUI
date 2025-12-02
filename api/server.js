require("dotenv").config({ path: require('path').join(__dirname, '..', '.env') });
const express = require("express");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Rate Limiting: Max 30 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 Requests
  message: 'Too many request from this IP. Wait some time.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.path === '/', // Health Check nicht limitieren
});

// Allowed origins (security: restrict to known frontends)
const ALLOWED_ORIGINS = [
  'https://minicube87.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

// CORS with origin validation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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

// Route für /api/analyze mit Rate Limiting
app.post("/api/analyze", limiter, analyzeHandler);

// GET / für Health Check (ohne Rate Limiting)
app.get("/", (req, res) => {
  res.send("Sleep Tracker API is running. Use POST /api/analyze to analyze sleep data.");
});

// Server starten
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`OPENAI_API_KEY loaded: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`);
  console.log(`Rate Limiting: 30 requests per 15 minutes per IP`);
});
