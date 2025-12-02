#!/bin/bash
# Sleep Tracker - nginx HTTPS Reverse Proxy Setup for Raspberry Pi
# This script sets up a HTTPS reverse proxy with self-signed certificate

set -e

echo "Sleep Tracker nginx HTTPS Reverse Proxy Setup"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be executed as root: sudo bash setup-nginx.sh"
   exit 1
fi

# Install nginx
echo "Installing nginx..."
apt-get update
apt-get install -y nginx openssl

# Backup nginx config
if [ -f /etc/nginx/sites-available/default ]; then
    echo "Backing up nginx config..."
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
fi

# Create self-signed certificate
echo "Creating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/C=DE/ST=State/L=City/O=Sleep-Tracker/CN=raspberrypi.local"

# Create nginx config for Sleep Tracker
echo "Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/sleep-tracker << 'EOF'
server {
    listen 443 ssl http2;
    server_name raspberrypi.local;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

server {
    listen 80;
    server_name raspberrypi.local;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable the config
echo "Enabling nginx config..."
ln -sf /etc/nginx/sites-available/sleep-tracker /etc/nginx/sites-enabled/sleep-tracker
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo "Testing nginx config..."
nginx -t

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

echo ""
echo "=================================================="
echo "nginx HTTPS Reverse Proxy successfully installed!"
echo ""
echo "Details:"
echo "   - HTTPS at: https://raspberrypi.local:443"
echo "   - HTTP redirects to: https://raspberrypi.local"
echo "   - Backend proxy to: http://localhost:3000"
echo "   - SSL certificate: /etc/ssl/certs/nginx-selfsigned.crt"
echo ""
echo "Important:"
echo "   - Browser will show security warning (normal for self-signed certificates)"
echo "   - Click 'Advanced' then 'Proceed' to continue"
echo "   - Frontend: https://minicube87.github.io/Sleep-Tracker-GUI/"
echo ""
echo "Test:"
echo "   curl -k https://raspberrypi.local/  (ignores SSL warning)"
echo ""

