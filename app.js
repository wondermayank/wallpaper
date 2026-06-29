// State Management
let currentView = 'explore'; // 'explore', 'liked', or 'board'
let currentBoardName = '';
let filteredWallpapers = [];
let renderedCount = 0;
const itemsPerLoad = 30;

let currentCategory = 'All';
let currentFormat = 'All';
let searchQuery = '';
let currentSort = 'default';
let currentGridDensity = 'md';

// Load liked wallpapers from localStorage
let likedWallpapers = new Set(JSON.parse(localStorage.getItem('liked_wallpapers') || '[]'));

// Load custom boards from localStorage
let customBoards = JSON.parse(localStorage.getItem('custom_boards') || '{}');

// Canvas Editor State
let editModeActive = false;
let currentBlur = 0;
let currentCropRatio = 'free';
let cropOffsetPercent = 50; // 0 (left/top) to 100 (right/bottom)
let originalImage = null;

// Slideshow Autoplay State
let slideshowActive = false;
let slideshowIndex = 0;
let slideshowTimer = null;
let slideshowAutoplay = true;
const slideshowDuration = 4000; // 4 seconds
let slideshowMouseTimer = null;

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

const panControl = document.getElementById('pan-control');
const panSlider = document.getElementById('pan-slider');
const panLabel = document.getElementById('pan-label');
const panVal = document.getElementById('pan-val');
const blurFitContainer = document.getElementById('blur-fit-container');
const blurFitCheckbox = document.getElementById('blur-fit-checkbox');

const sortSelect = document.getElementById('sort-select');
const slideshowTrigger = document.getElementById('slideshow-trigger');
const lightboxSlideshowBtn = document.getElementById('lightbox-slideshow');
const densityBtns = document.querySelectorAll('.density-btn');

const slideshowOverlay = document.getElementById('slideshow-overlay');
const slideshowImg = document.getElementById('slideshow-img');
const slideshowPlayBtn = document.getElementById('slideshow-play');
const slideshowPrevBtn = document.getElementById('slideshow-prev');
const slideshowNextBtn = document.getElementById('slideshow-next');
const slideshowCloseBtn = document.getElementById('slideshow-close');
const slideshowProgressBar = document.getElementById('slideshow-progress');

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

// Helper to calculate size in bytes
function getWpSizeBytes(wp) {
  const val = parseFloat(wp.size);
  if (wp.size.toLowerCase().includes('kb')) return val * 1024;
  if (wp.size.toLowerCase().includes('mb')) return val * 1024 * 1024;
  return val;
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

  // Sorting
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender(true);
  });

  // Grid Density
  densityBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      densityBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      currentGridDensity = targetBtn.getAttribute('data-density');
      
      grid.classList.remove('grid-sm', 'grid-md', 'grid-lg');
      grid.classList.add(`grid-${currentGridDensity}`);
    });
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

  // Board Creation Listener
  boardCreateBtn.addEventListener('click', createNewBoard);

  // Board Filter Pill Click
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
  panSlider.addEventListener('input', handlePanChange);
  blurFitCheckbox.addEventListener('change', () => updateCanvas());

  ratioBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      ratioBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCropRatio = e.target.getAttribute('data-ratio');
      cropOffsetPercent = 50; // Reset offset on aspect ratio changes
      panSlider.value = 50;
      panVal.textContent = '50%';
      updateCanvas();
    });
  });

  // Slideshow Triggers
  slideshowTrigger.addEventListener('click', () => startSlideshow(0));
  lightboxSlideshowBtn.addEventListener('click', () => {
    const currentId = window.location.hash.substring(1);
    const index = filteredWallpapers.findIndex(w => w.id === currentId);
    closeLightbox();
    startSlideshow(index !== -1 ? index : 0);
  });

  // Slideshow Controls
  slideshowPlayBtn.addEventListener('click', toggleSlideshowPlay);
  slideshowPrevBtn.addEventListener('click', prevSlide);
  slideshowNextBtn.addEventListener('click', nextSlide);
  slideshowCloseBtn.addEventListener('click', closeSlideshow);
  slideshowOverlay.addEventListener('mousemove', triggerSlideshowMouseMovement);

  // Key Down Events (Arrow controls, L, D, E, S, Esc)
  document.addEventListener('keydown', (e) => {
    // Lightbox Shortcuts
    if (lightbox.classList.contains('active') && !slideshowActive) {
      if (e.key === 'ArrowRight') {
        navigateWp(1);
      } else if (e.key === 'ArrowLeft') {
        navigateWp(-1);
      } else if (e.key.toLowerCase() === 'l') {
        const currentId = window.location.hash.substring(1);
        if (currentId) toggleLike(currentId);
      } else if (e.key.toLowerCase() === 'd') {
        const currentId = window.location.hash.substring(1);
        const wp = WALLPAPERS.find(w => w.id === currentId);
        if (wp) {
          if (editModeActive) {
            downloadWallpaper(wp.url, `Edited_${wp.name}.jpg`, editorCanvas);
          } else {
            downloadWallpaper(wp.url, `${wp.name}.${wp.format.toLowerCase()}`);
          }
        }
      } else if (e.key.toLowerCase() === 'e') {
        toggleEditorPanel();
      }
    }
    
    // Slideshow Shortcuts
    if (slideshowActive) {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleSlideshowPlay();
      } else if (e.key === 'Escape') {
        closeSlideshow();
      }
    }
  });
}

