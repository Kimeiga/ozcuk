import type { PageServerLoad } from './$types';
import { findWord, searchEnglishToTurkish, type ProcessedWord } from '$lib/utils/dictionary';
import { deinflect } from '$lib/utils/deinflect';
import { fetchTdkDefinition, type TdkEntry } from '$lib/utils/tdk';

export const load: PageServerLoad = async ({ params }) => {
  const query = decodeURIComponent(params.word);

  // First, try to find the exact word
  let words = await findWord(query);

  // If not found, try deinflection
  let deinflectionResults: { dictionaryForm: string; suffixes: string[] }[] = [];
  if (words.length === 0) {
    const deinflected = deinflect(query);
    deinflectionResults = deinflected;

    // Try to find each deinflected form
    for (const result of deinflected) {
      if (result.dictionaryForm !== query.toLowerCase()) {
        const foundWords = await findWord(result.dictionaryForm);
        if (foundWords.length > 0) {
          words = foundWords;
          break;
        }
      }
    }
  }

  // If still not found, try English reverse lookup
  let englishResults: ProcessedWord[] = [];
  let isEnglishSearch = false;
  if (words.length === 0) {
    englishResults = await searchEnglishToTurkish(query, 10);
    if (englishResults.length > 0) {
      isEnglishSearch = true;
    }
  }

  // Fetch TDK definition (native Turkish definitions)
  let tdkEntry: TdkEntry | null = null;
  if (words.length > 0) {
    const tdkResponse = await fetchTdkDefinition(words[0].word);
    if (tdkResponse.found && tdkResponse.entry) {
      tdkEntry = tdkResponse.entry;
    }
  }

  return {
    query,
    words,
    deinflectionResults,
    notFound: words.length === 0 && englishResults.length === 0,
    tdkEntry,
    englishResults,
    isEnglishSearch
  };
};

