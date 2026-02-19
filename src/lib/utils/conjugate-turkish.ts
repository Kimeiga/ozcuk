/**
 * Turkish Verb Conjugation Engine
 *
 * Handles all major Turkish tenses for all persons and polarities.
 * Includes irregular verb handling and compound tenses.
 *
 * Turkish verb structure: ROOT + (negation) + tense + person
 */

import type { TurkishTense, Person, ConjugationTable, TenseConjugation, PersonForms } from '$lib/types/turkish';
import {
  getVerbRoot,
  getLastVowel,
  getTwoWayHarmony,
  getFourWayHarmony,
  rootEndsInVowel,
  endsWithVoicelessConsonant,
  isEType
} from './vowel-harmony';

// ============================================
// IRREGULAR VERBS
// ============================================

/**
 * Irregular verbs with special aorist forms
 * gitmek → gider (not gitir) - consonant softening
 * etmek → eder (not etir) - consonant softening
 * yemek → yer (not yeir) - vowel contraction
 * demek → der (not deir) - vowel contraction
 */
const IRREGULAR_AORIST: Record<string, string> = {
  'git': 'gider',   // gitmek - to go
  'et': 'eder',     // etmek - to do
  'tat': 'tadar',   // tatmak - to taste
};

/**
 * Verbs with vowel contraction (e→i before -yor)
 * yemek → yiyor (not yeyor)
 * demek → diyor (not deyor)
 */
const VOWEL_CONTRACTION_VERBS: Record<string, string> = {
  'ye': 'yi',    // yemek - to eat
  'de': 'di',    // demek - to say
};

/**
 * Verbs with consonant softening (t→d when followed by vowel)
 */
const CONSONANT_SOFTENING_ROOTS = ['git', 'et', 'tat', 'güt', 'dit'];

// ============================================
// PERSON SUFFIXES
// ============================================

const PERSON_SUFFIXES = {
  // Type 1: Used with aorist, future, reported past (after consonant)
  type1: {
    ben: 'Im',    // gel-ir-im
    sen: 'sIn',   // gel-ir-sin
    o: '',        // gel-ir
    biz: 'Iz',    // gel-ir-iz
    siz: 'sInIz', // gel-ir-siniz
    onlar: 'lAr'  // gel-ir-ler
  },
  // Type 2: Used with simple past
  type2: {
    ben: 'm',     // gel-di-m
    sen: 'n',     // gel-di-n
    o: '',        // gel-di
    biz: 'k',     // gel-di-k
    siz: 'nIz',   // gel-di-niz
    onlar: 'lAr'  // gel-di-ler
  },
  // Type 3: Used with present continuous
  type3: {
    ben: 'um',    // gel-iyor-um
    sen: 'sun',   // gel-iyor-sun
    o: '',        // gel-iyor
    biz: 'uz',    // gel-iyor-uz
    siz: 'sunuz', // gel-iyor-sunuz
    onlar: 'lar'  // gel-iyor-lar
  }
};

// ============================================
// TENSE METADATA (including compound tenses)
// ============================================

const TENSE_INFO: Record<TurkishTense, { label: string; labelTr: string }> = {
  present: { label: 'Present Continuous', labelTr: 'Şimdiki Zaman' },
  past: { label: 'Simple Past', labelTr: "Di'li Geçmiş" },
  future: { label: 'Future', labelTr: 'Gelecek Zaman' },
  aorist: { label: 'Simple Present (Aorist)', labelTr: 'Geniş Zaman' },
  reported: { label: 'Reported Past', labelTr: "Miş'li Geçmiş" },
  conditional: { label: 'Conditional', labelTr: 'Şart Kipi' },
  necessitative: { label: 'Necessitative', labelTr: 'Gereklilik Kipi' },
  optative: { label: 'Optative', labelTr: 'İstek Kipi' },
  imperative: { label: 'Imperative', labelTr: 'Emir Kipi' },
  // Compound tenses
  pastContinuous: { label: 'Past Continuous', labelTr: 'Şimdiki Zamanın Hikayesi' },
  futurePast: { label: 'Future in Past', labelTr: 'Gelecek Zamanın Hikayesi' },
  pastReported: { label: 'Past Reported', labelTr: "Miş'li Geçmişin Hikayesi" },
  aoristPast: { label: 'Aorist Past', labelTr: 'Geniş Zamanın Hikayesi' },
  pastContinuousReported: { label: 'Past Continuous Reported', labelTr: 'Şimdiki Zamanın Rivayeti' },
};

