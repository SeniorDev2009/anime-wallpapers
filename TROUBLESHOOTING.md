# 🆘 Troubleshooting & FAQ

## Installation Issues

### npm: command not found

**Problem:** NPM or Node.js not installed

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install the LTS version
3. Restart your terminal
4. Verify: `node --version` and `npm --version`

---

### EACCES: permission denied (Linux/macOS)

**Problem:** Can't install packages due to permissions

**Solution:**
```bash
# Option 1: Change npm permissions
sudo chown -R $USER ~/.npm

# Option 2: Use sudo with caution
sudo npm install

# Option 3: Use a Node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

---

### Cannot find module 'express'

**Problem:** Dependencies not installed

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## Server Issues

### EADDRINUSE: address already in use :::3000

**Problem:** Port 3000 is already in use

**Solution:**

**Windows PowerShell:**
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process
Stop-Process -Id <PID> -Force

# Or use a different port
$env:PORT = 8080
npm start
```

**Windows CMD:**
```cmd
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
set PORT=8080
npm start
```

**macOS/Linux:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8080 npm start
```

---

### Server won't start

**Problem:** Express server fails to start

**Solution:**
1. Check console for error messages
2. Verify Node.js version: `node --version` (should be 14+)
3. Check file permissions
4. Try with verbose output:
```bash
npm start 2>&1 | tee debug.log
```

---

### TypeError: Cannot read property 'images' of undefined

**Problem:** Database.json is corrupted

**Solution:**
```bash
# Backup corrupted database
cp database.json database.json.corrupted

# Reset database
rm database.json

# Restart server (will create fresh database)
npm start
```

---

## Image Upload Issues

### Images not uploading

**Problem:** Upload endpoint returns error

**Solutions:**
1. **Check uploads folder exists:**
```bash
# Windows
if not exist uploads mkdir uploads

# Linux/macOS
mkdir -p uploads
```

2. **Check file permissions:**
```bash
# Linux/macOS
chmod 755 uploads
```

3. **Check file size:**
- Default limit: 50MB
- Check max_file_size in server.js

4. **Check file type:**
- Allowed: JPG, PNG, WebP only
- Not allowed: GIF, TIFF, BMP

---

### "Invalid file type" error

**Problem:** Image format not supported

**Solution:**
- Use JPG or PNG format
- Convert file if needed:
  ```bash
  # Using ImageMagick
  convert image.gif image.jpg
  ```

---

### "Upload failed" error

**Problem:** Server-side upload issue

**Solution:**
1. Check server console for error details
2. Verify disk space available
3. Check file isn't corrupted
4. Restart server: `npm start`

---

## Admin Panel Issues

### Can't login to admin panel

**Problem:** Password rejected

**Solutions:**
1. **Check default password:** `admin123`
2. **Check CAPS LOCK:** Password is case-sensitive
3. **Check environment variable:**
```bash
# Windows
echo %ADMIN_PASSWORD%

