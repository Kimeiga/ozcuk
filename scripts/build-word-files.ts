/**
 * Build individual word JSON files for CDN delivery
 * Output: words/{word}.json for each word
 * Also builds index.json for search autocomplete
 * 
 * This runs in GitHub Actions on push
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const INPUT_DIR = process.env.INPUT_DIR || 'src/lib/data/words';
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'output';

// Sanitize filename - handle special chars
function sanitizeFilename(word: string): string {
  // URL-encode special characters for filesystem safety
  return encodeURIComponent(word.toLowerCase());
}

// Main
console.log(`📚 Building word files...`);
console.log(`   Input: ${INPUT_DIR}`);
console.log(`   Output: ${OUTPUT_DIR}`);

// Create output directories
const wordsDir = join(OUTPUT_DIR, 'words');
if (!existsSync(wordsDir)) {
  mkdirSync(wordsDir, { recursive: true });
}

// Track all words for index
const wordList: string[] = [];

// Read all source files
const files = readdirSync(INPUT_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
let totalWords = 0;

for (const file of files) {
  const filePath = join(INPUT_DIR, file);
  console.log(`Processing ${file}...`);
  
  const words = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  for (const word of words) {
    if (!word.word) continue;
    
    const filename = sanitizeFilename(word.word);
    const outputPath = join(wordsDir, `${filename}.json`);
    
    // Write individual word file
    writeFileSync(outputPath, JSON.stringify(word));
    wordList.push(word.word.toLowerCase());
    totalWords++;
  }
}

// Sort word list for efficient prefix search
wordList.sort();

// Write index.json (simple array for autocomplete)
writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(wordList));

console.log(`\n✅ Done!`);
console.log(`   Total words: ${totalWords}`);
console.log(`   Word files: ${wordsDir}`);
console.log(`   Index: ${join(OUTPUT_DIR, 'index.json')}`);

