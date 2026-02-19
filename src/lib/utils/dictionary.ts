/**
 * Dictionary service for loading and searching Turkish words
 * Fetches from jsDelivr CDN with hash-based sharding (256 buckets)
 */

export interface ProcessedWord {
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

// CDN base URL for dictionary data
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main';

// Cache for loaded shards and word index
const shardCache = new Map<string, ProcessedWord[]>();
let wordIndex: Record<string, string> | null = null;

/**
 * Normalize Turkish characters for lookup
 */
export function normalizeForLookup(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * Hash function for word sharding (djb2)
 */
function hashWord(word: string): number {
  let hash = 5381;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) + hash) + word.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Get the shard key (00-ff) for a word using hash
 */
export function getShardKey(word: string): string {
  const normalized = normalizeForLookup(word);
  const hash = hashWord(normalized);
  return (hash % 256).toString(16).padStart(2, '0');
}

/**
 * Load the word index (maps word -> shard key)
 */
async function loadWordIndex(): Promise<Record<string, string>> {
  if (wordIndex) return wordIndex;

  try {
    const response = await fetch(`${CDN_BASE}/index.json`);
    wordIndex = await response.json();
    return wordIndex!;
  } catch (e) {
    console.error('Failed to load word index:', e);
    return {};
  }
}

/**
 * Load a shard from CDN
 */
export async function loadWordShard(shardKey: string): Promise<ProcessedWord[]> {
  if (shardCache.has(shardKey)) {
    return shardCache.get(shardKey)!;
  }

  try {
    const response = await fetch(`${CDN_BASE}/shards/${shardKey}/words.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json() as ProcessedWord[];
    shardCache.set(shardKey, data);
    return data;
  } catch (e) {
    console.error(`Failed to load shard: ${shardKey}`, e);
    return [];
  }
}

/**
 * Find a word by exact match
 */
export async function findWord(query: string): Promise<ProcessedWord[]> {
  const normalized = normalizeForLookup(query);
  const shardKey = getShardKey(normalized);
  const words = await loadWordShard(shardKey);
  
  return words.filter(w => normalizeForLookup(w.word) === normalized);
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if query matches any definition/gloss
 */
export function matchesDefinition(word: ProcessedWord, query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  for (const sense of word.senses) {
    for (const gloss of sense.glosses) {
      if (gloss.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Search words by prefix using word index
 */
export async function searchWords(query: string, limit: number = 20): Promise<ProcessedWord[]> {
  if (!query || query.length < 1) return [];

  const normalized = normalizeForLookup(query);

  // Load the word index for prefix matching
  const index = await loadWordIndex();

  // Find all words that match the query (prefix match on index keys)
  const matchingWords: string[] = [];
  for (const word of Object.keys(index)) {
    if (word === normalized || word.startsWith(normalized)) {
      matchingWords.push(word);
      if (matchingWords.length >= limit * 2) break; // Get more than needed for ranking
    }
  }

  // Group by shard and fetch
  const shardGroups = new Map<string, string[]>();
  for (const word of matchingWords) {
    const shardKey = index[word];
    if (!shardGroups.has(shardKey)) {
      shardGroups.set(shardKey, []);
    }
    shardGroups.get(shardKey)!.push(word);
  }

  // Fetch needed shards in parallel
  const shardPromises = Array.from(shardGroups.keys()).map(key => loadWordShard(key));
  const shardResults = await Promise.all(shardPromises);

  // Build a map of word -> ProcessedWord
  const wordMap = new Map<string, ProcessedWord>();
  for (const shard of shardResults) {
    for (const word of shard) {
      wordMap.set(normalizeForLookup(word.word), word);
    }
  }

  // Categorize and rank matches
  const exactMatches: ProcessedWord[] = [];
  const prefixMatches: ProcessedWord[] = [];

  for (const wordKey of matchingWords) {
    const word = wordMap.get(wordKey);
    if (!word) continue;

    if (wordKey === normalized) {
      exactMatches.push(word);
    } else {
      prefixMatches.push(word);
    }
  }

  // Sort prefix matches by length (shorter = better match)
  prefixMatches.sort((a, b) => a.word.length - b.word.length);

  // Combine results
  const results = [...exactMatches, ...prefixMatches].slice(0, limit);

  return results;
}

/**
 * Get part of speech display label
 */
export function getPosLabel(pos: string): { en: string; tr: string } {
  const labels: Record<string, { en: string; tr: string }> = {
    'noun': { en: 'Noun', tr: 'İsim' },
    'verb': { en: 'Verb', tr: 'Fiil' },
    'adjective': { en: 'Adjective', tr: 'Sıfat' },
    'adverb': { en: 'Adverb', tr: 'Zarf' },
    'pronoun': { en: 'Pronoun', tr: 'Zamir' },
    'postposition': { en: 'Postposition', tr: 'Edat' },
    'conjunction': { en: 'Conjunction', tr: 'Bağlaç' },
    'interjection': { en: 'Interjection', tr: 'Ünlem' },
    'particle': { en: 'Particle', tr: 'İlgeç' },
    'numeral': { en: 'Numeral', tr: 'Sayı' },
    'determiner': { en: 'Determiner', tr: 'Belirteç' },
    'proper-noun': { en: 'Proper Noun', tr: 'Özel İsim' },
    'suffix': { en: 'Suffix', tr: 'Sonek' },
    'prefix': { en: 'Prefix', tr: 'Önek' },
    'phrase': { en: 'Phrase', tr: 'Deyim' },
    'proverb': { en: 'Proverb', tr: 'Atasözü' }
  };
  
  return labels[pos] || { en: pos, tr: pos };
}

/**
 * Check if word is a verb (for conjugation)
 */
export function isVerb(word: ProcessedWord): boolean {
  return word.pos === 'verb';
}

/**
 * Check if word ends with -mek/-mak (infinitive form)
 */
export function isInfinitive(word: string): boolean {
  const lower = word.toLowerCase();
  return lower.endsWith('mek') || lower.endsWith('mak');
}

