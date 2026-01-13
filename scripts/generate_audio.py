#!/usr/bin/env python3
"""
Generate audio files for flashcard words using Microsoft Edge TTS.
Uses random voices for variety.

Usage:
    python generate_audio.py <dictionary.json>
    
Example:
    python generate_audio.py dictionary.json
    python generate_audio.py n5-dictionary.json
"""

import asyncio
import json
import os
import sys
import hashlib
import random
import edge_tts

# Voice options by language code
VOICES = {
    "ja": [
        "ja-JP-NanamiNeural",   # Female, natural
        "ja-JP-KeitaNeural",    # Male, natural
    ],
    "vi": [
        "vi-VN-HoaiMyNeural",   # Female, natural
        "vi-VN-NamMinhNeural",  # Male, natural
    ],
    "en": [
        "en-US-JennyNeural",    # Female, natural
        "en-US-GuyNeural",      # Male, natural
    ],
}


def get_dictionary_dir(dictionary_name: str) -> str:
    """Get dictionary directory based on dictionary name."""
    return f"assets/dictionaries/{dictionary_name}"


def get_audio_dir(dictionary_name: str) -> str:
    """Get audio directory based on dictionary name."""
    return f"assets/dictionaries/{dictionary_name}/audios"


def get_audio_filename(text: str, lang: str = "ja", slow: bool = False) -> str:
    """Generate a safe filename from text using hash."""
    text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:12]
    suffix = "_slow" if slow else ""
    return f"{lang}_{text_hash}{suffix}.mp3"


def get_random_voice(lang: str = "ja") -> str:
    """Get a random voice for the specified language."""
    voices = VOICES.get(lang, VOICES["en"])
    return random.choice(voices)


import re

def get_tts_text(text: str, lang: str) -> str:
    """
    Get text optimized for TTS.
    - Replaces '/' with SSML break for pause
    - Removes parenthetical content like "(9)" from "nine (9)"
    """
    if lang == "ja":
        return text
    
    result = text
    
    # Replace "/" with SSML break for pause
    result = result.replace("/", "<break time='400ms'/>")
    
    # Remove parenthetical content like "(9)", "(10,000)", etc.
    result = re.sub(r'\s*\([^)]+\)\s*', ' ', result).strip()
    
    return result


async def generate_audio(text: str, output_path: str, lang: str = "ja", rate: str = "+0%", max_retries: int = 3) -> tuple[bool, str]:
    """Generate audio file for a single text with random voice and retry logic.
    
    Args:
        text: Text to convert to speech
        output_path: Path to save the audio file
        lang: Language code (ja, en, vi)
        rate: Speech rate (e.g., "+0%" for normal, "-30%" for slow)
        max_retries: Number of retry attempts
    """
    tts_text = get_tts_text(text, lang)
    for attempt in range(max_retries):
        voice = get_random_voice(lang)
        try:
            communicate = edge_tts.Communicate(tts_text, voice, rate=rate)
            await communicate.save(output_path)
            return True, voice
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(0.5)
                continue
            print(f"  Error generating audio for '{text}': {e}")
            return False, None