// Keyboard arrow index navigator
function navigateWp(direction) {
  const currentId = window.location.hash.substring(1);
  if (!currentId) return;
  const currentIndex = filteredWallpapers.findIndex(w => w.id === currentId);
  if (currentIndex === -1) return;
  
  let nextIndex = currentIndex + direction;
  if (nextIndex >= filteredWallpapers.length) nextIndex = 0;
  if (nextIndex < 0) nextIndex = filteredWallpapers.length - 1;
  
  openLightbox(filteredWallpapers[nextIndex]);
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

function deactivateBoardPills() {
  boardPillsContainer.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
}

// Populate Dropdown selector inside the Lightbox
function populateBoardSelect() {
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
  }

  filteredWallpapers = WALLPAPERS.filter(wp => {
    const matchesSearch = searchQuery === '' || 
      wp.name.toLowerCase().includes(searchQuery) ||
      wp.category.toLowerCase().includes(searchQuery) ||
      wp.format.toLowerCase().includes(searchQuery);

    const matchesCategory = currentCategory === 'All' || wp.category === currentCategory;
    const matchesFormat = currentFormat === 'All' || wp.format === currentFormat;

    let matchesView = true;
    if (currentView === 'liked') {
      matchesView = likedWallpapers.has(wp.id);
    } else if (currentView === 'board') {
      const boardWps = customBoards[currentBoardName] || [];
      matchesView = boardWps.includes(wp.id);
    }

    return matchesSearch && matchesCategory && matchesFormat && matchesView;
  });

  // Apply Sorting
  if (currentSort === 'name-asc') {
    filteredWallpapers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === 'name-desc') {
    filteredWallpapers.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSort === 'size-asc') {
    filteredWallpapers.sort((a, b) => getWpSizeBytes(a) - getWpSizeBytes(b));
  } else if (currentSort === 'size-desc') {
    filteredWallpapers.sort((a, b) => getWpSizeBytes(b) - getWpSizeBytes(a));
  }

  // Update Stats
  totalCountEl.textContent = WALLPAPERS.length;
  viewCountEl.textContent = filteredWallpapers.length;

  if (filteredWallpapers.length === 0) {
    renderEmptyState();
    loaderContainer.style.display = 'none';
  } else {
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

  localStorage.setItem('liked_wallpapers', JSON.stringify(Array.from(likedWallpapers)));

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
    customBoards[boardName] = boardWps.filter(id => id !== wpId);
    showToast(`Removed from "${boardName}"`, 'info');
  } else {
    boardWps.push(wpId);
    showToast(`Added to "${boardName}"`, 'success');
  }

  localStorage.setItem('custom_boards', JSON.stringify(customBoards));
  renderBoardPills();
  
  if (currentView === 'board' && currentBoardName === boardName) {
    setTimeout(() => filterAndRender(false), 400);
  }
}

// Download Wallpaper Helper
async function downloadWallpaper(url, filename, canvasElement = null) {
  showToast('Initializing download...', 'info');
  try {
    let downloadUrl = url;

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

  boardSelect.onchange = (e) => {
    const selectedBoard = e.target.value;
    if (selectedBoard) {
      addWallpaperToBoard(wp.id, selectedBoard);
    }
  };

  resetEditorState();

  if (wp.format === 'GIF') {
    editorToggleBtn.style.display = 'none';
  } else {
    editorToggleBtn.style.display = 'block';
    originalImage = new Image();
    originalImage.crossOrigin = 'anonymous';
    originalImage.src = wp.url;
  }

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, null, ' ');
  resetEditorState();
}

