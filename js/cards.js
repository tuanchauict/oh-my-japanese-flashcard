// Cards module - manages flashcard display and navigation

class CardManager {
  constructor(elements) {
    this.elements = elements;
    this.words = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.mode = 'jp-vn';
    this.spiralMode = false;
    this.spiralState = 'forward'; // 'forward' or 'review'
    this.highestReached = 0; // Track furthest card reached
  }

  setWords(words) {
    this.words = words;
    this.currentIndex = Math.min(this.currentIndex, Math.max(0, words.length - 1));
    this.highestReached = this.currentIndex;
    this.spiralState = 'forward';
  }

  getCurrentWord() {
    return this.words[this.currentIndex] || null;
  }

  setIndex(index) {
    this.currentIndex = Math.min(index, Math.max(0, this.words.length - 1));
    this.highestReached = Math.max(this.highestReached, this.currentIndex);
  }

  setSpiralMode(enabled) {
    this.spiralMode = enabled;
    this.spiralState = 'forward';
  }

  setMode(mode) {
    this.mode = mode;
    this.elements.modeJpVn.classList.toggle('active', mode === 'jp-vn');
    this.elements.modeVnJp.classList.toggle('active', mode === 'vn-jp');
    this.resetFlip();
  }

  updateDisplay() {
    if (this.words.length === 0) return;

    const word = this.getCurrentWord();

    if (this.mode === 'jp-vn') {
      this.elements.frontMain.textContent = word.japanese;
      this.elements.frontSub.textContent = word.romaji;
      this.elements.backMain.textContent = word.vietnamese;
    } else {
      this.elements.frontMain.textContent = word.vietnamese;
      this.elements.frontSub.textContent = '';
      this.elements.backMain.innerHTML = `
        <span style="font-size: 2rem;">${word.japanese}</span>
        <br><br>
        <span style="font-size: 1.2rem; opacity: 0.9;">${word.romaji}</span>
      `;
    }

    // Add animation
    this.elements.flashcard.classList.add('animate');
    setTimeout(() => {
      this.elements.flashcard.classList.remove('animate');
    }, 300);

    return word;
  }

  showEmpty() {
    this.elements.frontMain.textContent = '🎉';
    this.elements.frontSub.textContent = 'Đã thuộc hết!';
    this.elements.backMain.textContent = '';
  }

  flip() {
    this.isFlipped = !this.isFlipped;
    this.elements.flashcard.classList.toggle('flipped', this.isFlipped);
    return this.isFlipped;
  }

  resetFlip() {
    this.isFlipped = false;
    this.elements.flashcard.classList.remove('flipped');
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.spiralState = 'forward'; // Reset spiral when manually going back
      this.resetFlip();
      return true;
    }
    return false;
  }

  next() {
    if (this.spiralMode) {
      return this.nextSpiral();
    }
    return this.nextLinear();
  }

  nextLinear() {
    if (this.currentIndex < this.words.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop
    }
    this.resetFlip();
    return true;
  }

  nextSpiral() {
    // Spiral pattern with window of 3:
    // 1 → 2 → 3 → [1 → 2 → 3] → 4 → [2 → 3 → 4] → 5 → [3 → 4 → 5] → 6 → ...
    // After initial 3 cards, pattern is: new card → review window of 3
    const windowSize = 3;
    
    // Calculate window start position
    const windowStart = Math.max(0, this.highestReached - windowSize + 1);
    
    if (this.spiralState === 'forward') {
      // Initial phase: go through first windowSize cards
      if (this.highestReached < windowSize - 1) {
        this.currentIndex++;
        this.highestReached = this.currentIndex;
      } else {
        // After initial cards, switch to review
        this.spiralState = 'review';
        this.currentIndex = windowStart;
      }
    } else {
      // Review phase: go through window, then add new card
      if (this.currentIndex < this.highestReached) {
        // Continue through review window
        this.currentIndex++;
      } else {
        // Finished window, add new card
        if (this.highestReached < this.words.length - 1) {
          this.highestReached++;
          this.currentIndex = this.highestReached;
          // Jump back to start of new window
          const newWindowStart = Math.max(0, this.highestReached - windowSize + 1);
          this.currentIndex = newWindowStart;
        } else {
          // Reached end, loop back
          this.currentIndex = 0;
          this.highestReached = 0;
          this.spiralState = 'forward';
        }
      }
    }
    this.resetFlip();
    return true;
  }

  shuffle() {
    // Fisher-Yates shuffle
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
    this.currentIndex = 0;
    this.resetFlip();
  }

  getProgress() {
    return {
      current: this.currentIndex + 1,
      total: this.words.length,
      percentage: this.words.length > 0 ? ((this.currentIndex + 1) / this.words.length) * 100 : 0
    };
  }

  isEmpty() {
    return this.words.length === 0;
  }
}

export default CardManager;
