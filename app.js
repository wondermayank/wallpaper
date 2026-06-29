// State Management
let currentView = 'explore'; // 'explore', 'liked', or 'board'
let currentBoardName = '';
let filteredWallpapers = [];
let renderedCount = 0;
const itemsPerLoad = 30;

let currentCategory = 'All';
let currentFormat = 'All';
let searchQuery = '';

// Load liked wallpapers from localStorage
let likedWallpapers = new Set(JSON.parse(localStorage.getItem('liked_wallpapers') || '[]'));

// Load custom boards from localStorage
// Structure: { boardName: [wpId1, wpId2, ...] }
let customBoards = JSON.parse(localStorage.getItem('custom_boards') || '{}');

// Canvas Editor State
let editModeActive = false;
let currentBlur = 0;
let currentCropRatio = 'free';
let originalImage = null; // Image object loaded dynamically

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

// Upgrade DOM Elements
const surpriseBtn = document.getElementById('surprise-btn');
const boardsFilterRow = document.getElementById('boards-filter-row');
const boardPillsContainer = document.getElementById('board-pills');
const boardSelect = document.getElementById('board-select');
const boardCreateBtn = document.getElementById('board-create-btn');

const editorToggleBtn = document.getElementById('editor-toggle-btn');
const editorPanel = document.getElementById('editor-panel');
const blurSlider = document.getElementById('blur-slider');
const blurVal = document.getElementById('blur-val');
const ratioBtns = document.querySelectorAll('.ratio-btn');
const lightboxMedia = document.getElementById('lightbox-media');
const editorCanvas = document.getElementById('editor-canvas');

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
  handleSplashScreen();
  setupTheme();
  setupFilters();
  renderBoardPills();
  populateBoardSelect();
  setupEventListeners();
  filterAndRender(true);
  setupInfiniteScroll();
  handleDeepLinking();
}

// Splash Loading Screen Handler
function handleSplashScreen() {
  const splash = document.getElementById('splash-screen');
  const progress = document.getElementById('splash-progress');
  if (!splash) return;

  progress.style.width = '30%';
  setTimeout(() => {
    progress.style.width = '75%';
    setTimeout(() => {
      progress.style.width = '100%';
      setTimeout(() => {
        splash.classList.add('fade-out');
      }, 200);
    }, 250);
  }, 150);
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
  const categories = ['All', ...new Set(WALLPAPERS.map(wp => wp.category))];
  const formats = ['All', ...new Set(WALLPAPERS.map(wp => wp.format))];

  categoryPillsContainer.innerHTML = categories.map(cat => 
    `<button class="pill ${cat === 'All' ? 'active' : ''}" data-value="${cat}">${cat}</button>`
  ).join('');

  formatPillsContainer.innerHTML = formats.map(fmt => 
    `<button class="pill ${fmt === 'All' ? 'active' : ''}" data-value="${fmt}">${fmt}</button>`
  ).join('');
}

// Event Listeners Setup
function setupEventListeners() {
  // Search Input
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
      deactivateBoardPills();
      filterAndRender(true);
    }
  });

  likedTab.addEventListener('click', () => {
    if (currentView !== 'liked') {
      currentView = 'liked';
      likedTab.classList.add('active');
      exploreTab.classList.remove('active');
      deactivateBoardPills();
      filterAndRender(true);
    }
  });

  // Surprise Me Button Click (Random Wallpaper)
  surpriseBtn.addEventListener('click', () => {
    if (WALLPAPERS.length === 0) return;
    const randomIndex = Math.floor(Math.random() * WALLPAPERS.length);
    const randomWp = WALLPAPERS[randomIndex];
    openLightbox(randomWp);
    showToast(`Surprise! Displaying "${randomWp.name}"`, 'success');
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

  // Board Creation Listener
  boardCreateBtn.addEventListener('click', createNewBoard);

  // Board Filter Pill Event delegation
  boardPillsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      boardPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      exploreTab.classList.remove('active');
      likedTab.classList.remove('active');
      
      currentView = 'board';
      currentBoardName = e.target.getAttribute('data-value');
      filterAndRender(true);
    }
  });

  // Editor Panel Listeners
  editorToggleBtn.addEventListener('click', toggleEditorPanel);
  blurSlider.addEventListener('input', handleBlurChange);
  ratioBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      ratioBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCropRatio = e.target.getAttribute('data-ratio');
      updateCanvas();
    });
  });
}

