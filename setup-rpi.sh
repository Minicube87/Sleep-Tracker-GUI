#!/bin/bash
# Sleep Tracker - Raspberry Pi Setup Script
# Dieses Script installiert und konfiguriert den Backend-Server auf der RPi

set -e

echo "🚀 Sleep Tracker Backend Setup für Raspberry Pi"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Node.js nicht gefunden. Installiere Node.js 18+..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📥 Installiere npm-Dependencies..."
cd "$(dirname "$0")/api" || exit
npm install

# Install pm2 globally
echo "📥 Installiere pm2 (Process Manager)..."
sudo npm install -g pm2

# Create .env file if not exists
if [ ! -f ../.env ]; then
    echo "⚠️  .env Datei nicht gefunden!"
    echo "📝 Bitte erstelle eine .env Datei im Projektroot mit:"
    echo "   OPENAI_API_KEY=your_api_key_here"
    echo "   NODE_ENV=production"
    exit 1
fi

# Start with pm2
echo "🔄 Starte Server mit pm2..."
pm2 start server.js --name "sleep-tracker-backend" --env production

# Setup pm2 to start on system reboot
echo "⚙️  Konfiguriere pm2 für Auto-Start..."
pm2 startup systemd -u $(whoami) --hp "$(cd ~ && pwd)"
pm2 save

# Open firewall if UFW is enabled
if command -v ufw &> /dev/null; then
    echo "🔥 Öffne Firewall Port 3000..."
    sudo ufw allow 3000/tcp || true
fi

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Backend läuft unter:"
echo "   Local: http://localhost:3000"
echo "   RPi Network: http://raspberrypi.local:3000"
echo ""
echo "🛠️  Wichtige pm2 Befehle:"
echo "   pm2 status                    - Status anzeigen"
echo "   pm2 logs sleep-tracker-backend - Logs anzeigen"
echo "   pm2 restart sleep-tracker-backend - Server neustarten"
echo "   pm2 stop sleep-tracker-backend    - Server stoppen"
echo ""
