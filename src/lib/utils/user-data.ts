/**
 * User data utilities for localStorage-based features
 * - Recently viewed words
 * - Word of the day
 * - Saved words for flashcards
 */

import { browser } from '$app/environment';

const RECENTLY_VIEWED_KEY = 'ozcuk_recently_viewed';
const SAVED_WORDS_KEY = 'ozcuk_saved_words';
const WORD_OF_DAY_KEY = 'ozcuk_word_of_day';
const MAX_RECENT_WORDS = 10;

export interface RecentWord {
  word: string;
  pos: string;
  gloss: string;
  timestamp: number;
}

export interface SavedWord {
  word: string;
  pos: string;
  gloss: string;
  addedAt: number;
  // SM-2 spaced repetition fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}

export interface WordOfDay {
  word: string;
  pos: string;
  gloss: string;
  date: string; // YYYY-MM-DD
}

// ============================================
// RECENTLY VIEWED
// ============================================

export function getRecentlyViewed(): RecentWord[] {
  if (!browser) return [];
  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(word: string, pos: string, gloss: string): void {
  if (!browser) return;
  try {
    let recent = getRecentlyViewed();
    // Remove if already exists
    recent = recent.filter(w => w.word !== word);
    // Add to front
    recent.unshift({ word, pos, gloss, timestamp: Date.now() });
    // Keep only last N
    recent = recent.slice(0, MAX_RECENT_WORDS);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentlyViewed(): void {
  if (!browser) return;
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}

// ============================================
// WORD OF THE DAY
// ============================================

// Curated list of interesting words for Word of the Day
const FEATURED_WORDS = [
  { word: 'özlem', pos: 'noun', gloss: 'longing, yearning, nostalgia' },
  { word: 'huzur', pos: 'noun', gloss: 'peace, tranquility, serenity' },
  { word: 'merak', pos: 'noun', gloss: 'curiosity, interest, worry' },
  { word: 'umut', pos: 'noun', gloss: 'hope, expectation' },
  { word: 'sevgi', pos: 'noun', gloss: 'love, affection' },
  { word: 'mutluluk', pos: 'noun', gloss: 'happiness, joy' },
  { word: 'dostluk', pos: 'noun', gloss: 'friendship' },
  { word: 'güven', pos: 'noun', gloss: 'trust, confidence' },
  { word: 'başarı', pos: 'noun', gloss: 'success, achievement' },
  { word: 'cesaret', pos: 'noun', gloss: 'courage, bravery' },
  { word: 'sabır', pos: 'noun', gloss: 'patience, endurance' },
  { word: 'şükür', pos: 'noun', gloss: 'gratitude, thankfulness' },
  { word: 'keyif', pos: 'noun', gloss: 'pleasure, enjoyment, mood' },
  { word: 'neşe', pos: 'noun', gloss: 'joy, cheerfulness, mirth' },
  { word: 'heyecan', pos: 'noun', gloss: 'excitement, thrill' },
  { word: 'gurur', pos: 'noun', gloss: 'pride, honor' },
  { word: 'şefkat', pos: 'noun', gloss: 'compassion, tenderness' },
  { word: 'vefa', pos: 'noun', gloss: 'loyalty, faithfulness' },
  { word: 'dürüstlük', pos: 'noun', gloss: 'honesty, integrity' },
  { word: 'anlayış', pos: 'noun', gloss: 'understanding, comprehension' },
  { word: 'özgürlük', pos: 'noun', gloss: 'freedom, liberty' },
  { word: 'barış', pos: 'noun', gloss: 'peace' },
  { word: 'adalet', pos: 'noun', gloss: 'justice, fairness' },
  { word: 'bilgelik', pos: 'noun', gloss: 'wisdom' },
  { word: 'erdem', pos: 'noun', gloss: 'virtue, merit' },
  { word: 'hayal', pos: 'noun', gloss: 'dream, imagination, fantasy' },
  { word: 'yaratıcılık', pos: 'noun', gloss: 'creativity' },
  { word: 'hoşgörü', pos: 'noun', gloss: 'tolerance, leniency' },
  { word: 'samimiyet', pos: 'noun', gloss: 'sincerity, intimacy' },
  { word: 'minnettarlık', pos: 'noun', gloss: 'gratitude, thankfulness' },
];

export function getWordOfDay(): WordOfDay {
  const today = new Date().toISOString().split('T')[0];
  
  if (browser) {
    try {
      const cached = localStorage.getItem(WORD_OF_DAY_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as WordOfDay;
        if (parsed.date === today) {
          return parsed;
        }
      }
    } catch {
      // Continue to generate new word
    }
  }
  
  // Generate deterministic word based on date
  const dateNum = parseInt(today.replace(/-/g, ''), 10);
  const index = dateNum % FEATURED_WORDS.length;
  const wordOfDay: WordOfDay = {
    ...FEATURED_WORDS[index],
    date: today
  };
  
  if (browser) {
    try {
      localStorage.setItem(WORD_OF_DAY_KEY, JSON.stringify(wordOfDay));
    } catch {
      // Ignore
    }
  }
  
  return wordOfDay;
}

// ============================================
// SAVED WORDS (for flashcards)
// ============================================

export function getSavedWords(): SavedWord[] {
  if (!browser) return [];
  try {
    const data = localStorage.getItem(SAVED_WORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWord(word: string, pos: string, gloss: string): void {
  if (!browser) return;
  try {
    let saved = getSavedWords();
    if (saved.some(w => w.word === word)) return; // Already saved
    
    saved.push({
      word, pos, gloss,
      addedAt: Date.now(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: Date.now()
    });
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(saved));
  } catch {
    // Ignore
  }
}

export function removeSavedWord(word: string): void {
  if (!browser) return;
  try {
    let saved = getSavedWords();
    saved = saved.filter(w => w.word !== word);
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(saved));
  } catch {
    // Ignore
  }
}

export function isWordSaved(word: string): boolean {
  return getSavedWords().some(w => w.word === word);
}

/**
 * Get words due for review (SM-2 algorithm)
 */
export function getWordsForReview(): SavedWord[] {
  const now = Date.now();
  return getSavedWords()
    .filter(w => w.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}

/**
 * SM-2 Algorithm implementation
 * Quality: 0-5 (0=complete blackout, 5=perfect response)
 */
export function updateWordReview(word: string, quality: number): void {
  if (!browser) return;

  const saved = getSavedWords();
  const wordIdx = saved.findIndex(w => w.word === word);
  if (wordIdx === -1) return;

  const w = saved[wordIdx];

  // SM-2 Algorithm
  if (quality >= 3) {
    // Correct response
    if (w.repetitions === 0) {
      w.interval = 1;
    } else if (w.repetitions === 1) {
      w.interval = 6;
    } else {
      w.interval = Math.round(w.interval * w.easeFactor);
    }
    w.repetitions++;
  } else {
    // Incorrect response - reset
    w.repetitions = 0;
    w.interval = 1;
  }

  // Update ease factor
  w.easeFactor = Math.max(1.3, w.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Schedule next review
  w.nextReview = Date.now() + w.interval * 24 * 60 * 60 * 1000; // Convert days to ms

  saved[wordIdx] = w;
  localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(saved));
}

/**
 * Get flashcard statistics
 */
export function getFlashcardStats(): { total: number; dueToday: number; mastered: number } {
  const saved = getSavedWords();
  const todayEnd = new Date().setHours(23, 59, 59, 999);

  return {
    total: saved.length,
    dueToday: saved.filter(w => w.nextReview <= todayEnd).length,
    mastered: saved.filter(w => w.interval >= 21).length // 3+ weeks interval
  };
}

