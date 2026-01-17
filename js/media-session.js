// Media session mixin for flashcard store
// Handles browser media session integration

export const mediaSessionMixin = {
  setupMediaSession() {
    const { Audio } = window.FlashcardModules;
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('play', () => this.speak());
    navigator.mediaSession.setActionHandler('pause', () => Audio.pause());
  },
  
  updateMediaSessionMetadata() {
    const { Audio } = window.FlashcardModules;
    if (!this.currentWord) return;
    Audio.updateMediaSession(
      this.currentWord,
      `${this.progress.current}/${this.progress.total}`,
      this.currentCategory.name
    );
  }
};