/**
 * Apply vowel harmony to a suffix template
 */
function harmonize(stem: string, template: string): string {
  const lastVowel = getLastVowel(stem) || 'e';
  let result = '';
  
  for (const char of template) {
    switch (char) {
      case 'A':
        result += getTwoWayHarmony(lastVowel);
        break;
      case 'I':
        result += getFourWayHarmony(lastVowel);
        break;
      default:
        result += char;
    }
  }
  return result;
}

/**
 * Check if root has irregular aorist form
 */
function hasIrregularAorist(root: string): boolean {
  return root.toLowerCase() in IRREGULAR_AORIST;
}

/**
 * Get irregular aorist base (before person suffix)
 */
function getIrregularAoristBase(root: string): string {
  return IRREGULAR_AORIST[root.toLowerCase()] || root;
}

/**
 * Check if verb has vowel contraction
 */
function hasVowelContraction(root: string): boolean {
  return root.toLowerCase() in VOWEL_CONTRACTION_VERBS;
}

/**
 * Get contracted root for -yor tense
 */
function getContractedRoot(root: string): string {
  return VOWEL_CONTRACTION_VERBS[root.toLowerCase()] || root;
}

/**
 * Check if root requires consonant softening (t→d)
 */
function requiresConsonantSoftening(root: string): boolean {
  return CONSONANT_SOFTENING_ROOTS.includes(root.toLowerCase());
}

/**
 * Apply consonant softening (t→d) for aorist
 */
function softenConsonant(root: string): string {
  if (root.endsWith('t')) {
    return root.slice(0, -1) + 'd';
  }
  return root;
}

/**
 * Get aorist tense suffix
 * Rules:
 * - Monosyllabic verbs ending in consonant: -Ar (gel → gelir, but yap → yapar is exception)
 * - Polysyllabic verbs ending in consonant: -Ir
 * - Verbs ending in vowel: -r
 * - Irregular verbs: git→gid+er, et→ed+er
 */
function getAoristSuffix(root: string): string {
  // Handle irregular verbs with consonant softening
  if (requiresConsonantSoftening(root)) {
    return 'Ar'; // git→gider, et→eder use -Ar after softening
  }

  if (rootEndsInVowel(root)) {
    return 'r';
  }

  // Count syllables (approximate by counting vowels)
  const vowelCount = (root.match(/[aeıioöuü]/gi) || []).length;

  // Monosyllabic verbs that take -Ir (not -Ar)
  const monosyllabicIrVerbs = ['al', 'bil', 'bul', 'dur', 'gel', 'gör', 'kal', 'ol', 'öl', 'san', 'var', 'ver', 'vur'];

  if (vowelCount === 1 && !monosyllabicIrVerbs.includes(root.toLowerCase())) {
    return 'Ar';
  }

  return 'Ir';
}

/**
 * Get the aorist stem (handles irregular verbs)
 */
function getAoristStem(root: string): string {
  // Handle consonant softening verbs: git→gid, et→ed
  if (requiresConsonantSoftening(root)) {
    return softenConsonant(root);
  }
  return root;
}

/**
 * Conjugate a single form
 */
