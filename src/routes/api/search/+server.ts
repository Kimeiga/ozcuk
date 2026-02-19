import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchWords } from '$lib/utils/dictionary';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  
  if (!query || query.length < 1) {
    return json({ results: [] });
  }
  
  try {
    const results = await searchWords(query, Math.min(limit, 50));
    
    // Return simplified results for autocomplete
    const simplified = results.map(word => ({
      word: word.word,
      pos: word.pos,
      gloss: word.senses[0]?.glosses[0] || ''
    }));
    
    return json({ results: simplified });
  } catch (e) {
    console.error('Search error:', e);
    return json({ results: [], error: 'Search failed' }, { status: 500 });
  }
};

