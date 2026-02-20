/**
 * Build individual word JSON files for CDN delivery
 * Output: words/{word}.json for each word
 * Also builds index.json for search autocomplete
 *
 * This runs in GitHub Actions on push
 *
 * IMPORTANT: When multiple entries have the same normalized name (e.g., "su" and "Su"),
 * we merge them, prioritizing common nouns over proper nouns.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const INPUT_DIR = process.env.INPUT_DIR || 'src/lib/data/words';
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'output';

interface ProcessedWord {
  word: string;
  pos: string;
  senses: Array<{
    glosses: string[];
    tags?: string[];
    examples?: Array<{ text: string; translation?: string }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  pronunciation?: string;
  etymology?: string;
  forms?: Array<{ form: string; tags: string[] }>;
}

// Sanitize filename - handle special chars
function sanitizeFilename(word: string): string {
  // URL-encode special characters for filesystem safety
  return encodeURIComponent(word.toLowerCase());
}

// Priority for POS - lower is better (common nouns before proper nouns)
function getPosPriority(pos: string): number {
  const priorities: Record<string, number> = {
    'noun': 1,
    'verb': 2,
    'adjective': 3,
    'adverb': 4,
    'pronoun': 5,
    'postposition': 6,
    'conjunction': 7,
    'interjection': 8,
    'particle': 9,
    'numeral': 10,
    'determiner': 11,
    'suffix': 12,
    'prefix': 13,
    'phrase': 14,
    'proverb': 15,
    'proper-noun': 20, // Proper nouns have lower priority
    'other': 25
  };
  return priorities[pos] || 15;
}

// Merge two word entries with the same normalized name
function mergeWords(existing: ProcessedWord, newWord: ProcessedWord): ProcessedWord {
  // If same POS, combine senses
  if (existing.pos === newWord.pos) {
    return {
      ...existing,
      senses: [...existing.senses, ...newWord.senses],
      forms: existing.forms || newWord.forms,
      pronunciation: existing.pronunciation || newWord.pronunciation,
      etymology: existing.etymology || newWord.etymology
    };
  }

  // If different POS, prefer the one with higher priority (lower number)
  const existingPriority = getPosPriority(existing.pos);
  const newPriority = getPosPriority(newWord.pos);

  if (newPriority < existingPriority) {
    // New word has higher priority - use it as base and add existing senses
    return {
      ...newWord,
      senses: [...newWord.senses, ...existing.senses]
    };
  } else {
    // Existing word has higher priority - add new senses to it
    return {
      ...existing,
      senses: [...existing.senses, ...newWord.senses]
    };
  }
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

// Track all words by filename for merging
const wordsByFilename: Map<string, ProcessedWord> = new Map();

// Track all words for index
const wordSet: Set<string> = new Set();

// Read all source files
const files = readdirSync(INPUT_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
let totalEntries = 0;
let mergedCount = 0;

for (const file of files) {
  const filePath = join(INPUT_DIR, file);
  console.log(`Processing ${file}...`);

  const words: ProcessedWord[] = JSON.parse(readFileSync(filePath, 'utf-8'));

  for (const word of words) {
    if (!word.word) continue;

    const filename = sanitizeFilename(word.word);
    totalEntries++;

    // Check if we already have an entry for this filename
    if (wordsByFilename.has(filename)) {
      const existing = wordsByFilename.get(filename)!;
      const merged = mergeWords(existing, word);
      wordsByFilename.set(filename, merged);
      mergedCount++;
    } else {
      wordsByFilename.set(filename, word);
    }

    wordSet.add(word.word.toLowerCase());
  }
}

// Write word files
console.log(`\nWriting ${wordsByFilename.size} word files...`);
for (const [filename, word] of wordsByFilename) {
  const outputPath = join(wordsDir, `${filename}.json`);
  writeFileSync(outputPath, JSON.stringify(word));
}

// Sort word list for efficient prefix search
const wordList = Array.from(wordSet).sort();

// Write index.json (simple array for autocomplete)
writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(wordList));

console.log(`\n✅ Done!`);
console.log(`   Total entries processed: ${totalEntries}`);
console.log(`   Merged entries: ${mergedCount}`);
console.log(`   Unique word files: ${wordsByFilename.size}`);
console.log(`   Word files: ${wordsDir}`);
console.log(`   Index: ${join(OUTPUT_DIR, 'index.json')}`);

