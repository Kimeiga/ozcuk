import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchWords, searchEnglishToTurkish } from '$lib/utils/dictionary';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  if (!query || query.length < 1) {
    return json({ results: [] });
  }

  try {
    // Search both Turkish (direct) and English (reverse lookup) simultaneously
    const [turkishResults, englishResults] = await Promise.all([
      searchWords(query, Math.min(limit, 30)),
      searchEnglishToTurkish(query, Math.min(limit, 30))
    ]);

    // Build unified results with source indicator
    const turkishSimplified = turkishResults.map(word => ({
      word: word.word,
      pos: word.pos,
      gloss: word.senses[0]?.glosses[0] || '',
      source: 'turkish' as const
    }));

    const englishSimplified = englishResults.map(word => ({
      word: word.word,
      pos: word.pos,
      gloss: word.senses[0]?.glosses[0] || '',
      source: 'english' as const,
      matchedEnglish: query.toLowerCase() // The English term that matched
    }));

    // Deduplicate: prefer Turkish direct matches over English reverse matches
    const seenWords = new Set(turkishSimplified.map(r => r.word));
    const uniqueEnglish = englishSimplified.filter(r => !seenWords.has(r.word));

    // Combine: Turkish matches first (direct), then English reverse matches
    const combined = [...turkishSimplified, ...uniqueEnglish].slice(0, limit);

    return json({ results: combined });
  } catch (e) {
    console.error('Search error:', e);
    return json({ results: [], error: 'Search failed' }, { status: 500 });
  }
};

