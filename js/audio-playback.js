// Audio playback mixin for flashcard store
// Handles building and playing audio sequences

export const audioPlaybackMixin = {
  // State (initialized in main store)
  // speaking: boolean
  
  buildSpeakSequence() {
    if (!this.currentWord) return [];
    
    const word = this.currentWord;
    const sequence = [];
    
    // Play slow first if enabled
    if (this.readSlow) {
      sequence.push({ text: word.japanese, slow: true });
      sequence.push({ text: word.japanese, delay: 300 });
    } else {
      sequence.push({ text: word.japanese });
    }
    
    if (this.readBoth) {
      sequence.push({ text: word.meaning, delay: 300 });
      
      if (this.readExample && word.example) {
        // Play slow example first if enabled
        if (this.readSlow) {
          sequence.push({ text: word.example, delay: 300, slow: true });
          sequence.push({ text: word.example, delay: 300 });
        } else {
          sequence.push({ text: word.example, delay: 300 });
        }
        if (word.exampleMeaning) {
          sequence.push({ text: word.exampleMeaning });
        }
      }
    }
    
    return sequence;
  },
  
  buildExampleSequence() {
    if (!this.currentWord?.example) return [];
    
    const word = this.currentWord;
    const sequence = [];
    
    // Play slow first if enabled
    if (this.readSlow) {
      sequence.push({ text: word.example, slow: true });
      sequence.push({ text: word.example, delay: 300 });
    } else {
      sequence.push({ text: word.example });
    }
    
    if (word.exampleMeaning) {
      sequence.push({ text: word.exampleMeaning });
    }
    
    return sequence;
  },
  
  async speak() {
    const { Audio } = window.FlashcardModules;
    const sequence = this.buildSpeakSequence();
    if (sequence.length === 0) return;
    
    this.speaking = true;
    try {
      await Audio.playSequence(sequence);
    } finally {
      this.speaking = false;
    }
  },
  
  async speakExample() {
    const { Audio } = window.FlashcardModules;
    const sequence = this.buildExampleSequence();
    if (sequence.length === 0) return;
    
    this.speaking = true;
    try {
      await Audio.playSequence(sequence);
    } finally {
      this.speaking = false;
    }
  }
};
