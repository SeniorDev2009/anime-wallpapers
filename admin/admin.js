// ============================================
// ADMIN PANEL - MAIN SCRIPT
// ============================================

let adminPassword = null;
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const adminPassword_input = document.getElementById('adminPassword');
const loginStatus = document.getElementById('loginStatus');

// ============================================
// AUTHENTICATION
// ============================================

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  adminPassword = adminPassword_input.value;
  
  // Verify password by trying to load admin data
  verifyAdminAccess();
});

async function verifyAdminAccess() {
  try {
    const response = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });

    if (!response.ok) {
      throw new Error('Invalid password');
    }

    // Password is valid
    loginModal.classList.remove('active');
    initializeAdmin();
    showStatus(loginStatus, 'Login successful', 'success');
  } catch (err) {
    showStatus(loginStatus, 'Invalid password', 'error');
  }
}

// ============================================
// INITIALIZE ADMIN
// ============================================

function initializeAdmin() {
  setupTabs();
  setupUploadForm();
  setupAdsForm();
  loadGallery();
  setupCategoriesForm();
  loadCategories();
  setupLogout();
}

// ============================================
// LOGOUT
// ============================================

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    adminPassword = null;
    loginModal.classList.add('active');
    adminPassword_input.value = '';
    loginStatus.style.display = 'none';
  });
}

// ============================================
// TAB NAVIGATION
// ============================================

function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active from all
      navItems.forEach(i => i.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      // Add active to clicked
      item.classList.add('active');
      const tabId = item.dataset.tab + 'Tab';
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// ============================================
// UPLOAD FORM
// ============================================

function setupUploadForm() {
  const uploadForm = document.getElementById('uploadForm');
  const fileUploadZone = document.getElementById('fileUploadZone');
  const imageFile = document.getElementById('imageFile');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const uploadStatus = document.getElementById('uploadStatus');
  const imageCategory = document.getElementById('imageCategory');

  // Dynamically load categories into dropdown
  async function populateCategoryDropdown() {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await response.json();
      if (data.categories && Array.isArray(data.categories)) {
        imageCategory.innerHTML = '<option value="">Select a category</option>';
        data.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          imageCategory.appendChild(opt);
        });
      }
    } catch (err) {
      // fallback: do nothing
    }
  }
  // Populate on admin init and after adding category
  populateCategoryDropdown();
  window.populateCategoryDropdown = populateCategoryDropdown;

  // Click to upload
  fileUploadZone.addEventListener('click', () => imageFile.click());

  // Drag and drop
  fileUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadZone.classList.add('dragover');
  });

  fileUploadZone.addEventListener('dragleave', () => {
    fileUploadZone.classList.remove('dragover');
  });

  fileUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imageFile.files = files;
      handleImageSelect();
    }
  });

  // File input change
  imageFile.addEventListener('change', handleImageSelect);

  function handleImageSelect() {
    const file = imageFile.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  }

  // Form submit
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('image', imageFile.files[0]);
    formData.append('title', document.getElementById('imageTitle').value);
    formData.append('description', document.getElementById('imageDescription').value);
    formData.append('category', imageCategory.value);
    formData.append('tags', document.getElementById('imageTags').value);
    formData.append('password', adminPassword);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        showStatus(uploadStatus, '✓ Image uploaded successfully!', 'success');
        uploadForm.reset();
        imagePreview.style.display = 'none';
        setTimeout(() => {
          loadGallery();
        }, 1000);
        // Refresh category dropdown in case a new category was added
        populateCategoryDropdown();
      } else {
        showStatus(uploadStatus, '✗ ' + (data.error || 'Upload failed'), 'error');
      }
    } catch (err) {
      showStatus(uploadStatus, '✗ Upload error: ' + err.message, 'error');
    }
  });
}

// ============================================
// LOAD GALLERY
// ============================================

async function loadGallery() {
  try {
    const response = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });

    const data = await response.json();
    const galleryList = document.getElementById('galleryList');
    galleryList.innerHTML = '';

    if (data.images && data.images.length > 0) {
      data.images.forEach(image => {
        const item = createGalleryItem(image);
        galleryList.appendChild(item);
      });
    } else {
      galleryList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1; padding: 2rem;">No images uploaded yet</p>';
    }
  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}

function createGalleryItem(image) {
  const div = document.createElement('div');
  div.className = 'gallery-item';
  div.innerHTML = `
    <img src="/uploads/${image.filename}" alt="${image.title}" class="gallery-item-image">
    <div class="gallery-item-info">
      <div class="gallery-item-title">${image.title}</div>
      <div class="gallery-item-meta">
        <strong>Category:</strong> ${image.category}<br>
        <strong>Tags:</strong> ${image.tags.join(', ') || 'None'}
      </div>
      <div class="gallery-item-actions">
        <button class="btn btn-secondary btn-small edit-btn">Edit</button>
        <button class="btn btn-danger btn-small delete-btn">Delete</button>
      </div>
    </div>
  `;

  const editBtn = div.querySelector('.edit-btn');
  const deleteBtn = div.querySelector('.delete-btn');

  editBtn.addEventListener('click', () => editImage(image));
  deleteBtn.addEventListener('click', () => deleteImage(image.id, div));

  return div;
}

