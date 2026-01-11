<p align="center">
  <img src="assets/favicon.svg" width="120" height="120" alt="車">
</p>

# 🚗 Oh! My Japanese Flashcard 🎴

Ứng dụng flashcard học từ vựng tiếng Nhật cho lớp học lái xe.

## 🌐 Demo

[https://japanese.iamtuna.org/](https://japanese.iamtuna.org/)

## ✨ Tính năng

- 📚 **Bộ từ vựng đầy đủ** - Các khẩu lệnh trong lớp học lái xe Nhật Bản
- 🔊 **Phát âm audio** - Nghe phát âm chuẩn tiếng Nhật và tiếng Việt
- 🇻🇳 **Đọc cả hai ngôn ngữ** - Tùy chọn đọc tiếng Việt sau tiếng Nhật
- 🔄 **Hai chế độ học** - Nhật → Việt hoặc Việt → Nhật
- ▶️ **Tự động phát** - Auto-play với chống tắt màn hình
- 🔀 **Trộn bài ngẫu nhiên** - Học theo thứ tự ngẫu nhiên
- ⭐ **Đánh dấu đã thuộc** - Theo dõi từ đã học, bỏ qua khi ôn tập
- 💾 **Lưu tiến độ** - Tự động nhớ vị trí học
- 🎧 **Media Session** - Điều khiển từ màn hình khóa
- 📱 **PWA** - Cài đặt như app trên điện thoại
- 📱 **Responsive** - Hoạt động tốt trên mobile và desktop

## ⌨️ Phím tắt

| Phím | Chức năng |
|------|-----------|
| `←` `→` | Di chuyển thẻ |
| `Space` `↑` `↓` | Lật thẻ |
| `S` | Trộn bài |
| `P` `Enter` | Phát âm |

## 🛠️ Công nghệ

- Alpine.js (reactive UI framework)
- CSS3 với animations
- Edge TTS (audio generation)
- Media Session API
- Screen Wake Lock API
- LocalStorage
- PWA (Progressive Web App)

## 📁 Cấu trúc

```
├── assets/          # Favicon, icons, audio files
├── js/
│   └── alpine-store.js  # Alpine.js reactive store
├── scripts/
│   └── generate_audio.py
├── index.html
├── styles.css
├── dictionary.json
└── manifest.json
```

## 📦 Triển khai

Dự án được deploy tự động lên Cloudflare Pages qua Git integration.

## 📄 License

MIT
