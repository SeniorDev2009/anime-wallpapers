# 🎨 Anime Wallpapers - Production Ready Website

Fast, mobile-first anime wallpaper gallery optimized for Yandex Advertising Network (YAN) and Telegram traffic.

## 📋 Features

✅ **Frontend**
- Single-topic anime wallpaper gallery
- Dark minimalist UI optimized for Telegram users
- Infinite scroll with lazy loading
- Mobile-first responsive design
- Semantic HTML5 with SEO optimization
- Zero external frameworks (vanilla HTML/CSS/JS)

✅ **Backend**
- Node.js + Express server
- JSON-based lightweight database
- Image upload with validation
- RESTful API architecture

✅ **Admin Panel**
- Password-protected administration
- Upload wallpapers with drag-and-drop
- Create/manage categories and tags
- Edit image metadata
- Delete images
- Manage Yandex ad codes directly
- Mobile-friendly dashboard

✅ **Ad Optimization**
- Safe Yandex ad placeholders
- Ad slots:
  - Below header
  - After every 6 images (in-content)
  - Before footer
- High viewability design
- No forced clicks or overlays
- Compliant with Yandex policies

✅ **Performance**
- Fast page load times
- Lazy loading images
- Minimal JavaScript footprint
- Optimized for slow connections

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm

### Installation

1. **Navigate to project directory:**
```bash
cd anime-wallpapers
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

4. **Open in browser:**
- Gallery: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- Default password: `admin123`

### Configure Admin Password & Database

**Local Development:**
```bash
set ADMIN_PASSWORD=your-secure-password
set USE_SQLITE=1
npm start
```

**Or use `.env` file:**
```bash
cp .env.example .env
# Edit .env with your values
npm start
```

**For Windows PowerShell:**
```powershell
$env:ADMIN_PASSWORD="your-secure-password"
$env:USE_SQLITE="1"
node server.js
```

## 🌐 Deploy to Production

### Quick Deploy to Railway (Free)

Railway.app offers **free tier with 5GB/month** — perfect for your site!

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Set these environment variables in Railway Dashboard:
- `USE_SQLITE=1` (required)
- `ADMIN_PASSWORD=your_secure_password` (change from default)

**See detailed guide:** [QUICK_DEPLOY_RAILWAY.md](QUICK_DEPLOY_RAILWAY.md)

### Why Not Render.com Static Site?

❌ **Render Static Site** = for static HTML/CSS/JS only
✅ **This app** = Node.js server + SQLite database + dynamic content

**Options:**
- **Railway** (recommended) - free tier, SQLite support
- **Render Web Service** - paid, full Node.js support
- **Replit** - free, browser-based

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed comparison.

## 📁 Project Structure

```
anime-wallpapers/
├── public/
│   ├── index.html          # Gallery homepage
│   ├── style.css           # Main styles
│   ├── script.js           # Gallery logic
│   └── (images load here from /uploads)
│
├── admin/
│   ├── admin.html          # Admin panel UI
│   ├── admin.css           # Admin styles
│   └── admin.js            # Admin functionality
│
├── uploads/                # Wallpaper storage
├── server.js               # Express backend
├── database.json           # Image metadata + ad codes
├── package.json            # Dependencies
└── README.md               # This file
```

## 🎯 API Endpoints

### Public Routes

**GET /api/wallpapers?page=0**
- Returns paginated images (12 per page)
- Response:
```json
{
  "images": [...],
  "total": 50,
  "page": 0,
  "hasMore": true
}
```

**GET /api/categories**
- Returns all categories

**GET /api/ads**
- Returns current ad settings

### Admin Routes (Password Protected)

**POST /api/admin/upload**
- Upload new wallpaper
- Payload: multipart form-data
  - image: File
  - title: String
  - description: String
  - category: String
  - tags: String (comma-separated)
  - password: String

**POST /api/admin/images**
- Get all images (admin only)
- Payload: `{ password: String }`

**POST /api/admin/update**
- Update image metadata
- Payload: `{ password, imageId, title, description, category, tags }`

**POST /api/admin/delete**
- Delete image
- Payload: `{ password, imageId }`

**POST /api/admin/ads**
- Update ad settings
- Payload: `{ password, headerAd, inContentAd, footerAd }`

**POST /api/admin/ads-get**
- Get current ad settings
- Payload: `{ password }`

**POST /api/admin/categories**
- Get all categories
- Payload: `{ password }`

## 🎨 Customization

### Change Site Title
Edit `public/index.html` line 9:
```html
<title>Anime Wallpapers - HD & 4K Gallery | Free Download</title>
```

### Adjust Gallery Grid
Edit `public/style.css` around line 200:
```css
.gallery {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
}
```

### Modify Dark Theme Colors
Edit `public/style.css` lines 19-27:
```css
:root {
    --bg-dark: #0a0e27;
    --bg-secondary: #1a1f3a;
    --text-primary: #e0e6ff;
    --accent: #7c3aed;
    /* ... etc */
}
```

### Add Yandex Ad Codes
1. Login to Admin Panel
2. Navigate to "Ad Settings"
3. Paste your Yandex ad codes in the respective fields
4. Changes reflect instantly on the gallery

## 📱 Mobile Optimization

- Touch-friendly buttons and filters
- Optimized image sizes for mobile
- Fast first content (no heavy text loading)
- Infinite scroll designed for mobile scrolling
- Responsive grid adapts to screen size

## 🔐 Security

- Admin routes protected with password authentication
- CORS friendly for future API expansion
- File upload validation (image types only)
- SQL injection safe (JSON database)

## 📊 SEO & Performance

- Semantic HTML5 structure
- Meta tags for social sharing
- Image alt text from title
- Lazy loading reduces bandwidth
- Clean URL structure
- Fast initial page load (<2s on 3G)

## 🧩 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js 14+, Express 4.18+
- **Storage:** JSON (database.json)
- **Image Processing:** Sharp (optional for resizing)
- **File Upload:** Multer

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0"
}
```

