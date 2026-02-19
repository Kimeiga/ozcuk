<script lang="ts">
  import type { ProcessedWord } from '$lib/utils/dictionary';
  import { getPosLabel } from '$lib/utils/dictionary';
  import { deinflect, type DeinflectionResult } from '$lib/utils/deinflect';
  import AudioButton from './AudioButton.svelte';

  interface Props {
    sentence: string;
  }

  interface TokenInfo {
    original: string;      // Original token (may include punctuation)
    word: string;          // Clean word for lookup
    isPunctuation: boolean;
    data: ProcessedWord | null;
    deinflectionInfo: DeinflectionResult | null;  // Info about how word was deinflected
    loading: boolean;
    error: boolean;
  }

  let { sentence }: Props = $props();
  
  let tokens = $state<TokenInfo[]>([]);
  let selectedIndex = $state<number | null>(null);

  // Tokenize the sentence
  function tokenize(text: string): TokenInfo[] {
    // Split on whitespace, keeping punctuation attached
    const parts = text.split(/(\s+)/);
    const result: TokenInfo[] = [];

    for (const part of parts) {
      if (!part || /^\s+$/.test(part)) continue;

      // Extract the word without leading/trailing punctuation
      const match = part.match(/^([^\p{L}]*)(\p{L}+)([^\p{L}]*)$/u);

      if (match) {
        const [, leadingPunct, word, trailingPunct] = match;
        if (leadingPunct) {
          result.push({ original: leadingPunct, word: '', isPunctuation: true, data: null, deinflectionInfo: null, loading: false, error: false });
        }
        result.push({ original: word, word: word.toLowerCase(), isPunctuation: false, data: null, deinflectionInfo: null, loading: false, error: false });
        if (trailingPunct) {
          result.push({ original: trailingPunct, word: '', isPunctuation: true, data: null, deinflectionInfo: null, loading: false, error: false });
        }
      } else {
        // Pure punctuation or non-word
        result.push({ original: part, word: '', isPunctuation: true, data: null, deinflectionInfo: null, loading: false, error: false });
      }
    }

    return result;
  }

  // Try to fetch word data from CDN
  async function tryFetchWord(word: string): Promise<ProcessedWord | null> {
    try {
      const encoded = encodeURIComponent(word);
      const res = await fetch(`https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main/words/${encoded}.json`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Word not found
    }
    return null;
  }

  // Fetch word data for a token (with deinflection fallback)
  async function fetchWordData(index: number) {
    const token = tokens[index];
    if (token.isPunctuation || token.data || token.loading) return;

    tokens[index].loading = true;

    try {
      // First, try direct lookup
      let wordData = await tryFetchWord(token.word);

      if (wordData) {
        tokens[index].data = wordData;
        tokens[index].deinflectionInfo = null;
        return;
      }

      // If not found, try deinflection
      const deinflections = deinflect(token.word);

      for (const result of deinflections) {
        // Skip if the dictionary form is the same as the original
        if (result.dictionaryForm === token.word) continue;

        wordData = await tryFetchWord(result.dictionaryForm);
        if (wordData) {
          tokens[index].data = wordData;
          tokens[index].deinflectionInfo = result;
          return;
        }
      }

      // No match found
      tokens[index].error = true;
    } catch (e) {
      tokens[index].error = true;
    } finally {
      tokens[index].loading = false;
    }
  }

  // Handle token click
  function handleTokenClick(index: number) {
    if (tokens[index].isPunctuation) return;
    
    if (selectedIndex === index) {
      selectedIndex = null;
    } else {
      selectedIndex = index;
      if (!tokens[index].data && !tokens[index].loading) {
        fetchWordData(index);
      }
    }
  }

  // Initialize tokens when sentence changes
  $effect(() => {
    tokens = tokenize(sentence);
    selectedIndex = null;
    
    // Prefetch all word data
    tokens.forEach((_, i) => {
      if (!tokens[i].isPunctuation) {
        fetchWordData(i);
      }
    });
  });
</script>

<div class="sentence-analyzer">
  <!-- Sentence display with clickable words -->
  <div class="flex flex-wrap gap-1 text-2xl leading-relaxed mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
    {#each tokens as token, i}
      {#if token.isPunctuation}
        <span class="text-[var(--color-text-secondary)]">{token.original}</span>
      {:else}
        <button
          type="button"
          onclick={() => handleTokenClick(i)}
          class="turkish-text px-1 py-0.5 rounded transition-all hover:bg-[var(--color-primary)] hover:text-white
                 {selectedIndex === i ? 'bg-[var(--color-primary)] text-white' : ''}
                 {token.data ? 'underline decoration-dotted decoration-[var(--color-primary)] underline-offset-4' : ''}
                 {token.loading ? 'animate-pulse opacity-50' : ''}
                 {token.error ? 'text-red-500' : ''}"
        >
          {token.original}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Selected word details -->
  {#if selectedIndex !== null && tokens[selectedIndex]}
    {@const token = tokens[selectedIndex]}
    <div class="word-card animate-in fade-in slide-in-from-top-2 duration-200">
      {#if token.loading}
        <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <span class="animate-spin">⏳</span>
          <span>Yükleniyor...</span>
        </div>
      {:else if token.data}
        {@const word = token.data}
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <!-- Show deinflection info if word was conjugated/inflected -->
            {#if token.deinflectionInfo}
              <div class="mb-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded inline-flex items-center gap-2">
                <span class="turkish-text font-medium">{token.original}</span>
                <span>→</span>
                <span class="turkish-text font-bold text-[var(--color-primary)]">{word.word}</span>
                {#if token.deinflectionInfo.suffixes.length > 0}
                  <span class="text-xs">({token.deinflectionInfo.suffixes.join(', ')})</span>
                {/if}
              </div>
            {/if}

            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-xl font-bold turkish-text">{word.word}</h3>
              <AudioButton text={word.word} size="sm" />
              <span class="pos-badge pos-{word.pos === 'adjective' ? 'adj' : word.pos === 'adverb' ? 'adv' : word.pos}">
                {getPosLabel(word.pos).tr}
              </span>
            </div>

            {#if word.pronunciation}
              <p class="text-sm text-[var(--color-text-secondary)] font-mono mb-2">/{word.pronunciation}/</p>
            {/if}

            <ul class="space-y-1">
              {#each word.senses.slice(0, 3) as sense, i}
                <li class="text-[var(--color-text-secondary)]">
                  <span class="text-xs font-medium mr-1">{i + 1}.</span>
                  {sense.glosses[0]}
                </li>
              {/each}
              {#if word.senses.length > 3}
                <li class="text-sm text-[var(--color-primary)]">
                  +{word.senses.length - 3} daha fazla anlam
                </li>
              {/if}
            </ul>
          </div>

          <a
            href="/{encodeURIComponent(word.word)}"
            class="text-sm text-[var(--color-primary)] hover:underline whitespace-nowrap"
          >
            Tam giriş →
          </a>
        </div>
      {:else if token.error}
        <p class="text-[var(--color-text-secondary)]">
          "{token.original}" sözlükte bulunamadı.
          <a href="/{encodeURIComponent(token.word)}" class="text-[var(--color-primary)] hover:underline ml-1">
            Yine de ara →
          </a>
        </p>
      {:else}
        <p class="text-[var(--color-text-secondary)]">
          "{token.original}" için veri bulunamadı.
        </p>
      {/if}
    </div>
  {/if}
</div>

