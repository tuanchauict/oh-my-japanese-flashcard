// Alpine.js store for flashcard app
// Main entry point that composes all modules

import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { navigationMixin } from './navigation.js';
import { settingsMixin } from './settings.js';
import { rememberedMixin } from './remembered.js';
import { audioPlaybackMixin } from './audio-playback.js';
import { autoplayMixin } from './autoplay.js';
import { mediaSessionMixin } from './media-session.js';
import { keyboardMixin } from './keyboard.js';
import { dictionaryMixin } from './dictionary.js';

// Expose modules globally for mixins to access
window.FlashcardModules = { Storage, Audio };

// Main flashcard store
document.addEventListener('alpine:init', () => {
  Alpine.store('app', {
    // Core state
    dictionary: null,
    words: [],
    currentIndex: 0,
    isFlipped: false,
    mode: 'jp-vn',
    currentCategory: { id: 'all', name: 'Tất cả từ vựng' },
    dictionaryName: '',
    
    // Settings state
    readBoth: false,
    readExample: true,
    readSlow: false,
    spiralMode: false,
    skipRemembered: false,
    remembered: new Set(),
    
    // UI state
    autoPlaying: false,
    autoPlayVersion: 0,
    wakeLock: null,
    shuffleConfirm: false,
    rememberedListOpen: false,
    pendingRemoval: false,
    speaking: false,
    showDictMenu: false,
    dictionaries: [],
    
    // Spiral state
    spiralStep: 0,
    
    // Init flags
    _initializing: false,
    _initialized: false,
    
    // Computed properties
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
      if (!this.dictionary?.categories) return [];
      if (this.currentCategory.id === 'all') {
        return this.dictionary.categories.flatMap(c => c.words || []);
      }
      return this.dictionary.categories.find(c => c.id === this.currentCategory.id)?.words || [];
    },
    
    get rememberedInCategory() {
      return this.allCategoryWords.filter(w => w?.japanese && this.remembered.has(w.japanese));
    },
    
    get rememberedCount() {
      return this.rememberedInCategory.length;
    },
    
    get frontMain() {
      if (!this.currentWord) return '';
      return this.mode.startsWith('jp') ? this.currentWord.japanese : this.currentWord.meaning;
    },
    
    get frontSub() {
      if (!this.currentWord) return '';
      return this.mode.startsWith('jp') ? this.currentWord.romaji : '';
    },
    
    get backMain() {
      if (!this.currentWord) return '';
      if (this.mode.startsWith('jp')) return this.currentWord.meaning;
      return `<span style="font-size:2rem">${this.currentWord.japanese}</span><br><br><span style="font-size:1.2rem;opacity:0.9">${this.currentWord.romaji}</span>`;
    },
    
    get hasExample() {
      return this.currentWord?.example;
    },
    
    get exampleText() {
      if (!this.currentWord?.example) return '';
      return this.currentWord.example;
    },
    
    get exampleMeaning() {
      if (!this.currentWord?.exampleMeaning) return '';
      return this.currentWord.exampleMeaning;
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
    
    // Mix in all functionality
    ...navigationMixin,
    ...settingsMixin,
    ...rememberedMixin,
    ...audioPlaybackMixin,
    ...autoplayMixin,
    ...mediaSessionMixin,
    ...keyboardMixin,
    ...dictionaryMixin,

    // Init
    async init() {
      // Prevent concurrent or duplicate init
      if (this._initializing || this._initialized) {
        console.log('Init already in progress or completed, skipping');
        return;
      }
      this._initializing = true;
      
      // Load available dictionaries list
      await this.loadDictionariesList();
      
      // URL param is dictionary name (e.g., 'n5-dictionary'), default to 'dictionary'
      const urlDict = new URLSearchParams(window.location.search).get('dictionary');
      this.dictionaryName = urlDict || 'dictionary';
      
      console.log('Init with dictionary:', this.dictionaryName);
      
      await this.loadDictionary();
      console.log('Dictionary loaded:', this.dictionary?.metadata?.title, 'Categories:', this.dictionary?.categories?.length);
      
      if (!this.dictionary) {
        console.error('Failed to load dictionary');
        this._initializing = false;
        return;
      }
      
      // Load audio mapping
      await Audio.loadMapping(this.dictionaryName);
      
      this.loadPreferences();
      
      // Get saved category for this specific dictionary
      const savedCategory = Storage.get(`${this.dictionaryName}-category`, 'all');
      this.loadCategory(savedCategory, true);
      
      this.setupMediaSession();
      this.setupKeyboard();
      
      this._initializing = false;
      this._initialized = true;
    }
  });
});
