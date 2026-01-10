#!/usr/bin/env python3
"""
Generate audio files for Japanese and Vietnamese flashcard words using Microsoft Edge TTS.
Uses random voices for variety.
"""

import asyncio
import json
import os
import hashlib
import random
import edge_tts

# Japanese voice options (reliable neural voices)
JAPANESE_VOICES = [
    "ja-JP-NanamiNeural",   # Female, natural
    "ja-JP-KeitaNeural",    # Male, natural
]

# Vietnamese voice options
VIETNAMESE_VOICES = [
    "vi-VN-HoaiMyNeural",   # Female, natural
    "vi-VN-NamMinhNeural",  # Male, natural
]

AUDIO_DIR = "audio"


def get_audio_filename(text: str, lang: str = "ja") -> str:
    """Generate a safe filename from text using hash."""
    # Use MD5 hash to create a safe filename
    text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:12]
    return f"{lang}_{text_hash}.mp3"


def get_random_voice(lang: str = "ja") -> str:
    """Get a random voice for the specified language."""
    if lang == "vi":
        return random.choice(VIETNAMESE_VOICES)
    return random.choice(JAPANESE_VOICES)


async def generate_audio(text: str, output_path: str, lang: str = "ja", max_retries: int = 3) -> tuple[bool, str]:
    """Generate audio file for a single text with random voice and retry logic."""
    for attempt in range(max_retries):
        voice = get_random_voice(lang)
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            return True, voice
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(0.5)  # Brief pause before retry
                continue
            print(f"  Error generating audio for '{text}': {e}")
            return False, None


async def main():
    # Create audio directory
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    # Load dictionary
    with open("dictionary.json", "r", encoding="utf-8") as f:
        dictionary = json.load(f)
    
    # Collect all unique texts (Japanese and Vietnamese)
    audio_mapping = {}
    japanese_texts = set()
    vietnamese_texts = set()
    
    for category in dictionary["categories"]:
        for word in category["words"]:
            japanese_texts.add(word["japanese"])
            vietnamese_texts.add(word["vietnamese"])
    
    print(f"Found {len(japanese_texts)} unique Japanese phrases")
    print(f"Found {len(vietnamese_texts)} unique Vietnamese phrases")
    print(f"Japanese voices: {', '.join(JAPANESE_VOICES)}")
    print(f"Vietnamese voices: {', '.join(VIETNAMESE_VOICES)}")
    print("-" * 50)
    
    # Delete existing audio files to regenerate with random voices
    for filename in os.listdir(AUDIO_DIR):
        if filename.endswith('.mp3'):
            os.remove(os.path.join(AUDIO_DIR, filename))
    print("Cleared existing audio files")
    print("-" * 50)
    
    # Generate audio for Japanese texts
    print("Generating Japanese audio...")
    success_count_ja = 0
    
    for i, text in enumerate(sorted(japanese_texts), 1):
        filename = get_audio_filename(text, "ja")
        output_path = os.path.join(AUDIO_DIR, filename)
        audio_mapping[text] = f"audio/{filename}"
        
        print(f"[JA {i}/{len(japanese_texts)}] {text}", end="")
        success, voice = await generate_audio(text, output_path, "ja")
        if success:
            success_count_ja += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    print("-" * 50)
    
    # Generate audio for Vietnamese texts
    print("Generating Vietnamese audio...")
    success_count_vi = 0
    
    for i, text in enumerate(sorted(vietnamese_texts), 1):
        filename = get_audio_filename(text, "vi")
        output_path = os.path.join(AUDIO_DIR, filename)
        audio_mapping[text] = f"audio/{filename}"
        
        print(f"[VI {i}/{len(vietnamese_texts)}] {text}", end="")
        success, voice = await generate_audio(text, output_path, "vi")
        if success:
            success_count_vi += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    # Save audio mapping file
    with open("audio_mapping.json", "w", encoding="utf-8") as f:
        json.dump(audio_mapping, f, ensure_ascii=False, indent=2)
    
    print("-" * 50)
    print(f"Done!")
    print(f"  Japanese: {success_count_ja}/{len(japanese_texts)} audio files")
    print(f"  Vietnamese: {success_count_vi}/{len(vietnamese_texts)} audio files")
    print(f"Audio mapping saved to audio_mapping.json")


if __name__ == "__main__":
    asyncio.run(main())
