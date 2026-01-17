// Sound effects module for flashcard app
// Provides rhythmic sounds to make learning more engaging
// Pattern inspired by Duolingo/game-style learning apps

export const SoundEffects = {
  audioContext: null,
  tingInterval: null,
  tingCount: 0,
  
  // Major chord pattern (C-E-G) - energetic and upbeat like learning apps
  // Pattern: C(root) - G(5th) - E(3rd) - G(5th) - repeat
  notes: [
    1047,  // C6 - root (strong beat)
    1568,  // G6 - fifth (energetic)
    1319,  // E6 - third (melodic)
    1568   // G6 - fifth
  ],
  
  // Initialize audio context (must be called after user interaction)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },
  
  // Play a single ting at specified frequency with optional emphasis
  playTing(freq, emphasis = false) {
    const ctx = this.init();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Slightly brighter sound with sine for clarity
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, now);
    
    // Emphasized beat is louder and slightly longer
    const volume = emphasis ? 0.15 : 0.08;
    const decay = emphasis ? 0.15 : 0.08;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + decay);
  },
  
  // Start rhythmic ting sounds - C-G-E-G pattern
  startTingRhythm() {
    this.stopTingRhythm();
    this.tingCount = 0;
    
    // Start with emphasized root note
    this.playTing(this.notes[0], true);
    
    this.tingInterval = setInterval(() => {
      this.tingCount++;
      const noteIndex = this.tingCount % 4;
      // Emphasize the root note (beat 1)
      this.playTing(this.notes[noteIndex], noteIndex === 0);
    }, 400); // Faster tempo for more energy
  },
  
  // Stop the rhythmic ting sounds
  stopTingRhythm() {
    if (this.tingInterval) {
      clearInterval(this.tingInterval);
      this.tingInterval = null;
    }
    this.tingCount = 0;
  },
  
  // Check if rhythm is playing
  isPlaying() {
    return this.tingInterval !== null;
  }
};
