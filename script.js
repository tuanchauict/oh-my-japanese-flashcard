// Flash Card Application for Japanese Driving School Vocabulary

class FlashCardApp {
  constructor() {
    this.dictionary = null;
    this.audioMapping = null;
    this.currentCategory = null;
    this.currentWords = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.mode = 'jp-vn'; // 'jp-vn' or 'vn-jp'
    this.currentAudio = null;
    this.autoPlay = false;
    this.autoPlayDelay = 3000; // 3 seconds
    this.wakeLock = null;
    
    this.init();
  }
  
  async init() {
    await this.loadDictionary();
    await this.loadAudioMapping();
    this.setupElements();
    this.setupEventListeners();
    this.populateCategories();
    this.loadFirstCategory();
  }
  
  async loadAudioMapping() {
    try {
      const response = await fetch('audio_mapping.json');
      this.audioMapping = await response.json();
      console.log('Loaded audio mapping with', Object.keys(this.audioMapping).length, 'entries');
    } catch (error) {
      console.warn('Audio mapping not found, speech will be disabled:', error);
      this.audioMapping = {};
    }
  }
  
  speakJapanese(text) {
    // Get audio file path from mapping
    const audioPath = this.audioMapping[text];
    if (!audioPath) {
      console.warn('No audio file for:', text);
      return;
    }
    
    // Visual feedback
    const speakBtn = this.isFlipped ? this.elements.speakBtnBack : this.elements.speakBtn;
    speakBtn.classList.add('speaking');
    
    // Reuse existing Audio element for mobile compatibility
    // Mobile browsers block audio unless initiated by user gesture
    // By reusing the same Audio element, we keep the "unlocked" state
    if (!this.currentAudio) {
      this.currentAudio = new Audio();
    } else {
      this.currentAudio.pause();
    }
    
    this.currentAudio.src = audioPath;
    
    this.currentAudio.onended = () => {
      speakBtn.classList.remove('speaking');
    };
    
    this.currentAudio.onerror = () => {
      speakBtn.classList.remove('speaking');
      console.error('Error playing audio for:', text);
    };
    
    this.currentAudio.play().catch(err => {
      speakBtn.classList.remove('speaking');
      console.error('Failed to play audio:', err);
    });
  }
  
  async loadDictionary() {
    try {
      const response = await fetch('dictionary.json');
      this.dictionary = await response.json();
    } catch (error) {
      console.error('Error loading dictionary:', error);
      alert('Không thể tải từ điển. Vui lòng thử lại.');
    }
  }
  
  setupElements() {
    this.elements = {
      categorySelect: document.getElementById('category-select'),
      flashcard: document.getElementById('flashcard'),
      frontMain: document.getElementById('front-main'),
      frontSub: document.getElementById('front-sub'),
      backMain: document.getElementById('back-main'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      shuffleBtn: document.getElementById('shuffle-btn'),
      progressText: document.getElementById('progress-text'),
      progressFill: document.getElementById('progress-fill'),
      modeJpVn: document.getElementById('mode-jp-vn'),
      modeVnJp: document.getElementById('mode-vn-jp'),
      speakBtn: document.getElementById('speak-btn'),
      speakBtnBack: document.getElementById('speak-btn-back'),
      autoPlayBtn: document.getElementById('auto-play-btn')
    };
  }
  
  setupEventListeners() {
    // Category change
    this.elements.categorySelect.addEventListener('change', (e) => {
      this.selectCategory(e.target.value);
    });
    
    // Card flip
    this.elements.flashcard.addEventListener('click', () => {
      this.flipCard();
    });
    
    // Navigation buttons
    this.elements.prevBtn.addEventListener('click', () => {
      this.previousCard();
    });
    
    this.elements.nextBtn.addEventListener('click', () => {
      this.nextCard();
    });
    
    // Shuffle button
    this.elements.shuffleBtn.addEventListener('click', () => {
      this.shuffleCards();
    });
    
    // Mode toggle
    this.elements.modeJpVn.addEventListener('click', () => {
      this.setMode('jp-vn');
    });
    
    this.elements.modeVnJp.addEventListener('click', () => {
      this.setMode('vn-jp');
    });
    
    // Speak buttons
    this.elements.speakBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card flip
      this.speakCurrentWord();
    });
    
