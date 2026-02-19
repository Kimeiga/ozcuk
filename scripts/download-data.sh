#!/bin/bash
# Download Turkish dictionary data from Kaikki.org

DATA_DIR="data"
mkdir -p "$DATA_DIR"

echo "Downloading Turkish Wiktionary data from Kaikki.org..."
echo "This file is ~349 MB and contains 40,000+ Turkish words."

# Download the Turkish dictionary JSON
curl -L "https://kaikki.org/dictionary/Turkish/kaikki.org-dictionary-Turkish.jsonl" \
  -o "$DATA_DIR/turkish-raw.jsonl"

echo "Download complete!"
echo "File saved to: $DATA_DIR/turkish-raw.jsonl"

# Show file info
ls -lh "$DATA_DIR/turkish-raw.jsonl"
wc -l "$DATA_DIR/turkish-raw.jsonl"

