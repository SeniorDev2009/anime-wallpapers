// ============================================
// ANIME WALLPAPERS - MAIN SCRIPT
// Infinite scroll, lazy loading, and gallery logic
// ============================================

const IMAGES_PER_PAGE = 12;
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentFilter = 'all';
let allImages = [];
let searchQuery = '';
let lastTotal = 0;

// DOM Elements
const gallery = document.getElementById('gallery');
const loadingIndicator = document.getElementById('loadingIndicator');
const endMessage = document.getElementById('endMessage');
const categoryList = document.getElementById('categoryList');
const resultsInfo = document.getElementById('resultsInfo');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if viewing individual wallpaper by ID
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'wallpaper' && pathParts[2]) {
    loadIndividualWallpaper(pathParts[2]);
    return;
  }

  // Inject ad settings
  injectAdSettings();

  loadCategories();
  createPreviewModal();
  loadWallpapers();
  setupInfiniteScroll();
  // Wire up search input after DOM ready
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const debounce = (fn, wait) => {
      let t = null;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };

    const onSearch = debounce((e) => {
      searchQuery = (e.target.value || '').trim();
      // Reset pagination and reload
      currentPage = 0;
      hasMore = true;
      lastTotal = 0;
      gallery.innerHTML = '';
      endMessage.style.display = 'none';
      updateResultsInfo();
      loadWallpapers();
    }, 300);

    searchInput.addEventListener('input', onSearch);
  }
});

// Inject ad settings from backend into ad containers
async function injectAdSettings() {
  try {
    const response = await fetch('/api/ads');
    const ads = await response.json();
    if (ads.headerAd) {
      const headerAd = document.querySelector('.ad-header');
      if (headerAd) headerAd.innerHTML = ads.headerAd;
    }
    if (ads.inContentAd) {
      const inlineAd = document.querySelector('.ad-inline');
      if (inlineAd) inlineAd.innerHTML = ads.inContentAd;
    }
    if (ads.footerAd) {
      const footerAd = document.querySelector('.ad-footer');
      if (footerAd) footerAd.innerHTML = ads.footerAd;
    }
  } catch (err) {
    // fail silently
  }
}

// ============================================
// LOAD CATEGORIES
// ============================================

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    
    categoryList.innerHTML = '';
      // Ensure the static "All" button (in index.html) is wired to the filter
      const allBtn = document.querySelector('.filter-btn[data-category="all"]');
      if (allBtn) {
        allBtn.addEventListener('click', () => filterByCategory('all'));
      }
    
    categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = category;
      btn.dataset.category = category.toLowerCase();
      btn.addEventListener('click', () => filterByCategory(category));
      categoryList.appendChild(btn);
    });
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// ============================================
// LOAD WALLPAPERS
// ============================================

async function loadWallpapers() {
  if (isLoading || !hasMore) return;
  
  isLoading = true;
  loadingIndicator.classList.remove('hidden');
  
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: IMAGES_PER_PAGE,
      category: currentFilter,
      q: searchQuery
    });
    const response = await fetch(`/api/wallpapers?${params.toString()}`);
    const data = await response.json();
    
    allImages = data.images;
    hasMore = data.hasMore;
    lastTotal = data.total || 0;
    
    renderGallery(data.images || []);
    updateResultsInfo();
    currentPage++;
    
    if (!hasMore) {
      loadingIndicator.classList.add('hidden');
      endMessage.style.display = 'block';
    }
  } catch (err) {
    console.error('Error loading wallpapers:', err);
  } finally {
    isLoading = false;
    loadingIndicator.classList.add('hidden');
  }
}

// ============================================
// RENDER GALLERY
// ============================================

function renderGallery(images) {
  images.forEach(image => {
    const card = createImageCard(image);
    gallery.appendChild(card);
  });
}

// ============================================
// CREATE IMAGE CARD
// ============================================

