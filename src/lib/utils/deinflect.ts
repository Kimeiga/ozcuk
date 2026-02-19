/**
 * Turkish Deinflection System
 *
 * Removes suffixes from Turkish words to find the dictionary form.
 * Turkish is agglutinative, so words can have many suffixes stacked.
 *
 * Handles:
 * - Verb tenses (present, past, future, aorist, etc.)
 * - Irregular verbs (gitmek→gider, yemek→yiyor, demek→diyor)
 * - Consonant softening (gidiyorum→gitmek)
 * - Noun cases (accusative, dative, locative, etc.)
 * - Possessive suffixes
 * - Compound tenses
 */

import { VOWELS, getLastVowel } from './vowel-harmony';

export interface DeinflectionResult {
  dictionaryForm: string;
  originalWord: string;
  suffixes: string[];       // Technical suffix names
  suffixLabels: string[];   // Human-readable Turkish labels
  possiblePos: string[];
}

// ============================================
// IRREGULAR VERB MAPPINGS
// ============================================

// Verbs with consonant softening: root form → dictionary form mapping
// These verbs soften t→d when followed by a vowel
const CONSONANT_SOFTENING_VERBS: Record<string, string> = {
  'gid': 'git',   // gitmek - to go (gidiyorum → gitmek)
  'ed': 'et',     // etmek - to do (ediyorum → etmek)
  'tad': 'tat',   // tatmak - to taste
  'güd': 'güt',   // gütmek - to herd
  'did': 'dit',   // ditmek - to shred
};

// Verbs with vowel contraction in present tense
// yi/di in conjugated form → ye/de in infinitive
const VOWEL_CONTRACTION_VERBS: Record<string, string> = {
  'yi': 'ye',     // yemek - to eat (yiyorum → yemek)
  'di': 'de',     // demek - to say (diyorum → demek)
};

// Irregular aorist forms → infinitive root
const IRREGULAR_AORIST_TO_ROOT: Record<string, string> = {
  'gider': 'git',   // gider → gitmek
  'eder': 'et',     // eder → etmek
  'tadar': 'tat',   // tadar → tatmak
  'yer': 'ye',      // yer → yemek (also irregular)
  'der': 'de',      // der → demek
};

// ============================================
// SUFFIX LABELS (Turkish)
// ============================================

const SUFFIX_LABELS: Record<string, string> = {
  // Verb tenses
  'present': 'şimdiki zaman',
  'past': "di'li geçmiş",
  'future': 'gelecek zaman',
  'aorist': 'geniş zaman',
  'reported': "miş'li geçmiş",
  'conditional': 'şart kipi',
  'necessitative': 'gereklilik',
  'optative': 'istek kipi',
  'imperative': 'emir kipi',
  'negative': 'olumsuz',
  // Person markers
  '1sg': '1. tekil (ben)',
  '2sg': '2. tekil (sen)',
  '3sg': '3. tekil (o)',
  '1pl': '1. çoğul (biz)',
  '2pl': '2. çoğul (siz)',
  '3pl': '3. çoğul (onlar)',
  // Noun cases
  'accusative': 'belirtme hali (-i)',
  'dative': 'yönelme hali (-e)',
  'locative': 'bulunma hali (-de)',
  'ablative': 'ayrılma hali (-den)',
  'genitive': 'tamlayan (-in)',
  'plural': 'çoğul (-ler)',
  // Possessive
  'poss1sg': 'iyelik 1. tekil (-im)',
  'poss2sg': 'iyelik 2. tekil (-in)',
  'poss3sg': 'iyelik 3. tekil (-i)',
  'poss1pl': 'iyelik 1. çoğul (-imiz)',
  'poss2pl': 'iyelik 2. çoğul (-iniz)',
  'poss3pl': 'iyelik 3. çoğul (-leri)',
};

// Helper to get Turkish label for suffix
function getSuffixLabel(suffix: string): string {
  return SUFFIX_LABELS[suffix] || suffix;
}

// ============================================
// VERB TENSE PATTERNS
// ============================================

interface VerbPattern {
  pattern: RegExp;
  tense: string;
  person?: string;
  negative?: boolean;
}

