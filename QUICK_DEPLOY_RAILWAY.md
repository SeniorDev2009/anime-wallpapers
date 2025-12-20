# Quick Start Deployment to Railway

## Prerequisites
- GitHub account (push code there)
- Railway account (free at railway.app)

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: anime wallpapers gallery"
git remote add origin https://github.com/YOUR_USERNAME/anime-wallpapers.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Railway

### Option A: Via Railway Dashboard (Easiest)
1. Go to [railway.app](https://railway.app)
2. New Project → Import from GitHub → Select your repo
3. Railway auto-detects `package.json` and deploys
4. Check logs for status

### Option B: Via Railway CLI
```bash
npm install -g @railway/cli
railway login
cd path/to/anime-wallpapers
railway init
railway up
```

## 3. Configure Environment Variables

In Railway Dashboard:

1. Go to your project
2. Click "Variables" tab
3. Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `USE_SQLITE` | `1` | **Required** |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | Change from default |
| `NODE_ENV` | `production` | Optional but recommended |

**Do NOT set `PORT`** — Railway sets it automatically as an environment variable

## 4. Access Your App

After deploy completes:
- **Gallery:** `https://<your-railway-project>.up.railway.app/`
- **Admin Panel:** `https://<your-railway-project>.up.railway.app/admin`
- **API:** `https://<your-railway-project>.up.railway.app/api/wallpapers`

## 5. Upload Images

1. Go to admin panel: `/admin`
2. Login with password you set
3. Upload wallpapers
4. All data persists in Railway's managed volume

## Troubleshooting

### "Port already in use" error?
- Railway sets `process.env.PORT` automatically
- Server code already respects this (see `server.js` line 21)
- Just remove any hardcoded port

### Database not persisting?
- Ensure `USE_SQLITE=1` env var is set
- Check Railway logs for SQLite errors
- SQLite file (`database.sqlite`) is automatically in Railway's persistent storage

### Images/uploads not showing?
- Check `/uploads` folder exists (server creates it)
- Verify `UPLOADS_DIR` path in `server.js` (should be `./uploads`)

### Deploy failed?
1. Check Railway logs:
   - Project → Logs tab
   - Look for npm install or node errors
2. Common issues:
   - Missing dependencies → check `package.json`
   - Node version incompatible → add `engines` in `package.json`
   - Port conflict → remove hardcoded `PORT` in code

## Monitoring

**View real-time logs:**
- Railway Dashboard → Logs tab
- Search for errors, check startup output

**View disk usage:**
- Railway Dashboard → Usage tab
- See SQLite DB size, upload folder size

## Custom Domain (Optional)

1. Railway Dashboard → Settings → Custom Domain
2. Add your domain
3. Follow DNS setup instructions

## Performance Tips

1. **Cache thumbnails:**
   - Add Cloudflare (free CDN) for `/thumbnails` and `/uploads`

2. **Optimize images:**
   - Limit upload size in `server.js` (currently unlimited)
   - Add image compression in upload handler

3. **Database:**
   - Add indexes (see TODO: Add SQLite FTS)
   - Archive old data periodically

## Upgrade Path

**When you're ready to pay:**
1. Railway Hobby tier (~$5/month) for more resources
2. Add Redis cache for API responses
3. Use S3/R2 for image storage instead of local filesystem
4. Add CDN like Cloudflare or BunnyCDN

---

**Need help?** See:
- [Railway Docs](https://docs.railway.app)
- [Express Deployment](https://expressjs.com/en/advanced/best-practice-security.html)
- [SQLite Persistence](https://docs.railway.app/databases/sqlite)
