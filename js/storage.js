// Storage utilities for localStorage operations

export const StorageKeys = {
  CATEGORY: 'flashcard-category',
  INDEX: 'flashcard-index',
  MODE: 'flashcard-mode',
  READ_BOTH: 'flashcard-read-both',
  READ_EXAMPLE: 'flashcard-read-example',
  READ_SLOW: 'flashcard-read-slow',
  SKIP_REMEMBERED: 'flashcard-skip-remembered',
  REMEMBERED: 'flashcard-remembered',
  SPIRAL_MODE: 'flashcard-spiral-mode'
};

export const Storage = {
  keys: StorageKeys,
  
  get(key, def = null) {
    return localStorage.getItem(key) ?? def;
  },
  
  set(key, val) {
    localStorage.setItem(key, val);
  },
  
  getJSON(key, def = null) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? def;
    } catch {
      return def;
    }
  },
  
  setJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  
  getBool(key) {
    return localStorage.getItem(key) === 'true';
  },
  
  getInt(key, def = 0) {
    return parseInt(localStorage.getItem(key), 10) || def;
  }
};
