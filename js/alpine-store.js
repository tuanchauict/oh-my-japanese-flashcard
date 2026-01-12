// Alpine.js store for flashcard app

// Storage utilities
const Storage = {
  keys: {
    CATEGORY: 'flashcard-category',
    INDEX: 'flashcard-index',
    MODE: 'flashcard-mode',
    READ_BOTH: 'flashcard-read-both',
    SKIP_REMEMBERED: 'flashcard-skip-remembered',
    REMEMBERED: 'flashcard-remembered',
    SPIRAL_MODE: 'flashcard-spiral-mode'
  },
  get: (key, def = null) => localStorage.getItem(key) ?? def,
  set: (key, val) => localStorage.setItem(key, val),
  getJSON: (key, def = null) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } },
  setJSON: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  getBool: (key) => localStorage.getItem(key) === 'true',
  getInt: (key, def = 0) => parseInt(localStorage.getItem(key), 10) || def
};

// Audio manager
const Audio = {
  current: null,
  mapping: {},
  
  async loadMapping(dictionaryName) {
    try {
      const path = `assets/audio/${dictionaryName}/audio_mapping.json`;
      const res = await fetch(path);
      this.mapping = await res.json();
    } catch (e) {
      console.warn('Audio mapping not found:', e);
    }
  },
  
  play(text, onEnded) {
    const path = this.mapping[text];
    if (!path) { onEnded?.(); return; }
    
    if (!this.current) this.current = new window.Audio();
    else this.current.pause();
    
    this.current.src = path;
    this.current.onended = () => onEnded?.();
    this.current.onerror = () => onEnded?.();
    this.current.play().catch(() => onEnded?.());
  },
  
  pause() { this.current?.pause(); },
  isPlaying() { return this.current && !this.current.paused; },
  
  updateMediaSession(word, cardNum, category) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${word.japanese} (${word.romaji})`,
      artist: word.meaning,
      album: `${category} (${cardNum})`,
      artwork: [{ src: 'assets/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }]
    });
  }
};

// Main flashcard store
document.addEventListener('alpine:init', () => {
  Alpine.store('app', {
    // Data
    dictionary: null,
    words: [],
    currentIndex: 0,
    isFlipped: false,
    mode: 'jp-vn',
    currentCategory: { id: 'all', name: 'Tất cả từ vựng' },
    
    // Settings
    readBoth: false,
    spiralMode: false,
    skipRemembered: false,
    remembered: new Set(),
    
    // UI state
    autoPlaying: false,
    autoPlayVersion: 0, // Invalidate old schedules when category changes
    wakeLock: null,
    shuffleConfirm: false,
    rememberedListOpen: false,
    pendingRemoval: false,
    speaking: false,
    
    // Spiral state
    spiralStep: 0, // Current step in spiral sequence

    // Computed - Metadata
    get title() {
      return this.dictionary?.metadata?.title || '';
    },
    
    get subtitle() {
      return this.dictionary?.metadata?.subtitle || '';
    },
    
    get modes() {
      return this.dictionary?.metadata?.modes || [];
    },
    
    get readBothLabel() {
      return this.dictionary?.metadata?.readBothLabel || '';
    },
    
    get currentWord() {
      return this.words[this.currentIndex] || null;
    },
    
    get progress() {
      if (this.words.length === 0) return { current: 0, total: 0, percent: 0 };
      return {
        current: this.currentIndex + 1,
        total: this.words.length,
        percent: ((this.currentIndex + 1) / this.words.length) * 100
      };
    },
    
    get allCategoryWords() {
      if (!this.dictionary) return [];
      if (this.currentCategory.id === 'all') {
        return this.dictionary.categories.flatMap(c => c.words);
      }
      return this.dictionary.categories.find(c => c.id === this.currentCategory.id)?.words || [];
    },
    
    get rememberedInCategory() {
      return this.allCategoryWords.filter(w => this.remembered.has(w.japanese));
    },
    
    get rememberedCount() {
      return this.rememberedInCategory.length;
    },
    
    get frontMain() {
      if (!this.currentWord) return '';
      return this.mode === 'jp-vn' ? this.currentWord.japanese : this.currentWord.meaning;
    },
    
    get frontSub() {
      if (!this.currentWord) return '';
      return this.mode === 'jp-vn' ? this.currentWord.romaji : '';
    },
    
    get backMain() {
      if (!this.currentWord) return '';
      if (this.mode === 'jp-vn') return this.currentWord.meaning;
      return `<span style="font-size:2rem">${this.currentWord.japanese}</span><br><br><span style="font-size:1.2rem;opacity:0.9">${this.currentWord.romaji}</span>`;
    },
    
    get isCurrentRemembered() {
      return this.currentWord && this.remembered.has(this.currentWord.japanese);
    },
    
    get categories() {
      if (!this.dictionary) return [];
      const total = this.dictionary.categories.reduce((s, c) => s + c.words.length, 0);
      return [
        { id: 'all', name: `📚 Tất cả từ vựng (${total} từ)` },
        ...this.dictionary.categories.map(c => ({ id: c.id, name: `${c.name} (${c.words.length} từ)` }))
      ];
    },

    // Init
    async init(dictionaryFile = 'dictionary.json') {
      this.dictionaryFile = dictionaryFile;
      await this.loadDictionary();
      
      // Get dictionary name for audio folder (e.g., "dictionary" from "dictionary.json")
      const dictionaryName = dictionaryFile.replace('.json', '');
      await Audio.loadMapping(dictionaryName);
      
      this.loadPreferences();
      this.loadCategory(Storage.get(Storage.keys.CATEGORY, 'all'), true); // Restore saved index on init
      this.setupMediaSession();
      this.setupKeyboard();
    },
    
    async loadDictionary() {
      try {
        const res = await fetch(this.dictionaryFile);
        this.dictionary = await res.json();
      } catch (e) {
        console.error('Failed to load dictionary:', e);
      }
    },
    
    loadPreferences() {
      // Use first mode from metadata as default
      const defaultMode = this.dictionary?.metadata?.modes?.[0]?.id || 'jp-vn';
      this.mode = Storage.get(Storage.keys.MODE, defaultMode);
      this.readBoth = Storage.getBool(Storage.keys.READ_BOTH);
      this.spiralMode = Storage.getBool(Storage.keys.SPIRAL_MODE);
      this.skipRemembered = Storage.getBool(Storage.keys.SKIP_REMEMBERED);
      const saved = Storage.getJSON(Storage.keys.REMEMBERED, []);
      this.remembered = new Set(saved);
    },
    
    saveRemembered() {
      Storage.setJSON(Storage.keys.REMEMBERED, [...this.remembered]);
    },
    
    // Category
    loadCategory(categoryId, restoreIndex = false) {
      if (categoryId === 'all') {
        this.currentCategory = { id: 'all', name: 'Tất cả từ vựng' };
        this.words = this.dictionary.categories.flatMap(c => [...c.words]);
      } else {
        const cat = this.dictionary.categories.find(c => c.id === categoryId);
        if (cat) {
          this.currentCategory = cat;
          this.words = [...cat.words];
        }
      }
      
      if (this.skipRemembered) {
        this.words = this.words.filter(w => !this.remembered.has(w.japanese));
      }
      
      // Only restore saved index on initial load, otherwise start from 0
      if (restoreIndex) {
        this.currentIndex = Math.min(Storage.getInt(Storage.keys.INDEX, 0), Math.max(0, this.words.length - 1));
      } else {
        this.currentIndex = 0;
      }
      this.isFlipped = false;
      this.spiralStep = 0;
      this.autoPlayVersion++; // Invalidate any pending auto-play schedules
      Storage.set(Storage.keys.CATEGORY, categoryId);
      Storage.set(Storage.keys.INDEX, '0');
      
      this.updateMediaSessionMetadata();
      this.speak();
      
      // Restart auto-play scheduling if active
      if (this.autoPlaying) {
        this.scheduleNext();
      }
    },
    
    // Navigation
    flip() {
      this.isFlipped = !this.isFlipped;
      this.speak();
    },
    
    prev() {
      if (this.spiralStep > 0) {
        this.spiralStep--;
        this.currentIndex = this.spiralIndexAt(this.spiralStep, this.spiralMode ? 3 : 0, this.words.length);
        this.isFlipped = false;
        this.saveIndex();
        this.updateMediaSessionMetadata();
        this.speak();
      }
    },
    
    next() {
      if (this.pendingRemoval) {
        this.pendingRemoval = false;
        this.removeCurrentWord();
        return;
      }
      
      this.spiralStep++;
      this.currentIndex = this.spiralIndexAt(this.spiralStep, this.spiralMode ? 3 : 0, this.words.length);
      
      this.isFlipped = false;
      this.saveIndex();
      this.updateMediaSessionMetadata();
      this.speak();
    },
    
    /**
     * Maps a step number to card index using spiral pattern
     * @param {number} step - Current step in the sequence
     * @param {number} windowSize - Review window size (0 = linear, 1 = repeat twice, 3 = current behavior)
     * @param {number} n - Total number of cards
     * @returns {number} Card index
     * 
     * Pattern for windowSize=3: 0→1→2→[0→1→2]→3→[1→2→3]→4→[2→3→4]→5→...
     */
    spiralIndexAt(step, windowSize, n) {
      if (n === 0) return 0;
      
      // Step 1: Map step to spiral index (as if infinite cards)
      let spiralIndex;
      
      if (windowSize === 0) {
        spiralIndex = step;
      } else if (step < windowSize) {
        // Initial forward phase
        spiralIndex = step;
      } else {
        const adjusted = step - windowSize;
        const cycleLen = windowSize + 1;
        const cycleNum = Math.floor(adjusted / cycleLen);
        const posInCycle = adjusted % cycleLen;
        
        if (posInCycle < windowSize) {
          // Reviewing: window starts at cycleNum
          spiralIndex = cycleNum + posInCycle;
        } else {
          // New card
          spiralIndex = windowSize + cycleNum;
        }
      }
      
      // Step 2: Normalize to actual card count
      return spiralIndex % n;
    },
    
    shuffle() {
      for (let i = this.words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
      }
      this.currentIndex = 0;
      this.isFlipped = false;
      this.shuffleConfirm = true;
      setTimeout(() => this.shuffleConfirm = false, 1000);
      this.speak();
    },
    
    saveIndex() {
      Storage.set(Storage.keys.INDEX, this.currentIndex.toString());
    },
    
    // Mode
    setMode(mode) {
      this.mode = mode;
      this.isFlipped = false;
      Storage.set(Storage.keys.MODE, mode);
    },
    
    // Settings
    toggleReadBoth() {
      this.readBoth = !this.readBoth;
      Storage.set(Storage.keys.READ_BOTH, this.readBoth);
    },
    
    toggleSpiralMode() {
      this.spiralMode = !this.spiralMode;
      this.spiralState = 'forward';
      Storage.set(Storage.keys.SPIRAL_MODE, this.spiralMode);
    },
    
    toggleSkipRemembered() {
      this.skipRemembered = !this.skipRemembered;
      Storage.set(Storage.keys.SKIP_REMEMBERED, this.skipRemembered);
      this.loadCategory(this.currentCategory.id);
    },
    
    // Remembered
    toggleRemembered() {
      if (!this.currentWord) return;
      const jp = this.currentWord.japanese;
      
      if (this.remembered.has(jp)) {
        this.remembered.delete(jp);
      } else {
        this.remembered.add(jp);
        if (this.skipRemembered) {
          this.pendingRemoval = true;
        }
      }
      this.saveRemembered();
    },
    
    unmarkRemembered(japanese) {
      this.remembered.delete(japanese);
      this.saveRemembered();
      if (this.skipRemembered) {
        this.loadCategory(this.currentCategory.id);
      }
    },
    
    resetRemembered() {
      if (confirm('Xóa tất cả đánh dấu đã thuộc?')) {
        this.remembered.clear();
        this.saveRemembered();
        if (this.skipRemembered) {
          this.loadCategory(this.currentCategory.id);
        }
      }
    },
    
    removeCurrentWord() {
      const idx = this.currentIndex;
      this.words = this.words.filter((_, i) => i !== idx);
      
      if (this.words.length === 0) {
        return;
      }
      
      this.currentIndex = Math.min(idx, this.words.length - 1);
      this.updateMediaSessionMetadata();
      this.speak();
    },
    
    // Audio
    speak() {
      if (!this.currentWord) return;
      this.speaking = true;
      
      const done = () => { this.speaking = false; };
      
      if (this.readBoth) {
        Audio.play(this.currentWord.japanese, () => {
          setTimeout(() => {
            Audio.play(this.currentWord.meaning, done);
          }, 500);
        });
      } else {
        Audio.play(this.currentWord.japanese, done);
      }
    },
    
    // Auto-play
    async toggleAutoPlay() {
      this.autoPlaying = !this.autoPlaying;
      
      if (this.autoPlaying) {
        await this.requestWakeLock();
        this.scheduleNext();
      } else {
        this.releaseWakeLock();
      }
    },
    
    async requestWakeLock() {
      if (!('wakeLock' in navigator)) return;
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        console.warn('Wake lock failed:', e);
      }
    },
    
    releaseWakeLock() {
      this.wakeLock?.release();
      this.wakeLock = null;
    },
    
    scheduleNext() {
      if (!this.autoPlaying) return;
      
      const version = this.autoPlayVersion;
      
      const check = () => {
        // Stop if auto-play was disabled or category changed
        if (!this.autoPlaying || version !== this.autoPlayVersion) return;
        
        if (Audio.isPlaying()) {
          setTimeout(check, 500);
        } else {
          setTimeout(() => {
            if (this.autoPlaying && version === this.autoPlayVersion) {
              this.next();
              this.scheduleNext();
            }
          }, 3000);
        }
      };
      check();
    },
    
    // Media Session
    setupMediaSession() {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('play', () => this.speak());
      navigator.mediaSession.setActionHandler('pause', () => Audio.pause());
    },
    
    updateMediaSessionMetadata() {
      if (!this.currentWord) return;
      Audio.updateMediaSession(
        this.currentWord,
        `${this.progress.current}/${this.progress.total}`,
        this.currentCategory.name
      );
    },
    
    // Keyboard
    setupKeyboard() {
      document.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowLeft': this.prev(); break;
          case 'ArrowRight': this.next(); break;
          case ' ':
          case 'ArrowUp':
          case 'ArrowDown':
            e.preventDefault();
            this.flip();
            break;
          case 's':
          case 'S': this.shuffle(); break;
          case 'p':
          case 'P':
          case 'Enter': this.speak(); break;
        }
      });
    }
  });
});
