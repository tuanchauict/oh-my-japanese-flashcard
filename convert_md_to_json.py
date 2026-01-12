#!/usr/bin/env python3
"""Convert n5-vocabs.md to n5-dictionary.json"""

import re
import json

def parse_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    categories = []
    current_category = None
    
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Match category headers (## or ###)
        h2_match = re.match(r'^## \*\*\d+\. (.+)\*\*$', line)
        h3_match = re.match(r'^### \*\*(.+)\*\*$', line)
        
        if h2_match:
            # Main category - skip, use subcategories
            pass
        elif h3_match:
            # Subcategory
            if current_category and current_category['words']:
                categories.append(current_category)
            
            name = h3_match.group(1)
            category_id = name.lower()
            category_id = re.sub(r'\s*\([^)]+\)\s*', '', category_id)  # Remove Japanese in parentheses
            category_id = re.sub(r'[^a-z0-9]+', '-', category_id).strip('-')
            
            current_category = {
                'id': category_id,
                'name': name,
                'words': []
            }
        
        # Match table rows
        if line.startswith('| **') and current_category is not None:
            # Parse table row: | **word** (romaji) | meaning | example | example meaning |
            match = re.match(r'\| \*\*(.+?)\*\* \((.+?)\) \| (.+?) \| (.+?) \| (.+?) \|', line)
            if match:
                japanese = match.group(1)
                romaji = match.group(2)
                meaning = match.group(3).strip()
                example = match.group(4).strip()
                example_meaning = match.group(5).strip()
                
                word = {
                    'japanese': japanese,
                    'romaji': romaji,
                    'meaning': meaning,
                    'example': example,
                    'exampleMeaning': example_meaning
                }
                current_category['words'].append(word)
        
        i += 1
    
    # Add last category
    if current_category and current_category['words']:
        categories.append(current_category)
    
    return categories


def main():
    categories = parse_markdown('n5-vocabs.md')
    
    # Count total words
    total_words = sum(len(c['words']) for c in categories)
    print(f"Parsed {len(categories)} categories with {total_words} words")
    
    dictionary = {
        'metadata': {
            'title': '📚 JLPT N5 Vocabulary',
            'subtitle': 'Core vocabulary for basic Japanese communication',
            'primaryLanguage': 'ja',
            'meaningLanguage': 'en',
            'modes': [
                {'id': 'jp-en', 'label': '🇯🇵 → 🇬🇧'},
                {'id': 'en-jp', 'label': '🇬🇧 → 🇯🇵'}
            ],
            'readBothLabel': '🔊 Read both Japanese and English'
        },
        'categories': categories
    }
    
    with open('n5-dictionary.json', 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)
    
    print(f"Written to n5-dictionary.json")
    
    # Print category summary
    for cat in categories:
        print(f"  - {cat['name']}: {len(cat['words'])} words")


if __name__ == '__main__':
    main()