const VERB_TENSE_PATTERNS: VerbPattern[] = [
  // Present continuous: -iyor + person
  { pattern: /([ıiuü])yorum$/i, tense: 'present', person: '1sg' },
  { pattern: /([ıiuü])yorsun$/i, tense: 'present', person: '2sg' },
  { pattern: /([ıiuü])yor$/i, tense: 'present', person: '3sg' },
  { pattern: /([ıiuü])yoruz$/i, tense: 'present', person: '1pl' },
  { pattern: /([ıiuü])yorsunuz$/i, tense: 'present', person: '2pl' },
  { pattern: /([ıiuü])yorlar$/i, tense: 'present', person: '3pl' },

  // Present continuous negative: -miyor
  { pattern: /m([ıiuü])yorum$/i, tense: 'present', person: '1sg', negative: true },
  { pattern: /m([ıiuü])yorsun$/i, tense: 'present', person: '2sg', negative: true },
  { pattern: /m([ıiuü])yor$/i, tense: 'present', person: '3sg', negative: true },
  { pattern: /m([ıiuü])yoruz$/i, tense: 'present', person: '1pl', negative: true },
  { pattern: /m([ıiuü])yorsunuz$/i, tense: 'present', person: '2pl', negative: true },
  { pattern: /m([ıiuü])yorlar$/i, tense: 'present', person: '3pl', negative: true },

  // Simple past: -di + person
  { pattern: /(d[ıiuü]|t[ıiuü])m$/i, tense: 'past', person: '1sg' },
  { pattern: /(d[ıiuü]|t[ıiuü])n$/i, tense: 'past', person: '2sg' },
  { pattern: /(d[ıiuü]|t[ıiuü])$/i, tense: 'past', person: '3sg' },
  { pattern: /(d[ıiuü]|t[ıiuü])k$/i, tense: 'past', person: '1pl' },
  { pattern: /(d[ıiuü]|t[ıiuü])n[ıiuü]z$/i, tense: 'past', person: '2pl' },
  { pattern: /(d[ıiuü]|t[ıiuü])l[ae]r$/i, tense: 'past', person: '3pl' },

  // Future: -ecek + person
  { pattern: /(y?[ae]c[ae][kğ])[ıiuü]m$/i, tense: 'future', person: '1sg' },
  { pattern: /(y?[ae]c[ae][kğ])s[ıiuü]n$/i, tense: 'future', person: '2sg' },
  { pattern: /(y?[ae]c[ae][kğ])$/i, tense: 'future', person: '3sg' },
  { pattern: /(y?[ae]c[ae][kğ])[ıiuü]z$/i, tense: 'future', person: '1pl' },
  { pattern: /(y?[ae]c[ae][kğ])s[ıiuü]n[ıiuü]z$/i, tense: 'future', person: '2pl' },
  { pattern: /(y?[ae]c[ae][kğ])l[ae]r$/i, tense: 'future', person: '3pl' },

  // Reported past: -miş + person
  { pattern: /m[ıiuü]ş[ıiuü]m$/i, tense: 'reported', person: '1sg' },
  { pattern: /m[ıiuü]şs[ıiuü]n$/i, tense: 'reported', person: '2sg' },
  { pattern: /m[ıiuü]ş$/i, tense: 'reported', person: '3sg' },
  { pattern: /m[ıiuü]ş[ıiuü]z$/i, tense: 'reported', person: '1pl' },
  { pattern: /m[ıiuü]şs[ıiuü]n[ıiuü]z$/i, tense: 'reported', person: '2pl' },
  { pattern: /m[ıiuü]şl[ae]r$/i, tense: 'reported', person: '3pl' },

  // Aorist: -ir/-er/-ar + person
  { pattern: /([ıiuü]r|[ae]r)[ıiuü]m$/i, tense: 'aorist', person: '1sg' },
  { pattern: /([ıiuü]r|[ae]r)s[ıiuü]n$/i, tense: 'aorist', person: '2sg' },
  { pattern: /([ıiuü]r|[ae]r)$/i, tense: 'aorist', person: '3sg' },
  { pattern: /([ıiuü]r|[ae]r)[ıiuü]z$/i, tense: 'aorist', person: '1pl' },
  { pattern: /([ıiuü]r|[ae]r)s[ıiuü]n[ıiuü]z$/i, tense: 'aorist', person: '2pl' },
  { pattern: /([ıiuü]r|[ae]r)l[ae]r$/i, tense: 'aorist', person: '3pl' },

  // Aorist negative: -mez/-maz
  { pattern: /m[ae]m$/i, tense: 'aorist', person: '1sg', negative: true },
  { pattern: /m[ae]zs[ıiuü]n$/i, tense: 'aorist', person: '2sg', negative: true },
  { pattern: /m[ae]z$/i, tense: 'aorist', person: '3sg', negative: true },
  { pattern: /m[ae]y[ıiuü]z$/i, tense: 'aorist', person: '1pl', negative: true },
  { pattern: /m[ae]zs[ıiuü]n[ıiuü]z$/i, tense: 'aorist', person: '2pl', negative: true },
  { pattern: /m[ae]zl[ae]r$/i, tense: 'aorist', person: '3pl', negative: true },

  // Conditional: -se + person
  { pattern: /s[ae]m$/i, tense: 'conditional', person: '1sg' },
  { pattern: /s[ae]n$/i, tense: 'conditional', person: '2sg' },
  { pattern: /s[ae]$/i, tense: 'conditional', person: '3sg' },
  { pattern: /s[ae]k$/i, tense: 'conditional', person: '1pl' },
  { pattern: /s[ae]n[ıiuü]z$/i, tense: 'conditional', person: '2pl' },
  { pattern: /s[ae]l[ae]r$/i, tense: 'conditional', person: '3pl' },

  // Necessitative: -meli + person
  { pattern: /m[ae]l[ıiuü]y[ıiuü]m$/i, tense: 'necessitative', person: '1sg' },
  { pattern: /m[ae]l[ıiuü]s[ıiuü]n$/i, tense: 'necessitative', person: '2sg' },
  { pattern: /m[ae]l[ıiuü]$/i, tense: 'necessitative', person: '3sg' },
  { pattern: /m[ae]l[ıiuü]y[ıiuü]z$/i, tense: 'necessitative', person: '1pl' },
  { pattern: /m[ae]l[ıiuü]s[ıiuü]n[ıiuü]z$/i, tense: 'necessitative', person: '2pl' },
  { pattern: /m[ae]l[ıiuü]l[ae]r$/i, tense: 'necessitative', person: '3pl' },

  // Optative: -e/-a + person
  { pattern: /(y?[ae])y[ıiuü]m$/i, tense: 'optative', person: '1sg' },
  { pattern: /(y?[ae])s[ıiuü]n$/i, tense: 'optative', person: '2sg' },
  { pattern: /(y?[ae])$/i, tense: 'optative', person: '3sg' },
  { pattern: /(y?[ae])l[ıiuü]m$/i, tense: 'optative', person: '1pl' },
  { pattern: /(y?[ae])s[ıiuü]n[ıiuü]z$/i, tense: 'optative', person: '2pl' },
  { pattern: /(y?[ae])l[ae]r$/i, tense: 'optative', person: '3pl' },

  // Imperative
  { pattern: /s[ıiuü]n$/i, tense: 'imperative', person: '3sg' },
  { pattern: /([ıiuü]n|y[ıiuü]n)$/i, tense: 'imperative', person: '2pl' },
  { pattern: /([ıiuü]n[ıiuü]z|y[ıiuü]n[ıiuü]z)$/i, tense: 'imperative', person: '2pl' },
  { pattern: /s[ıiuü]nl[ae]r$/i, tense: 'imperative', person: '3pl' },
];

