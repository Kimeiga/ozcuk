#!/usr/bin/env python3
"""
Compress all dictionary JSON files to .deflate format.
This reduces repository size by ~75-92%.
"""
import os
import zlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Paths
OZCUK_DATA_DIR = Path(__file__).parent.parent.parent / "ozcuk-data"
WORDS_DIR = OZCUK_DATA_DIR / "words"
INDEX_FILE = OZCUK_DATA_DIR / "index.json"
REVERSE_INDEX_FILE = OZCUK_DATA_DIR / "reverse-index.json"


def compress_file(json_path: Path) -> tuple[str, int, int]:
    """Compress a single JSON file to .deflate format."""
    try:
        # Read original JSON
        with open(json_path, 'rb') as f:
            original_data = f.read()
        
        original_size = len(original_data)
        
        # Compress using zlib (deflate)
        compressed_data = zlib.compress(original_data, level=9)
        compressed_size = len(compressed_data)
        
        # Write compressed file
        deflate_path = json_path.with_suffix('.json.deflate')
        with open(deflate_path, 'wb') as f:
            f.write(compressed_data)
        
        # Remove original JSON file
        json_path.unlink()
        
        return str(json_path.name), original_size, compressed_size
    except Exception as e:
        return str(json_path.name), 0, 0


def main():
    print("🗜️  Compressing dictionary files to .deflate format...")
    
    # Get all JSON files in words directory
    json_files = list(WORDS_DIR.glob("*.json"))
    total_files = len(json_files)
    print(f"Found {total_files} word files to compress")
    
    # Add root-level JSON files
    root_files = []
    if INDEX_FILE.exists():
        root_files.append(INDEX_FILE)
    if REVERSE_INDEX_FILE.exists():
        root_files.append(REVERSE_INDEX_FILE)
    
    all_files = json_files + root_files
    
    # Track statistics
    total_original = 0
    total_compressed = 0
    processed = 0
    
    # Process files in parallel
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(compress_file, f): f for f in all_files}
        
        for future in as_completed(futures):
            name, orig_size, comp_size = future.result()
            if orig_size > 0:
                total_original += orig_size
                total_compressed += comp_size
                processed += 1
                
                if processed % 5000 == 0:
                    print(f"Processed {processed}/{len(all_files)} files...")
    
    # Print summary
    print(f"\n✅ Compression complete!")
    print(f"Files processed: {processed}")
    print(f"Original size: {total_original / 1024 / 1024:.1f} MB")
    print(f"Compressed size: {total_compressed / 1024 / 1024:.1f} MB")
    print(f"Reduction: {100 - (total_compressed * 100 // total_original)}%")


if __name__ == "__main__":
    main()

