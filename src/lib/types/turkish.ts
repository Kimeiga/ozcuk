/**
 * Core types for Turkish dictionary data
 */

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'postposition'
  | 'conjunction'
  | 'interjection'
  | 'particle'
  | 'numeral'
  | 'determiner'
  | 'proper-noun'
  | 'suffix'
  | 'prefix'
  | 'phrase'
  | 'proverb'
  | 'other';

export interface TurkishWord {
  word: string;
  pos: PartOfSpeech;
  senses: TurkishSense[];
  pronunciation?: string;
  etymology?: string;
  forms?: WordForm[];
  frequencyRank?: number;
}

export interface TurkishSense {
  glosses: string[];
  tags?: string[];
  examples?: Example[];
  categories?: string[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface Example {
  text: string;
  translation?: string;
}

export interface WordForm {
  form: string;
  tags: string[];
}

// Verb conjugation types
export type TurkishTense =
  // Simple tenses
  | 'aorist'           // Geniş zaman: -r, -ar, -er, -ır, etc.
  | 'present'          // Şimdiki zaman: -yor
  | 'future'           // Gelecek zaman: -ecek, -acak
  | 'past'             // Di'li geçmiş: -dı, -di, -du, -dü
  | 'reported'         // Miş'li geçmiş: -mış, -miş, -muş, -müş
  | 'conditional'      // Şart kipi: -se, -sa
  | 'necessitative'    // Gereklilik: -meli, -malı
  | 'optative'         // İstek kipi: -e, -a
  | 'imperative'       // Emir kipi
  // Compound tenses (hikaye - story/past forms)
  | 'pastContinuous'   // Şimdiki zamanın hikayesi: -yordu
  | 'futurePast'       // Gelecek zamanın hikayesi: -ecekti
  | 'pastReported'     // Miş'li geçmişin hikayesi: -mıştı
  | 'aoristPast'       // Geniş zamanın hikayesi: -rdı
  // Compound tenses (rivayet - reported forms)
  | 'pastContinuousReported'; // Şimdiki zamanın rivayeti: -yormuş

export type Person = 'ben' | 'sen' | 'o' | 'biz' | 'siz' | 'onlar';

export type Polarity = 'positive' | 'negative' | 'question' | 'negative-question';

export interface ConjugatedForm {
  form: string;
  person: Person;
  tense: TurkishTense;
  polarity: Polarity;
}

export interface ConjugationTable {
  infinitive: string;
  root: string;
  vowelType: VowelHarmonyType;
  tenses: TenseConjugation[];
}

export interface TenseConjugation {
  tense: TurkishTense;
  label: string;
  labelTr: string;
  forms: PersonForms;
}

export interface PersonForms {
  ben: PolarityForms;
  sen: PolarityForms;
  o: PolarityForms;
  biz: PolarityForms;
  siz: PolarityForms;
  onlar: PolarityForms;
}

export interface PolarityForms {
  positive: string;
  negative: string;
  question: string;
  negativeQuestion: string;
}

// Vowel harmony types
export type VowelHarmonyType = 'e-type' | 'a-type';

export interface DeinflectionResult {
  root: string;
  pos: PartOfSpeech[];
  suffixes: SuffixInfo[];
  originalWord: string;
}

export interface SuffixInfo {
  suffix: string;
  meaning: string;
  type: 'tense' | 'person' | 'case' | 'possession' | 'plural' | 'other';
}

// Dictionary entry for storage/display
export interface DictionaryEntry {
  key: string;
  words: TurkishWord[];
  relatedWords?: string[];
}