async def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_audio.py <dictionary-name>")
        print("Example: python generate_audio.py dictionary")
        print("         python generate_audio.py n5-dictionary")
        sys.exit(1)
    
    dictionary_name = sys.argv[1]
    dictionary_dir = get_dictionary_dir(dictionary_name)
    dictionary_file = os.path.join(dictionary_dir, "dictionary.json")
    
    if not os.path.exists(dictionary_file):
        print(f"Error: Dictionary file '{dictionary_file}' not found")
        sys.exit(1)
    
    # Load dictionary
    with open(dictionary_file, "r", encoding="utf-8") as f:
        dictionary = json.load(f)
    
    # Get languages from metadata
    metadata = dictionary.get("metadata", {})
    primary_lang = metadata.get("primaryLanguage", "ja")
    meaning_lang = metadata.get("meaningLanguage", "en")
    
    # Create audio directory
    audio_dir = get_audio_dir(dictionary_name)
    os.makedirs(audio_dir, exist_ok=True)
    
    print(f"Dictionary: {dictionary_name}")
    print(f"Primary language: {primary_lang}")
    print(f"Meaning language: {meaning_lang}")
    print(f"Audio directory: {audio_dir}")
    print("-" * 50)
    
    # Collect all unique texts
    audio_mapping = {}
    primary_texts = set()
    meaning_texts = set()
    example_texts = set()  # Japanese examples
    example_meaning_texts = set()  # Example meanings (in meaning language)

    for category in dictionary["categories"]:
        for word in category["words"]:
            primary_texts.add(word["japanese"])
            if word.get("meaning"):
                meaning_texts.add(word["meaning"])
            if word.get("example"):
                example_texts.add(word["example"])
            if word.get("exampleMeaning"):
                example_meaning_texts.add(word["exampleMeaning"])
    
    print(f"Found {len(primary_texts)} unique primary language phrases")
    print(f"Found {len(meaning_texts)} unique meaning language phrases")
    print(f"Found {len(example_texts)} unique example sentences")
    print(f"Found {len(example_meaning_texts)} unique example meanings")
    print(f"Primary voices: {', '.join(VOICES.get(primary_lang, VOICES['en']))}")
    print(f"Meaning voices: {', '.join(VOICES.get(meaning_lang, VOICES['en']))}")
    print("-" * 50)
    
    # Clear existing audio files
    if os.path.exists(audio_dir):
        for filename in os.listdir(audio_dir):
            if filename.endswith('.mp3'):
                os.remove(os.path.join(audio_dir, filename))
        print("Cleared existing audio files")
        print("-" * 50)
    
    # Generate audio for primary language texts (normal speed)
    print(f"Generating {primary_lang.upper()} audio (normal)...")
    success_count_primary = 0
    
    for i, text in enumerate(sorted(primary_texts), 1):
        filename = get_audio_filename(text, primary_lang)
        output_path = os.path.join(audio_dir, filename)
        audio_mapping[text] = f"{audio_dir}/{filename}"
        
        print(f"[{primary_lang.upper()} {i}/{len(primary_texts)}] {text}", end="")
        success, voice = await generate_audio(text, output_path, primary_lang)
        if success:
            success_count_primary += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    print("-" * 50)
    
    # Generate slow audio for primary language texts (for learning)
    print(f"Generating {primary_lang.upper()} audio (slow)...")
    success_count_primary_slow = 0
    
    for i, text in enumerate(sorted(primary_texts), 1):
        filename = get_audio_filename(text, primary_lang, slow=True)
        output_path = os.path.join(audio_dir, filename)
        # Use special key format for slow audio: text + ":slow"
        audio_mapping[text + ":slow"] = f"{audio_dir}/{filename}"
        
        print(f"[{primary_lang.upper()}-SLOW {i}/{len(primary_texts)}] {text}", end="")
        success, voice = await generate_audio(text, output_path, primary_lang, rate="-30%")
        if success:
            success_count_primary_slow += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    print("-" * 50)
    
    # Generate audio for meaning language texts
    print(f"Generating {meaning_lang.upper()} audio...")
    success_count_meaning = 0
    
    for i, text in enumerate(sorted(meaning_texts), 1):
        filename = get_audio_filename(text, meaning_lang)
        output_path = os.path.join(audio_dir, filename)
        audio_mapping[text] = f"{audio_dir}/{filename}"
        
        print(f"[{meaning_lang.upper()} {i}/{len(meaning_texts)}] {text}", end="")
        success, voice = await generate_audio(text, output_path, meaning_lang)
        if success:
            success_count_meaning += 1
            print(f" ✓ ({voice.split('-')[-1]})")
        else:
            print(" ✗")
    
    print("-" * 50)
    
    # Generate audio for example sentences (always in Japanese)
    success_count_examples = 0
    if example_texts:
        print(f"Generating example audio (JA)...")
        
        for i, text in enumerate(sorted(example_texts), 1):
            filename = get_audio_filename(text, "ja")
            output_path = os.path.join(audio_dir, filename)
            audio_mapping[text] = f"{audio_dir}/{filename}"
            
            # Truncate display for long examples
            display_text = text[:40] + "..." if len(text) > 40 else text
            print(f"[EX {i}/{len(example_texts)}] {display_text}", end="")
            success, voice = await generate_audio(text, output_path, "ja")
            if success:
                success_count_examples += 1
                print(f" ✓ ({voice.split('-')[-1]})")
            else:
                print(" ✗")
        
        print("-" * 50)
    
    # Generate audio for example meanings (in meaning language)
    success_count_example_meanings = 0
    if example_meaning_texts:
        print(f"Generating example meaning audio ({meaning_lang.upper()})...")
        
        for i, text in enumerate(sorted(example_meaning_texts), 1):
            filename = get_audio_filename(text, meaning_lang)
            output_path = os.path.join(audio_dir, filename)
            audio_mapping[text] = f"{audio_dir}/{filename}"
            
            # Truncate display for long examples
            display_text = text[:40] + "..." if len(text) > 40 else text
            print(f"[EX-M {i}/{len(example_meaning_texts)}] {display_text}", end="")
            success, voice = await generate_audio(text, output_path, meaning_lang)
            if success:
                success_count_example_meanings += 1
                print(f" ✓ ({voice.split('-')[-1]})")
            else:
                print(" ✗")
        
        print("-" * 50)
    
    # Save audio mapping in the dictionary directory (not audio directory)
    mapping_path = os.path.join(dictionary_dir, "audio-mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(audio_mapping, f, ensure_ascii=False, indent=2)
    
    print("-" * 50)
    print(f"Done!")
    print(f"  {primary_lang.upper()}: {success_count_primary}/{len(primary_texts)} audio files")
    print(f"  {primary_lang.upper()} (slow): {success_count_primary_slow}/{len(primary_texts)} audio files")
    print(f"  {meaning_lang.upper()}: {success_count_meaning}/{len(meaning_texts)} audio files")
    print(f"  Examples (JA): {success_count_examples}/{len(example_texts)} audio files")
    print(f"  Example meanings ({meaning_lang.upper()}): {success_count_example_meanings}/{len(example_meaning_texts)} audio files")
    print(f"Audio mapping saved to {mapping_path}")


if __name__ == "__main__":
    asyncio.run(main())