## 🚨 Production Deployment

### For Production:

1. **Change default password:**
```bash
set ADMIN_PASSWORD=your-super-secure-password
```

2. **Use environment variables:**
```bash
set NODE_ENV=production
set PORT=8080
```

3. **Use process manager (PM2):**
```bash
npm install -g pm2
pm2 start server.js --name "anime-wallpapers"
pm2 startup
pm2 save
```

4. **Setup reverse proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

5. **Setup HTTPS with Let's Encrypt:**
```bash
# Install Certbot and configure SSL
```

## 📈 Yandex Optimization Tips

1. **High Viewability:**
   - Ad containers are never hidden initially
   - Natural placement within content
   - Proper spacing from other elements

2. **Safe Content:**
   - Only anime wallpapers (consistent niche)
   - No clickbait or misleading ads
   - Clean, professional design

3. **Mobile Optimization:**
   - Ads scale properly on mobile
   - Touch-friendly ad placement
   - Fast loading for better CTR

4. **Traffic Quality:**
   - Direct Telegram referrals
   - SEO optimized for relevant keywords
   - User-friendly experience

## 🐛 Troubleshooting

**Images not loading?**
- Check `uploads/` folder exists
- Verify file permissions
- Check server console for errors

**Admin panel not accepting password?**
- Ensure password is correct (default: admin123)
- Check `ADMIN_PASSWORD` environment variable
- Verify server is running

**Infinite scroll not working?**
- Check browser console for JS errors
- Verify `/api/wallpapers` endpoint responds
- Check network tab for failed requests

**Ad placeholders not showing?**
- Verify Yandex ad code is valid
- Check for script errors in console
- Ensure ad code format is correct

## 📝 License

MIT License - Feel free to use and modify

## 👨‍💻 Support

For issues or questions, check:
1. Browser console (F12) for errors
2. Server logs for backend issues
3. Verify all files are in correct directories

---

Built with ❤️ for Anime fans and Telegram users
