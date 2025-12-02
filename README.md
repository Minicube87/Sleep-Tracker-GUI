# Sleep Tracker GUI

A mobile-optimized sleep tracking system with AI-powered sleep quality analysis using OpenAI ChatGPT API.

## Live Demo

**Frontend:** https://minicube87.github.io/Sleep-Tracker-GUI/

## Features

- Mobile-optimized responsive design (iPhone/Android)
- Input form for 7 sleep parameters from Apple Watch
- AI-powered biohacking-style analysis with OpenAI GPT-4-turbo
- Sleep score calculation (0-50 points)
- Personalized recommendations
- Rate limiting (30 requests per 15 minutes)
- 24/7 operation on Raspberry Pi

## Architecture

```
┌──────────────────────────────────┐
│     GitHub Pages (Frontend)      │
│   HTML + CSS + JavaScript        │
└───────────────┬──────────────────┘
                │ HTTPS
                ▼
┌──────────────────────────────────┐
│      Raspberry Pi (Backend)      │
│                                  │
│  ┌────────────────────────────┐  │
│  │  nginx (Port 443)          │  │
│  │  SSL Reverse Proxy         │  │
│  └─────────────┬──────────────┘  │
│                │ HTTP            │
│  ┌─────────────▼──────────────┐  │
│  │  Node.js + Express (:3000) │  │
│  │  Managed by pm2            │  │
│  └─────────────┬──────────────┘  │
└────────────────┼─────────────────┘
                 │ HTTPS
                 ▼
┌──────────────────────────────────┐
│         OpenAI API               │
│       (gpt-4-turbo)              │
└──────────────────────────────────┘
```

## Tech Stack

**Frontend:**
- HTML5
- CSS3 (Mobile-First, Flexbox, Gradients)
- Vanilla JavaScript (no dependencies)

**Backend:**
- Node.js 18+
- Express.js
- express-rate-limit
- dotenv

**Infrastructure:**
- GitHub Pages (Frontend hosting)
- Raspberry Pi (Backend hosting)
- nginx (HTTPS reverse proxy)
- pm2 (Process manager)
- OpenAI Chat Completion API (GPT-4-turbo)

## Project Structure

```
Sleep-Tracker-GUI/
├── docs/                   # GitHub Pages frontend
│   ├── index.html
│   ├── app.js
│   └── style.css
├── api/
│   ├── server.js           # Express server
│   └── analyze.js          # OpenAI integration
├── setup-rpi.sh            # Raspberry Pi setup script
├── setup-nginx.sh          # nginx HTTPS setup script
├── .env.example            # Environment template
├── package.json            # Node.js dependencies
├── DEPLOYMENT.md           # Deployment guide
├── JOURNEY.md              # Development journey documentation
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
- Raspberry Pi (for 24/7 operation)

### 1. Clone & Install

```bash
git clone https://github.com/Minicube87/Sleep-Tracker-GUI.git
cd Sleep-Tracker-GUI
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
# Add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Local Development

```bash
# Start backend
node api/server.js

# In another terminal - start frontend
python3 -m http.server 8000 --directory docs
# Open http://localhost:8000
```

### 4. Raspberry Pi Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

Quick version:
```bash
# On Raspberry Pi
git clone https://github.com/Minicube87/Sleep-Tracker-GUI.git
cd Sleep-Tracker-GUI
npm install

# Setup pm2
chmod +x setup-rpi.sh
./setup-rpi.sh

# Setup HTTPS (nginx)
chmod +x setup-nginx.sh
sudo bash setup-nginx.sh

# Open firewall
sudo ufw allow 443/tcp
```

## API Documentation

### Endpoint: POST `/api/analyze`

**Request:**
```json
{
  "date": "2024-12-02",
  "totalSleep": { "hours": 7, "minutes": 30 },
  "awake": { "minutes": 5 },
  "rem": { "hours": 1, "minutes": 30 },
  "light": { "hours": 3, "minutes": 0 },
  "deep": { "hours": 2, "minutes": 30 },
  "sleepTime": { "from": "22:00", "to": "05:30" }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analyse erfolgreich erstellt",
  "timestamp": "2024-12-02T10:30:00.000Z",
  "rawData": { ... },
  "score": "94% (A+ Performance-Schlaf)",
  "analysis": "Rohdaten - 2024-12-02\n...",
  "trend": "Siehe Analyse oben",
  "recommendation": "Siehe Analyse oben"
}
```

## Sleep Parameters

| Parameter | Description | Optimal Range |
|-----------|-------------|---------------|
| Total Sleep | Total sleep duration | 7-9 hours |
| Awake | Time awake during night | < 15 minutes |
| REM | Dream sleep phase | 1.5-2.5 hours |
| Light | Light sleep (N1-N2) | 3-4 hours |
| Deep | Deep sleep (N3) | 1.5-2 hours |
| Time Span | Sleep start to end | Consistent schedule |

## Cost Estimate

- ~$0.0007 per API request
- Daily use: ~$0.02/month
- Very affordable for personal use!

## Security Notes

Current implementation includes:
- Rate limiting (30 requests per 15 minutes per IP)
- CORS headers
- Input validation
- HTTPS via nginx (self-signed certificate)

See [JOURNEY.md](./JOURNEY.md) for security analysis and improvement suggestions.

## Troubleshooting

### "Connection Error: Failed to fetch"
- Check if backend is running: `pm2 status`
- Check nginx: `sudo systemctl status nginx`
- Verify firewall: `sudo ufw status` (port 443 must be open)

### "Certificate Error"
- Visit `https://YOUR_RPI_IP/` directly first
- Click "Advanced" -> "Proceed anyway"
- Browser needs to trust the self-signed certificate

### Backend not responding
```bash
pm2 logs sleep-tracker
sudo tail -f /var/log/nginx/error.log
```

## Development Journey

Want to know how this project was built, including all the challenges and solutions? 

Check out [JOURNEY.md](./JOURNEY.md) for the full story!

## License

MIT

---

Built with mass amounts of mass amounts of mass amounts of caffeine and mass amounts of mass amounts of mass amounts of sleep deprivation for better sleep!
