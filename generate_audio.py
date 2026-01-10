#!/usr/bin/env python3
"""
Generate audio files for Japanese flashcard words using Microsoft Edge TTS.
Uses high-quality Japanese voice: ja-JP-NanamiNeural
"""

import asyncio
import json
import os
import hashlib
import edge_tts

# Japanese voice options:
# - ja-JP-NanamiNeural (Female, natural)
# - ja-JP-KeitaNeural (Male, natural)
VOICE = "ja-JP-NanamiNeural"
AUDIO_DIR = "audio"


def get_audio_filename(japanese_text: str) -> str:
    """Generate a safe filename from Japanese text using hash."""
    # Use MD5 hash to create a safe filename
    text_hash = hashlib.md5(japanese_text.encode('utf-8')).hexdigest()[:12]
    return f"{text_hash}.mp3"


async def generate_audio(text: str, output_path: str) -> bool:
    """Generate audio file for a single text."""
    try:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_path)
        return True
    except Exception as e:
        print(f"  Error generating audio for '{text}': {e}")
        return False


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
    print(f"Using voice: {VOICE}")
    print("-" * 50)
    
    # Generate audio for each text
    success_count = 0
    skip_count = 0
    
    for i, text in enumerate(sorted(all_texts), 1):
        filename = get_audio_filename(text)
        output_path = os.path.join(AUDIO_DIR, filename)
        audio_mapping[text] = f"audio/{filename}"
        
        # Skip if already exists
        if os.path.exists(output_path):
            print(f"[{i}/{len(all_texts)}] Skipping (exists): {text}")
            skip_count += 1
            continue
        
        print(f"[{i}/{len(all_texts)}] Generating: {text}")
        success = await generate_audio(text, output_path)
        if success:
            success_count += 1
    
    # Save audio mapping file
    with open("audio_mapping.json", "w", encoding="utf-8") as f:
        json.dump(audio_mapping, f, ensure_ascii=False, indent=2)
    
    print("-" * 50)
    print(f"Done! Generated: {success_count}, Skipped: {skip_count}")
    print(f"Audio mapping saved to audio_mapping.json")


if __name__ == "__main__":
    asyncio.run(main())
