/**
 * Build reverse index (English -> Turkish) for reverse lookup
 * Run: npx tsx scripts/build-reverse-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const INPUT_DIR = process.env.INPUT_DIR || 'src/lib/data/words';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '../ozcuk-data';

interface ProcessedWord {
  word: string;
  pos: string;
  senses: Array<{
    glosses: string[];
    tags?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }>;
}

// Extract meaningful words from glosses
function extractWords(gloss: string): string[] {
  // Remove parenthetical content
  const cleaned = gloss.replace(/\([^)]+\)/g, '');
  // Split by common delimiters
  const words = cleaned.split(/[,;\/\-\s]+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
  return words;
}

async function main() {
  console.log('Building reverse index (English -> Turkish)...');
  console.log(`Input: ${INPUT_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  // Read all word files
  const wordFiles = fs.readdirSync(INPUT_DIR);
  console.log(`Found ${wordFiles.length} word files`);

  // Build reverse index: English word -> Turkish words
  const reverseIndex = new Map<string, Set<string>>();

  let processed = 0;
  for (const file of wordFiles) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(INPUT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const words: ProcessedWord[] = JSON.parse(content);
      
      for (const word of words) {
        for (const sense of word.senses) {
          for (const gloss of sense.glosses) {
            const englishWords = extractWords(gloss);
            for (const engWord of englishWords) {
              if (!reverseIndex.has(engWord)) {
                reverseIndex.set(engWord, new Set());
              }
              reverseIndex.get(engWord)!.add(word.word);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }

    processed++;
    if (processed % 1000 === 0) {
      console.log(`Processed ${processed}/${wordFiles.length} files...`);
    }
  }

  console.log(`Built reverse index with ${reverseIndex.size} English words`);

  // Convert to plain object and limit Turkish words per English word
  const indexObj: Record<string, string[]> = {};
  for (const [engWord, turkishSet] of reverseIndex.entries()) {
    // Limit to 20 Turkish words per English word to keep index size reasonable
    indexObj[engWord] = Array.from(turkishSet).slice(0, 20);
  }

  // Write output
  const outputPath = path.join(OUTPUT_DIR, 'reverse-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(indexObj));
  
  const stats = fs.statSync(outputPath);
  console.log(`\nReverse index created: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`English words: ${Object.keys(indexObj).length}`);
}

main().catch(console.error);

