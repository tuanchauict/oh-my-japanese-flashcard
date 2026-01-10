#!/usr/bin/env python3
"""
Generate audio files for Japanese flashcard words using Microsoft Edge TTS.
Uses random Japanese voices for variety.
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

AUDIO_DIR = "audio"


def get_audio_filename(japanese_text: str) -> str:
    """Generate a safe filename from Japanese text using hash."""
    # Use MD5 hash to create a safe filename
    text_hash = hashlib.md5(japanese_text.encode('utf-8')).hexdigest()[:12]
    return f"{text_hash}.mp3"


def get_random_voice() -> str:
    """Get a random Japanese voice."""
    return random.choice(JAPANESE_VOICES)


async def generate_audio(text: str, output_path: str, max_retries: int = 3) -> tuple[bool, str]:
    """Generate audio file for a single text with random voice and retry logic."""
    for attempt in range(max_retries):
        voice = get_random_voice()
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
    
    # Collect all unique Japanese texts
    audio_mapping = {}
    all_texts = set()
    
    for category in dictionary["categories"]:
        for word in category["words"]:
            japanese_text = word["japanese"]
            all_texts.add(japanese_text)
    
    print(f"Found {len(all_texts)} unique Japanese phrases")
    print(f"Using random voices from: {', '.join(JAPANESE_VOICES)}")
    print("-" * 50)
    
    # Delete existing audio files to regenerate with random voices
    for filename in os.listdir(AUDIO_DIR):
        if filename.endswith('.mp3'):
            os.remove(os.path.join(AUDIO_DIR, filename))
    print("Cleared existing audio files")
    print("-" * 50)
    
    # Generate audio for each text
    success_count = 0
    
    for i, text in enumerate(sorted(all_texts), 1):
        filename = get_audio_filename(text)
        output_path = os.path.join(AUDIO_DIR, filename)
        audio_mapping[text] = f"audio/{filename}"
        
        print(f"[{i}/{len(all_texts)}] Generating: {text}", end="")
        success, voice = await generate_audio(text, output_path)
        if success:
            success_count += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    # Save audio mapping file
    with open("audio_mapping.json", "w", encoding="utf-8") as f:
        json.dump(audio_mapping, f, ensure_ascii=False, indent=2)
    
    print("-" * 50)
    print(f"Done! Generated: {success_count}/{len(all_texts)} audio files")
    print(f"Audio mapping saved to audio_mapping.json")


if __name__ == "__main__":
    asyncio.run(main())
