// AutoPlay module - handles auto-play and wake lock

class AutoPlayManager {
  constructor(options = {}) {
    this.isActive = false;
    this.delay = options.delay || 3000;
    this.wakeLock = null;
    this.onNext = options.onNext || (() => {});
    this.isAudioPlaying = options.isAudioPlaying || (() => false);
  }

  async toggle(button) {
    this.isActive = !this.isActive;
    button.classList.toggle('active', this.isActive);
    button.textContent = this.isActive ? '❙❙' : '▶';

    if (this.isActive) {
      await this.requestWakeLock();
      this.scheduleNext();
    } else {
      this.releaseWakeLock();
    }

    return this.isActive;
  }

  async requestWakeLock() {
    if (!('wakeLock' in navigator)) return;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock acquired');

      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock released');
      });
    } catch (err) {
      console.warn('Wake lock request failed:', err);
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  scheduleNext() {
    if (!this.isActive) return;

    const checkAndNext = () => {
      if (!this.isActive) return;

      if (this.isAudioPlaying()) {
        setTimeout(checkAndNext, 500);
      } else {
        setTimeout(() => {
          if (this.isActive) {
            this.onNext();
            this.scheduleNext();
          }
        }, this.delay);
      }
    };

    checkAndNext();
  }

  stop() {
    this.isActive = false;
    this.releaseWakeLock();
  }
}

export default AutoPlayManager;
