// Dictionary mixin for flashcard store
// Handles dictionary and category loading

export const dictionaryMixin = {
  // State (initialized in main store)
  // dictionary: null, dictionaries: [], dictionaryName: '', showDictMenu: false
  
  async loadDictionary() {
    try {
      const path = `assets/dictionaries/${this.dictionaryName}/dictionary.json`;
      const res = await fetch(path);
      this.dictionary = await res.json();
    } catch (e) {
      console.error('Failed to load dictionary:', e);
    }
  },
  
  async loadDictionariesList() {
    try {
      const res = await fetch('assets/dictionaries/dictionaries.json');
      this.dictionaries = await res.json();
    } catch (e) {
      console.warn('Failed to load dictionaries list:', e);
      this.dictionaries = [];
    }
  },
  
  toggleDictMenu() {
    this.showDictMenu = !this.showDictMenu;
  },
  
  selectDictionary(dictId) {
    this.showDictMenu = false;
    if (dictId === this.dictionaryName) return;
    
    // Navigate to the new dictionary
    const url = new URL(window.location);
    if (dictId === 'dictionary') {
      url.searchParams.delete('dictionary');
    } else {
      url.searchParams.set('dictionary', dictId);
    }
    window.location.href = url.toString();
  },
  
  loadCategory(categoryId, restoreIndex = false) {
    const { Storage } = window.FlashcardModules;
    
    // Validate category exists, fallback to 'all' if not
    if (categoryId !== 'all') {
      const cat = this.dictionary.categories.find(c => c.id === categoryId);
      if (!cat) {
        categoryId = 'all'; // Category not found, fallback
      }
    }
    
    if (categoryId === 'all') {
      this.currentCategory = { id: 'all', name: 'Tất cả từ vựng' };
      this.words = this.dictionary.categories.flatMap(c => [...c.words]);
    } else {
      const cat = this.dictionary.categories.find(c => c.id === categoryId);
      this.currentCategory = cat;
      this.words = [...cat.words];
    }
    
    if (this.skipRemembered) {
      this.words = this.words.filter(w => !this.remembered.has(w.japanese));
    }
    
    // Only restore saved index on initial load, otherwise start from 0
    if (restoreIndex) {
      const savedIndex = Storage.getInt(`${this.dictionaryName}-index`, 0);
      this.currentIndex = Math.min(savedIndex, Math.max(0, this.words.length - 1));
    } else {
      this.currentIndex = 0;
    }
    this.isFlipped = false;
    this.spiralStep = 0;
    this.autoPlayVersion++; // Invalidate any pending auto-play schedules
    
    // Save with dictionary-specific keys
    Storage.set(`${this.dictionaryName}-category`, categoryId);
    Storage.set(`${this.dictionaryName}-index`, '0');
    
    this.updateMediaSessionMetadata();
    
    // Start auto-play scheduling if active, otherwise just speak once
    if (this.autoPlaying) {
      this.scheduleNext();
    } else {
      this.speak();
    }
  }
};
