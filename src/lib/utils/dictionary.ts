/**
 * Dictionary service for loading and searching Turkish words
 * Fetches individual word files from jsDelivr CDN
 * URL pattern: /words/{word}.json
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

// Cache for loaded words and word list
const wordCache = new Map<string, ProcessedWord>();
let wordList: string[] | null = null;

/**
 * Normalize Turkish characters for lookup
 */
export function normalizeForLookup(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * Load the word index (array of all words for autocomplete)
 */
async function loadWordIndex(): Promise<string[]> {
  if (wordList) return wordList;

  try {
    const response = await fetch(`${CDN_BASE}/index.json`);
    wordList = await response.json() as string[];
    return wordList;
  } catch (e) {
    console.error('Failed to load word index:', e);
    return [];
  }
}

/**
 * Load a single word from CDN
 */
async function loadWord(word: string): Promise<ProcessedWord | null> {
  const normalized = normalizeForLookup(word);

  if (wordCache.has(normalized)) {
    return wordCache.get(normalized)!;
  }

  try {
    const encoded = encodeURIComponent(normalized);
    const response = await fetch(`${CDN_BASE}/words/${encoded}.json`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as ProcessedWord;
    wordCache.set(normalized, data);
    return data;
  } catch (e) {
    console.error(`Failed to load word: ${word}`, e);
    return null;
  }
}

/**
 * Find a word by exact match
 */
export async function findWord(query: string): Promise<ProcessedWord[]> {
  const word = await loadWord(query);
  return word ? [word] : [];
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

  // Load the word index (array of all words)
  const allWords = await loadWordIndex();

  // Find all words that match the query (exact or prefix match)
  const matchingWords: string[] = [];
  for (const word of allWords) {
    if (word === normalized || word.startsWith(normalized)) {
      matchingWords.push(word);
      if (matchingWords.length >= limit * 2) break; // Get more than needed for ranking
    }
  }

  // Fetch individual word files in parallel (limit concurrent requests)
  const batchSize = 10;
  const results: ProcessedWord[] = [];

  for (let i = 0; i < matchingWords.length && results.length < limit; i += batchSize) {
    const batch = matchingWords.slice(i, i + batchSize);
    const wordPromises = batch.map(w => loadWord(w));
    const wordResults = await Promise.all(wordPromises);

    for (const word of wordResults) {
      if (word) {
        results.push(word);
        if (results.length >= limit) break;
      }
    }
  }

  // Categorize and rank matches
  const exactMatches: ProcessedWord[] = [];
  const prefixMatches: ProcessedWord[] = [];

  for (const word of results) {
    if (normalizeForLookup(word.word) === normalized) {
      exactMatches.push(word);
    } else {
      prefixMatches.push(word);
    }
  }

  // Sort prefix matches by length (shorter = better match)
  prefixMatches.sort((a, b) => a.word.length - b.word.length);

  // Combine results
  return [...exactMatches, ...prefixMatches].slice(0, limit);
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

// Reverse index cache (English word -> Turkish words)
let reverseIndex: Map<string, string[]> | null = null;

/**
 * Load or build the reverse lookup index (English -> Turkish)
 */
async function loadReverseIndex(): Promise<Map<string, string[]>> {
  if (reverseIndex) return reverseIndex;

  try {
    // Try to load pre-built reverse index
    const response = await fetch(`${CDN_BASE}/reverse-index.json`);
    if (response.ok) {
      const data = await response.json() as Record<string, string[]>;
      reverseIndex = new Map(Object.entries(data));
      return reverseIndex;
    }
  } catch (e) {
    console.error('Failed to load reverse index:', e);
  }

  // Return empty map if no index available
  reverseIndex = new Map();
  return reverseIndex;
}

/**
 * Search English glosses to find Turkish words (reverse lookup)
 */
export async function searchEnglishToTurkish(query: string, limit: number = 20): Promise<ProcessedWord[]> {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const reverseIdx = await loadReverseIndex();

  // Find matching English words from the reverse index
  const matchingTurkish: Set<string> = new Set();

  for (const [englishWord, turkishWords] of reverseIdx.entries()) {
    if (englishWord.includes(normalizedQuery) || normalizedQuery.includes(englishWord)) {
      for (const tw of turkishWords) {
        matchingTurkish.add(tw);
        if (matchingTurkish.size >= limit * 2) break;
      }
    }
    if (matchingTurkish.size >= limit * 2) break;
  }

  // Fetch the Turkish words
  const results: ProcessedWord[] = [];
  const wordArray = Array.from(matchingTurkish);

  for (let i = 0; i < wordArray.length && results.length < limit; i += 10) {
    const batch = wordArray.slice(i, i + 10);
    const wordPromises = batch.map(w => loadWord(w));
    const wordResults = await Promise.all(wordPromises);

    for (const word of wordResults) {
      if (word) {
        // Verify the word actually contains the query in a gloss
        if (matchesDefinition(word, normalizedQuery)) {
          results.push(word);
          if (results.length >= limit) break;
        }
      }
    }
  }

  return results;
}

