const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sqlite3 = null;
let sqliteDb = null;
const SQLITE_PATH = path.join(__dirname, 'database.sqlite');
const USE_SQLITE = process.env.USE_SQLITE === '1' || fs.existsSync(SQLITE_PATH);

if (USE_SQLITE) {
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (e) {
    console.error('sqlite3 not installed. Run `npm install` to add it.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '970720526';

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
// Serve thumbnails
const THUMB_DIR = path.join(__dirname, 'uploads', 'thumbs');
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });
app.use('/thumbnails', express.static(path.join('uploads', 'thumbs')));

// Helper functions
function initSqlite() {
  if (!sqlite3) return;
  
  sqliteDb = new sqlite3.Database(SQLITE_PATH, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
      process.exit(1);
    }
    console.log('✅ SQLite database connected');
  });

  // Create tables
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        filename TEXT,
        title TEXT,
        description TEXT,
        category TEXT,
        tags TEXT,
        uploadedAt TEXT,
        views INTEGER,
        width INTEGER,
        height INTEGER,
        size INTEGER,
        likes INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0
      )
    `);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY)`);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS adSettings (key TEXT PRIMARY KEY, value TEXT)`);

    // Ensure new columns exist for older DBs
    sqliteDb.all("PRAGMA table_info(images)", [], (err, cols) => {
      if (!err && Array.isArray(cols)) {
        const names = cols.map(c => c.name);
        if (!names.includes('width')) sqliteDb.run('ALTER TABLE images ADD COLUMN width INTEGER');
        if (!names.includes('height')) sqliteDb.run('ALTER TABLE images ADD COLUMN height INTEGER');
        if (!names.includes('size')) sqliteDb.run('ALTER TABLE images ADD COLUMN size INTEGER');
        if (!names.includes('likes')) sqliteDb.run('ALTER TABLE images ADD COLUMN likes INTEGER DEFAULT 0');
        if (!names.includes('downloads')) sqliteDb.run('ALTER TABLE images ADD COLUMN downloads INTEGER DEFAULT 0');
      }
    });
  });
}

function loadDatabase() {
  if (sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb.serialize(() => {
        const images = [];
        const categories = [];
        const adSettings = {};

        sqliteDb.all('SELECT * FROM images ORDER BY uploadedAt DESC', [], (err, rows) => {
          if (!err && rows) {
            rows.forEach(r => {
              images.push({
                id: r.id,
                filename: r.filename,
                title: r.title,
                description: r.description,
                category: r.category,
                tags: JSON.parse(r.tags || '[]'),
                uploadedAt: r.uploadedAt,
                views: r.views,
                width: r.width || null,
                height: r.height || null,
                size: r.size || null,
                likes: r.likes || 0,
                downloads: r.downloads || 0
              });
            });
          }

          sqliteDb.all('SELECT name FROM categories', [], (err, rows) => {
            if (!err && rows) {
              rows.forEach(r => categories.push(r.name));
            }

            sqliteDb.all('SELECT key,value FROM adSettings', [], (err, rows) => {
              if (!err && rows) {
                rows.forEach(a => adSettings[a.key] = a.value);
              }
              resolve({ images, categories, adSettings });
            });
          });
        });
      });
    });
  }

  // Fallback to JSON
  try {
    return Promise.resolve(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
  } catch (err) {
    return Promise.resolve({ images: [], categories: [], adSettings: {} });
  }
}

function saveDatabase(data) {
  if (sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb.serialize(() => {
        sqliteDb.run('DELETE FROM images');
        sqliteDb.run('DELETE FROM categories');
        sqliteDb.run('DELETE FROM adSettings', () => {
          const insertImage = sqliteDb.prepare(
            `INSERT INTO images (id,filename,title,description,category,tags,uploadedAt,views,width,height,size) VALUES (?,?,?,?,?,?,?,?,?,?)`
          );
          if (Array.isArray(data.images)) {
            data.images.forEach(img => {
              insertImage.run([
                img.id,
                img.filename,
                img.title || '',
                img.description || '',
                img.category || '',
                JSON.stringify(img.tags || []),
                img.uploadedAt || new Date().toISOString(),
                img.views || 0,
                img.width || null,
                img.height || null,
                img.size || null
              ]);
            });
          }
          insertImage.finalize();

          const insertCategory = sqliteDb.prepare(`INSERT INTO categories (name) VALUES (?)`);
          if (Array.isArray(data.categories)) {
            data.categories.forEach(c => insertCategory.run([c]));
          }
          insertCategory.finalize();

          const insertAd = sqliteDb.prepare(`INSERT INTO adSettings (key,value) VALUES (?,?)`);
          if (data.adSettings) {
            Object.keys(data.adSettings).forEach(k => {
              insertAd.run([k, data.adSettings[k] || '']);
            });
          }
          insertAd.finalize();
          resolve();
        });
      });
    });
  }

  // Fallback to JSON
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return Promise.resolve();
}

function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
}

// Helper: add computed thumbnail URLs to images
function addThumbnails(images) {
  return (images || []).map(img => ({
    ...img,
    thumbnail: `/thumbnails/${img.filename}`
  }));
}

// Initialize SQLite if configured
if (USE_SQLITE) initSqlite();

// Public API - Get all wallpapers with pagination, filter, and search
app.get('/api/wallpapers', async (req, res) => {
  const page = Math.max(0, parseInt(req.query.page) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
  const category = (req.query.category || '').toString().trim().toLowerCase();
  const query = (req.query.q || '').toString().trim().toLowerCase();

  const db = await loadDatabase();
  const images = db.images || [];

  const matchesQuery = (img) => {
    if (!query) return true;
    const title = (img.title || '').toLowerCase();
    const desc = (img.description || '').toLowerCase();
    const cat = (img.category || '').toLowerCase();
    const tags = Array.isArray(img.tags) ? img.tags.join(' ').toLowerCase() : '';
    const filename = (img.filename || '').toLowerCase();
    return (
      title.includes(query) ||
      desc.includes(query) ||
      cat.includes(query) ||
      tags.includes(query) ||
      filename.includes(query)
    );
  };

  const filtered = images.filter(img => {
    const inCategory = !category || category === 'all'
      ? true
      : (img.category || '').toLowerCase() === category;
    return inCategory && matchesQuery(img);
  });

  const total = filtered.length;
  const start = page * limit;
  const end = start + limit;
  const paginatedImages = addThumbnails(filtered.slice(start, end));

  res.json({
    images: paginatedImages,
    total,
    page,
    limit,
    hasMore: end < total
  });
});

// Public API - Get ad settings
app.get('/api/ads', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.adSettings || {});
});

// Public API - Get categories
app.get('/api/categories', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.categories || []);
});

// Public API - Get individual wallpaper by ID
// Public API - Like a wallpaper
app.post('/api/wallpapers/like/:id', (req, res) => {
  const id = req.params.id;
  sqliteDb.run('UPDATE images SET likes = likes + 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to like wallpaper' });
    sqliteDb.get('SELECT likes FROM images WHERE id = ?', [id], (err2, row) => {
      if (err2 || !row) return res.status(404).json({ error: 'Wallpaper not found' });
      res.json({ likes: row.likes });
    });
  });
});

// Public API - Download counter
app.post('/api/wallpapers/download/:id', (req, res) => {
  const id = req.params.id;
  sqliteDb.run('UPDATE images SET downloads = downloads + 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to increment download count' });
    sqliteDb.get('SELECT downloads FROM images WHERE id = ?', [id], (err2, row) => {
      if (err2 || !row) return res.status(404).json({ error: 'Wallpaper not found' });
      res.json({ downloads: row.downloads });
    });
  });
});
app.get('/api/wallpapers/:id', async (req, res) => {
  const db = await loadDatabase();
  const wallpaper = db.images.find(img => img.id === req.params.id);
  
  if (!wallpaper) {
    return res.status(404).json({ error: 'Wallpaper not found' });
  }
  
  // Increment views
  wallpaper.views = (wallpaper.views || 0) + 1;
  await saveDatabase(db);
  
  res.json(addThumbnails([wallpaper])[0]);
});

// Public API - Get similar wallpapers (server-side, paged)
app.get('/api/wallpapers/similar/:id', async (req, res) => {
  const db = await loadDatabase();
  const id = req.params.id;
  const page = Math.max(0, parseInt(req.query.page) || 0);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));

  const target = db.images.find(img => img.id === id);
  if (!target) return res.status(404).json({ error: 'Wallpaper not found' });

  // Prepare scoring helpers
  const normalize = (s) => (s || '').toString().toLowerCase();
  const titleWords = new Set((normalize(target.title)).split(/\s+/));
  const tagSet = new Set((target.tags || []).map(t => normalize(t)));
  const targetCategory = normalize(target.category);

  const scored = (db.images || [])
    .filter(i => i && i.id !== id)
    .map(i => {
      const iTags = (i.tags || []).map(t => normalize(t));
      const tagMatches = iTags.filter(t => tagSet.has(t)).length;
      const iTitle = normalize(i.title || '');
      const titleWordsI = new Set(iTitle.split(/\s+/));
      let titleOverlap = 0;
      for (const w of titleWords) if (titleWordsI.has(w)) titleOverlap++;
      const titleSim = titleWords.size > 0 ? (titleOverlap / Math.max(1, titleWordsI.size)) : 0;
      const sameCategory = (normalize(i.category) === targetCategory) ? 1 : 0;
      const score = (titleSim * 8) + (tagMatches * 5) + (sameCategory * 2);
      return { item: i, score };
    })
    .sort((a,b) => b.score - a.score || (b.item.uploadedAt || '').localeCompare(a.item.uploadedAt || ''))
    .map(s => s.item);

  const total = scored.length;
  const start = page * limit;
  const end = start + limit;
  const pageItems = addThumbnails(scored.slice(start, end));

  res.json({ images: pageItems, page, limit, total, hasMore: end < total });
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
    const filePath = path.join(UPLOADS_DIR, filename);
    const thumbPath = path.join(THUMB_DIR, filename);
    const title = req.body.title || 'Untitled';
    const description = req.body.description || '';
    const category = req.body.category || 'General';
    const tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(t => t);

    // Probe file for metadata (width, height, size)
    let width = null, height = null, size = null;
    try {
      const meta = await sharp(filePath).metadata();
      width = meta.width || null;
      height = meta.height || null;
      // Generate thumbnail (vertical-friendly)
      await sharp(filePath)
        .resize({ width: 400, height: 700, fit: 'cover' })
        .toFile(thumbPath);
    } catch (e) {
      console.warn('sharp metadata/thumbnail failed for', filePath, e.message || e);
    }
    try {
      const st = fs.statSync(filePath);
      size = st.size || null;
    } catch (e) {
      console.warn('stat failed for', filePath, e.message || e);
    }

    // Add category if new
    sqliteDb.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);

    // Insert image directly into SQLite
    const id = crypto.randomBytes(6).toString('hex');
    const uploadedAt = new Date().toISOString();
    sqliteDb.run(
      `INSERT INTO images (id, filename, title, description, category, tags, uploadedAt, views, width, height, size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        filename,
        title,
        description,
        category,
        JSON.stringify(tags),
        uploadedAt,
        0,
        width,
        height,
        size
      ],
      function (err) {
        if (err) {
          console.error('SQLite insert error:', err);
          return res.status(500).json({ error: 'Failed to save image to database' });
        }
        // Return the inserted image data
        res.json({
          success: true,
          image: addThumbnails([
            {
              id,
              filename,
              title,
              description,
              category,
              tags,
              uploadedAt,
              views: 0,
              width,
              height,
              size
            }
          ])[0],
          message: 'Image uploaded successfully'
        });
      }
    );
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin API - Delete image
app.post('/api/admin/delete', async (req, res) => {
  const { password, imageId } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  // Get image filename from DB
  sqliteDb.get('SELECT filename FROM images WHERE id = ?', [imageId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const filePath = path.join(UPLOADS_DIR, row.filename);
    // Delete file from disk
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('File delete error:', err);
    }
    // Delete from database
    sqliteDb.run('DELETE FROM images WHERE id = ?', [imageId], function (err2) {
      if (err2) {
        return res.status(500).json({ error: 'Failed to delete image from database' });
      }
      res.json({ success: true, message: 'Image deleted successfully' });
    });
  });
});