function setupBoardSelectorForWallpaper(wpId) {
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
  cropOffsetPercent = 50;
  originalImage = null;
  
  editorToggleBtn.classList.remove('active');
  editorToggleBtn.innerHTML = '<i class="fas fa-magic"></i> Edit Wallpaper (Crop & Blur)';
  editorPanel.classList.remove('active');
  lightboxMedia.classList.remove('canvas-preview-active');
  
  blurSlider.value = 0;
  blurVal.textContent = '0px';
  panSlider.value = 50;
  panVal.textContent = '50%';
  panControl.style.display = 'none';
  blurFitContainer.style.display = 'none';
  blurFitCheckbox.checked = false;

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

function handlePanChange(e) {
  cropOffsetPercent = parseInt(e.target.value, 10);
  panVal.textContent = `${cropOffsetPercent}%`;
  updateCanvas();
}

// Render dynamic center-crop, Gaussian blur, crop pan slider offsets, and Blurred Fit logic onto canvas
function updateCanvas() {
  if (!originalImage || !originalImage.complete) {
    setTimeout(updateCanvas, 50);
    return;
  }

  const imgW = originalImage.naturalWidth;
  const imgH = originalImage.naturalHeight;

  // Decide if panning offset sliders need to be visible
  updateEditorControlsVisibility(imgW, imgH);

  // Calculate cropping bounds
  const crop = getCropBounds(imgW, imgH, currentCropRatio);

  editorCanvas.width = crop.w;
  editorCanvas.height = crop.h;

  const ctx = editorCanvas.getContext('2d');
  ctx.clearRect(0, 0, crop.w, crop.h);

  // Check if Blurred Fit Portrait is enabled
  const doBlurFit = blurFitCheckbox.checked && 
    (currentCropRatio === '9:16' || currentCropRatio === '1:1') && 
    (imgW > imgH);

  if (doBlurFit) {
    // 1. Draw blurred, zoomed background
    ctx.save();
    ctx.filter = `blur(${Math.max(currentBlur, 24)}px)`; // enforce minimum blur for fitting
    
    // Zoom/fill backdrop math: crop center portrait slice of landscape image
    const bgRatio = crop.w / crop.h;
    let bgW, bgH;
    if (imgW / imgH > bgRatio) {
      bgH = imgH;
      bgW = imgH * bgRatio;
    } else {
      bgW = imgW;
      bgH = imgW / bgRatio;
    }
    const bgX = (imgW - bgW) / 2;
    const bgY = (imgH - bgH) / 2;
    
    // Draw blurred back
    ctx.drawImage(originalImage, bgX, bgY, bgW, bgH, 0, 0, crop.w, crop.h);
    ctx.restore();

    // 2. Draw clean unblurred desktop foreground in center
    ctx.save();
    if (currentBlur > 0) {
      ctx.filter = `blur(${currentBlur}px)`;
    } else {
      ctx.filter = 'none';
    }

    const scale = crop.w / imgW;
    const fgH = imgH * scale;
    const fgY = (crop.h - fgH) / 2;
    
    ctx.drawImage(originalImage, 0, 0, imgW, imgH, 0, fgY, crop.w, fgH);
    ctx.restore();

  } else {
    // Standard Draw logic (Blur + Crop Position Pan offsets)
    if (currentBlur > 0) {
      ctx.filter = `blur(${currentBlur}px)`;
    } else {
      ctx.filter = 'none';
    }

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
}

// Dynamically toggles sliders depending on crop bounds prying axes
function updateEditorControlsVisibility(imgW, imgH) {
  if (currentCropRatio === 'free') {
    panControl.style.display = 'none';
    blurFitContainer.style.display = 'none';
    return;
  }

  let targetRatio = 1;
  if (currentCropRatio === '16:9') targetRatio = 16 / 9;
  else if (currentCropRatio === '9:16') targetRatio = 9 / 16;
  else if (currentCropRatio === '1:1') targetRatio = 1;

  const imgRatio = imgW / imgH;

  // 1. Pan controls visibility
  if (Math.abs(imgRatio - targetRatio) < 0.05) {
    panControl.style.display = 'none'; // ratios match, no panning needed
  } else {
    panControl.style.display = 'flex';
    if (imgRatio > targetRatio) {
      panLabel.textContent = 'Slide Left / Right';
    } else {
      panLabel.textContent = 'Slide Up / Down';
    }
  }

  // 2. Blurred Fit Portrait controls visibility (Landscape image fitted into Portrait crop)
  const isPortraitCrop = currentCropRatio === '9:16' || currentCropRatio === '1:1';
  if (isPortraitCrop && imgW > imgH) {
    blurFitContainer.style.display = 'flex';
  } else {
    blurFitContainer.style.display = 'none';
    blurFitCheckbox.checked = false;
  }
}

// Center crop calculation helper with panning offsets
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

  // Position panner math using cropOffsetPercent (value 0 to 100)
  const offsetFraction = cropOffsetPercent / 100;
  let cropX = (w - cropW) / 2;
  let cropY = (h - cropH) / 2;

  if (w / h > targetRatio) {
    cropX = (w - cropW) * offsetFraction; // slide left-to-right
  } else {
    cropY = (h - cropH) * offsetFraction; // slide up-to-down
  }

  return { x: cropX, y: cropY, w: cropW, h: cropH };
}

// Fullscreen Slideshow Loop Manager
function startSlideshow(startIndex = 0) {
  if (filteredWallpapers.length === 0) return;
  
  slideshowActive = true;
  slideshowIndex = startIndex;
  slideshowAutoplay = true;
  
  slideshowPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
  slideshowOverlay.classList.add('active');
  slideshowOverlay.classList.remove('idle');
  document.body.style.overflow = 'hidden';
  
  showSlide(slideshowIndex);
  resetSlideshowTimer();
}

function showSlide(index) {
  slideshowIndex = index;
  const wp = filteredWallpapers[slideshowIndex];
  
  // Set image source
  slideshowImg.classList.remove('active');
  setTimeout(() => {
    slideshowImg.src = wp.url;
    slideshowImg.alt = wp.name;
    slideshowImg.onload = () => {
      slideshowImg.classList.add('active');
    };
  }, 100);

  // Update hash deep linking in background
  window.location.hash = wp.id;
}

function nextSlide() {
  showSlide((slideshowIndex + 1) % filteredWallpapers.length);
  if (slideshowAutoplay) resetSlideshowTimer();
}

function prevSlide() {
  showSlide((slideshowIndex - 1 + filteredWallpapers.length) % filteredWallpapers.length);
  if (slideshowAutoplay) resetSlideshowTimer();
}

function toggleSlideshowPlay() {
  slideshowAutoplay = !slideshowAutoplay;
  if (slideshowAutoplay) {
    slideshowPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    resetSlideshowTimer();
    showToast('Slideshow resumed', 'info');
  } else {
    slideshowPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    clearInterval(slideshowTimer);
    slideshowProgressBar.style.transition = 'none';
    slideshowProgressBar.style.width = '0%';
    showToast('Slideshow paused', 'info');
  }
}

function resetSlideshowTimer() {
  clearInterval(slideshowTimer);
  
  // Animate CSS progress bar
  slideshowProgressBar.style.transition = 'none';
  slideshowProgressBar.style.width = '0%';
  
  // Trigger bar animation
  setTimeout(() => {
    slideshowProgressBar.style.transition = `width ${slideshowDuration}ms linear`;
    slideshowProgressBar.style.width = '100%';
  }, 50);

  slideshowTimer = setInterval(() => {
    nextSlide();
  }, slideshowDuration);
}

function closeSlideshow() {
  slideshowActive = false;
  clearInterval(slideshowTimer);
  slideshowOverlay.classList.remove('active');
  document.body.style.overflow = '';
  
  // Sync back to lightbox with deep-linking
  const currentWp = filteredWallpapers[slideshowIndex];
  if (currentWp) {
    openLightbox(currentWp);
  }
}

// Mouse idle auto-hider for slideshow
function triggerSlideshowMouseMovement() {
  slideshowOverlay.classList.remove('idle');
  clearTimeout(slideshowMouseTimer);
  
  slideshowMouseTimer = setTimeout(() => {
    if (slideshowActive && slideshowAutoplay) {
      slideshowOverlay.classList.add('idle');
    }
  }, 2500);
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