function conjugateForm(root: string, tense: TurkishTense, person: Person, negative: boolean): string {
  let stem = root;

  switch (tense) {
    case 'present': {
      // Present continuous: root + (negative) + yor + person
      // Handle vowel contraction: ye→yi, de→di
      if (hasVowelContraction(root) && !negative) {
        stem = getContractedRoot(root);
        const base = stem + 'yor';
        return base + PERSON_SUFFIXES.type3[person];
      }

      if (negative) {
        const negSuffix = rootEndsInVowel(root) ? 'm' : 'mI';
        stem = root + harmonize(root, negSuffix);
      } else if (rootEndsInVowel(root)) {
        // Drop final vowel before -yor (e.g., bekle → bekliyor)
        stem = root.slice(0, -1);
      }
      const base = stem + (rootEndsInVowel(stem) ? '' : harmonize(stem, 'I')) + 'yor';
      return base + PERSON_SUFFIXES.type3[person];
    }

    case 'past': {
      // Simple past: root + (negative) + DI + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const d = endsWithVoicelessConsonant(stem) ? 't' : 'd';
      const base = stem + d + harmonize(stem, 'I');
      return base + harmonize(base, PERSON_SUFFIXES.type2[person]);
    }

    case 'future': {
      // Future: root + (y)AcAk + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const y = rootEndsInVowel(stem) ? 'y' : '';
      const base = stem + y + harmonize(stem, 'AcAk');
      return base + harmonize(base, PERSON_SUFFIXES.type1[person]);
    }

    case 'aorist': {
      // Aorist: root + (negative) + aorist suffix + person
      // Handle irregular verbs: git→gider, et→eder
      if (negative) {
        const negBase = root + harmonize(root, 'mA');
        if (person === 'o') {
          return negBase + 'z';
        }
        return negBase + harmonize(negBase, PERSON_SUFFIXES.type1[person]);
      }

      // Get aorist stem (handles consonant softening)
      const aoristStem = getAoristStem(root);
      const aoristSuffix = getAoristSuffix(root);
      const base = aoristStem + harmonize(aoristStem, aoristSuffix);
      return base + harmonize(base, PERSON_SUFFIXES.type1[person]);
    }

    case 'reported': {
      // Reported past: root + (negative) + mIş + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const base = stem + harmonize(stem, 'mIş');
      return base + harmonize(base, PERSON_SUFFIXES.type1[person]);
    }

    case 'conditional': {
      // Conditional: root + (negative) + sA + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const base = stem + harmonize(stem, 'sA');
      return base + harmonize(base, PERSON_SUFFIXES.type2[person]);
    }

    case 'necessitative': {
      // Necessitative: root + (negative) + mAlI + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const base = stem + harmonize(stem, 'mAlI');
      return base + harmonize(base, PERSON_SUFFIXES.type1[person]);
    }

    case 'optative': {
      // Optative: root + (y)A + person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const y = rootEndsInVowel(stem) ? 'y' : '';
      const base = stem + y + harmonize(stem, 'A');
      const optativePersons: Record<Person, string> = {
        ben: 'yIm', sen: 'sIn', o: '', biz: 'lIm', siz: 'sInIz', onlar: 'lAr'
      };
      return base + harmonize(base, optativePersons[person]);
    }

    case 'imperative': {
      // Imperative: special forms for each person
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const imperativeEndings: Record<Person, string> = {
        ben: '',     // Not used
        sen: '',     // gel!
        o: 'sIn',    // gelsin
        biz: 'lIm',  // gelelim
        siz: '(y)In',// gelin / geliniz
        onlar: 'sInlAr' // gelsinler
      };
      if (person === 'ben') return '';
      if (person === 'siz') {
        const ending = rootEndsInVowel(stem) ? 'yIn' : 'In';
        return stem + harmonize(stem, ending);
      }
      return stem + harmonize(stem, imperativeEndings[person]);
    }

    // ============================================
    // COMPOUND TENSES (hikaye - past story forms)
    // ============================================

    case 'pastContinuous': {
      // Şimdiki zamanın hikayesi: -yordu
      // geliyordum, geliyordun, geliyordu...
      const presentBase = conjugateForm(root, 'present', person, negative);
      // Remove person suffix and add -du + person
      const yorIndex = presentBase.lastIndexOf('yor');
      if (yorIndex === -1) return presentBase;
      const baseWithYor = presentBase.slice(0, yorIndex + 3);
      const d = 'd';
      const pastSuffix = d + harmonize(baseWithYor, 'I');
      return baseWithYor + pastSuffix + harmonize(baseWithYor + pastSuffix, PERSON_SUFFIXES.type2[person]);
    }

    case 'futurePast': {
      // Gelecek zamanın hikayesi: -ecekti
      // gelecektim, gelecektin, gelecekti...
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const y = rootEndsInVowel(stem) ? 'y' : '';
      const futureBase = stem + y + harmonize(stem, 'AcAk');
      const pastSuffix = 't' + harmonize(futureBase, 'I');
      return futureBase + pastSuffix + harmonize(futureBase + pastSuffix, PERSON_SUFFIXES.type2[person]);
    }

    case 'pastReported': {
      // Miş'li geçmişin hikayesi: -mıştı
      // gelmiştim, gelmiştin, gelmişti...
      if (negative) {
        stem = root + harmonize(root, 'mA');
      }
      const reportedBase = stem + harmonize(stem, 'mIş');
      const pastSuffix = 't' + harmonize(reportedBase, 'I');
      return reportedBase + pastSuffix + harmonize(reportedBase + pastSuffix, PERSON_SUFFIXES.type2[person]);
    }

    case 'aoristPast': {
      // Geniş zamanın hikayesi: -rdı
      // gelirdim, gelirdin, gelirdi...
      if (negative) {
        const negBase = root + harmonize(root, 'mA') + 'z';
        const pastSuffix = 'd' + harmonize(negBase, 'I');
        return negBase + pastSuffix + harmonize(negBase + pastSuffix, PERSON_SUFFIXES.type2[person]);
      }
      const aoristStem = getAoristStem(root);
      const aoristSuffix = getAoristSuffix(root);
      const aoristBase = aoristStem + harmonize(aoristStem, aoristSuffix);
      const pastSuffix = 'd' + harmonize(aoristBase, 'I');
      return aoristBase + pastSuffix + harmonize(aoristBase + pastSuffix, PERSON_SUFFIXES.type2[person]);
    }

    case 'pastContinuousReported': {
      // Şimdiki zamanın rivayeti: -yormuş
      // geliyormuşum, geliyormuşsun, geliyormuş...
      const presentBase = conjugateForm(root, 'present', person, negative);
      const yorIndex = presentBase.lastIndexOf('yor');
      if (yorIndex === -1) return presentBase;
      const baseWithYor = presentBase.slice(0, yorIndex + 3);
      const reportedSuffix = harmonize(baseWithYor, 'mIş');
      return baseWithYor + reportedSuffix + harmonize(baseWithYor + reportedSuffix, PERSON_SUFFIXES.type1[person]);
    }

    default:
      return root;
  }
}

