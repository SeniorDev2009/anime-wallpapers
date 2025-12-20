# 🌐 Deployment Guide

## Local Development

```bash
npm install
npm start
# Visit http://localhost:3000
```

---

## Cloud Deployment

### ⭐ Option 1: Railway (Recommended - Free Tier)

**Why Railway?**
- Free tier: 5GB/month (perfect for your app)
- SQLite + persistent storage for uploads
- Easy GitHub integration
- No credit card required

**Setup:**

1. Create account at [railway.app](https://railway.app)

2. Install Railway CLI & deploy:
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. Set Environment Variables in Railway Dashboard:
   - `USE_SQLITE=1` (critical)
   - `ADMIN_PASSWORD=your_secure_password` (change from 'admin123')

4. Access your app:
   - Gallery: `https://your-railway-url/`
   - Admin: `https://your-railway-url/admin`

**Data Persistence:**
- SQLite database (`database.sqlite`) automatically persists
- Uploads folder (`/uploads`) stays across restarts

---

### Option 2: Render.com Web Service

1. Create account at render.com
2. Create New → Web Service
3. Connect GitHub repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Environment variables: `USE_SQLITE=1`, `ADMIN_PASSWORD=...`
7. Add persistent disk at `/app/uploads`

---

### Option 3: Replit (Free, Browser-Based)

1. Go to [replit.com](https://replit.com)
2. Import from GitHub
3. Click "Run" (auto-detects `package.json`)
4. Share public URL

4. **Set environment variables**
   ```bash
   heroku config:set ADMIN_PASSWORD=your-secure-password
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Access**
   ```
   https://anime-wallpapers.herokuapp.com
   https://anime-wallpapers.herokuapp.com/admin
   ```

---

### Option 2: Railway.app

1. **Connect GitHub** at railway.app
2. **Connect your repository**
3. **Railway auto-detects Node.js**
4. **Add environment variables:**
   - `ADMIN_PASSWORD=your-password`
   - `NODE_ENV=production`
5. **Deploy automatically on push**

---

### Option 3: Replit

1. **Create new Replit project**
2. **Upload files**
3. **Install dependencies**
4. **Set Secrets:**
   - Key: `ADMIN_PASSWORD`
   - Value: `your-password`
5. **Click Run**

---

### Option 4: VPS (Ubuntu/Debian)

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repository
git clone <your-repo-url> /home/anime-wallpapers
cd /home/anime-wallpapers

# Install dependencies
npm install

# Create .env file
sudo nano .env
# Add: ADMIN_PASSWORD=your-secure-password
#      PORT=3000
#      NODE_ENV=production

# Start with PM2
pm2 start server.js --name "anime-wallpapers"
pm2 startup
pm2 save
```

#### Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/anime-wallpapers
```

Add this config:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /home/anime-wallpapers/uploads;
        expires 30d;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/anime-wallpapers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Database Backup

### Backup Uploads & Database

```bash
# Create backup
tar -czf anime-wallpapers-backup-$(date +%Y%m%d).tar.gz uploads/ database.json

# List backups
ls -lh anime-wallpapers-backup-*.tar.gz

# Restore from backup
tar -xzf anime-wallpapers-backup-20250101.tar.gz
```

### Auto-backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/anime-wallpapers"
APP_DIR="/home/anime-wallpapers"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup-$DATE.tar.gz $APP_DIR/uploads $APP_DIR/database.json

# Keep only last 10 backups
ls -t $BACKUP_DIR/backup-*.tar.gz | tail -n +11 | xargs rm -f

echo "Backup created: backup-$DATE.tar.gz"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/anime-wallpapers/backup.sh
```

---

## Performance Optimization

### Image Optimization

Before uploading to production, optimize images:

```bash
# Install ImageMagick
sudo apt install -y imagemagick

# Convert and compress
convert input.jpg -resize 1920x1440 -quality 85 output.jpg
```

### Caching Headers

Update Nginx config:

```nginx
location /uploads {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location /public {
    expires 1h;
    add_header Cache-Control "public";
}
```

### Enable Gzip Compression

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## Monitoring & Logs

### PM2 Monitoring

```bash
# Monitor all processes
pm2 monit

# View logs
pm2 logs anime-wallpapers

# Restart app
pm2 restart anime-wallpapers

# Stop app
pm2 stop anime-wallpapers
```

### Nginx Logs

```bash
# Real-time access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx status
sudo systemctl status nginx
```

---

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### .htaccess for Apache (if using Apache)

```apache
<Files ~ "\.env$">
    Order allow,deny
    Deny from all
</Files>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### Hide Server Info

Add to Nginx config:

```nginx
server_tokens off;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

---

## Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

Create `.dockerignore`:

```
node_modules
npm-debug.log
.env
uploads
database.json
```

Build and run:

```bash
docker build -t anime-wallpapers .
docker run -p 3000:3000 -e ADMIN_PASSWORD=secure anime-wallpapers
```

---

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT env variable |
| 502 Bad Gateway | Check if Node process is running |
| Images not uploading | Check `/uploads` folder permissions |
| Slow performance | Enable Gzip, optimize images, use CDN |
| Database not persisting | Check file permissions on `/uploads` and `database.json` |

---

## Monitoring Tools

- **Uptime Monitoring:** UptimeRobot (free tier)
- **Performance:** New Relic, DataDog
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics

---

## Rollback Procedure

If something breaks:

```bash
# Kill current process
pm2 stop anime-wallpapers

# Restore backup
tar -xzf anime-wallpapers-backup-20250101.tar.gz

# Install dependencies again
npm install

# Restart
pm2 start server.js
```

---

## Maintenance Schedule

- **Daily:** Monitor logs for errors
- **Weekly:** Check disk space, backup database
- **Monthly:** Update dependencies, review analytics
- **Quarterly:** Security audit, performance optimization

---

## Support & Resources

- Node.js Docs: https://nodejs.org/docs/
- Express Docs: https://expressjs.com/
- PM2 Docs: https://pm2.keymetrics.io/
- Nginx Docs: https://nginx.org/en/docs/
