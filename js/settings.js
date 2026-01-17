// Settings mixin for flashcard store
// Handles user preferences and settings toggles

export const settingsMixin = {
  // Settings state (initialized in main store)
  // readBoth, readExample, readSlow, spiralMode, skipRemembered
  
  setMode(mode) {
    const { Storage } = window.FlashcardModules;
    this.mode = mode;
    this.isFlipped = false;
    Storage.set(Storage.keys.MODE, mode);
  },
  
  toggleReadBoth() {
    const { Storage } = window.FlashcardModules;
    this.readBoth = !this.readBoth;
    Storage.set(Storage.keys.READ_BOTH, this.readBoth);
  },
  
  toggleReadExample() {
    const { Storage } = window.FlashcardModules;
    this.readExample = !this.readExample;
    Storage.set(Storage.keys.READ_EXAMPLE, this.readExample);
  },
  
  toggleReadSlow() {
    const { Storage } = window.FlashcardModules;
    this.readSlow = !this.readSlow;
    Storage.set(Storage.keys.READ_SLOW, this.readSlow);
  },
  
  toggleSpiralMode() {
    const { Storage } = window.FlashcardModules;
    this.spiralMode = !this.spiralMode;
    this.spiralState = 'forward';
    Storage.set(Storage.keys.SPIRAL_MODE, this.spiralMode);
  },
  
  toggleSkipRemembered() {
    const { Storage } = window.FlashcardModules;
    this.skipRemembered = !this.skipRemembered;
    Storage.set(Storage.keys.SKIP_REMEMBERED, this.skipRemembered);
    this.loadCategory(this.currentCategory.id);
  },
  
  toggleChorusSound() {
    const { Storage, SoundEffects } = window.FlashcardModules;
    this.chorusSound = !this.chorusSound;
    Storage.set(Storage.keys.CHORUS_SOUND, this.chorusSound);
    // Start or stop the rhythm
    if (this.chorusSound) {
      SoundEffects.startTingRhythm();
    } else {
      SoundEffects.stopTingRhythm();
    }
  },
  
  loadPreferences() {
    const { Storage, SoundEffects } = window.FlashcardModules;
    // Use first mode from metadata as default
    const defaultMode = this.dictionary?.metadata?.modes?.[0]?.id || 'jp-vn';
    this.mode = Storage.get(Storage.keys.MODE, defaultMode);
    this.readBoth = Storage.getBool(Storage.keys.READ_BOTH);
    this.readExample = Storage.get(Storage.keys.READ_EXAMPLE, 'true') === 'true';
    this.readSlow = Storage.getBool(Storage.keys.READ_SLOW);
    this.spiralMode = Storage.getBool(Storage.keys.SPIRAL_MODE);
    this.skipRemembered = Storage.getBool(Storage.keys.SKIP_REMEMBERED);
    this.chorusSound = Storage.getBool(Storage.keys.CHORUS_SOUND);
    const saved = Storage.getJSON(Storage.keys.REMEMBERED, []);
    this.remembered = new Set(saved);
    
    // Start rhythm if chorus sound was enabled
    if (this.chorusSound) {
      SoundEffects.startTingRhythm();
    }
  }
};
