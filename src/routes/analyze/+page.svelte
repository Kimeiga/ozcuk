<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import SearchBar from '$components/SearchBar.svelte';
  import WordDisplay from '$components/WordDisplay.svelte';
  import type { ProcessedWord } from '$lib/utils/dictionary';
  import { deinflect, type DeinflectionResult } from '$lib/utils/deinflect';

  interface TokenInfo {
    original: string;
    word: string;
    isPunctuation: boolean;
    data: ProcessedWord | null;
    baseWordData: ProcessedWord | null; // For form-of entries, the base word's data
    deinflectionInfo: DeinflectionResult | null;
    loading: boolean;
    error: boolean;
  }

  // Get URL parameters
  let sentence = $derived($page.url.searchParams.get('s') || '');
  let selectedIndex = $derived(parseInt($page.url.searchParams.get('i') || '0', 10));
  let searchQuery = $state('');

  let tokens = $state<TokenInfo[]>([]);

  // Initialize search query from URL
  $effect(() => {
    searchQuery = sentence;
  });

  function handleSearch(query: string) {
    if (query.trim()) {
      const words = query.trim().split(/\s+/).filter(w => /\p{L}/u.test(w));
      if (words.length >= 2) {
        goto(`/analyze?s=${encodeURIComponent(query.trim())}&i=0`);
      } else {
        goto(`/${encodeURIComponent(query.trim())}`);
      }
    }
  }

  // Tokenize the sentence
  function tokenize(text: string): TokenInfo[] {
    const parts = text.split(/(\s+)/);
    const result: TokenInfo[] = [];

    for (const part of parts) {
      if (!part || /^\s+$/.test(part)) continue;

      const match = part.match(/^([^\p{L}]*)(\p{L}+)([^\p{L}]*)$/u);

      if (match) {
        const [, leadingPunct, word, trailingPunct] = match;
        if (leadingPunct) {
          result.push({ original: leadingPunct, word: '', isPunctuation: true, data: null, baseWordData: null, deinflectionInfo: null, loading: false, error: false });
        }
        result.push({ original: word, word: word.toLowerCase(), isPunctuation: false, data: null, baseWordData: null, deinflectionInfo: null, loading: false, error: false });
        if (trailingPunct) {
          result.push({ original: trailingPunct, word: '', isPunctuation: true, data: null, baseWordData: null, deinflectionInfo: null, loading: false, error: false });
        }
      } else {
        result.push({ original: part, word: '', isPunctuation: true, data: null, baseWordData: null, deinflectionInfo: null, loading: false, error: false });
      }
    }

    return result;
  }

  // Fetch word data from CDN with deflate decompression
  async function tryFetchWord(word: string): Promise<ProcessedWord | null> {
    try {
      const encoded = encodeURIComponent(word);
      const res = await fetch(`https://raw.githubusercontent.com/Kimeiga/ozcuk-data/main/words/${encoded}.json.deflate`);
      if (res.ok) {
        const ds = new DecompressionStream('deflate');
        const decompressedStream = res.body!.pipeThrough(ds);
        const text = await new Response(decompressedStream).text();
        return JSON.parse(text);
      }
    } catch {
      // Word not found
    }
    return null;
  }

  // Extract base word from form-of gloss (e.g., "first-person singular past of gelmek" -> "gelmek")
  function extractBaseWordFromGloss(gloss: string): string | null {
    // Match patterns like "... of <word>" at the end of the gloss
    const match = gloss.match(/\bof\s+(\S+)$/i);
    return match ? match[1] : null;
  }

  // Check if word data is a form-of entry
  function isFormOfEntry(wordData: ProcessedWord): boolean {
    return wordData.senses?.some(sense => sense.tags?.includes('form-of')) ?? false;
  }

  // Fetch word data for a token (with deinflection fallback and base word lookup)
  async function fetchWordData(index: number) {
    const token = tokens[index];
    if (token.isPunctuation || token.data || token.loading) return;

    tokens[index].loading = true;

    try {
      let wordData = await tryFetchWord(token.word);

      if (wordData) {
        tokens[index].data = wordData;
        tokens[index].deinflectionInfo = null;

        // If this is a form-of entry, try to fetch the base word
        if (isFormOfEntry(wordData)) {
          const firstGloss = wordData.senses?.[0]?.glosses?.[0];
          if (firstGloss) {
            const baseWord = extractBaseWordFromGloss(firstGloss);
            if (baseWord) {
              const baseWordData = await tryFetchWord(baseWord);
              if (baseWordData) {
                tokens[index].baseWordData = baseWordData;
              }
            }
          }
        }
        return;
      }

      const deinflections = deinflect(token.word);

      for (const result of deinflections) {
        if (result.dictionaryForm === token.word) continue;

        wordData = await tryFetchWord(result.dictionaryForm);
        if (wordData) {
          tokens[index].data = wordData;
          tokens[index].baseWordData = wordData; // Base word is the same as the deinflected word
          tokens[index].deinflectionInfo = { ...result, originalWord: token.original };
          return;
        }
      }

      tokens[index].error = true;
    } catch {
      tokens[index].error = true;
    } finally {
      tokens[index].loading = false;
    }
  }

  // Handle word click - update URL without reload
  function handleWordClick(index: number) {
    if (tokens[index].isPunctuation) return;

    // Update URL with new index
    const url = new URL($page.url);
    url.searchParams.set('i', index.toString());
    goto(url.toString(), { replaceState: true, noScroll: true });

    // Fetch data if not already loaded
    if (!tokens[index].data && !tokens[index].loading) {
      fetchWordData(index);
    }
  }

  // Get the actual word index (accounting for punctuation tokens)
  function getWordIndex(tokenIndex: number): number {
    let wordCount = 0;
    for (let i = 0; i < tokenIndex; i++) {
      if (!tokens[i].isPunctuation) wordCount++;
    }
    return wordCount;
  }

  // Get token index from word index
  function getTokenIndexFromWordIndex(wordIndex: number): number {
    let wordCount = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i].isPunctuation) {
        if (wordCount === wordIndex) return i;
        wordCount++;
      }
    }
    return 0;
  }

  // Selected token based on URL index
  let selectedTokenIndex = $derived(getTokenIndexFromWordIndex(selectedIndex));
  let selectedToken = $derived(tokens[selectedTokenIndex]);

  // Track current sentence to avoid re-fetching
  let currentSentence = $state('');

  // Initialize tokens when sentence changes
  $effect(() => {
    if (sentence && sentence !== currentSentence) {
      currentSentence = sentence;
      const newTokens = tokenize(sentence);
      tokens = newTokens;

      // Prefetch all word data (run outside effect to avoid loops)
      setTimeout(() => {
        newTokens.forEach((_, i) => {
          if (!newTokens[i].isPunctuation) {
            fetchWordData(i);
          }
        });
      }, 0);
    }
  });
