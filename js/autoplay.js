// Auto-play mixin for flashcard store
// Handles automatic card progression

export const autoplayMixin = {
  // State (initialized in main store)
  // autoPlaying: boolean, autoPlayVersion: number, wakeLock: null
  
  async toggleAutoPlay() {
    this.autoPlaying = !this.autoPlaying;
    
    if (this.autoPlaying) {
      await this.requestWakeLock();
      this.scheduleNext();
    } else {
      this.releaseWakeLock();
    }
  },
  
  async requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) {
      console.warn('Wake lock failed:', e);
    }
  },
  
  releaseWakeLock() {
    this.wakeLock?.release();
    this.wakeLock = null;
  },
  
  scheduleNext() {
    if (!this.autoPlaying) return;
    
    const version = this.autoPlayVersion;
    
    // Play current word audio sequence, then move to next
    this.speak().then(() => {
      // Stop if auto-play was disabled or category changed during playback
      if (!this.autoPlaying || version !== this.autoPlayVersion) return;
      
      // Small delay before next card
      setTimeout(() => {
        if (this.autoPlaying && version === this.autoPlayVersion) {
          this.next();
          this.scheduleNext();
        }
      }, 1000);
    });
  }
};
