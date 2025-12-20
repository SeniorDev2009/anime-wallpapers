# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

Output should show:
```
🎨 Anime Wallpapers server running at http://localhost:3000
📱 Visit http://localhost:3000 for the gallery
⚙️  Visit http://localhost:3000/admin for admin panel
🔑 Default admin password: admin123
```

### 3. Test Gallery
- Open http://localhost:3000 in browser
- You should see the gallery homepage (empty at first)

### 4. Access Admin Panel
- Open http://localhost:3000/admin
- Enter password: `admin123`
- Upload your first wallpaper!

---

## First Wallpaper Upload

1. Go to Admin Panel → Upload Image
2. Click or drag-drop an anime image
3. Fill in details:
   - **Title:** e.g., "Naruto Uzumaki"
   - **Description:** Short description
   - **Category:** Choose from dropdown
   - **Tags:** anime, character, cool, 4k
4. Click "Upload Image"
5. Done! Check gallery at http://localhost:3000

---

## File Structure Summary

```
anime-wallpapers/
├── server.js              ← Backend (Express)
├── public/
│   ├── index.html         ← Gallery page
│   ├── style.css          ← Styles
│   └── script.js          ← Gallery logic
├── admin/
│   ├── admin.html         ← Admin page
│   ├── admin.css          ← Admin styles
│   └── admin.js           ← Admin logic
├── uploads/               ← Where images are stored
├── database.json          ← Image data + ad codes
└── package.json           ← Dependencies
```

---

## Common Tasks

### Add Yandex Ad Codes
1. Admin Panel → Ad Settings
2. Paste your Yandex ad codes
3. Save → Live on gallery instantly

### Add New Category
1. Upload image with new category name
2. Category auto-creates in system
3. Appears in gallery filters

### Edit Wallpaper Info
1. Admin Panel → Manage Gallery
2. Click "Edit" on any image
3. Update title, description, category, tags
4. Confirm changes

### Delete Wallpaper
1. Admin Panel → Manage Gallery
2. Click "Delete" on image
3. Confirm deletion

---

## Important Files

| File | Purpose |
|------|---------|
| `server.js` | Express backend - all API routes |
| `public/index.html` | Gallery homepage |
| `public/script.js` | Infinite scroll + lazy loading |
| `admin/admin.html` | Admin dashboard UI |
| `admin/admin.js` | Admin panel logic |
| `database.json` | All image metadata |

---

## Environment Variables (Optional)

Set before running `npm start`:

```bash
# Windows PowerShell
$env:ADMIN_PASSWORD = "your-secure-password"
$env:PORT = 3000
npm start

# Windows CMD
set ADMIN_PASSWORD=your-secure-password
set PORT=3000
npm start

# Linux/Mac
export ADMIN_PASSWORD=your-secure-password
export PORT=3000
npm start
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Change PORT env variable |
| Can't login to admin | Default password is `admin123` |
| Images not appearing | Check `/uploads` folder exists |
| Infinite scroll not working | Check browser console for errors |

---

## Performance Tips

- Keep image file sizes under 2MB
- Use JPG format for smaller files
- Add relevant tags for SEO
- Write descriptive titles

---

## Next Steps

1. ✅ Server running locally
2. ✅ Upload sample wallpapers
3. ✅ Configure Yandex ad codes
4. ✅ Deploy to production server
5. ✅ Setup domain + HTTPS
6. ✅ Share link on Telegram

---

## Need Help?

Check browser console (F12) → Console tab for error messages
