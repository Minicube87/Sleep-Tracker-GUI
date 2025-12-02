# 🚀 Deployment Guide - GitHub Pages & Raspberry Pi

## Part 1: Frontend auf GitHub Pages

### Vorbereitung
1. Stelle sicher, dass dein GitHub Repo `Sleep-Tracker-GUI` ist
2. Die Datei `.github/workflows/deploy-frontend.yml` ist bereits erstellt

### GitHub Pages aktivieren
1. Gehe zu deinem Repo auf GitHub
2. Klicke auf **Settings** → **Pages**
3. Unter "Source" wähle: **GitHub Actions**
4. Speichern

### Automatisches Deployment
- Jedes Mal wenn du `index.html`, `app.js` oder `style.css` pushst, wird das Frontend automatisch deployt
- Nach dem Push: **Actions** Tab → Workflow abwarten (ca. 1-2 Minuten)
- Frontend wird verfügbar unter: `https://dein-github-username.github.io/Sleep-Tracker-GUI/`

### Test
```bash
git add .github/workflows/deploy-frontend.yml
git commit -m "Add GitHub Pages deployment workflow"
git push
```

---

## Part 2: Backend auf Raspberry Pi

### Schritt 1: RPi vorbereiten

```bash
# SSH auf RPi
ssh pi@raspberrypi.local

# System updaten
sudo apt update && sudo apt upgrade -y
```

### Schritt 2: Sleep-Tracker-GUI auf RPi clonen

```bash
cd ~
git clone https://github.com/dein-username/Sleep-Tracker-GUI.git
cd Sleep-Tracker-GUI
```

### Schritt 3: .env Datei erstellen

```bash
nano .env
```

Füge folgendes ein:
```
OPENAI_API_KEY=sk-proj-dein-api-key-hier
NODE_ENV=production
PORT=3000
```

Speichern: `Ctrl+X`, dann `Y`, dann `Enter`

### Schritt 4: Setup Script ausführen

```bash
chmod +x setup-rpi.sh
./setup-rpi.sh
```

Das Script wird:
- ✅ Node.js 18+ installieren (falls nicht vorhanden)
- ✅ npm-Dependencies installieren
- ✅ pm2 installieren
- ✅ Server mit pm2 starten
- ✅ Auto-Start bei Reboot konfigurieren
- ✅ Firewall öffnen (Port 3000)

### Schritt 5: Status prüfen

```bash
pm2 status
pm2 logs sleep-tracker-backend
```

Sollte zeigen: "Server is running on http://localhost:3000"

---

## Part 3: Frontend mit Backend verbinden

Dein Frontend wird automatisch die richtige API-URL erkennen:

| Szenario | API URL | Status |
|----------|---------|--------|
| Lokale Entwicklung (localhost:8000) | `http://localhost:3000/api/analyze` | ✅ Funktioniert |
| GitHub Pages + RPi | `http://raspberrypi.local:3000/api/analyze` | ✅ Automatisch erkannt |
| Mit IP-Adresse (z.B. 192.168.x.x) | `http://192.168.x.x:3000/api/analyze` | ✅ Automatisch erkannt |

Die `determineApiUrl()` Funktion in `app.js` erkennt die Umgebung automatisch!

### Frontend URL für GitHub Pages

Wenn dein Frontend auf GitHub Pages läuft, muss die RPi im gleichen Netzwerk sein (oder über VPN erreichbar).

Beispiel:
- Frontend: `https://dein-github-username.github.io/Sleep-Tracker-GUI/`
- Backend: `http://raspberrypi.local:3000`

Browser macht automatisch die CORS-Anfrage zum Backend.

---

## Troubleshooting

### Backend läuft nicht
```bash
pm2 logs sleep-tracker-backend
# Zeigt Fehler an
```

### API Key funktioniert nicht
```bash
ssh pi@raspberrypi.local
nano .env
# Kontrolliere OPENAI_API_KEY
```

### Frontend kann Backend nicht erreichen
1. Prüfe ob RPi an ist: `ping raspberrypi.local`
2. Prüfe ob Port 3000 offen ist: `nmap -p 3000 raspberrypi.local`
3. Prüfe Firewall auf RPi: `sudo ufw status`

### Server neustarten
```bash
pm2 restart sleep-tracker-backend
```

---

## Nächste Schritte

### Optional: Domain statt IP/Hostname
Falls du eine echte Domain hast, kannst du die auch verwenden statt `raspberrypi.local`

### Optional: HTTPS (für echte Domains)
Mit Let's Encrypt + nginx kann man HTTPS einrichten

### Optional: Reverse Proxy
Falls der Backend-Server nicht direkt erreichbar sein soll, can man einen nginx Reverse Proxy aufsetzen

---

## Kosten

| Komponente | Kosten |
|-----------|--------|
| GitHub Pages (Frontend) | Kostenlos ✅ |
| RPi (einmalig) | ~€50-100 |
| RPi Strom (monatlich) | ~€5-10 |
| OpenAI API (täglich) | ~€0.002 |
| **Total monatlich** | **~€5-10** |

---

Viel Erfolg! 🚀
