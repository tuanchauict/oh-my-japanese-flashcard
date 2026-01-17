// Keyboard mixin for flashcard store
// Handles keyboard shortcuts

export const keyboardMixin = {
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
        case ' ':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          this.flip();
          break;
        case 's':
        case 'S': this.shuffle(); break;
        case 'p':
        case 'P':
        case 'Enter': this.speak(); break;
      }
    });
  }
};
