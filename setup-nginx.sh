#!/bin/bash
# Sleep Tracker - nginx HTTPS Reverse Proxy Setup for Raspberry Pi
# This script sets up a https reverse proxy with lets encrypt

set -e

echo "Sleep Tracker nginx HTTPS Reverse Proxy Setup"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Must be executed as root: sudo bash setup-nginx.sh"
   exit 1
fi

# Install nginx und certbot
echo "Install nginx and lets encrypt (certbot)..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Backup nginx config
echo "Backup nginx config..."
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create nginx config for Sleep Tracker
echo "Config nginx Reverse Proxy..."
cat > /etc/nginx/sites-available/sleep-tracker << 'EOF'
server {
    listen 80;
    server_name raspberrypi.local;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 30s;
    }
}
EOF

# Enable the config
ln -sf /etc/nginx/sites-available/sleep-tracker /etc/nginx/sites-enabled/sleep-tracker
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "Test the nginx config..."
nginx -t

# Restart nginx
systemctl restart nginx

echo ""
echo "=================================================="
echo "nginx Reverse Proxy installiert!"
echo ""
echo "Next steps:"
echo ""
echo "1. Setup HTTPS with Let's Encrypt:"
echo "   sudo certbot --nginx -d raspberrypi.local"
echo ""
echo "2. Now it should run under https://raspberrypi.local:443 "
echo ""
echo "   HInt: Let's Encrypt only workds with real domains."
echo "   for local networks: Selfsigned certificate:"
echo "   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt"
echo ""
