// State Management
let currentView = 'explore'; // 'explore' or 'liked'
let filteredWallpapers = [];
let renderedCount = 0;
const itemsPerLoad = 30;

let currentCategory = 'All';
let currentFormat = 'All';
let searchQuery = '';

// Load liked wallpapers from localStorage
let likedWallpapers = new Set(JSON.parse(localStorage.getItem('liked_wallpapers') || '[]'));

// DOM Elements
const grid = document.getElementById('masonry-grid');
const searchInput = document.getElementById('search-input');
const categoryPillsContainer = document.getElementById('category-pills');
const formatPillsContainer = document.getElementById('format-pills');
const themeToggleBtn = document.getElementById('theme-toggle');
const exploreTab = document.getElementById('explore-tab');
const likedTab = document.getElementById('liked-tab');
const lightbox = document.getElementById('lightbox');
const totalCountEl = document.getElementById('total-count');
const viewCountEl = document.getElementById('view-count');

// Create sentinel element for infinite scroll
const loaderContainer = document.createElement('div');
loaderContainer.className = 'loader-container';
loaderContainer.innerHTML = '<div class="spinner"></div>';
document.querySelector('main').appendChild(loaderContainer);

// Create toast container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

// Initialize App
function init() {
  setupTheme();
  setupFilters();
  setupEventListeners();
  filterAndRender(true);
  setupInfiniteScroll();
}

// Theme Setup (Default to Dark Mode)
function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.documentElement.classList.remove('light-mode');
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }
}

// Generate category and format pills from WALLPAPERS list
function setupFilters() {
  // Extract unique categories and formats
  const categories = ['All', ...new Set(WALLPAPERS.map(wp => wp.category))];
  const formats = ['All', ...new Set(WALLPAPERS.map(wp => wp.format))];

  // Render category pills
  categoryPillsContainer.innerHTML = categories.map(cat => 
    `<button class="pill ${cat === 'All' ? 'active' : ''}" data-value="${cat}">${cat}</button>`
  ).join('');

  // Render format pills
  formatPillsContainer.innerHTML = formats.map(fmt => 
    `<button class="pill ${fmt === 'All' ? 'active' : ''}" data-value="${fmt}">${fmt}</button>`
  ).join('');
}

// Event Listeners Setup
function setupEventListeners() {
  // Search Input (with input listener)
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterAndRender(true);
  });

  // Filter Pills Click
  categoryPillsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      categoryPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-value');
      filterAndRender(true);
    }
  });

  formatPillsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      formatPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentFormat = e.target.getAttribute('data-value');
      filterAndRender(true);
    }
  });

  // Theme Toggle Click
  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    showToast(`${isLight ? 'Light' : 'Dark'} mode enabled`, 'info');
  });

  // Tab Navigation Click
  exploreTab.addEventListener('click', () => {
    if (currentView !== 'explore') {
      currentView = 'explore';
      exploreTab.classList.add('active');
      likedTab.classList.remove('active');
      filterAndRender(true);
    }
  });

  likedTab.addEventListener('click', () => {
    if (currentView !== 'liked') {
      currentView = 'liked';
      likedTab.classList.add('active');
      exploreTab.classList.remove('active');
      filterAndRender(true);
    }
  });

  // Lightbox Close Events
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Key Down Events (Esc for lightbox)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