// Admin API - Update image
app.post('/api/admin/update', async (req, res) => {
  const { password, imageId, title, description, category, tags } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  // Add new category if needed
  if (category) {
    sqliteDb.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
  }
  // Update image in DB
  sqliteDb.run(
    'UPDATE images SET title = ?, description = ?, category = ?, tags = ? WHERE id = ?',
    [
      title,
      description,
      category,
      tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)) : null,
      imageId
    ],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(404).json({ error: 'Image not found or update failed' });
      }
      // Return updated image
      sqliteDb.get('SELECT * FROM images WHERE id = ?', [imageId], (err2, row) => {
        if (err2 || !row) {
          return res.status(404).json({ error: 'Image not found after update' });
        }
        row.tags = JSON.parse(row.tags || '[]');
        res.json({ success: true, image: addThumbnails([row])[0], message: 'Image updated successfully' });
      });
    }
  );
});

// Admin API - Get all images (for admin panel)
app.post('/api/admin/images', async (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  sqliteDb.all('SELECT * FROM images ORDER BY uploadedAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch images' });
    rows.forEach(r => r.tags = JSON.parse(r.tags || '[]'));
    res.json({ images: addThumbnails(rows) });
  });
});

// Admin API - Update ad settings
app.post('/api/admin/ads', async (req, res) => {
  const { password, headerAd, inContentAd, footerAd } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  // Update ad settings in DB
  sqliteDb.serialize(() => {
    sqliteDb.run('INSERT OR REPLACE INTO adSettings (key, value) VALUES (?, ?)', ['headerAd', headerAd || '']);
    sqliteDb.run('INSERT OR REPLACE INTO adSettings (key, value) VALUES (?, ?)', ['inContentAd', inContentAd || '']);
    sqliteDb.run('INSERT OR REPLACE INTO adSettings (key, value) VALUES (?, ?)', ['footerAd', footerAd || '']);
    res.json({ success: true, message: 'Ad settings updated successfully' });
  });
});

