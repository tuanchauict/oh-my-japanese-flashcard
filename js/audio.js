// Audio manager for playing flashcard audio

export const Audio = {
  current: null,
  mapping: {},
  
  async loadMapping(dictionaryName) {
    try {
      const path = `assets/dictionaries/${dictionaryName}/audio-mapping.json`;
      const res = await fetch(path);
      this.mapping = await res.json();
    } catch (e) {
      console.warn('Audio mapping not found:', e);
    }
  },
  
  // Play a single audio, returns Promise
  playOne(text, slow = false) {
    return new Promise((resolve) => {
      // For slow audio, use the special key format
      const key = slow ? text + ':slow' : text;
      const path = this.mapping[key];
      if (!path) { resolve(); return; }
      
      if (!this.current) this.current = new window.Audio();
      else this.current.pause();
      
      this.current.src = path;
      this.current.onended = resolve;
      this.current.onerror = resolve;
      this.current.play().catch(resolve);
    });
  },
  
  // Play a sequence of audio items
  // items: array of { text: string, delay?: number, slow?: boolean } or just string
  async playSequence(items) {
    for (const item of items) {
      const text = typeof item === 'string' ? item : item.text;
      const delay = typeof item === 'string' ? 0 : (item.delay || 0);
      const slow = typeof item === 'string' ? false : (item.slow || false);
      
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
      
      if (text) {
        await this.playOne(text, slow);
      }
    }
  },
  
  pause() {
    this.current?.pause();
  },
  
  isPlaying() {
    return this.current && !this.current.paused;
  },
  
  updateMediaSession(word, cardNum, category) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${word.japanese} (${word.romaji})`,
      artist: word.meaning,
      album: `${category} (${cardNum})`,
      artwork: [{ src: 'assets/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }]
    });
  }
};
