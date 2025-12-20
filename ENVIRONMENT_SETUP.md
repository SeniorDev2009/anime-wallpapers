# ⚙️ Environment Setup & Configuration

## System Requirements

- **Node.js:** v14.0.0 or higher
- **npm:** v6.0.0 or higher
- **Storage:** 500MB minimum (1GB recommended)
- **RAM:** 512MB minimum
- **Disk I/O:** Fast SSD recommended for production

---

## Installation Steps

### 1. Install Node.js

#### Windows
```bash
# Download installer from https://nodejs.org/
# Run the installer
# Follow on-screen instructions
# Restart your computer

# Verify installation
node --version
npm --version
```

#### macOS
```bash
# Using Homebrew
brew install node

# Verify
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

---

## Local Development Setup

### Step 1: Clone or Extract Project

```bash
# Navigate to your projects folder
cd path/to/anime-wallpapers

# Verify structure
ls -la
# Should show: admin/, public/, server.js, package.json, etc.
```

### Step 2: Install Dependencies

```bash
# Install Node packages
npm install

# This will create:
# - node_modules/ folder
# - package-lock.json file

# Installation time: 1-3 minutes depending on internet speed
```

### Step 3: Start Development Server

```bash
# Windows PowerShell
npm start

# Or with custom port
$env:PORT = 3000
npm start
```

```bash
# Windows CMD
npm start

# Or with custom port
set PORT=3000
npm start
```

```bash
# macOS / Linux
npm start

# Or with custom port
PORT=3000 npm start
```

### Step 4: Verify Server is Running

You should see:
```
🎨 Anime Wallpapers server running at http://localhost:3000
📱 Visit http://localhost:3000 for the gallery
⚙️  Visit http://localhost:3000/admin for admin panel
🔑 Default admin password: admin123
```

---

## Environment Variables

### Development

No environment variables needed for local development (uses defaults).

### Production

Create `.env` file in project root:

```bash
# .env file
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD=your-very-secure-password-here
```

---

## Directory Permissions

### Local Development
- Usually no permission issues on Windows
- Make sure folder is writable

### Linux/macOS Production
```bash
# Grant proper permissions
chmod 755 /home/anime-wallpapers
chmod 755 /home/anime-wallpapers/uploads
chmod 755 /home/anime-wallpapers/public
chmod 755 /home/anime-wallpapers/admin

# Make files readable
chmod 644 /home/anime-wallpapers/*.js
chmod 644 /home/anime-wallpapers/*.json
```

---

## Database Setup

### Automatic (Default)
Database initializes automatically on first run:
- `database.json` is created
- Pre-populated with default categories
- Ready to use

### Manual Backup/Restore

```bash
# Backup current database
cp database.json database.json.backup

# Restore from backup
cp database.json.backup database.json
```

---

## Port Configuration

### Default Port: 3000

If port 3000 is in use:

#### Windows PowerShell
```bash
# Check what's using port 3000
Get-NetTCPConnection -LocalPort 3000

# Use different port
$env:PORT = 8080
npm start
```

#### Windows CMD
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Use different port
set PORT=8080
npm start
```

#### macOS / Linux
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

---

## Troubleshooting Installation

### Error: "npm: command not found"
```bash
# Node.js not installed or not in PATH
# Solution: Reinstall Node.js and restart terminal
node --version  # Should show v14+ or higher
```

### Error: "EACCES: permission denied"
```bash
# File permission issue
# Solution on Linux/macOS:
sudo chown -R $USER ~/.npm
sudo chown -R $USER /path/to/project
```

### Error: "EADDRINUSE: address already in use :::3000"
```bash
# Port 3000 is already in use
# Solution: Use different port
set PORT=8080 && npm start
```

### Error: "Cannot find module 'express'"
```bash
# Dependencies not installed
# Solution:
npm install
npm start
```

### Error: "uploads directory not found"
```bash
# Uploads folder missing (should be created automatically)
# Solution:
mkdir uploads
npm start
```

---

## Package.json Customization

Edit `package.json` to customize:

```json
{
  "name": "anime-wallpapers",
  "version": "1.0.0",
  "description": "Your description here",
  "author": "Your Name",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "watch": "nodemon server.js"  // Add this for auto-restart
  }
}
```

### Add nodemon for development (optional)

```bash
# Install nodemon (auto-restart on file changes)
npm install --save-dev nodemon

# Then use:
npm run watch
```

---

## Database Backup Strategy

### Automated Backup (Linux/Mac)

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="$HOME/anime-wallpapers-backups"
mkdir -p $BACKUP_DIR

# Backup with timestamp
cp database.json "$BACKUP_DIR/database-$(date +%Y%m%d-%H%M%S).json"
cp -r uploads "$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S)/"

# Keep only last 10 backups
cd $BACKUP_DIR
ls -t database-*.json | tail -n +11 | xargs rm -f
ls -td uploads-*/ | tail -n +11 | xargs rm -rf

