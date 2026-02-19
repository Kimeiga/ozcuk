#!/usr/bin/env python3
"""Rename URL-encoded filenames to proper Unicode."""
import os
import urllib.parse
from pathlib import Path

words_dir = Path(__file__).parent.parent.parent / "ozcuk-data" / "words"

count = 0
skipped = 0
for f in words_dir.iterdir():
    if not f.name.endswith('.json'):
        continue

    decoded = urllib.parse.unquote(f.name)

    # Skip if decoded name contains invalid characters
    if '/' in decoded or '\\' in decoded:
        skipped += 1
        continue

    if f.name != decoded:
        new_path = f.parent / decoded
        try:
            f.rename(new_path)
            count += 1

            if count % 5000 == 0:
                print(f"Renamed {count} files...")
        except Exception as e:
            print(f"Failed to rename {f.name}: {e}")
            skipped += 1

print(f"Done! Renamed {count} files, skipped {skipped}.")