</script>

<svelte:head>
  <title>Cümle Analizi - Özcük Türkçe Sözlük</title>
  <meta name="description" content="Türkçe cümleleri analiz edin - her kelimeye tıklayarak anlamını öğrenin" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Search Bar -->
  <section class="mb-6">
    <SearchBar bind:query={searchQuery} onSearch={handleSearch} autofocus={false} />
  </section>

  {#if sentence}
    <!-- Sentence as clickable heading -->
    <section class="mb-8">
      <div class="flex flex-wrap gap-1 text-2xl md:text-3xl leading-relaxed p-4 bg-[var(--color-bg-secondary)] rounded-lg">
        {#each tokens as token, i}
          {#if token.isPunctuation}
            <span class="text-[var(--color-text-secondary)]">{token.original}</span>
          {:else}
            {@const wordIdx = getWordIndex(i)}
            <button
              type="button"
              onclick={() => handleWordClick(i)}
              class="turkish-text px-1 py-0.5 rounded transition-all cursor-pointer
                     hover:bg-[var(--color-primary)] hover:text-white
                     {selectedIndex === wordIdx ? 'bg-[var(--color-primary)] text-white' : ''}
                     {token.data ? 'underline decoration-dotted decoration-[var(--color-primary)] underline-offset-4' : ''}
                     {token.loading ? 'animate-pulse opacity-50' : ''}
                     {token.error ? 'text-[var(--color-text-secondary)]' : ''}"
            >
              {token.original}
            </button>
          {/if}
        {/each}
      </div>
    </section>

    <!-- Word Content Display -->
    <section>
      {#if selectedToken}
        {#if selectedToken.loading}
          <div class="word-card flex items-center gap-2 text-[var(--color-text-secondary)]">
            <span class="animate-spin">⏳</span>
            <span>Yükleniyor...</span>
          </div>
        {:else if selectedToken.data}
          <WordDisplay
            word={selectedToken.data}
            baseWordData={selectedToken.baseWordData}
            deinflectionInfo={selectedToken.deinflectionInfo}
          />
        {:else if selectedToken.error}
          <div class="word-card">
            <p class="text-[var(--color-text-secondary)]">
              "{selectedToken.original}" sözlükte bulunamadı.
              <a href="/{encodeURIComponent(selectedToken.word)}" class="text-[var(--color-primary)] hover:underline ml-1">
                Yine de ara →
              </a>
            </p>
          </div>
        {:else}
          <div class="word-card text-[var(--color-text-secondary)]">
            Kelime bilgisi yükleniyor...
          </div>
        {/if}
      {/if}
    </section>
  {:else}
    <!-- No sentence provided -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">✍️</div>
      <h1 class="text-2xl font-bold mb-2">Cümle Analizi</h1>
      <p class="text-[var(--color-text-secondary)] mb-4">
        Türkçe bir cümle girin ve her kelimeye tıklayarak anlamını öğrenin.
      </p>
      <p class="text-[var(--color-text-secondary)]">
        Örnek: "Ben dün akşam eve geldim"
      </p>
    </div>
  {/if}
</div>
