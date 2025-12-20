const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Database path
const DB_PATH = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize database
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    images: [],
    categories: [],
    adSettings: {
      headerAd: '<!-- YANDEX AD HEADER -->',
      inContentAd: '<!-- YANDEX AD IN-CONTENT -->',
      footerAd: '<!-- YANDEX AD FOOTER -->'
    }
  }, null, 2));
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(8).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/admin', express.static('admin'));

// Helper functions
function loadDatabase() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    return { images: [], categories: [], adSettings: {} };
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
}

// Routes

// Public API - Get all wallpapers with pagination
app.get('/api/wallpapers', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = 12;
  
  const db = loadDatabase();
  const images = db.images || [];
  
  const total = images.length;
  const start = page * limit;
  const end = start + limit;
  const paginatedImages = images.slice(start, end);
  
  res.json({
    images: paginatedImages,
    total: total,
    page: page,
    hasMore: end < total
  });
});

// Public API - Get ad settings
app.get('/api/ads', (req, res) => {
  const db = loadDatabase();
  res.json(db.adSettings || {});
});

// Public API - Get categories
app.get('/api/categories', (req, res) => {
  const db = loadDatabase();
  res.json(db.categories || []);
});

// Public API - Get individual wallpaper by ID
app.get('/api/wallpapers/:id', (req, res) => {
  const db = loadDatabase();
  const wallpaper = db.images.find(img => img.id === req.params.id);
  
  if (!wallpaper) {
    return res.status(404).json({ error: 'Wallpaper not found' });
  }
  
  // Increment views
  wallpaper.views = (wallpaper.views || 0) + 1;
  saveDatabase(db);
  
  res.json(wallpaper);
});

// Admin API - Upload image
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
  try {
    const password = req.body.password;
    
    if (!verifyPassword(password)) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ error: 'Invalid password' });
    }

    const filename = req.file.filename;
    const title = req.body.title || 'Untitled';
    const description = req.body.description || '';
    const category = req.body.category || 'General';
    const tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(t => t);

    const db = loadDatabase();

    // Add category if new
    if (!db.categories.includes(category)) {
      db.categories.push(category);
    }

    // Add image metadata
    const imageData = {
      id: crypto.randomBytes(6).toString('hex'),
      filename: filename,
      title: title,
      description: description,
      category: category,
      tags: tags,
      uploadedAt: new Date().toISOString(),
      views: 0
    };

    if (!db.images) db.images = [];
    db.images.unshift(imageData);

    saveDatabase(db);

    res.json({ 
      success: true, 
      image: imageData,
      message: 'Image uploaded successfully'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin API - Delete image
app.post('/api/admin/delete', (req, res) => {
  const { password, imageId } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  const imageIndex = db.images.findIndex(img => img.id === imageId);

  if (imageIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const image = db.images[imageIndex];
  const filePath = path.join(UPLOADS_DIR, image.filename);

  // Delete file from disk
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File delete error:', err);
  }

  // Delete from database
  db.images.splice(imageIndex, 1);
  saveDatabase(db);

  res.json({ success: true, message: 'Image deleted successfully' });
});

// Admin API - Update image
app.post('/api/admin/update', (req, res) => {
  const { password, imageId, title, description, category, tags } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  const image = db.images.find(img => img.id === imageId);

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  image.title = title || image.title;
  image.description = description || image.description;
  image.category = category || image.category;
  if (tags) {
    image.tags = tags.split(',').map(t => t.trim()).filter(t => t);
  }

  // Add new category if provided
  if (category && !db.categories.includes(category)) {
    db.categories.push(category);
  }

  saveDatabase(db);

  res.json({ success: true, image: image, message: 'Image updated successfully' });
});

// Admin API - Get all images (for admin panel)
app.post('/api/admin/images', (req, res) => {
  const { password } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  res.json({ images: db.images || [] });
});

// Admin API - Update ad settings
app.post('/api/admin/ads', (req, res) => {
  const { password, headerAd, inContentAd, footerAd } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  db.adSettings = {
    headerAd: headerAd || db.adSettings.headerAd,
    inContentAd: inContentAd || db.adSettings.inContentAd,
    footerAd: footerAd || db.adSettings.footerAd
  };

  saveDatabase(db);

  res.json({ success: true, message: 'Ad settings updated successfully' });
});

// Admin API - Get ad settings (for admin panel)
app.post('/api/admin/ads-get', (req, res) => {
  const { password } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  res.json(db.adSettings || {});
});

// Admin API - Get categories
app.post('/api/admin/categories', (req, res) => {
  const { password } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const db = loadDatabase();
  res.json({ categories: db.categories || [] });
});

// Admin API - Add new category
app.post('/api/admin/category-add', (req, res) => {
  const { password, name } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  const db = loadDatabase();
  if (!db.categories) db.categories = [];

  if (db.categories.includes(name)) {
    return res.status(400).json({ error: 'Category already exists' });
  }

  db.categories.push(name);
  saveDatabase(db);

  res.json({ success: true, categories: db.categories });
});

// Admin API - Update (rename) category
app.post('/api/admin/category-update', (req, res) => {
  const { password, oldName, newName } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!oldName || !newName) {
    return res.status(400).json({ error: 'oldName and newName are required' });
  }

  const db = loadDatabase();
  const idx = db.categories.findIndex(c => c === oldName);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });

  // Avoid duplicate
  if (db.categories.includes(newName) && newName !== oldName) {
    return res.status(400).json({ error: 'Category with newName already exists' });
  }

  // Rename category in categories list
  db.categories[idx] = newName;

  // Update images using this category
  if (db.images && Array.isArray(db.images)) {
    db.images.forEach(img => {
      if (img.category === oldName) img.category = newName;
    });
  }

  saveDatabase(db);
  res.json({ success: true, categories: db.categories });
});

// Admin API - Delete category
app.post('/api/admin/category-delete', (req, res) => {
  const { password, name, fallback } = req.body;

  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!name) return res.status(400).json({ error: 'name is required' });

  const db = loadDatabase();
  const idx = db.categories.findIndex(c => c === name);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });

  // Remove category
  db.categories.splice(idx, 1);

  // Set images with this category to fallback (default to 'General')
  const fallbackCategory = fallback || 'General';
  if (!db.categories.includes(fallbackCategory)) {
    db.categories.push(fallbackCategory);
  }

  if (db.images && Array.isArray(db.images)) {
    db.images.forEach(img => {
      if (img.category === name) img.category = fallbackCategory;
    });
  }

  saveDatabase(db);
  res.json({ success: true, categories: db.categories });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// Serve individual wallpaper page (only match hex IDs, not static files)
app.get('/wallpaper/:id([a-f0-9]+)', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎨 Anime Wallpapers server running at http://localhost:${PORT}`);
  console.log(`📱 Visit http://localhost:${PORT} for the gallery`);
  console.log(`⚙️  Visit http://localhost:${PORT}/admin for admin panel`);
  console.log(`🔑 Default admin password: ${ADMIN_PASSWORD}`);
});