// Filter and render list
function filterAndRender(reset = true) {
  if (reset) {
    grid.innerHTML = '';
    renderedCount = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Filter logic
  filteredWallpapers = WALLPAPERS.filter(wp => {
    // 1. Search Query
    const matchesSearch = searchQuery === '' || 
      wp.name.toLowerCase().includes(searchQuery) ||
      wp.category.toLowerCase().includes(searchQuery) ||
      wp.format.toLowerCase().includes(searchQuery);

    // 2. Category Filter
    const matchesCategory = currentCategory === 'All' || wp.category === currentCategory;

    // 3. Format Filter
    const matchesFormat = currentFormat === 'All' || wp.format === currentFormat;

    // 4. View Mode (Liked)
    const matchesView = currentView === 'explore' || likedWallpapers.has(wp.id);

    return matchesSearch && matchesCategory && matchesFormat && matchesView;
  });

  // Update Stats
  totalCountEl.textContent = WALLPAPERS.length;
  viewCountEl.textContent = filteredWallpapers.length;

  if (filteredWallpapers.length === 0) {
    renderEmptyState();
    loaderContainer.style.display = 'none';
  } else {
    // Remove empty state if active
    const emptyState = grid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    loaderContainer.style.display = 'flex';
    renderNextBatch();
  }
}

// Render empty state template
function renderEmptyState() {
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-image-slash"></i></div>
      <div class="empty-title">No Wallpapers Found</div>
      <div class="empty-desc">${
        currentView === 'liked' 
          ? 'You haven\'t liked any wallpapers yet. Go back to Explore and click the heart icon on your favorites!' 
          : 'We couldn\'t find any matching wallpapers. Try adjusting your filters or search terms.'
      }</div>
    </div>
  `;
}

// Render next slice of wallpapers
function renderNextBatch() {
  const nextBatch = filteredWallpapers.slice(renderedCount, renderedCount + itemsPerLoad);
  
  if (nextBatch.length === 0) {
    loaderContainer.style.display = 'none';
    return;
  }

  const fragment = document.createDocumentFragment();

  nextBatch.forEach(wp => {
    const isLiked = likedWallpapers.has(wp.id);
    const item = document.createElement('div');
    item.className = 'masonry-item';
    item.setAttribute('data-id', wp.id);
    
    // Construct Pinterest styled card markup
    item.innerHTML = `
      <div class="masonry-img-wrapper">
        <img class="masonry-img" src="${wp.url}" alt="${wp.name}" loading="lazy" />
      </div>
      <div class="card-overlay">
        <div class="overlay-top">
          <button class="overlay-btn like-btn ${isLiked ? 'liked' : ''}" title="${isLiked ? 'Unlike' : 'Like'}">
            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="overlay-btn download-btn" title="Download">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
        <div class="overlay-bottom">
          <h3 class="overlay-title">${wp.name}</h3>
          <div class="overlay-meta">
            <span class="overlay-category">${wp.category}</span>
            <span class="overlay-size">${wp.format} • ${wp.size}</span>
          </div>
        </div>
      </div>
    `;

    // Click card opens Lightbox
    item.addEventListener('click', (e) => {
      // Don't open if clicking like or download action buttons
      if (e.target.closest('.overlay-btn')) return;
      openLightbox(wp);
    });

    // Event delegation helper for actions
    const likeBtn = item.querySelector('.like-btn');
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLike(wp.id, likeBtn);
    });

    const downloadBtn = item.querySelector('.download-btn');
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadWallpaper(wp.url, `${wp.name}.${wp.format.toLowerCase()}`);
    });

    fragment.appendChild(item);
  });

  grid.appendChild(fragment);
  renderedCount += nextBatch.length;

  // Check if we reached the end
  if (renderedCount >= filteredWallpapers.length) {
    loaderContainer.style.display = 'none';
  } else {
    loaderContainer.style.display = 'flex';
  }
}

// Infinite scroll implementation using IntersectionObserver
function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderedCount < filteredWallpapers.length) {
      renderNextBatch();
    }
  }, {
    rootMargin: '100px 0px 300px 0px' // Fetch before hitting the very bottom
  });

  observer.observe(loaderContainer);
}

// Toggle Wallpaper Liking
function toggleLike(id, btnElement) {
  const isLiked = likedWallpapers.has(id);
  const wp = WALLPAPERS.find(w => w.id === id);

  if (isLiked) {
    likedWallpapers.delete(id);
    if (btnElement) {
      btnElement.classList.remove('liked');
      btnElement.querySelector('i').className = 'far fa-heart';
      btnElement.setAttribute('title', 'Like');
    }
    showToast(`Removed "${wp.name}" from favorites`, 'info');
  } else {
    likedWallpapers.add(id);
    if (btnElement) {
      btnElement.classList.add('liked');
      btnElement.querySelector('i').className = 'fas fa-heart';
      btnElement.setAttribute('title', 'Unlike');
    }
    showToast(`Added "${wp.name}" to favorites`, 'success');
  }

  // Save to LocalStorage
  localStorage.setItem('liked_wallpapers', JSON.stringify(Array.from(likedWallpapers)));

  // If in Liked tab, re-render to remove unliked card
  if (currentView === 'liked') {
    // Wait a brief moment to let user see animation before card vanishes
    setTimeout(() => {
      filterAndRender(false); // preserve scroll if possible or do smooth update
    }, 400);
  }
}

// Download Wallpaper Helper (bypasses browser raw link display)
async function downloadWallpaper(url, filename) {
  showToast('Initializing download...', 'info');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    showToast('Download started successfully!', 'success');
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
    showToast('Download started in a new tab', 'info');
  }
}

// Lightbox Logic
function openLightbox(wp) {
  const isLiked = likedWallpapers.has(wp.id);
  
  lightbox.querySelector('.detail-category').textContent = wp.category;
  lightbox.querySelector('.detail-title').textContent = wp.name;
  
  // Set attributes info
  document.getElementById('info-format').textContent = wp.format;
  document.getElementById('info-size').textContent = wp.size;
  document.getElementById('info-path').textContent = wp.path;
  
  // Set main preview image
  const imgElement = lightbox.querySelector('.lightbox-img');
  imgElement.src = wp.url;
  imgElement.alt = wp.name;

  // Setup Lightbox Actions
  const lightboxDownloadBtn = document.getElementById('lightbox-download');
  const lightboxLikeBtn = document.getElementById('lightbox-like');

  // Clear previous listeners (by replacing element or removing)
  const newDownloadBtn = lightboxDownloadBtn.cloneNode(true);
  const newLikeBtn = lightboxLikeBtn.cloneNode(true);
  
  lightboxDownloadBtn.parentNode.replaceChild(newDownloadBtn, lightboxDownloadBtn);
  lightboxLikeBtn.parentNode.replaceChild(newLikeBtn, lightboxLikeBtn);

  // Setup new button statuses and click triggers
  if (isLiked) {
    newLikeBtn.classList.add('liked');
    newLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
  } else {
    newLikeBtn.classList.remove('liked');
    newLikeBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
  }

  newDownloadBtn.addEventListener('click', () => {
    downloadWallpaper(wp.url, `${wp.name}.${wp.format.toLowerCase()}`);
  });

  newLikeBtn.addEventListener('click', () => {
    toggleLike(wp.id);
    const updatedLiked = likedWallpapers.has(wp.id);
    
    // Update lightbox button visual state
    if (updatedLiked) {
      newLikeBtn.classList.add('liked');
      newLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
    } else {
      newLikeBtn.classList.remove('liked');
      newLikeBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
    }

    // Synchronize card button state back in the grid
    const cardEl = document.querySelector(`.masonry-item[data-id="${wp.id}"]`);
    if (cardEl) {
      const cardLikeBtn = cardEl.querySelector('.like-btn');
      if (updatedLiked) {
        cardLikeBtn.classList.add('liked');
        cardLikeBtn.querySelector('i').className = 'fas fa-heart';
      } else {
        cardLikeBtn.classList.remove('liked');
        cardLikeBtn.querySelector('i').className = 'far fa-heart';
      }
    }
  });

  // Show Modal
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// Toast Alert Messages
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);
  
  // Trigger animation next tick
  setTimeout(() => toast.classList.add('show'), 50);

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Run on window load
window.addEventListener('DOMContentLoaded', init);