echo "Backup completed!"
```

Make executable and run daily:
```bash
chmod +x backup.sh
./backup.sh
```

### Windows Backup Script

Create `backup.ps1`:

```powershell
$backupDir = "$HOME\anime-wallpapers-backups"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Copy-Item database.json "$backupDir\database-$timestamp.json"
Copy-Item -Recurse uploads "$backupDir\uploads-$timestamp"

# Keep last 10 backups
Get-ChildItem "$backupDir\database-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item

Write-Host "Backup completed!"
```

Run with Task Scheduler for daily backups.

---

## Performance Tuning

### Node.js Optimization

```bash
# Increase memory limit for large galleries
node --max-old-space-size=4096 server.js

# Or in package.json:
"start": "node --max-old-space-size=4096 server.js"
```

### Nginx Caching (Production)

```nginx
# Add to Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=anime:10m;

location / {
    proxy_cache anime;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

---

## Development Tools Setup

### Visual Studio Code Extensions

```
Recommended:
- REST Client (for API testing)
- Thunder Client
- Prettier (code formatter)
- ESLint (code linting)
- Live Server (for testing HTML)
```

### Test API Endpoints

Create `test.rest` in project root:

```rest
### Get all images
GET http://localhost:3000/api/wallpapers?page=0

### Get categories
GET http://localhost:3000/api/categories

### Get ad settings
GET http://localhost:3000/api/ads

### Admin login test (replace password)
POST http://localhost:3000/api/admin/images
Content-Type: application/json

{
  "password": "admin123"
}
```

Use with REST Client extension in VS Code.

---

## Security Configuration

### .env Best Practices

Never commit `.env` to git:

```bash
# Already in .gitignore
.env
```

### Change Default Password Immediately

```bash
# Before deployment, change password
set ADMIN_PASSWORD=your-super-secure-pwd-20-chars-min
npm start
```

### File Permissions (Production)

```bash
# Restrict access
chmod 700 /home/anime-wallpapers
chmod 600 /home/anime-wallpapers/.env
chmod 700 /home/anime-wallpapers/uploads
```

---

## Monitoring & Logging

### Console Output

```bash
# View current logs
npm start

# Output includes:
# - Server startup message
# - Request logs (optional)
# - Error messages
```

### PM2 Process Manager (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "anime-wallpapers"

# View logs
pm2 logs anime-wallpapers

# Monitor in real-time
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Docker Monitoring

```bash
# View container logs
docker logs container_id

# Real-time monitoring
docker stats
```

---

## Cleanup & Maintenance

### Remove Old Uploads

```bash
# List large files
find uploads/ -type f -size +10M

# Remove specific file
rm uploads/large_file.jpg

# Clean entire uploads (WARNING!)
rm -rf uploads/*
mkdir uploads/.gitkeep
```

### Database Cleanup

```bash
# Reset database (WARNING - deletes all data!)
rm database.json
npm start  # Recreates default database
```

### Node Modules Cleanup

```bash
# Remove old modules
rm -rf node_modules package-lock.json

# Reinstall fresh
npm install
```

---

## Deployment Checklist

- [ ] Change admin password
- [ ] Set Node.js version requirement in `package.json`
- [ ] Review `.env` configuration
- [ ] Test all endpoints locally
- [ ] Verify uploads work
- [ ] Test admin panel
- [ ] Create backup system
- [ ] Set up monitoring
- [ ] Configure domain/DNS
- [ ] Set up SSL certificate
- [ ] Run security audit
- [ ] Test with simulated load

---

## Quick Reference

```bash
# Start development
npm start

# Stop server
Ctrl + C

# Check Node version
node -v

# Check npm version
npm -v

# Update npm
npm install -g npm@latest

# Update Node packages
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

---

## Getting Help

1. **Check logs** - First step for any error
2. **Browser console** - Press F12, go to Console tab
3. **Server output** - Check terminal where `npm start` is running
4. **Documentation** - See README.md and other docs
5. **Stack Overflow** - Search for error message

---

**Setup complete!** Your environment is ready for development.

Start with: `npm install && npm start`
