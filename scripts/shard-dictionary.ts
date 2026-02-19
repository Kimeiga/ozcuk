/**
 * Shard dictionary data into 256 buckets (00-ff) based on word hash
 * Output structure: ozcuk-data/shards/XX/words.json
 * 
 * This enables efficient CDN delivery via jsDelivr
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Simple hash function (djb2)
function hashWord(word: string): number {
  let hash = 5381;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) + hash) + word.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Get shard key (00-ff)
function getShardKey(word: string): string {
  const hash = hashWord(word.toLowerCase());
  return (hash % 256).toString(16).padStart(2, '0');
}

// Main
const wordsDir = 'src/lib/data/words';
const outputDir = '../ozcuk-data/shards';

// Create output directory structure
for (let i = 0; i < 256; i++) {
  const shardKey = i.toString(16).padStart(2, '0');
  const shardDir = join(outputDir, shardKey);
  if (!existsSync(shardDir)) {
    mkdirSync(shardDir, { recursive: true });
  }
}

// Collect all words by shard
const shards: Map<string, any[]> = new Map();
for (let i = 0; i < 256; i++) {
  shards.set(i.toString(16).padStart(2, '0'), []);
}

// Read all word files (exclude index.json)
const files = readdirSync(wordsDir).filter(f => f.endsWith('.json') && f !== 'index.json');
let totalWords = 0;

for (const file of files) {
  const filePath = join(wordsDir, file);
  console.log(`Processing ${file}...`);

  const words = JSON.parse(readFileSync(filePath, 'utf-8'));

  for (const word of words) {
    if (!word.word) continue; // Skip invalid entries
    const shardKey = getShardKey(word.word);
    shards.get(shardKey)!.push(word);
    totalWords++;
  }
}

// Write shard files
console.log(`\nWriting ${shards.size} shards...`);
let minCount = Infinity, maxCount = 0;

for (const [shardKey, words] of shards) {
  const shardFile = join(outputDir, shardKey, 'words.json');
  writeFileSync(shardFile, JSON.stringify(words));
  
  minCount = Math.min(minCount, words.length);
  maxCount = Math.max(maxCount, words.length);
}

// Create index file mapping words to shards (for search)
const wordIndex: Record<string, string> = {};
for (const [shardKey, words] of shards) {
  for (const word of words) {
    wordIndex[word.word.toLowerCase()] = shardKey;
  }
}

writeFileSync(join(outputDir, '../index.json'), JSON.stringify(wordIndex));

console.log(`\n✅ Done!`);
console.log(`   Total words: ${totalWords}`);
console.log(`   Shards: ${shards.size}`);
console.log(`   Words per shard: ${minCount} - ${maxCount}`);
console.log(`   Average: ${Math.round(totalWords / shards.size)}`);

