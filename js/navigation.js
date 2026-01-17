// Navigation mixin for flashcard store
// Handles card navigation, spiral mode, and shuffle

export const navigationMixin = {
  // Navigation state
  spiralStep: 0,
  
  // Navigation methods
  flip() {
    this.isFlipped = !this.isFlipped;
    // Don't restart audio if already playing or in auto-play mode
    if (!this.autoPlaying && !this.speaking) {
      this.speak();
    }
  },
  
  prev() {
    if (this.spiralStep > 0) {
      this.spiralStep--;
      this.currentIndex = this.spiralIndexAt(this.spiralStep, this.spiralMode ? 3 : 0, this.words.length);
      this.isFlipped = false;
      this.saveIndex();
      this.updateMediaSessionMetadata();
      if (!this.autoPlaying) {
        this.speak();
      }
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
    if (!this.autoPlaying) {
      this.speak();
    }
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
    const { Storage } = window.FlashcardModules;
    Storage.set(`${this.dictionaryName}-index`, this.currentIndex.toString());
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
  }
};