// ============================================
// NOUN PATTERNS
// ============================================

interface NounPattern {
  pattern: RegExp;
  suffix: string;
}

const NOUN_CASE_PATTERNS: NounPattern[] = [
  // Ablative (must come before locative - longer pattern)
  { pattern: /(d[ae]n|t[ae]n)$/i, suffix: 'ablative' },
  // Locative
  { pattern: /(d[ae]|t[ae])$/i, suffix: 'locative' },
  // Genitive
  { pattern: /(n[ıiuü]n|[ıiuü]n)$/i, suffix: 'genitive' },
  // Accusative
  { pattern: /(n[ıiuü]|y[ıiuü]|[ıiuü])$/i, suffix: 'accusative' },
  // Dative
  { pattern: /(n[ae]|y[ae]|[ae])$/i, suffix: 'dative' },
  // Plural
  { pattern: /l[ae]r$/i, suffix: 'plural' },
];

// Possessive suffixes
const POSSESSIVE_PATTERNS: NounPattern[] = [
  { pattern: /([ıiuü]m|m)$/i, suffix: 'poss1sg' },
  { pattern: /([ıiuü]n|n)$/i, suffix: 'poss2sg' },
  { pattern: /(s[ıiuü]|[ıiuü])$/i, suffix: 'poss3sg' },
  { pattern: /([ıiuü]m[ıiuü]z|m[ıiuü]z)$/i, suffix: 'poss1pl' },
  { pattern: /([ıiuü]n[ıiuü]z|n[ıiuü]z)$/i, suffix: 'poss2pl' },
  { pattern: /l[ae]r[ıiuü]$/i, suffix: 'poss3pl' },
];

