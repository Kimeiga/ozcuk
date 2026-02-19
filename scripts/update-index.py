#!/usr/bin/env python3
"""Update index.json with proper Unicode filenames."""
import json
from pathlib import Path

words_dir = Path(__file__).parent.parent.parent / "ozcuk-data" / "words"
index_file = Path(__file__).parent.parent.parent / "ozcuk-data" / "index.json"

# Get all word names from files
words = []
for f in sorted(words_dir.iterdir()):
    if f.name.endswith('.json'):
        # Remove .json extension
        word = f.name[:-5]
        words.append(word)

print(f"Found {len(words)} words")

# Save index
with open(index_file, 'w', encoding='utf-8') as f:
    json.dump(words, f, ensure_ascii=False)

print(f"Updated index.json with {len(words)} words")