/**
 * Create question form by adding "mI" particle
 */
function makeQuestion(conjugatedForm: string): string {
  // Question particle comes before person suffix in some tenses
  // For simplicity, we append "mI" with harmony
  const lastVowel = getLastVowel(conjugatedForm) || 'i';
  const mi = 'm' + getFourWayHarmony(lastVowel);
  return conjugatedForm + ' ' + mi + '?';
}

/**
 * Get all person forms for a tense
 */
function getPersonForms(root: string, tense: TurkishTense): PersonForms {
  const persons: Person[] = ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'];
  const result: Partial<PersonForms> = {};

  for (const person of persons) {
    const positive = conjugateForm(root, tense, person, false);
    const negative = conjugateForm(root, tense, person, true);

    result[person] = {
      positive,
      negative,
      question: makeQuestion(positive),
      negativeQuestion: makeQuestion(negative)
    };
  }

  return result as PersonForms;
}

// Simple tenses (shown by default)
export const SIMPLE_TENSES: TurkishTense[] = [
  'present', 'past', 'future', 'aorist', 'reported',
  'conditional', 'necessitative', 'optative', 'imperative'
];

// Compound tenses (hikaye - story forms)
export const COMPOUND_TENSES: TurkishTense[] = [
  'pastContinuous', 'futurePast', 'pastReported', 'aoristPast', 'pastContinuousReported'
];

/**
 * Generate complete conjugation table for a verb
 */
export function conjugateVerb(infinitive: string, includeCompound: boolean = false): ConjugationTable {
  const root = getVerbRoot(infinitive);
  const tenses = includeCompound ? [...SIMPLE_TENSES, ...COMPOUND_TENSES] : SIMPLE_TENSES;

  const tenseConjugations: TenseConjugation[] = tenses.map(tense => ({
    tense,
    label: TENSE_INFO[tense].label,
    labelTr: TENSE_INFO[tense].labelTr,
    forms: getPersonForms(root, tense)
  }));

  return {
    infinitive,
    root,
    vowelType: isEType(root) ? 'e-type' : 'a-type',
    tenses: tenseConjugations
  };
}

/**
 * Get a single conjugation for quick lookup
 */
export function getConjugation(
  infinitive: string,
  tense: TurkishTense,
  person: Person,
  negative: boolean = false
): string {
  const root = getVerbRoot(infinitive);
  return conjugateForm(root, tense, person, negative);
}

/**
 * Export tense info for UI
 */
export function getTenseInfo(tense: TurkishTense) {
  return TENSE_INFO[tense];
}

export const ALL_TENSES: TurkishTense[] = [...SIMPLE_TENSES, ...COMPOUND_TENSES];

