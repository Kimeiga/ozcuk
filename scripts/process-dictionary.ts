/**
 * Process Turkish Wiktionary data from Kaikki.org
 *
 * Input: data/turkish-raw.jsonl (from kaikki.org)
 * Output:
 *   - data/dictionary.json (processed dictionary)
 *   - src/lib/data/words/*.json (sharded by first letter)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kaikki.org entry structure (simplified)
interface KaikkiEntry {
  word: string;
  pos: string;
  lang: string;
  senses?: Array<{
    glosses?: string[];
    tags?: string[];
    examples?: Array<{ text?: string; english?: string }>;
    categories?: string[];
    synonyms?: Array<{ word: string }>;
    antonyms?: Array<{ word: string }>;
  }>;
  sounds?: Array<{ ipa?: string }>;
  etymology_text?: string;
  forms?: Array<{ form: string; tags?: string[] }>;
}

// Our output structure
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

// Normalize part of speech
function normalizePos(pos: string): string {
  const posMap: Record<string, string> = {
    'noun': 'noun',
    'verb': 'verb',
    'adj': 'adjective',
    'adv': 'adverb',
    'pron': 'pronoun',
    'prep': 'postposition',
    'postp': 'postposition',
    'conj': 'conjunction',
    'interj': 'interjection',
    'particle': 'particle',
    'num': 'numeral',
    'det': 'determiner',
    'name': 'proper-noun',
    'proper noun': 'proper-noun',
    'suffix': 'suffix',
    'prefix': 'prefix',
    'phrase': 'phrase',
    'proverb': 'proverb'
  };
  return posMap[pos.toLowerCase()] || 'other';
}

// Process a single entry
function processEntry(entry: KaikkiEntry): ProcessedWord | null {
  if (!entry.word || !entry.senses?.length) return null;

  const senses = entry.senses
    .filter(s => s.glosses?.length)
    .map(s => ({
      glosses: s.glosses || [],
      tags: s.tags,
      examples: s.examples
        ?.filter(e => e.text)
        .map(e => ({ text: e.text!, translation: e.english })),
      synonyms: s.synonyms?.map(syn => syn.word),
      antonyms: s.antonyms?.map(ant => ant.word)
    }));

  if (senses.length === 0) return null;

  return {
    word: entry.word,
    pos: normalizePos(entry.pos),
    senses,
    pronunciation: entry.sounds?.[0]?.ipa,
    etymology: entry.etymology_text,
    forms: entry.forms?.map(f => ({ form: f.form, tags: f.tags || [] }))
  };
}

async function main() {
  const inputPath = path.join(__dirname, '../data/turkish-raw.jsonl');
  const outputDir = path.join(__dirname, '../src/lib/data/words');
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Dictionary grouped by first letter
  const wordsByLetter: Record<string, ProcessedWord[]> = {};
  let totalWords = 0;
  let processedWords = 0;

  console.log('Processing Turkish dictionary data...');

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    totalWords++;
    try {
      const entry: KaikkiEntry = JSON.parse(line);
      if (entry.lang !== 'Turkish') continue;
      
      const processed = processEntry(entry);
      if (processed) {
        // Normalize first letter for grouping
        const firstChar = processed.word.charAt(0).toLowerCase();
        const key = /^[a-zçğıöşü]$/i.test(firstChar) ? firstChar : '_';
        
        if (!wordsByLetter[key]) wordsByLetter[key] = [];
        wordsByLetter[key].push(processed);
        processedWords++;
      }
    } catch (e) {
      // Skip malformed lines
    }
    
    if (totalWords % 10000 === 0) {
      console.log(`Processed ${totalWords} lines, ${processedWords} valid entries...`);
    }
  }

  console.log(`\nTotal lines: ${totalWords}`);
  console.log(`Valid entries: ${processedWords}`);

  // Write sharded files
  for (const [letter, words] of Object.entries(wordsByLetter)) {
    const filePath = path.join(outputDir, `${letter}.json`);
    fs.writeFileSync(filePath, JSON.stringify(words, null, 2));
    console.log(`Written ${words.length} words to ${letter}.json`);
  }

  // Write index file
  const index = Object.entries(wordsByLetter).map(([letter, words]) => ({
    letter,
    count: words.length,
    words: words.map(w => w.word).sort()
  }));
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log('\nDone! Index written to index.json');
}

main().catch(console.error);

