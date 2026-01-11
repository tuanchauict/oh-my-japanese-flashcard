// Main App - coordinates all modules

import Storage from './storage.js';
import AudioManager from './audio.js';
import RememberedManager from './remembered.js';
import CardManager from './cards.js';
import AutoPlayManager from './autoplay.js';

class FlashCardApp {
  constructor() {
    this.dictionary = null;
    this.currentCategory = null;
    this.readBothLanguages = false;

    this.audio = new AudioManager();
    this.remembered = new RememberedManager();
    this.cards = null; // Initialized after elements are ready
    this.autoPlay = null;

    this.init();
  }

  async init() {
    await this.loadDictionary();
    await this.audio.loadMapping();
    this.setupElements();
    this.initializeManagers();
    this.setupEventListeners();
    this.loadPreferences();
    this.populateCategories();
    this.loadFirstCategory();
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
      autoPlayBtn: document.getElementById('auto-play-btn'),
      readBothToggle: document.getElementById('read-both-toggle'),
      skipRememberedToggle: document.getElementById('skip-remembered-toggle'),
      markRememberedBtn: document.getElementById('mark-remembered-btn'),
      markRememberedBtnBack: document.getElementById('mark-remembered-btn-back'),
      resetRememberedBtn: document.getElementById('reset-remembered-btn'),
      rememberedListToggle: document.getElementById('remembered-list-toggle'),
      rememberedListTitle: document.getElementById('remembered-list-title'),
      rememberedListContent: document.getElementById('remembered-list-content'),
      rememberedWordsUl: document.getElementById('remembered-words-ul')
    };
  }

  initializeManagers() {
    this.cards = new CardManager(this.elements);
    this.remembered.load();

    this.autoPlay = new AutoPlayManager({
      delay: 3000,
      onNext: () => this.nextCard(),
      isAudioPlaying: () => this.audio.isPlaying()
    });

    this.audio.setupMediaSessionHandlers({
      onPrevious: () => this.previousCard(),
      onNext: () => this.nextCard(),
      onPlay: () => this.speakCurrentWord(),
      onPause: () => this.audio.pause()
    });
  }

  loadPreferences() {
    this.readBothLanguages = Storage.getBoolean(Storage.keys.READ_BOTH);
    this.elements.readBothToggle.checked = this.readBothLanguages;

    this.remembered.skipEnabled = Storage.getBoolean(Storage.keys.SKIP_REMEMBERED);
    this.elements.skipRememberedToggle.checked = this.remembered.skipEnabled;
  }

  setupEventListeners() {
    // Category change
    this.elements.categorySelect.addEventListener('change', (e) => {
      this.selectCategory(e.target.value);
    });

    // Card flip
    this.elements.flashcard.addEventListener('click', () => this.flipCard());

    // Navigation
    this.elements.prevBtn.addEventListener('click', () => this.previousCard());
    this.elements.nextBtn.addEventListener('click', () => this.nextCard());
    this.elements.shuffleBtn.addEventListener('click', () => this.shuffleCards());

    // Mode toggle
    this.elements.modeJpVn.addEventListener('click', () => this.setMode('jp-vn'));
    this.elements.modeVnJp.addEventListener('click', () => this.setMode('vn-jp'));

    // Speak buttons
    this.elements.speakBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.speakCurrentWord();
    });
    this.elements.speakBtnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      this.speakCurrentWord();
    });

    // Auto-play
    this.elements.autoPlayBtn.addEventListener('click', () => {
      this.autoPlay.toggle(this.elements.autoPlayBtn);
    });

    // Read both toggle
    this.elements.readBothToggle.addEventListener('change', (e) => {
      this.readBothLanguages = e.target.checked;
      Storage.set(Storage.keys.READ_BOTH, this.readBothLanguages);
    });

    // Skip remembered toggle
    this.elements.skipRememberedToggle.addEventListener('change', (e) => {
      this.remembered.setSkipEnabled(e.target.checked);
      this.applyFilter();
    });

    // Mark remembered buttons
    this.elements.markRememberedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleRemembered();
    });
    this.elements.markRememberedBtnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleRemembered();
    });

    // Reset remembered
    this.elements.resetRememberedBtn.addEventListener('click', () => {
      this.resetRemembered();
    });

    // Remembered list toggle
    this.elements.rememberedListToggle.addEventListener('click', () => {
      this.toggleRememberedList();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Touch swipe
    this.setupSwipeGestures();
  }

  setupSwipeGestures() {
    let touchStartX = 0;

    this.elements.flashcard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.elements.flashcard.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.nextCard();
        } else {
          this.previousCard();
        }
      }
    }, { passive: true });
  }

  handleKeyboard(e) {
    switch (e.key) {
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

  // Category management
  populateCategories() {
    if (!this.dictionary) return;

    this.elements.categorySelect.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = `📚 Tất cả từ vựng (${this.getTotalWords()} từ)`;
    this.elements.categorySelect.appendChild(allOption);

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
    const savedCategory = Storage.get(Storage.keys.CATEGORY, 'all');
    const savedIndex = Storage.getInt(Storage.keys.INDEX, 0);
    const savedMode = Storage.get(Storage.keys.MODE, 'jp-vn');

    this.elements.categorySelect.value = savedCategory;
    this.setMode(savedMode);
    this.selectCategory(savedCategory, savedIndex);
  }

  selectCategory(categoryId, startIndex = 0) {
    let words;
    if (categoryId === 'all') {
      words = this.dictionary.categories.flatMap(cat => cat.words);
      this.currentCategory = { id: 'all', name: 'Tất cả từ vựng' };
    } else {
      const category = this.dictionary.categories.find(c => c.id === categoryId);
      if (category) {
        words = [...category.words];
        this.currentCategory = category;
      }
    }

    // Apply remembered filter
    words = this.remembered.filterWords(words);

    if (words.length === 0) {
      this.cards.showEmpty();
      this.elements.progressText.textContent = 'Hoàn thành!';
      this.elements.progressFill.style.width = '100%';
      return;
    }

    this.cards.setWords(words);
    this.cards.setIndex(startIndex);
    this.saveState();
    this.updateCard();
    this.updateProgress();
    this.updateRememberedList();
  }

  applyFilter() {
    const currentCategoryId = this.currentCategory?.id || 'all';
    this.selectCategory(currentCategoryId);
  }

  // Card operations
  setMode(mode) {
    this.cards.setMode(mode);
    Storage.set(Storage.keys.MODE, mode);
    this.updateCard();
  }

  updateCard() {
    const word = this.cards.updateDisplay();
    if (!word) return;

    // Update page title
    if (this.readBothLanguages) {
      document.title = word.japanese;
    } else {
      document.title = this.cards.mode === 'jp-vn' ? word.japanese : word.vietnamese;
    }

    // Update remembered button
    this.updateRememberedButton();

    // Update media session
    const progress = this.cards.getProgress();
    this.audio.updateMediaSession(
      word,
      `${progress.current}/${progress.total}`,
      this.currentCategory?.name || 'Flashcard'
    );

    // Auto-play audio
    this.speakCurrentWord();
  }

  flipCard() {
    this.cards.flip();
    this.speakCurrentWord();
  }

  previousCard() {
    if (this.cards.previous()) {
      this.saveState();
      this.updateCard();
      this.updateProgress();
    }
  }

  nextCard() {
    if (this.cards.next()) {
      this.saveState();
      this.updateCard();
      this.updateProgress();
    }
  }

  shuffleCards() {
    this.cards.shuffle();
    this.updateCard();
    this.updateProgress();

    this.elements.shuffleBtn.textContent = '✓';
    setTimeout(() => {
      this.elements.shuffleBtn.textContent = '↻';
    }, 1000);
  }

  // Audio
  speakCurrentWord() {
    const word = this.cards.getCurrentWord();
    if (!word) return;

    // Visual feedback
    const speakBtn = this.cards.isFlipped ? this.elements.speakBtnBack : this.elements.speakBtn;
    speakBtn.classList.add('speaking');

    const onEnded = () => {
      speakBtn.classList.remove('speaking');
    };

    if (this.readBothLanguages) {
      this.audio.play(word.japanese, () => {
        setTimeout(() => {
          this.audio.play(word.vietnamese, onEnded);
        }, 500);
      });
    } else {
      this.audio.play(word.japanese, onEnded);
    }
  }

  // Remembered words
  toggleRemembered() {
    const word = this.cards.getCurrentWord();
    if (!word) return;

    const isNowRemembered = this.remembered.toggle(word.japanese);
    this.updateRememberedButton();
    this.updateProgress();
    this.updateRememberedList();

    if (this.remembered.skipEnabled && isNowRemembered) {
      // Remove the word from current list and continue
      setTimeout(() => {
        this.removeCurrentWordFromList();
      }, 300);
    }
  }

  removeCurrentWordFromList() {
    const currentIndex = this.cards.currentIndex;
    const words = this.cards.words.filter((_, i) => i !== currentIndex);
    
    if (words.length === 0) {
      this.cards.setWords([]);
      this.cards.showEmpty();
      this.elements.progressText.textContent = 'Hoàn thành!';
      this.elements.progressFill.style.width = '100%';
      this.updateRememberedList();
      return;
    }

    // Adjust index if we removed a card before the end
    const newIndex = Math.min(currentIndex, words.length - 1);
    this.cards.setWords(words);
    this.cards.setIndex(newIndex);
    this.updateCard();
    this.updateProgress();
  }

  updateRememberedButton() {
    const word = this.cards.getCurrentWord();
    if (!word) return;

    const isRemembered = this.remembered.isRemembered(word.japanese);
    const icon = isRemembered ? '★' : '☆';

    this.elements.markRememberedBtn.textContent = icon;
    this.elements.markRememberedBtnBack.textContent = icon;
    this.elements.markRememberedBtn.classList.toggle('remembered', isRemembered);
    this.elements.markRememberedBtnBack.classList.toggle('remembered', isRemembered);
  }

  resetRemembered() {
    if (confirm('Xóa tất cả đánh dấu đã thuộc?')) {
      this.remembered.reset();
      this.updateRememberedButton();
      this.updateProgress();
      this.updateRememberedList();
    }
  }

  toggleRememberedList() {
    const listContainer = this.elements.rememberedListToggle.parentElement;
    listContainer.classList.toggle('expanded');
  }

  updateRememberedList() {
    // Get all words for current category (unfiltered)
    const allWords = this.getAllCategoryWords();

    // Filter to remembered words only
    const rememberedWords = allWords.filter(w => this.remembered.isRemembered(w.japanese));
    
    // Update title
    this.elements.rememberedListTitle.textContent = `Từ đã thuộc (${rememberedWords.length})`;

    // Build list
    const ul = this.elements.rememberedWordsUl;
    ul.innerHTML = '';

    if (rememberedWords.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'remembered-list-empty';
      emptyMsg.textContent = 'Chưa có từ nào được đánh dấu';
      ul.appendChild(emptyMsg);
      return;
    }

    rememberedWords.forEach(word => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="word-text">
          <span class="word-japanese">${word.japanese}</span>
          <span class="word-vietnamese"> - ${word.vietnamese}</span>
        </div>
        <button class="unmark-btn" title="Bỏ đánh dấu">✕</button>
      `;

      li.querySelector('.unmark-btn').addEventListener('click', () => {
        this.remembered.toggle(word.japanese);
        this.updateRememberedList();
        this.updateRememberedButton();
        this.updateProgress();
      });

      ul.appendChild(li);
    });
  }

  // Progress
  updateProgress() {
    const progress = this.cards.getProgress();
    const allCategoryWords = this.getAllCategoryWords();
    const rememberedCount = this.remembered.getCountIn(allCategoryWords);
    const rememberedText = rememberedCount > 0 ? ` (${rememberedCount} đã thuộc)` : '';

    this.elements.progressText.textContent = `Thẻ ${progress.current} / ${progress.total}${rememberedText}`;
    this.elements.progressFill.style.width = `${progress.percentage}%`;

    this.elements.prevBtn.disabled = this.cards.currentIndex === 0;
    this.elements.nextBtn.disabled = false;
  }

  // Helper to get all words in current category (unfiltered)
  getAllCategoryWords() {
    if (this.currentCategory?.id === 'all') {
      return this.dictionary.categories.flatMap(cat => cat.words);
    }
    const category = this.dictionary.categories.find(c => c.id === this.currentCategory?.id);
    return category ? category.words : [];
  }

  // State persistence
  saveState() {
    Storage.set(Storage.keys.CATEGORY, this.currentCategory.id);
    Storage.set(Storage.keys.INDEX, this.cards.currentIndex.toString());
    Storage.set(Storage.keys.MODE, this.cards.mode);
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FlashCardApp();
});