// ============================================
// EDIT IMAGE
// ============================================

function editImage(image) {
  const newTitle = prompt('Enter new title:', image.title);
  if (!newTitle) return;

  const newDescription = prompt('Enter new description:', image.description || '');
  const newCategory = prompt('Enter new category:', image.category);

  updateImage(image.id, newTitle, newDescription, newCategory, image.tags.join(', '));
}

async function updateImage(imageId, title, description, category, tags) {
  try {
    const response = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: adminPassword,
        imageId: imageId,
        title: title,
        description: description,
        category: category,
        tags: tags
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert('Image updated successfully!');
      loadGallery();
    } else {
      alert('Error: ' + (data.error || 'Failed to update'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ============================================
// DELETE IMAGE
// ============================================

async function deleteImage(imageId, element) {
  if (!confirm('Are you sure you want to delete this image?')) return;

  try {
    const response = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: adminPassword,
        imageId: imageId
      })
    });

    const data = await response.json();
    if (response.ok) {
      element.remove();
      alert('Image deleted successfully!');
    } else {
      alert('Error: ' + (data.error || 'Failed to delete'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ============================================
// AD SETTINGS FORM
// ============================================

function setupAdsForm() {
  const adsForm = document.getElementById('adsForm');
  const adsStatus = document.getElementById('adsStatus');

  loadAdSettings();

  adsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const headerAd = document.getElementById('headerAd').value;
    const inContentAd = document.getElementById('inContentAd').value;
    const footerAd = document.getElementById('footerAd').value;

    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword,
          headerAd: headerAd,
          inContentAd: inContentAd,
          footerAd: footerAd
        })
      });

      const data = await response.json();
      if (response.ok) {
        showStatus(adsStatus, '✓ Ad settings saved successfully!', 'success');
      } else {
        showStatus(adsStatus, '✗ ' + (data.error || 'Failed to save'), 'error');
      }
    } catch (err) {
      showStatus(adsStatus, '✗ Error: ' + err.message, 'error');
    }
  });
}

async function loadAdSettings() {
  try {
    const response = await fetch('/api/admin/ads-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });

    const ads = await response.json();
    document.getElementById('headerAd').value = ads.headerAd || '';
    document.getElementById('inContentAd').value = ads.inContentAd || '';
    document.getElementById('footerAd').value = ads.footerAd || '';
  } catch (err) {
    console.error('Error loading ad settings:', err);
  }
}

// ============================================
// LOAD CATEGORIES
// ============================================

async function loadCategories() {
  try {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });

    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      categoriesList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">${data.error || 'Failed to load categories'}</p>`;
      return;
    }

    const data = await response.json();

    if (data.categories && data.categories.length > 0) {
      data.categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-badge';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '0.5rem';

        const name = document.createElement('div');
        name.textContent = category;
        name.style.fontWeight = '600';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-small';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          const newName = prompt('Rename category', category);
          if (newName && newName.trim() && newName.trim() !== category) {
            updateCategory(category, newName.trim());
          }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          if (!confirm(`Delete category "${category}"? This will move images to a fallback category.`)) return;
          let fallback = prompt('Fallback category name (leave blank for General):', 'General');
          if (!fallback || !fallback.trim()) fallback = 'General';
          deleteCategory(category, fallback.trim());
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(name);
        item.appendChild(actions);
        categoriesList.appendChild(item);
      });
    } else {
      categoriesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No categories yet</p>';
    }
  } catch (err) {
    console.error('Error loading categories:', err);
    const categoriesList = document.getElementById('categoriesList');
    if (categoriesList) {
      categoriesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">Failed to load categories</p>';
    }
  }
}

// Setup add-category form handler
function setupCategoriesForm() {
  const addBtn = document.getElementById('addCategoryBtn');
  const input = document.getElementById('newCategoryName');
  const status = document.createElement('div');
  status.className = 'status-message';
  status.style.display = 'none';
  input.parentNode.parentNode.appendChild(status);

  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = input.value && input.value.trim();
    if (!name) return showStatus(status, 'Enter a category name', 'error');

    try {
      const response = await fetch('/api/admin/category-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, name: name })
      });
      const data = await response.json();
      if (response.ok) {
        showStatus(status, 'Category added', 'success');
        input.value = '';
        loadCategories();
        if (window.populateCategoryDropdown) window.populateCategoryDropdown();
      } else {
        showStatus(status, data.error || 'Failed to add category', 'error');
      }
    } catch (err) {
      showStatus(status, 'Error: ' + err.message, 'error');
    }
  });
}

async function updateCategory(oldName, newName) {
  try {
    const response = await fetch('/api/admin/category-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, oldName: oldName, newName: newName })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Category renamed');
      loadCategories();
      loadGallery();
    } else {
      alert('Error: ' + (data.error || 'Failed to rename'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function deleteCategory(name, fallback) {
  try {
    const response = await fetch('/api/admin/category-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, name: name, fallback: fallback })
    });
    const data = await response.json();
    if (response.ok) {
      alert('Category deleted');
      loadCategories();
      loadGallery();
    } else {
      alert('Error: ' + (data.error || 'Failed to delete'));
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showStatus(element, message, type) {
  element.textContent = message;
  element.className = 'status-message ' + type;
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 4000);
}
