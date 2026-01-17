// Remembered words mixin for flashcard store
// Handles marking and managing remembered words

export const rememberedMixin = {
  // State (initialized in main store)
  // remembered: Set, rememberedListOpen: boolean, pendingRemoval: boolean
  
  saveRemembered() {
    const { Storage } = window.FlashcardModules;
    Storage.setJSON(Storage.keys.REMEMBERED, [...this.remembered]);
  },
  
  toggleRemembered() {
    if (!this.currentWord) return;
    const jp = this.currentWord.japanese;
    
    if (this.remembered.has(jp)) {
      this.remembered.delete(jp);
    } else {
      this.remembered.add(jp);
      if (this.skipRemembered) {
        this.pendingRemoval = true;
      }
    }
    this.saveRemembered();
  },
  
  unmarkRemembered(japanese) {
    this.remembered.delete(japanese);
    this.saveRemembered();
    if (this.skipRemembered) {
      this.loadCategory(this.currentCategory.id);
    }
  },
  
  resetRemembered() {
    if (confirm('Xóa tất cả đánh dấu đã thuộc?')) {
      this.remembered.clear();
      this.saveRemembered();
      if (this.skipRemembered) {
        this.loadCategory(this.currentCategory.id);
      }
    }
  }
};