// Deep Linking Handler
function handleDeepLinking() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#wp_')) {
    const wpId = hash.substring(1);
    const targetWp = WALLPAPERS.find(w => w.id === wpId);
    if (targetWp) {
      setTimeout(() => openLightbox(targetWp), 600);
    }
  }
}

// Render Custom Board Pills
function renderBoardPills() {
  const boardNames = Object.keys(customBoards);
  if (boardNames.length === 0) {
    boardsFilterRow.style.display = 'none';
    return;
  }

  boardsFilterRow.style.display = 'flex';
  boardPillsContainer.innerHTML = boardNames.map(name => 
    `<button class="pill" data-value="${name}">${name} (${customBoards[name].length})</button>`
  ).join('');
}

// Helper to reset active board filters
function deactivateBoardPills() {
  boardPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
}

// Populate Dropdown selector inside the Lightbox
function populateBoardSelect() {
  // Clear options keeping original two options
  boardSelect.innerHTML = `
    <option value="">-- Add to Board --</option>
    <option value="Favorites">Liked Wallpapers</option>
  `;
  
  Object.keys(customBoards).forEach(boardName => {
    const option = document.createElement('option');
    option.value = boardName;
    option.textContent = boardName;
    boardSelect.appendChild(option);
  });
}

// Board Creation Prompt Logic
function createNewBoard() {
  const boardName = prompt('Enter a name for your new Board/Collection:');
  if (!boardName) return;
  
  const trimmed = boardName.trim();
  if (trimmed === '') return;

  if (trimmed.toLowerCase() === 'favorites') {
    showToast('Use the "Liked Wallpapers" options instead', 'info');
    return;
  }

  if (customBoards[trimmed]) {
    showToast('A board with this name already exists', 'info');
    return;
  }

  // Initialize empty board
  customBoards[trimmed] = [];
  localStorage.setItem('custom_boards', JSON.stringify(customBoards));
  
  populateBoardSelect();
  renderBoardPills();
  showToast(`Board "${trimmed}" created successfully!`, 'success');
}