// Admin API - Get ad settings (for admin panel)
app.post('/api/admin/ads-get', async (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  sqliteDb.all('SELECT key, value FROM adSettings', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch ad settings' });
    const adSettings = {};
    rows.forEach(a => adSettings[a.key] = a.value);
    res.json(adSettings);
  });
});

// Admin API - Get categories
app.post('/api/admin/categories', async (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  sqliteDb.all('SELECT name FROM categories', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch categories' });
    res.json({ categories: rows.map(r => r.name) });
  });
});

// Admin API - Add new category
app.post('/api/admin/category-add', async (req, res) => {
  const { password, name } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  sqliteDb.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to add category' });
    // Return updated categories
    sqliteDb.all('SELECT name FROM categories', [], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'Failed to fetch categories' });
      res.json({ success: true, categories: rows.map(r => r.name) });
    });
  });
});

// Admin API - Update (rename) category
app.post('/api/admin/category-update', async (req, res) => {
  const { password, oldName, newName } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'oldName and newName are required' });
  }
  // Check for duplicate
  sqliteDb.get('SELECT name FROM categories WHERE name = ?', [newName], (err, row) => {
    if (row && newName !== oldName) {
      return res.status(400).json({ error: 'Category with newName already exists' });
    }
    // Update category name
    sqliteDb.run('UPDATE categories SET name = ? WHERE name = ?', [newName, oldName], function (err2) {
      if (err2 || this.changes === 0) {
        return res.status(404).json({ error: 'Category not found or update failed' });
      }
      // Update images using this category
      sqliteDb.run('UPDATE images SET category = ? WHERE category = ?', [newName, oldName], function (err3) {
        if (err3) {
          return res.status(500).json({ error: 'Failed to update images with new category' });
        }
        // Return updated categories
        sqliteDb.all('SELECT name FROM categories', [], (err4, rows) => {
          if (err4) return res.status(500).json({ error: 'Failed to fetch categories' });
          res.json({ success: true, categories: rows.map(r => r.name) });
        });
      });
    });
  });
});