# Linux/macOS
echo $ADMIN_PASSWORD
```
4. **Reset to default:**
```bash
# Remove environment variable and restart
npm start
# Use: admin123
```

---

### Admin panel loading forever

**Problem:** Page stuck loading

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify server is running
4. Try clearing browser cache (Ctrl+Shift+Delete)
5. Restart server and browser

---

### Edit/Delete buttons not working

**Problem:** Admin operations fail

**Solution:**
1. Check browser console for errors
2. Verify you're logged in
3. Check network tab (F12) for failed requests
4. Verify image still exists in /uploads

---

## Frontend Issues

### Images not showing in gallery

**Problem:** Gallery loads but no images appear

**Solutions:**
1. **Check images were uploaded:**
```bash
# List uploaded files
ls -la uploads/   # Linux/macOS
dir uploads       # Windows
```

2. **Check image paths:**
- Verify files exist in /uploads folder
- Check filename in database.json

3. **Check console (F12):**
- Look for 404 errors
- Check network tab

4. **Test API endpoint:**
```bash
# Visit in browser
http://localhost:3000/api/wallpapers?page=0
# Should return JSON with images
```

---

### Infinite scroll not working

**Problem:** No automatic image loading on scroll

**Solutions:**
1. **Check console for errors:** F12 → Console
2. **Verify API works:**
```bash
# Should return JSON
curl http://localhost:3000/api/wallpapers?page=0
```
3. **Scroll to bottom:** 
- Must scroll near bottom of page
- Network tab should show new API calls

---

### Images load very slowly

**Problem:** Slow image loading

**Solutions:**
1. **Optimize image sizes:**
   - Compress before upload
   - Use JPG instead of PNG when possible
   - Max recommended: 500KB per image

2. **Enable server compression:**
```javascript
// In server.js, add:
const compression = require('compression');
app.use(compression());
```

3. **Use CDN for production:**
   - Cloudflare
   - BunnyCDN
   - AWS CloudFront

---

### Filter buttons not working

**Problem:** Category filter doesn't change gallery

**Solutions:**
1. Check browser console (F12)
2. Verify categories exist:
```bash
curl http://localhost:3000/api/categories
```
3. Try refreshing page (F5)

---

### Lazy loading not working

**Problem:** All images load at once (slow)

**Solutions:**
1. Verify browser supports Intersection Observer:
   - All modern browsers support it
   - Check browser console for errors

2. Check if images have `loading="lazy"`:
```bash
# In public/script.js, search for:
img.loading = 'lazy';
```

3. Clear browser cache:
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (macOS)

---

## Database Issues

### database.json file missing

**Problem:** Database file deleted

**Solution:**
```bash
# Restart server - it will create default database
npm start
```

**Backup recovery:**
```bash
# If you have a backup
cp database.json.backup database.json
npm start
```

---

### Images disappeared after restart

**Problem:** Gallery was empty after restarting server

**Solutions:**
1. **Check database.json exists:**
```bash
ls database.json    # Linux/macOS
dir database.json   # Windows
```

2. **Check database has images:**
```bash
# On Linux/macOS
cat database.json | grep "images"

# On Windows (PowerShell)
Get-Content database.json | Select-String "images"
```

3. **Restore from backup:**
```bash
cp database.json.backup database.json
npm start
```

---

## Performance Issues

### Server using too much memory

**Problem:** Node process consuming lots of RAM

**Solutions:**
1. **Restart server:**
```bash
# Stop: Ctrl+C
# Start: npm start
```

2. **Increase memory limit:**
```bash
node --max-old-space-size=4096 server.js
```

3. **Optimize database:**
   - Remove old images
   - Clean up database.json
   - Backup and restore clean data

---

### Website very slow

**Problem:** Page takes forever to load

**Solutions:**
1. **Check internet speed:**
   - Use SpeedTest.net
   - Slow connections need optimization

2. **Optimize images:**
   - Compress before upload
   - Use smaller sizes (max 500KB)

3. **Enable caching:**
```nginx
# In Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=anime:10m;
proxy_cache_valid 200 1h;
proxy_cache anime;
```

4. **Use CDN:**
   - Cloudflare
   - BunnyCDN
   - AWS CloudFront

---

## Security Issues

### Unauthorized API access

**Problem:** Can access admin endpoints without password

**Solutions:**
1. **Verify password is set:**
```bash
# Windows
echo %ADMIN_PASSWORD%