// Filter and render list
function filterAndRender(reset = true) {
  if (reset) {
    grid.innerHTML = '';
    renderedCount = 0;
    // Don't scroll to top on simple liking, only on category/tab reset
    if (reset && searchQuery === '' && currentCategory === 'All' && currentFormat === 'All' && currentView === 'explore') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

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

    // 4. View Mode (Explore vs Liked vs Board)
    let matchesView = true;
    if (currentView === 'liked') {
      matchesView = likedWallpapers.has(wp.id);
    } else if (currentView === 'board') {
      const boardWps = customBoards[currentBoardName] || [];
      matchesView = boardWps.includes(wp.id);
    }

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
  let emptyDesc = 'We couldn\'t find any matching wallpapers. Try adjusting your filters or search terms.';
  if (currentView === 'liked') {
    emptyDesc = 'You haven\'t liked any wallpapers yet. Go back to Explore and click the heart icon on your favorites!';
  } else if (currentView === 'board') {
    emptyDesc = `This board is empty. Open any wallpaper and add it to "${currentBoardName}"!`;
  }

  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-image-slash"></i></div>
      <div class="empty-title">No Wallpapers Found</div>
      <div class="empty-desc">${emptyDesc}</div>
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
    
    const isGif = wp.format === 'GIF';
    
    item.innerHTML = `
      <div class="masonry-img-wrapper">
        ${isGif ? '<div class="gif-badge">GIF</div>' : ''}
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
      if (e.target.closest('.overlay-btn')) return;
      openLightbox(wp);
    });

    // Action button listeners
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

  if (renderedCount >= filteredWallpapers.length) {
    loaderContainer.style.display = 'none';
  } else {
    loaderContainer.style.display = 'flex';
  }
}

// Infinite scroll implementation
function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderedCount < filteredWallpapers.length) {
      renderNextBatch();
    }
  }, {
    rootMargin: '100px 0px 400px 0px'
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
    setTimeout(() => filterAndRender(false), 400);
  }
}

// Custom Boards: Add Wallpaper to Specific Board
function addWallpaperToBoard(wpId, boardName) {
  if (boardName === 'Favorites') {
    toggleLike(wpId);
    return;
  }

  const boardWps = customBoards[boardName];
  if (boardWps.includes(wpId)) {
    // Remove if already exists (toggle behavior)
    customBoards[boardName] = boardWps.filter(id => id !== wpId);
    showToast(`Removed from "${boardName}"`, 'info');
  } else {
    boardWps.push(wpId);
    showToast(`Added to "${boardName}"`, 'success');
  }

  localStorage.setItem('custom_boards', JSON.stringify(customBoards));
  renderBoardPills();
  
  // If viewing this board, update UI
  if (currentView === 'board' && currentBoardName === boardName) {
    setTimeout(() => filterAndRender(false), 400);
  }
}

// Download Wallpaper Helper
async function downloadWallpaper(url, filename, canvasElement = null) {
  showToast('Initializing download...', 'info');
  try {
    let downloadUrl = url;

    // If canvas element is provided (edited mode active), export dataURL
    if (canvasElement) {
      downloadUrl = canvasElement.toDataURL('image/jpeg', 0.95);
    }

    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Network response not ok');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    showToast('Download completed!', 'success');
  } catch (error) {
    console.error('Download error:', error);
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
  
  // Deep linking hash trigger
  window.location.hash = wp.id;

  // Set main preview image
  const imgElement = lightbox.querySelector('.lightbox-img');
  imgElement.src = wp.url;
  imgElement.alt = wp.name;

  // Set Board Select dropdown values
  setupBoardSelectorForWallpaper(wp.id);

  // Setup Lightbox Action listeners
  const lightboxDownloadBtn = document.getElementById('lightbox-download');
  const lightboxLikeBtn = document.getElementById('lightbox-like');

  const newDownloadBtn = lightboxDownloadBtn.cloneNode(true);
  const newLikeBtn = lightboxLikeBtn.cloneNode(true);
  
  lightboxDownloadBtn.parentNode.replaceChild(newDownloadBtn, lightboxDownloadBtn);
  lightboxLikeBtn.parentNode.replaceChild(newLikeBtn, lightboxLikeBtn);

  if (isLiked) {
    newLikeBtn.classList.add('liked');
    newLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
  } else {
    newLikeBtn.classList.remove('liked');
    newLikeBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
  }

  newDownloadBtn.addEventListener('click', () => {
    if (editModeActive) {
      downloadWallpaper(wp.url, `Edited_${wp.name}.jpg`, editorCanvas);
    } else {
      downloadWallpaper(wp.url, `${wp.name}.${wp.format.toLowerCase()}`);
    }
  });

  newLikeBtn.addEventListener('click', () => {
    toggleLike(wp.id);
    const updatedLiked = likedWallpapers.has(wp.id);
    
    if (updatedLiked) {
      newLikeBtn.classList.add('liked');
      newLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
      boardSelect.value = 'Favorites';
    } else {
      newLikeBtn.classList.remove('liked');
      newLikeBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
      boardSelect.value = '';
    }

    // Update card button state in grid
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

  // Setup Board dropdown change listener
  boardSelect.onchange = (e) => {
    const selectedBoard = e.target.value;
    if (selectedBoard) {
      addWallpaperToBoard(wp.id, selectedBoard);
    }
  };

  // Editor controls: Reset editor state and hide panels
  resetEditorState();

  // If the format is a GIF, disable editor controls
  if (wp.format === 'GIF') {
    editorToggleBtn.style.display = 'none';
  } else {
    editorToggleBtn.style.display = 'block';
    // Pre-load image object in background for canvas editor operations
    originalImage = new Image();
    originalImage.crossOrigin = 'anonymous';
    originalImage.src = wp.url;
  }

  // Show Modal
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  // Clean up URL deep link hash
  history.replaceState(null, null, ' ');
  resetEditorState();
}

// Setup board select visual indicators
function setupBoardSelectorForWallpaper(wpId) {
  // Check which board contains this wallpaper
  let matchedBoard = '';
  if (likedWallpapers.has(wpId)) {
    matchedBoard = 'Favorites';
  } else {
    for (const name of Object.keys(customBoards)) {
      if (customBoards[name].includes(wpId)) {
        matchedBoard = name;
        break;
      }
    }
  }
  boardSelect.value = matchedBoard;
}

// Canvas Editor Panel Actions
function toggleEditorPanel() {
  editModeActive = !editModeActive;
  
  if (editModeActive) {
    editorToggleBtn.classList.add('active');
    editorToggleBtn.innerHTML = '<i class="fas fa-check"></i> Close Editor';
    editorPanel.classList.add('active');
    lightboxMedia.classList.add('canvas-preview-active');
    updateCanvas();
  } else {
    resetEditorState();
  }
}

// Reset Editor State
function resetEditorState() {
  editModeActive = false;
  currentBlur = 0;
  currentCropRatio = 'free';
  originalImage = null;
  
  editorToggleBtn.classList.remove('active');
  editorToggleBtn.innerHTML = '<i class="fas fa-magic"></i> Edit Wallpaper (Crop & Blur)';
  editorPanel.classList.remove('active');
  lightboxMedia.classList.remove('canvas-preview-active');
  
  blurSlider.value = 0;
  blurVal.textContent = '0px';
  ratioBtns.forEach(btn => {
    if (btn.getAttribute('data-ratio') === 'free') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function handleBlurChange(e) {
  currentBlur = parseInt(e.target.value, 10);
  blurVal.textContent = `${currentBlur}px`;
  updateCanvas();
}

// Render dynamic center-crop and Gaussian blur onto canvas
function updateCanvas() {
  if (!originalImage || !originalImage.complete) {
    // Retrying loading if not complete
    setTimeout(updateCanvas, 50);
    return;
  }

  const imgW = originalImage.naturalWidth;
  const imgH = originalImage.naturalHeight;

  // Calculate cropping bounds based on ratio selector
  const crop = getCropBounds(imgW, imgH, currentCropRatio);

  // Resize canvas to cropped dimension
  editorCanvas.width = crop.w;
  editorCanvas.height = crop.h;

  const ctx = editorCanvas.getContext('2d');
  ctx.clearRect(0, 0, crop.w, crop.h);

  // Apply Gaussian blur filter on canvas drawing context
  if (currentBlur > 0) {
    ctx.filter = `blur(${currentBlur}px)`;
  } else {
    ctx.filter = 'none';
  }

  // Draw center cropped image onto full canvas size
  // drawImage syntax: ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  // Padding drawing by blur radius to prevent transparent border leakages
  const pad = currentBlur * 2;
  ctx.drawImage(
    originalImage, 
    crop.x - pad, 
    crop.y - pad, 
    crop.w + pad * 2, 
    crop.h + pad * 2, 
    -pad, 
    -pad, 
    crop.w + pad * 2, 
    crop.h + pad * 2
  );
}

// Center crop calculation helper
function getCropBounds(w, h, ratioStr) {
  if (ratioStr === 'free') {
    return { x: 0, y: 0, w: w, h: h };
  }

  let targetRatio = 1;
  if (ratioStr === '16:9') targetRatio = 16 / 9;
  else if (ratioStr === '9:16') targetRatio = 9 / 16;
  else if (ratioStr === '1:1') targetRatio = 1;

  let cropW, cropH;
  if (w / h > targetRatio) {
    cropH = h;
    cropW = h * targetRatio;
  } else {
    cropW = w;
    cropH = w / targetRatio;
  }

  const cropX = (w - cropW) / 2;
  const cropY = (h - cropH) / 2;

  return { x: cropX, y: cropY, w: cropW, h: cropH };
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
  
  setTimeout(() => toast.classList.add('show'), 50);

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