function createImageCard(imageData) {
  const card = document.createElement('div');
  card.className = 'image-card placeholder';
  
  const img = document.createElement('img');
  img.alt = imageData.title || 'Anime Wallpaper';
  img.loading = 'lazy';
  img.src = imageData.thumbnail || '/uploads/' + imageData.filename;
  
  img.addEventListener('load', () => {
    card.classList.remove('placeholder');
    img.classList.add('loaded');
  });
  
  img.addEventListener('error', () => {
    console.error('Failed to load image:', imageData.filename);
  });
  
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';
  
  const title = document.createElement('div');
  title.className = 'image-title';
  title.textContent = imageData.title;
  
  const category = document.createElement('div');
  category.className = 'image-category';
  category.textContent = imageData.category || 'General';
  
  const actions = document.createElement('div');
  actions.className = 'image-actions';
  actions.style.display = 'flex';
  actions.style.gap = '0.5rem';
  actions.style.marginTop = '0.5rem';

  // Like button
  const likeBtn = document.createElement('button');
  likeBtn.className = 'image-btn';
  likeBtn.textContent = '❤️ Like';
  likeBtn.style.flex = '1';
  likeBtn.style.padding = '0.4rem';
  likeBtn.style.fontSize = '0.75rem';
  likeBtn.style.background = 'rgba(255,255,255,0.2)';
  likeBtn.style.color = 'white';
  likeBtn.style.border = 'none';
  likeBtn.style.borderRadius = '4px';
  likeBtn.style.cursor = 'pointer';
  likeBtn.style.fontWeight = '500';

  // Show liked state from localStorage
  const likedWallpapers = JSON.parse(localStorage.getItem('likedWallpapers') || '[]');
  if (likedWallpapers.includes(imageData.id)) {
    likeBtn.style.background = '#e74c3c';
    likeBtn.textContent = '💖 Liked';
  }

  // Like count display
  const likeCount = document.createElement('span');
  likeCount.className = 'like-count';
  likeCount.textContent = ` ${imageData.likes || 0}`;
  likeCount.style.marginLeft = '0.3rem';
  likeBtn.appendChild(likeCount);

  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    let liked = JSON.parse(localStorage.getItem('likedWallpapers') || '[]');
    if (!liked.includes(imageData.id)) {
      liked.push(imageData.id);
      localStorage.setItem('likedWallpapers', JSON.stringify(liked));
      likeBtn.style.background = '#e74c3c';
      likeBtn.textContent = '💖 Liked';
      likeBtn.appendChild(likeCount);
      // Send like to server
      fetch('/api/wallpapers/like/' + imageData.id, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          likeCount.textContent = ` ${data.likes}`;
        });
    }
  });

  // Download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'image-btn';
  downloadBtn.textContent = '⬇️ Download';
  downloadBtn.style.flex = '1';
  downloadBtn.style.padding = '0.4rem';
  downloadBtn.style.fontSize = '0.75rem';
  downloadBtn.style.background = 'rgba(255,255,255,0.2)';
  downloadBtn.style.color = 'white';
  downloadBtn.style.border = 'none';
  downloadBtn.style.borderRadius = '4px';
  downloadBtn.style.cursor = 'pointer';
  downloadBtn.style.fontWeight = '500';
  // Download count display
  const downloadCount = document.createElement('span');
  downloadCount.className = 'download-count';
  downloadCount.textContent = ` ${imageData.downloads || 0}`;
  downloadCount.style.marginLeft = '0.3rem';
  downloadBtn.appendChild(downloadCount);

  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadImage(imageData.filename, imageData.title);
    // Send download event to server
    fetch('/api/wallpapers/download/' + imageData.id, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        downloadCount.textContent = ` ${data.downloads}`;
      });
  });

  actions.appendChild(likeBtn);
  actions.appendChild(downloadBtn);

  overlay.appendChild(title);
  overlay.appendChild(category);
  overlay.appendChild(actions);
  
  card.appendChild(img);
  card.appendChild(overlay);
  
  // Click to open (can be extended with modal or download)
  card.addEventListener('click', () => {
    openPreview(imageData);
  });
  
  return card;
}

// ============================================
// DOWNLOAD IMAGE
// ============================================

