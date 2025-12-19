# 🚀 Sleep Tracker API - Docker Deployment

## Quick Start (Lokal)

```bash
# 1. .env Datei erstellen
cp .env.example .env
# API Key eintragen!

# 2. Container starten
docker-compose up -d

# 3. Testen
curl http://localhost:3000/
```

## Deployment Optionen

### Option 1: Raspberry Pi / Linux Server

```bash
# Auf dem Server:
git clone https://github.com/minicube87/Sleep-Tracker-GUI.git
cd Sleep-Tracker-GUI

# .env mit API Key erstellen
echo "OPENAI_API_KEY=sk-your-key" > .env

# Starten
docker-compose up -d
```

### Option 2: Railway.app (Kostenlos bis 5$/Monat)

1. Gehe zu [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub Repo"
3. Repository auswählen
4. Environment Variable hinzufügen: `OPENAI_API_KEY`
5. Deploy! 🚀

### Option 3: Render.com (Kostenloser Tier)

1. Gehe zu [render.com](https://render.com)
2. "New" → "Web Service"
3. GitHub Repo verbinden
4. Settings:
   - **Build Command:** `docker build -t api .`
   - **Start Command:** `docker run -p 3000:3000 api`
5. Environment: `OPENAI_API_KEY=sk-...`

### Option 4: Fly.io (Kostenloser Tier)

```bash
# Fly CLI installieren
curl -L https://fly.io/install.sh | sh

# Einloggen
fly auth login

# App erstellen
fly launch --name sleep-tracker-api

# Secret setzen
fly secrets set OPENAI_API_KEY=sk-your-key

# Deployen
fly deploy
```

### Option 5: DigitalOcean App Platform

1. [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. "Apps" → "Create App"
3. GitHub auswählen
4. Dockerfile erkennen lassen
5. Environment Variables setzen

---

## Nach dem Deployment

### Frontend API-URL anpassen

In `docs/app.js` die `API_BASE_URL` auf deine Deployment-URL ändern:

```javascript
const API_BASE_URL = 'https://your-app.railway.app';
// oder
const API_BASE_URL = 'https://your-app.fly.dev';
```

### CORS anpassen

In `api/config/index.js` die GitHub Pages URL ist bereits konfiguriert:
```javascript
allowedOrigins: [
    'https://minicube87.github.io',  // ✅ Bereits drin
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]
```

---

## Befehle

```bash
# Container starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f api

# Container stoppen
docker-compose down

# Neu bauen (nach Code-Änderungen)
docker-compose up -d --build

# Container Status
docker ps
```

## Troubleshooting

### Container startet nicht
```bash
docker-compose logs api
```

### API Key fehlt
```bash
# Prüfen ob .env existiert
cat .env

# Oder direkt setzen
docker-compose down
export OPENAI_API_KEY=sk-your-key
docker-compose up -d
```

### Port bereits belegt
```bash
# Anderen Port verwenden
PORT=3001 docker-compose up -d
```
