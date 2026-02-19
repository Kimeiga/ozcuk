/**
 * Turkish Deinflection System
 * 
 * Removes suffixes from Turkish words to find the dictionary form.
 * Turkish is agglutinative, so words can have many suffixes stacked.
 */

import { VOWELS, getLastVowel, getFourWayHarmony, getTwoWayHarmony } from './vowel-harmony';

export interface DeinflectionResult {
  dictionaryForm: string;
  originalWord: string;
  suffixes: string[];
  possiblePos: string[];
}

// Common verb endings to strip
const VERB_TENSE_PATTERNS = [
  // Present continuous
  { pattern: /([ıiuü])yor(um|sun|sunuz|uz|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Simple past
  { pattern: /(d[ıiuü]|t[ıiuü])(m|n|k|nız|niz|nuz|nüz|lar|ler)?$/i, replacement: '', addEnding: 'mek' },
  // Future
  { pattern: /(y?[ae]c[ae][kğ])(ım|sın|sınız|ız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Reported past
  { pattern: /m[ıiuü]ş(ım|sın|sınız|ız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Aorist positive  
  { pattern: /([ıiuü]r|[ae]r)(ım|sın|sınız|ız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Aorist negative
  { pattern: /m[ae]z?(sın|sınız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Conditional
  { pattern: /s[ae](m|n|k|nız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Necessitative
  { pattern: /m[ae]l[ıiuü](yım|sın|sınız|yız|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Optative
  { pattern: /(y?[ae])(yım|sın|sınız|lım|lar)?$/i, replacement: '', addEnding: 'mek' },
  // Imperative
  { pattern: /(s[ıiuü]n|[ıiuü]n|[ıiuü]nız|s[ıiuü]nlar)$/i, replacement: '', addEnding: 'mek' },
  // Infinitive already - just return as is
  { pattern: /m[ae]k$/i, replacement: 'mek', addEnding: '' },
];

// Noun case endings
const NOUN_CASE_PATTERNS = [
  // Accusative
  { pattern: /([ıiuü]|y[ıiuü]|n[ıiuü])$/i, suffix: 'accusative' },
  // Dative
  { pattern: /([ae]|y[ae]|n[ae])$/i, suffix: 'dative' },
  // Locative
  { pattern: /(d[ae]|t[ae])$/i, suffix: 'locative' },
  // Ablative
  { pattern: /(d[ae]n|t[ae]n)$/i, suffix: 'ablative' },
  // Genitive
  { pattern: /([ıiuü]n|n[ıiuü]n)$/i, suffix: 'genitive' },
  // Plural
  { pattern: /l[ae]r$/i, suffix: 'plural' },
];

/**
 * Attempt to deinflect a Turkish word
 */
export function deinflect(word: string): DeinflectionResult[] {
  const results: DeinflectionResult[] = [];
  const lower = word.toLowerCase();
  
  // Try verb patterns
  for (const rule of VERB_TENSE_PATTERNS) {
    const match = lower.match(rule.pattern);
    if (match) {
      let root = lower.replace(rule.pattern, rule.replacement);
      
      // Determine correct infinitive ending based on vowel harmony
      if (rule.addEnding === 'mek') {
        const lastVowel = getLastVowel(root);
        const ending = lastVowel && VOWELS.back.includes(lastVowel as any) ? 'mak' : 'mek';
        root = root + ending;
      }
      
      results.push({
        dictionaryForm: root,
        originalWord: word,
        suffixes: [match[0]],
        possiblePos: ['verb']
      });
    }
  }
  
  // Try noun case patterns
  for (const rule of NOUN_CASE_PATTERNS) {
    const match = lower.match(rule.pattern);
    if (match) {
      const root = lower.replace(rule.pattern, '');
      if (root.length >= 2) {
        results.push({
          dictionaryForm: root,
          originalWord: word,
          suffixes: [rule.suffix],
          possiblePos: ['noun', 'adjective', 'proper-noun']
        });
      }
    }
  }
  
  // Always include the original word as a possible form
  if (results.length === 0) {
    results.push({
      dictionaryForm: lower,
      originalWord: word,
      suffixes: [],
      possiblePos: ['noun', 'verb', 'adjective', 'adverb']
    });
  }
  
  // Remove duplicates
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.dictionaryForm)) return false;
    seen.add(r.dictionaryForm);
    return true;
  });
}

/**
 * Get morphological breakdown of a word
 */
export function getMorphemes(word: string): { root: string; suffixes: string[] } {
  const results = deinflect(word);
  if (results.length > 0) {
    const best = results[0];
    return {
      root: best.dictionaryForm,
      suffixes: best.suffixes
    };
  }
  return { root: word, suffixes: [] };
}