// Admin API - Delete category
app.post('/api/admin/category-delete', async (req, res) => {
  const { password, name, fallback } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!name) return res.status(400).json({ error: 'name is required' });
  const fallbackCategory = fallback || 'General';
  // Ensure fallback category exists
  sqliteDb.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [fallbackCategory], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to ensure fallback category' });
    // Update images with this category to fallback
    sqliteDb.run('UPDATE images SET category = ? WHERE category = ?', [fallbackCategory, name], function (err2) {
      if (err2) return res.status(500).json({ error: 'Failed to update images to fallback category' });
      // Remove category
      sqliteDb.run('DELETE FROM categories WHERE name = ?', [name], function (err3) {
        if (err3 || this.changes === 0) {
          return res.status(404).json({ error: 'Category not found or delete failed' });
        }
        // Return updated categories
        sqliteDb.all('SELECT name FROM categories', [], (err4, rows) => {
          if (err4) return res.status(500).json({ error: 'Failed to fetch categories' });
          res.json({ success: true, categories: rows.map(r => r.name) });
        });
      });
    });
  });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// Serve individual wallpaper page
app.get('/wallpaper/:id', (req, res) => {
  const { id } = req.params;
  // Check if ID looks like a wallpaper ID (hex string, 8+ chars)
  if (/^[a-f0-9]{8,}$/.test(id)) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎨 Anime Wallpapers server running at http://localhost:${PORT}`);
  console.log(`📱 Visit http://localhost:${PORT} for the gallery`);
  console.log(`⚙️  Visit http://localhost:${PORT}/admin for admin panel`);
  console.log(`🔑 Default admin password: ${ADMIN_PASSWORD}\n`);
});