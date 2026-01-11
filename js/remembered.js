// Remembered module - manages remembered words

import Storage from './storage.js';

class RememberedManager {
  constructor() {
    this.words = new Set();
    this.skipEnabled = false;
  }

  load() {
    const saved = Storage.getJSON(Storage.keys.REMEMBERED, []);
    this.words = new Set(saved);
    this.skipEnabled = Storage.getBoolean(Storage.keys.SKIP_REMEMBERED);
  }

  save() {
    Storage.setJSON(Storage.keys.REMEMBERED, [...this.words]);
  }

  isRemembered(japaneseText) {
    return this.words.has(japaneseText);
  }

  toggle(japaneseText) {
    if (this.words.has(japaneseText)) {
      this.words.delete(japaneseText);
    } else {
      this.words.add(japaneseText);
    }
    this.save();
    return this.words.has(japaneseText);
  }

  reset() {
    this.words.clear();
    this.save();
  }

  setSkipEnabled(enabled) {
    this.skipEnabled = enabled;
    Storage.set(Storage.keys.SKIP_REMEMBERED, enabled);
  }

  filterWords(words) {
    if (!this.skipEnabled) return words;
    return words.filter(w => !this.words.has(w.japanese));
  }

  getCountIn(words) {
    return words.filter(w => this.words.has(w.japanese)).length;
  }
}

export default RememberedManager;