# Linux/macOS
echo $ADMIN_PASSWORD
```

2. **Check server.js has password verification:**
```javascript
function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
}
```

3. **Change default password immediately:**
```bash
set ADMIN_PASSWORD=super-secret-password
npm start
```

---

### File upload exploits

**Problem:** Can upload non-image files

**Solutions:**
1. **Verify file type validation:**
```javascript
// Check server.js line 85-92
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
```

2. **File size limits:**
```javascript
// Check server.js line 72-76
multer({ fileFilter, storage })
```

---

## Browser-Specific Issues

### Not working in Internet Explorer

**Problem:** Ancient browser incompatibility

**Solution:**
- Use modern browser (Chrome, Firefox, Safari, Edge)
- IE11 not supported (use polyfills if required)

---

### Looks broken in mobile

**Problem:** Responsive design issues

**Solutions:**
1. **Check viewport meta tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

2. **Test on real device:**
   - Emulator isn't always accurate
   - Use Chrome DevTools device mode

3. **Check CSS media queries:**
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

---

## Deployment Issues

### Heroku deployment failed

**Problem:** Deployment to Heroku fails

**Solutions:**
1. **Check Procfile:**
```
web: node server.js
```

2. **Check buildpack:**
```bash
heroku buildpacks
# Should show: heroku/nodejs
```

3. **Check logs:**
```bash
heroku logs --tail
```

---

### VPS server not responding

**Problem:** Deployed site not accessible

**Solutions:**
1. **Check if server is running:**
```bash
pm2 list
# If not running: pm2 start server.js
```

2. **Check port access:**
```bash
netstat -tlnp | grep 3000
sudo ufw allow 3000
```

3. **Check firewall:**
```bash
# UFW firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

4. **Check Nginx configuration:**
```bash
sudo nginx -t  # Test config
sudo systemctl status nginx
```

---

## Common Questions (FAQ)

### Q: How do I change the site title?

**A:** Edit `public/index.html`:
```html
<title>Your New Title Here</title>
```

---

### Q: How do I add more categories?

**A:** Just upload an image with a new category name - it auto-creates!

---

### Q: Can I add my own logo?

**A:** Edit the logo in `public/index.html`:
```html
<h1 class="logo">🎨 Your Logo Here</h1>
```

---

### Q: How do I backup my data?

**A:** 
```bash
# Backup uploads and database
tar -czf backup.tar.gz database.json uploads/
```

---

### Q: How do I restore from backup?

**A:**
```bash
# Extract backup
tar -xzf backup.tar.gz
npm start
```

---

### Q: Can I use a different database?

**A:** Currently uses JSON. To use SQLite/PostgreSQL, you'd need to modify `server.js` to add database drivers.

---

### Q: How do I add image watermarks?

**A:** Use Sharp library in server.js to overlay watermarks on upload:
```javascript
// After upload, before saving
await sharp(req.file.path)
  .composite([{ input: 'watermark.png' }])
  .toFile(outputPath);
```

---

### Q: Can I monetize with ads other than Yandex?

**A:** Yes! Replace ad placeholders with Google AdSense, MediaVine, or other networks.

---

### Q: How do I prevent hotlinking to images?

**A:** Add Nginx header:
```nginx
location /uploads {
  valid_referers none blocked ~.google. ~.bing.;
  if ($invalid_referer) {
    return 403;
  }
}
```

---

### Q: How many users can the site support?

**A:** Depends on:
- Server specs
- Image optimization
- Database size
- Traffic patterns
- Typical: 1000-10000 concurrent users on 1GB RAM

---

### Q: Can I migrate to a different hosting?

**A:** Yes! Backup and copy:
- `database.json`
- `uploads/` folder
- `node_modules/` (or reinstall with npm install)

---

## Getting More Help

1. **Check the docs:**
   - README.md
   - DEPLOYMENT.md
   - PROJECT_SUMMARY.md

2. **Check browser console:**
   - F12 → Console tab
   - Look for error messages

3. **Check server logs:**
   - Terminal where `npm start` is running
   - Look for error stack traces

4. **Online resources:**
   - Stack Overflow
   - Express.js docs
   - Node.js docs
   - MDN Web Docs

5. **AI assistance:**
   - Use ChatGPT with error messages
   - Provide code snippets
   - Include error stack traces

---

## Report a Bug

When reporting issues, include:
1. Error message (exact text)
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Your environment (OS, Node version, browser)
6. Screenshot if visual issue

---

**Still having trouble?**

1. Check all docs
2. Review error messages carefully
3. Search GitHub issues
4. Try Stack Overflow
5. Ask in Node.js/Express communities

Good luck! 🚀
