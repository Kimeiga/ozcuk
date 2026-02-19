#!/bin/bash
# Fix URL-encoded filenames by renaming them to proper Unicode

cd ../ozcuk-data/words

count=0
for f in *.json; do
  # Decode URL-encoded filename
  decoded=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$f'))")
  
  if [ "$f" != "$decoded" ]; then
    mv "$f" "$decoded"
    count=$((count + 1))
    
    # Show progress every 1000 files
    if [ $((count % 1000)) -eq 0 ]; then
      echo "Renamed $count files..."
    fi
  fi
done

echo "Done! Renamed $count files total."

