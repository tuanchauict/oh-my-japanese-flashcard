// Storage module - handles all localStorage operations

const Storage = {
  keys: {
    CATEGORY: 'flashcard-category',
    INDEX: 'flashcard-index',
    MODE: 'flashcard-mode',
    READ_BOTH: 'flashcard-read-both',
    SKIP_REMEMBERED: 'flashcard-skip-remembered',
    REMEMBERED: 'flashcard-remembered'
  },

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      console.warn(`Failed to get ${key}:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Failed to set ${key}:`, e);
    }
  },

  getJSON(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse ${key}:`, e);
      return defaultValue;
    }
  },

  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to stringify ${key}:`, e);
    }
  },

  getBoolean(key, defaultValue = false) {
    return this.get(key) === 'true' || defaultValue;
  },

  getInt(key, defaultValue = 0) {
    const value = parseInt(this.get(key, defaultValue), 10);
    return isNaN(value) ? defaultValue : value;
  }
};

export default Storage;