function downloadImage(filename, title) {
  const url = '/uploads/' + filename;
  const extension = filename.split('.').pop();
  const downloadName = (title || 'anime-wallpaper').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.' + extension;
  
  // Create anchor element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================
// OPEN IMAGE DETAIL
// ============================================

function openImageDetail(imageData) {
  // Backwards-compatible alias to the preview modal
  openPreview(imageData);
}

// ============================================
// PREVIEW MODAL
// ============================================

let previewModal = null;
let previewImageEl = null;
let previewTitleEl = null;
let previewCategoryEl = null;
let previewCurrentData = null;
let previewDescEl = null;
let previewViewsEl = null;
let previewUploadedEl = null;
let previewFilenameEl = null;
let previewTagsEl = null;
let similarListEl = null;
let previewDownloadBtn = null;
let previewOpenEl = null;
let previewSimilarPool = [];
let previewSimilarIndex = 0;
const SIMILAR_CHUNK_SIZE = 12;
let previewSimilarScrollHandler = null;
let previewSimilarId = null;
let previewSimilarPage = 0;
let previewSimilarHasMore = false;
let previewSimilarLoading = false;

function createPreviewModal() {
  if (previewModal) return;

  previewModal = document.createElement('div');
  previewModal.className = 'preview-modal';
  previewModal.innerHTML = `
    <div class="preview-backdrop" id="previewBackdrop"></div>
    <div class="preview-content" role="dialog" aria-modal="true">
      <button class="preview-close" id="previewClose">✕</button>
      <div class="preview-body">
        <div class="preview-image-wrap">
          <img class="preview-image" id="previewImage" src="" alt="Preview">
        </div>
        <div class="preview-meta">
          <h3 id="previewTitle"></h3>
          <div class="preview-category" id="previewCategory"></div>
          <p class="preview-desc" id="previewDescription"></p>
          <div class="preview-stats">
            <span id="previewViews" class="meta-item"></span>
            <span id="previewUploaded" class="meta-item"></span>
            <span id="previewFilename" class="meta-item"></span>
          </div>
          <div class="preview-tags" id="previewTags"></div>
          <div class="preview-actions">
            <button id="previewDownload" class="image-btn">⬇️ Download</button>
            <a id="previewOpen" class="image-btn" target="_blank" rel="noopener">Open</a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append a similar section to the modal (placed after the main content)
  const similarSection = document.createElement('div');
  similarSection.className = 'preview-similar-wrap';
  similarSection.innerHTML = `
    <div class="preview-similar" id="previewSimilar">
      <h4>Similar Wallpapers</h4>
      <div class="similar-list" id="similarList"></div>
    </div>
  `;
  previewModal.querySelector('.preview-content').appendChild(similarSection);

  document.body.appendChild(previewModal);

  previewImageEl = previewModal.querySelector('#previewImage');
  previewTitleEl = previewModal.querySelector('#previewTitle');
  previewCategoryEl = previewModal.querySelector('#previewCategory');
  previewDescEl = previewModal.querySelector('#previewDescription');
  previewViewsEl = previewModal.querySelector('#previewViews');
  previewUploadedEl = previewModal.querySelector('#previewUploaded');
  previewFilenameEl = previewModal.querySelector('#previewFilename');
  previewTagsEl = previewModal.querySelector('#previewTags');
  previewOpenEl = previewModal.querySelector('#previewOpen');
  previewDownloadBtn = previewModal.querySelector('#previewDownload');
  similarListEl = previewModal.querySelector('#similarList');

  // Close handlers
  previewModal.querySelector('#previewClose').addEventListener('click', closePreview);
  previewModal.querySelector('#previewBackdrop').addEventListener('click', closePreview);

  // Download handler
  previewDownloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const filename = previewImageEl.dataset.filename;
    const title = previewTitleEl.textContent;
    if (filename) downloadImage(filename, title);
  });

  // Open in new tab
  previewOpenEl.addEventListener('click', (e) => {
    e.stopPropagation();
    const filename = previewImageEl.dataset.filename;
    if (filename) previewOpenEl.href = '/uploads/' + filename;
  });

  // Similar list click handler will be attached when rendered

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePreview();
  });
}

function openPreview(imageData) {
  createPreviewModal();
  previewCurrentData = imageData;

  // Basic fields
  previewImageEl.src = '/uploads/' + imageData.filename;
  previewImageEl.alt = imageData.title || 'Preview';
  previewImageEl.dataset.filename = imageData.filename;
  previewTitleEl.textContent = imageData.title || '';
  previewCategoryEl.textContent = imageData.category || '';
  previewDescEl.textContent = imageData.description || '';
  previewViewsEl.textContent = `Views: ${imageData.views || 0}`;
  previewUploadedEl.textContent = imageData.uploadedAt ? `Uploaded: ${humanDate(imageData.uploadedAt)}` : '';
  previewFilenameEl.textContent = imageData.filename || '';

  // Tags
  previewTagsEl.innerHTML = '';
  if (imageData.tags && imageData.tags.length > 0) {
    imageData.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      previewTagsEl.appendChild(span);
    });
  }

  // Show modal
  previewModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Enrich with file info (resolution, size) asynchronously
  enrichPreviewWithFileInfo(imageData).catch(err => console.warn('File info error', err));

  // Initialize and load server-paged similar wallpapers
  initSimilarFor(imageData.id).catch(err => console.error('Similar init error', err));
}

function closePreview() {
  if (!previewModal) return;
  previewModal.classList.remove('open');
  document.body.style.overflow = '';
  previewCurrentData = null;
  // clear similar list
  if (similarListEl) similarListEl.innerHTML = '';
}

function toggleShareLink() {
  // Share functionality removed — no-op.
}

// (duplicate open/close removed)

// ============================================
// FILTER BY CATEGORY
// ============================================

// ============================================
// PREVIEW HELPERS: file info & similar
// ============================================

// ============================================
// STRING SIMILARITY HELPER
// ============================================

function stringSimilarity(str1, str2) {
  // Simple word-overlap similarity (0 to 1)
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Split into words and compute overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = Math.max(words1.size, words2.size);
  
  return union > 0 ? intersection / union : 0;
}

async function enrichPreviewWithFileInfo(imageData) {
  try {
    const url = '/uploads/' + imageData.filename;

    // Try HEAD to get size from Content-Length
    let sizeText = '';
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const len = head.headers.get('content-length');
      if (len) sizeText = formatBytes(parseInt(len, 10));
    } catch (e) {
      // ignore HEAD errors
    }

    // Load image to get resolution
    const img = new Image();
    img.src = url + '?_t=' + Date.now();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const resolution = (img.naturalWidth && img.naturalHeight) ? `${img.naturalWidth}×${img.naturalHeight}` : '';

    // Update stats area
    if (previewViewsEl) previewViewsEl.textContent = `Views: ${imageData.views || 0}` + (resolution ? ` • ${resolution}` : '');
    if (previewFilenameEl) previewFilenameEl.textContent = (imageData.filename || '') + (sizeText ? ` • ${sizeText}` : '');
  } catch (err) {
    console.warn('Error enriching preview', err);
  }
}

async function computeSimilar(imageData, maxResults = 8) {
  // Fetch multiple pages of images until we have a buffer or run out
  const collected = [];
  let page = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      const resp = await fetch(`/api/wallpapers?page=${page}`);
      if (!resp.ok) break;
      const data = await resp.json();
      if (Array.isArray(data.images)) {
        collected.push(...data.images);
      }
      hasMorePages = data.hasMore;
      page++;
    } catch (err) {
      console.warn('Error fetching for similarity', err);
      break;
    }
  }

  // Remove the current image and duplicates
  const pool = collected.filter(i => i && i.id !== imageData.id);
  console.log('Similar: pool size =', pool.length);

  // Score images: title similarity + tag overlap + category match
  const tagSet = new Set((imageData.tags || []).map(t => t.toLowerCase()));
  const currentTitle = imageData.title || '';
  console.log('Similar: current tags =', Array.from(tagSet), 'title =', currentTitle);

  const scored = pool.map(i => {
    const tags = (i.tags || []).map(t => t.toLowerCase());
    const tagMatches = tags.filter(t => tagSet.has(t)).length;
    const titleSim = stringSimilarity(currentTitle, i.title || '');
    const sameCategory = (i.category || '').toLowerCase() === (imageData.category || '').toLowerCase() ? 1 : 0;
    
    // Weighted scoring: title similarity (0-1 * 8), tag matches (0-max * 5), category (0-1 * 2)
    const score = (titleSim * 8) + (tagMatches * 5) + (sameCategory * 2);
    return { item: i, score, tagMatches, titleSim, sameCategory };
  }).sort((a,b) => b.score - a.score || (b.item.uploadedAt || '').localeCompare(a.item.uploadedAt || '')).map(s => s.item);

  console.log('Similar: scored count =', scored.length);
  // Return full scored list (rendering/pagination handled by UI)
  return scored;
}

// Initialize server-paged similar list for a wallpaper id
async function initSimilarFor(id) {
  if (!similarListEl) return;
  previewSimilarId = id;
  previewSimilarPage = 0;
  previewSimilarHasMore = true;
  previewSimilarLoading = false;
  similarListEl.innerHTML = '';

  // remove previous handler if any
  if (previewSimilarScrollHandler) {
    similarListEl.removeEventListener('scroll', previewSimilarScrollHandler);
    previewSimilarScrollHandler = null;
  }

  // load first page
  await loadSimilarPage(previewSimilarPage);

  // attach scroll handler to request more pages when near right edge
  previewSimilarScrollHandler = () => {
    const el = similarListEl;
    if (!el || previewSimilarLoading || !previewSimilarHasMore) return;
    const threshold = 200;
    if (el.scrollWidth - (el.scrollLeft + el.clientWidth) < threshold) {
      loadSimilarPage(previewSimilarPage).catch(err => console.error('loadSimilarPage error', err));
    }
  };
  similarListEl.addEventListener('scroll', previewSimilarScrollHandler);
}

async function loadSimilarPage(page) {
  if (!previewSimilarId) return;
  if (previewSimilarLoading) return;
  previewSimilarLoading = true;
  try {
    const resp = await fetch(`/api/wallpapers/similar/${previewSimilarId}?page=${page}&limit=${SIMILAR_CHUNK_SIZE}`);
    if (!resp.ok) {
      previewSimilarHasMore = false;
      return;
    }
    const data = await resp.json();
    const images = data.images || [];
    appendSimilarItems(images);
    previewSimilarHasMore = !!data.hasMore;
    previewSimilarPage = page + 1;
  } catch (err) {
    console.error('Error loading similar page', err);
    previewSimilarHasMore = false;
  } finally {
    previewSimilarLoading = false;
  }
}

function appendSimilarItems(items) {
  if (!similarListEl) return;
  if (!items || items.length === 0) {
    if (!similarListEl.firstChild) similarListEl.innerHTML = '<div class="no-similar">No similar wallpapers found</div>';
    return;
  }
  items.forEach(img => {
    const item = document.createElement('div');
    item.className = 'similar-item';
    item.innerHTML = `
      <img src="/uploads/${img.filename}" alt="${img.title || ''}" loading="lazy" />
      <div class="similar-title">${img.title || ''}</div>
    `;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openPreview(img);
    });
    similarListEl.appendChild(item);
  });
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

function humanDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

function filterByCategory(category) {
  currentFilter = category.toLowerCase();
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.category === currentFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Reload gallery with filter applied
  currentPage = 0;
  hasMore = true;
  lastTotal = 0;
  gallery.innerHTML = '';
  endMessage.style.display = 'none';
  updateResultsInfo();
  loadWallpapers();
}

function updateResultsInfo() {
  if (!resultsInfo) return;
  if (lastTotal === 0) {
    resultsInfo.textContent = searchQuery || (currentFilter && currentFilter !== 'all')
      ? 'No results found'
      : '';
    return;
  }
  const filters = [];
  if (currentFilter && currentFilter !== 'all') {
    filters.push(`Category: ${currentFilter}`);
  }
  if (searchQuery) {
    filters.push(`Search: "${searchQuery}"`);
  }
  const filterText = filters.length ? ` • ${filters.join(' • ')}` : '';
  resultsInfo.textContent = `Showing ${Math.min((currentPage + 1) * IMAGES_PER_PAGE, lastTotal)} of ${lastTotal}${filterText}`;
}

// ============================================
// INFINITE SCROLL
// ============================================

function setupInfiniteScroll() {
  const options = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoading && hasMore) {
        loadWallpapers();
      }
    });
  }, options);
  
  // Create a sentinel element
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  sentinel.style.height = '1px';
  
  gallery.parentNode.insertBefore(sentinel, gallery.nextSibling);
  observer.observe(sentinel);
}

// ============================================
// UTILITY - Scroll to top
// ============================================

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// ============================================
// INDIVIDUAL WALLPAPER VIEW
// ============================================

async function loadIndividualWallpaper(id) {
  try {
    const response = await fetch(`/api/wallpapers/${id}`);
    
    if (!response.ok) {
      document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-primary); text-align: center;"><div><h1>Wallpaper not found</h1><p><a href="/" style="color: var(--accent);">Back to gallery</a></p></div></div>';
      return;
    }
    
    const wallpaper = await response.json();
    
    // Replace the main container with individual wallpaper view
    const mainContainer = document.querySelector('main.container');
    if (!mainContainer) return;
    
    mainContainer.innerHTML = `
      <div class="individual-wallpaper">
        <a href="/" class="back-link" style="display: inline-block; margin-bottom: 1rem; color: var(--accent); text-decoration: none;">← Back to gallery</a>
        <div class="wallpaper-container">
          <img src="/uploads/${wallpaper.filename}" alt="${wallpaper.title}" class="wallpaper-image" />
          <div class="wallpaper-info">
            <h1>${wallpaper.title}</h1>
            <p class="wallpaper-description">${wallpaper.description || ''}</p>
            <div class="wallpaper-meta">
              <span class="meta-item"><strong>Category:</strong> ${wallpaper.category || 'General'}</span>
              <span class="meta-item"><strong>Views:</strong> ${wallpaper.views || 0}</span>
            </div>
            ${wallpaper.tags && wallpaper.tags.length > 0 ? `
              <div class="wallpaper-tags">
                <strong>Tags:</strong>
                <div class="tags-list">${wallpaper.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
              </div>
            ` : ''}
            <div class="wallpaper-actions">
              <button class="download-btn" onclick="downloadImage('${wallpaper.filename}', '${wallpaper.title}')">⬇️ Download Wallpaper</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add inline styles for individual wallpaper view
    addIndividualWallpaperStyles();
  } catch (err) {
    console.error('Error loading wallpaper:', err);
    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-primary); text-align: center;"><div><h1>Error loading wallpaper</h1><p><a href="/" style="color: var(--accent);">Back to gallery</a></p></div></div>';
  }
}

function addIndividualWallpaperStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .individual-wallpaper {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .wallpaper-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .wallpaper-image {
      width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .wallpaper-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .wallpaper-info h1 {
      font-size: 2rem;
      margin: 0;
    }
    .wallpaper-description {
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .wallpaper-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 6px;
    }
    .meta-item {
      font-size: 0.9rem;
    }
    .wallpaper-tags {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 6px;
    }
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .tag {
      background: var(--accent);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .wallpaper-actions {
      display: flex;
      gap: 0.5rem;
    }
    .download-btn, .copy-link-btn {
      flex: 1;
      padding: 0.75rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    .download-btn:hover, .copy-link-btn:hover {
      background: var(--accent-hover);
      transform: scale(1.05);
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: var(--accent);
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .back-link:hover {
      color: var(--accent-hover);
    }
    @media (max-width: 768px) {
      .wallpaper-container {
        grid-template-columns: 1fr;
      }
      .wallpaper-info h1 {
        font-size: 1.5rem;
      }
    }
  `;
  document.head.appendChild(style);
}

// copyShareLink removed (share-by-id disabled)

// ESC key to close modals (if implemented)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any open modals
  }
});
// ESC key to close modals (if implemented)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any open modals
  }
});