/**
 * Apply irregular verb transformations to get dictionary form
 */
function applyIrregularVerbRules(root: string): string {
  // Check for consonant softening (gid → git)
  for (const [softened, original] of Object.entries(CONSONANT_SOFTENING_VERBS)) {
    if (root === softened || root.endsWith(softened)) {
      return root.slice(0, -softened.length) + original;
    }
  }

  // Check for vowel contraction (yi → ye)
  for (const [contracted, original] of Object.entries(VOWEL_CONTRACTION_VERBS)) {
    if (root === contracted) {
      return original;
    }
  }

  // Check for irregular aorist forms (gider → git)
  for (const [aorist, originalRoot] of Object.entries(IRREGULAR_AORIST_TO_ROOT)) {
    if (root === aorist || root.endsWith(aorist)) {
      return root.slice(0, -aorist.length) + originalRoot;
    }
  }

  return root;
}

/**
 * Get infinitive ending based on vowel harmony
 */
function getInfinitiveEnding(root: string): string {
  const lastVowel = getLastVowel(root);
  return lastVowel && VOWELS.back.includes(lastVowel as typeof VOWELS.back[number]) ? 'mak' : 'mek';
}

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
      // Remove the matched suffix to get the root
      let root = lower.replace(rule.pattern, '');

      // Apply irregular verb rules
      root = applyIrregularVerbRules(root);

      // Add infinitive ending
      const infinitive = root + getInfinitiveEnding(root);

      // Build suffix list
      const suffixes: string[] = [];
      const suffixLabels: string[] = [];

      if (rule.negative) {
        suffixes.push('negative');
        suffixLabels.push(getSuffixLabel('negative'));
      }

      suffixes.push(rule.tense);
      suffixLabels.push(getSuffixLabel(rule.tense));

      if (rule.person) {
        suffixes.push(rule.person);
        suffixLabels.push(getSuffixLabel(rule.person));
      }

      results.push({
        dictionaryForm: infinitive,
        originalWord: word,
        suffixes,
        suffixLabels,
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
          suffixLabels: [getSuffixLabel(rule.suffix)],
          possiblePos: ['noun', 'adjective', 'proper-noun']
        });
      }
    }
  }

  // Try possessive patterns
  for (const rule of POSSESSIVE_PATTERNS) {
    const match = lower.match(rule.pattern);
    if (match) {
      const root = lower.replace(rule.pattern, '');
      if (root.length >= 2) {
        results.push({
          dictionaryForm: root,
          originalWord: word,
          suffixes: [rule.suffix],
          suffixLabels: [getSuffixLabel(rule.suffix)],
          possiblePos: ['noun', 'adjective']
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
      suffixLabels: [],
      possiblePos: ['noun', 'verb', 'adjective', 'adverb']
    });
  }

  // Remove duplicates, keeping the most informative result
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
export function getMorphemes(word: string): { root: string; suffixes: string[]; suffixLabels: string[] } {
  const results = deinflect(word);
  if (results.length > 0) {
    const best = results[0];
    return {
      root: best.dictionaryForm,
      suffixes: best.suffixes,
      suffixLabels: best.suffixLabels
    };
  }
  return { root: word, suffixes: [], suffixLabels: [] };
}

