<p align="center">
  <img src="assets/favicon.svg" width="120" height="120" alt="日本語">
</p>

# 🎴 Oh! My Japanese Flashcard

A Japanese vocabulary flashcard app with audio support and multiple dictionaries.

## 🌐 Demo

[https://japanese.iamtuna.org/](https://japanese.iamtuna.org/)

## 📚 Dictionaries

- 🚗 **Driving School** - Commands and vocabulary for Japanese driving lessons
- 📖 **JLPT N5** - Basic Japanese vocabulary for N5 level
- 🏦 **Banking & Finance** - Essential vocabulary for banking transactions
- 🏠 **Real Estate** - Vocabulary for renting and buying property in Japan

## ✨ Features

- 🔊 **Audio pronunciation** - Native Japanese audio with slow playback option
- 🔄 **Two study modes** - Japanese → English or English → Japanese
- ▶️ **Auto-play** - Continuous playback with screen wake lock
- 🔀 **Shuffle mode** - Randomize card order
- ⭐ **Mark as learned** - Track progress, skip learned words
- 💾 **Save progress** - Automatically remembers your position
- 🎧 **Media Session** - Control from lock screen
- 📱 **PWA** - Install as a mobile app
- 📱 **Responsive** - Works on mobile and desktop

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate cards |
| `Space` `↑` `↓` | Flip card |
| `S` | Shuffle |
| `P` `Enter` | Play audio |

## 🛠️ Tech Stack

- Alpine.js (reactive UI)
- Edge TTS (audio generation)
- Media Session API
- Screen Wake Lock API
- PWA (Progressive Web App)
- Cloudflare Pages

## 📁 Structure

```
├── assets/
│   ├── dictionaries/     # Dictionary JSON + audio files
│   └── icons/
├── js/
│   └── alpine-store.js
├── scripts/
│   └── generate_audio.py
├── index.html
├── styles.css
└── manifest.json
```

## 🔊 Generating Audio

```bash
source venv/bin/activate && python3 scripts/generate_audio.py <dictionary-name>
```

## 📦 Deployment

Auto-deployed to Cloudflare Pages via Git integration.

## 📄 License

MIT