    this.elements.speakBtnBack.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card flip
      this.speakCurrentWord();
    });
    
    // Auto-play button
    this.elements.autoPlayBtn.addEventListener('click', () => {
      this.toggleAutoPlay();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
    
    // Touch swipe support
    this.setupSwipeGestures();
  }
  
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    this.elements.flashcard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    this.elements.flashcard.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });
  }
  
  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next card
        this.nextCard();
      } else {
        // Swipe right - previous card
        this.previousCard();
      }
    }
  }
  
  handleKeyboard(e) {
    switch(e.key) {
      case 'ArrowLeft':
        this.previousCard();
        break;
      case 'ArrowRight':
        this.nextCard();
        break;
      case ' ':
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        this.flipCard();
        break;
      case 's':
      case 'S':
        this.shuffleCards();
        break;
      case 'p':
      case 'P':
      case 'Enter':
        this.speakCurrentWord();
        break;
    }
  }
  
  speakCurrentWord() {
    if (this.currentWords.length === 0) return;
    const word = this.currentWords[this.currentIndex];
    this.speakJapanese(word.japanese);
  }
  
  populateCategories() {
    if (!this.dictionary) return;
    
    this.elements.categorySelect.innerHTML = '';
    
    // Add "All words" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = `📚 Tất cả từ vựng (${this.getTotalWords()} từ)`;
    this.elements.categorySelect.appendChild(allOption);
    
    // Add categories
    this.dictionary.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.name} (${category.words.length} từ)`;
      this.elements.categorySelect.appendChild(option);
    });
  }
  
  getTotalWords() {
    if (!this.dictionary) return 0;
    return this.dictionary.categories.reduce((sum, cat) => sum + cat.words.length, 0);
  }
  
  loadFirstCategory() {
    const savedCategory = localStorage.getItem('flashcard-category') || 'all';
    const savedIndex = parseInt(localStorage.getItem('flashcard-index') || '0', 10);
    const savedMode = localStorage.getItem('flashcard-mode') || 'jp-vn';
    
    this.elements.categorySelect.value = savedCategory;
    this.setMode(savedMode);
    this.selectCategory(savedCategory, savedIndex);
  }
  
  selectCategory(categoryId, startIndex = 0) {
    if (categoryId === 'all') {
      // Combine all words from all categories
      this.currentWords = this.dictionary.categories.flatMap(cat => cat.words);
      this.currentCategory = { id: 'all', name: 'Tất cả từ vựng' };
    } else {
      const category = this.dictionary.categories.find(c => c.id === categoryId);
      if (category) {
        this.currentWords = [...category.words];
        this.currentCategory = category;
      }
    }
    
    this.currentIndex = Math.min(startIndex, this.currentWords.length - 1);
    this.isFlipped = false;
    this.saveState();
    this.updateCard();
    this.updateProgress();
  }
  
  saveState() {
    localStorage.setItem('flashcard-category', this.currentCategory.id);
    localStorage.setItem('flashcard-index', this.currentIndex.toString());
    localStorage.setItem('flashcard-mode', this.mode);
  }
  
  setMode(mode) {
    this.mode = mode;
    
    // Update button states
    this.elements.modeJpVn.classList.toggle('active', mode === 'jp-vn');
    this.elements.modeVnJp.classList.toggle('active', mode === 'vn-jp');
    
    // Save mode
    localStorage.setItem('flashcard-mode', mode);
    
    // Reset flip state and update card
    this.isFlipped = false;
    this.elements.flashcard.classList.remove('flipped');
    this.updateCard();
  }
  
  updateCard() {
    if (this.currentWords.length === 0) return;
    
    const word = this.currentWords[this.currentIndex];
    
    if (this.mode === 'jp-vn') {
      // Front: Japanese, Back: Vietnamese
      this.elements.frontMain.textContent = word.japanese;
      this.elements.frontSub.textContent = word.romaji;
      this.elements.backMain.textContent = word.vietnamese;
      document.title = `${word.japanese} - Oh! My Japanese Flashcard`;
    } else {
      // Front: Vietnamese, Back: Japanese
      this.elements.frontMain.textContent = word.vietnamese;
      this.elements.frontSub.textContent = '';
      this.elements.backMain.innerHTML = `
        <span style="font-size: 2rem;">${word.japanese}</span>
        <br><br>
        <span style="font-size: 1.2rem; opacity: 0.9;">${word.romaji}</span>
      `;
      document.title = `${word.vietnamese} - Oh! My Japanese Flashcard`;
    }
    
    // Add animation
    this.elements.flashcard.classList.add('animate');
    setTimeout(() => {
      this.elements.flashcard.classList.remove('animate');
    }, 300);
    
    // Auto-play audio when card is shown
    this.speakCurrentWord();
  }
  
  flipCard() {
    this.isFlipped = !this.isFlipped;
    this.elements.flashcard.classList.toggle('flipped', this.isFlipped);
    this.speakCurrentWord();
  }
  
  previousCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
      this.elements.flashcard.classList.remove('flipped');
      this.saveState();
      this.updateCard();
      this.updateProgress();
    }
  }
  
  nextCard() {
    if (this.currentIndex < this.currentWords.length - 1) {
      this.currentIndex++;
    } else {
      // Loop back to first card
      this.currentIndex = 0;
    }
    this.isFlipped = false;
    this.elements.flashcard.classList.remove('flipped');
    this.saveState();
    this.updateCard();
    this.updateProgress();
  }
  
  async toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;
    this.elements.autoPlayBtn.classList.toggle('active', this.autoPlay);
    this.elements.autoPlayBtn.textContent = this.autoPlay ? '❙❙' : '▶';
    
    if (this.autoPlay) {
      await this.requestWakeLock();
      this.scheduleAutoNext();
    } else {
      this.releaseWakeLock();
    }
  }
  
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
        
        // Re-acquire wake lock if page becomes visible again
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake lock released');
        });
      } catch (err) {
        console.warn('Wake lock request failed:', err);
      }
    }
  }
  
  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
  
  scheduleAutoNext() {
    if (!this.autoPlay) return;
    
    // Wait for audio to finish, then wait delay, then next
    const checkAndNext = () => {
      if (!this.autoPlay) return;
      
      if (this.currentAudio && !this.currentAudio.paused) {
        // Audio still playing, check again later
        setTimeout(checkAndNext, 500);
      } else {
        // Audio done, wait delay then go next
        setTimeout(() => {
          if (this.autoPlay) {
            this.nextCard();
            this.scheduleAutoNext();
          }
        }, this.autoPlayDelay);
      }
    };
    
    checkAndNext();
  }
  
  shuffleCards() {
    // Fisher-Yates shuffle
    for (let i = this.currentWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentWords[i], this.currentWords[j]] = [this.currentWords[j], this.currentWords[i]];
    }
    
    this.currentIndex = 0;
    this.isFlipped = false;
    this.elements.flashcard.classList.remove('flipped');
    this.updateCard();
    this.updateProgress();
    
    // Visual feedback
    this.elements.shuffleBtn.textContent = '✓';
    setTimeout(() => {
      this.elements.shuffleBtn.textContent = '↻';
    }, 1000);
  }
  
  updateProgress() {
    const current = this.currentIndex + 1;
    const total = this.currentWords.length;
    const percentage = (current / total) * 100;
    
    this.elements.progressText.textContent = `Thẻ ${current} / ${total}`;
    this.elements.progressFill.style.width = `${percentage}%`;
    
    // Update button states (prev disabled at start, next always enabled for loop)
    this.elements.prevBtn.disabled = this.currentIndex === 0;
    this.elements.nextBtn.disabled = false;
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FlashCardApp();
});
