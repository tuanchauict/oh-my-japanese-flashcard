// Audio module - handles audio playback and Media Session API

class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.audioMapping = {};
  }

  async loadMapping() {
    try {
      const response = await fetch('audio_mapping.json');
      this.audioMapping = await response.json();
      console.log('Loaded audio mapping with', Object.keys(this.audioMapping).length, 'entries');
    } catch (error) {
      console.warn('Audio mapping not found, speech will be disabled:', error);
      this.audioMapping = {};
    }
  }

  play(text, onEnded = null) {
    const audioPath = this.audioMapping[text];
    if (!audioPath) {
      console.warn('No audio file for:', text);
      if (onEnded) onEnded();
      return;
    }

    // Reuse existing Audio element for mobile compatibility
    if (!this.currentAudio) {
      this.currentAudio = new Audio();
    } else {
      this.currentAudio.pause();
    }

    this.currentAudio.src = audioPath;

    this.currentAudio.onended = () => {
      if (onEnded) onEnded();
    };

    this.currentAudio.onerror = () => {
      console.error('Error playing audio for:', text);
      if (onEnded) onEnded();
    };

    this.currentAudio.play().catch(err => {
      console.error('Failed to play audio:', err);
      if (onEnded) onEnded();
    });

    return this.currentAudio;
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused;
  }

  updateMediaSession(word, cardNumber, categoryName) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${word.japanese} (${word.romaji})`,
      artist: word.vietnamese,
      album: `${categoryName} (${cardNumber})`,
      artwork: [
        { src: 'assets/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
      ]
    });
  }

  setupMediaSessionHandlers(handlers) {
    if (!('mediaSession' in navigator)) return;

    if (handlers.onPrevious) {
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
    }
    if (handlers.onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
    }
    if (handlers.onPlay) {
      navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    }
    if (handlers.onPause) {
      navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    }
  }
}

export default AudioManager;
