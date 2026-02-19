/**
 * Turkish Vowel Harmony System
 * 
 * Turkish has 8 vowels divided into:
 * - Front vowels: e, i, ö, ü
 * - Back vowels: a, ı, o, u
 * 
 * And also:
 * - Rounded: o, ö, u, ü
 * - Unrounded: a, e, ı, i
 * 
 * Vowel harmony rules:
 * 1. Two-way (e/a): Front vowels → e, Back vowels → a
 * 2. Four-way (i/ı/u/ü): Based on both front/back and rounded/unrounded
 */

export const VOWELS = {
  front: ['e', 'i', 'ö', 'ü'],
  back: ['a', 'ı', 'o', 'u'],
  rounded: ['o', 'ö', 'u', 'ü'],
  unrounded: ['a', 'e', 'ı', 'i'],
  all: ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']
} as const;

export const CONSONANTS = {
  voiced: ['b', 'c', 'd', 'g', 'ğ', 'j', 'l', 'm', 'n', 'r', 'v', 'y', 'z'],
  voiceless: ['ç', 'f', 'h', 'k', 'p', 's', 'ş', 't'],
  // Consonants that cause voicing changes
  softening: ['p', 't', 'k', 'ç'] // p→b, t→d, k→ğ, ç→c when followed by vowel
} as const;

export type VowelCategory = 'front-unrounded' | 'front-rounded' | 'back-unrounded' | 'back-rounded';

/**
 * Get the last vowel from a word
 */
export function getLastVowel(word: string): string | null {
  const normalized = word.toLowerCase();
  for (let i = normalized.length - 1; i >= 0; i--) {
    if (VOWELS.all.includes(normalized[i] as any)) {
      return normalized[i];
    }
  }
  return null;
}

/**
 * Determine the vowel category for harmony purposes
 */
export function getVowelCategory(vowel: string): VowelCategory {
  const v = vowel.toLowerCase();
  const isFront = VOWELS.front.includes(v as any);
  const isRounded = VOWELS.rounded.includes(v as any);

  if (isFront && !isRounded) return 'front-unrounded';  // e, i
  if (isFront && isRounded) return 'front-rounded';      // ö, ü
  if (!isFront && !isRounded) return 'back-unrounded';   // a, ı
  return 'back-rounded';                                  // o, u
}

/**
 * Get the harmonized vowel for two-way harmony (e/a)
 */
export function getTwoWayHarmony(lastVowel: string): 'e' | 'a' {
  return VOWELS.front.includes(lastVowel.toLowerCase() as any) ? 'e' : 'a';
}

/**
 * Get the harmonized vowel for four-way harmony (i/ı/u/ü)
 */
export function getFourWayHarmony(lastVowel: string): 'i' | 'ı' | 'u' | 'ü' {
  const category = getVowelCategory(lastVowel);
  switch (category) {
    case 'front-unrounded': return 'i';
    case 'front-rounded': return 'ü';
    case 'back-unrounded': return 'ı';
    case 'back-rounded': return 'u';
  }
}

/**
 * Check if a word uses front vowels (e-type harmony)
 */
export function isEType(word: string): boolean {
  const lastVowel = getLastVowel(word);
  if (!lastVowel) return true; // Default to e-type
  return VOWELS.front.includes(lastVowel as any);
}

/**
 * Check if a word ends with a voiceless consonant
 */
export function endsWithVoicelessConsonant(word: string): boolean {
  const lastChar = word[word.length - 1]?.toLowerCase();
  return CONSONANTS.voiceless.includes(lastChar as any);
}

/**
 * Apply consonant assimilation for d/t alternation
 * d becomes t after voiceless consonants
 */
export function getConsonantD(word: string): 'd' | 't' {
  return endsWithVoicelessConsonant(word) ? 't' : 'd';
}

/**
 * Apply suffix to word with vowel harmony
 * Suffix template uses:
 * - A = two-way vowel (e/a)
 * - I = four-way vowel (i/ı/u/ü)
 * - D = consonant that becomes d/t based on preceding consonant
 */
export function applySuffix(stem: string, suffixTemplate: string): string {
  const lastVowel = getLastVowel(stem);
  if (!lastVowel) return stem + suffixTemplate;

  let result = '';
  for (const char of suffixTemplate) {
    switch (char) {
      case 'A':
        result += getTwoWayHarmony(lastVowel);
        break;
      case 'I':
        result += getFourWayHarmony(lastVowel);
        break;
      case 'D':
        result += getConsonantD(stem);
        break;
      default:
        result += char;
    }
  }
  return stem + result;
}

/**
 * Get the verb root from infinitive form
 * Removes -mek/-mak ending
 */
export function getVerbRoot(infinitive: string): string {
  const lower = infinitive.toLowerCase();
  if (lower.endsWith('mek') || lower.endsWith('mak')) {
    return infinitive.slice(0, -3);
  }
  return infinitive;
}

/**
 * Check if verb root ends in a vowel
 */
export function rootEndsInVowel(root: string): boolean {
  const lastChar = root[root.length - 1]?.toLowerCase();
  return VOWELS.all.includes(lastChar as any);
}

