# Sleep Tracker GUI

A mobile-optimized sleep tracking system with AI-powered sleep quality analysis using OpenAI ChatGPT API.

## Features

- Mobile-optimized Responsive Design (iPhone/Android)
- Input form for 7 sleep parameters
- AI-powered analysis with OpenAI ChatGPT
- 9-day trend analysis
- Personalized recommendations
- No database required
- Serverless deployment on Vercel

## Tech Stack

**Frontend:**

- HTML5
- CSS3 (Mobile-First, Flexbox)
- Vanilla JavaScript (no dependencies)

**Backend:**

- Node.js
- Vercel Serverless Functions
- OpenAI Chat Completion API (GPT-4o-mini)

## Project Structure

```
Sleep-Tracker-GUI/
├── index.html              # Frontend HTML
├── app.js                  # Frontend JavaScript
├── style.css               # Frontend CSS
├── package.json            # Node.js Package
├── vercel.json             # Vercel Config
├── .env.example            # Environment Template
├── .gitignore              # Git Ignore
├── api/
│   └── analyze.js          # Backend API Endpoint
└── README.md               # This File
```

## Installation & Setup

### 1. Local Setup (Development)

```bash
# Clone repository
git clone https://github.com/yourusername/sleep-tracker-gui.git
cd sleep-tracker-gui

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Add API Key (from OpenAI Platform)
# Edit .env.local and add your OpenAI API Key
nano .env.local
```

### 2. Generate OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in (or create an account)
3. Generate a new API Key
4. Copy the key into `.env.local`
5. Save the file

**IMPORTANT:** Never share your API key publicly!

### 3. Local Testing

```bash
# Open frontend
open index.html
# or with Python Server
python -m http.server 8000
# Then navigate to http://localhost:8000
```

## Deployment on Vercel

### Option 1: With GitHub + Vercel (Recommended)

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Sleep Tracker"
   git branch -M main
   git remote add origin https://github.com/yourusername/sleep-tracker-gui.git
   git push -u origin main
   ```

2. **Create Vercel Account:**
   - Go to https://vercel.com
   - Sign in with GitHub

3. **Deploy Project on Vercel:**
   - Click on "New Project"
   - Select your repository
   - Vercel recognizes it as Node.js/Static Project
   - Click "Deploy"

4. **Set Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add: `OPENAI_API_KEY` = (your API key)
   - Save & redeploy

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variable
vercel env add OPENAI_API_KEY
# (Enter your API key)

# Deploy to production
vercel --prod
```

## API Documentation

### Endpoint: POST `/api/analyze`

**Request Body:**
```json
{
  "date": "2024-11-28",
  "totalSleep": {
    "hours": 7,
    "minutes": 8
  },
  "awake": {
    "minutes": 13
  },
  "rem": {
    "hours": 1,
    "minutes": 53
  },
  "light": {
    "hours": 3,
    "minutes": 50
  },
  "deep": {
    "hours": 1,
    "minutes": 25
  },
  "sleepTime": {
    "from": "01:32",
    "to": "08:53"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis created successfully",
  "timestamp": "2024-11-28T10:30:00.000Z",
  "rawData": { ... },
  "score": "75/100",
  "analysis": "Your sleep quality was good yesterday...",
  "trend": "Over the last 9 days...",
  "recommendation": "1. Go to bed earlier...\n2. ..."
}
```

## Usage

1. **Open the website** in your browser (mobile optimized)
2. **Fill out the form:**
   - Date of the night
   - Total sleep duration
   - Sleep phase details (REM, Light, Deep)
   - Awake time
   - Sleep time span (from-to)
3. **Click "Analyze"**
4. **Wait for AI analysis** (approx. 2-5 seconds)
5. **Read the recommendations** and improve your sleep

## Sleep Parameters Explained

| Parameter | Description | Optimal |
|-----------|-------------|---------|
| **Total Sleep** | Total sleep duration per night | 7-9 hours |
| **Awake** | Time you were awake at night | < 10 minutes |
| **REM Sleep** | Rapid Eye Movement (Dreams) | 20-25% of total duration |
| **Light Sleep** | Light Sleep (N1-N2) | 45-55% of total duration |
| **Deep Sleep** | Deep Sleep (N3) | 13-23% of total duration |
| **Time Span** | From-to sleep times | Keep consistent |

## Troubleshooting

### "API Key missing" Error

- Make sure `.env.local` exists
- OpenAI API Key is correctly entered
- Restart the server after changes

### "OpenAI API Error: 401"

- API Key is expired/invalid
- Generate a new key on platform.openai.com
- Make sure your OpenAI account is active

### "Connection error"

- Check your internet connection
- Backend running on Vercel? > Open Vercel Logs
- CORS error? > Open Browser Developer Tools (F12)

### Mobile design looks weird

- Clear cache (Cmd+Shift+R / Ctrl+Shift+R)
- Set viewport zoom to 100%
- Test in incognito mode

## Performance Tips

- **Cache API calls:** Implement localStorage
- **Progressive Web App:** Add service-worker.js
- **Optimize CDN:** Compress images
- **API Timeouts:** Increase max_tokens if needed

## Security

### Best Practices

1. **Never expose API key in frontend** We use backend proxy
2. **Use HTTPS** Vercel sets SSL automatically
3. **Implement rate limiting** ToDo
4. **Input validation** Backend validates all inputs
5. **Configure CORS** Allow only specific origins

## Production Deployment

### Option 1: GitHub Pages + Raspberry Pi (Recommended)

For a self-hosted solution that runs 24/7 without keeping your PC on:

1. **Frontend:** Deployed on GitHub Pages (free, automatic)
2. **Backend:** Runs on Raspberry Pi with pm2 (always online)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete setup instructions.

```bash
# Quick start on RPi
chmod +x setup-rpi.sh
./setup-rpi.sh
```

### Option 2: Vercel (Easiest)

Deploy both frontend and backend to Vercel:

```bash
npm install -g vercel
vercel
```

---

## FAQ

**Q: Can I use the API in my app?**
A: Yes! The backend is publicly accessible via POST `/api/analyze`.

**Q: How much does OpenAI cost?**
A: ~$0.0007 per analysis with gpt-4-turbo. ~$0.002/month for daily use. Details: https://openai.com/pricing

**Q: Are my sleep data stored?**
A: No, they are only sent to OpenAI for analysis and not stored locally.

**Q: Can I use this for business?**
A: Yes, but please respect the OpenAI Terms of Service and privacy regulations.

**Q: How do I deploy to Raspberry Pi?**
A: See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions with pm2 setup.

## Credits & License

Developed with love for better sleep.
 sa as
**License:** MIT

---

Good luck tracking your sleep!
