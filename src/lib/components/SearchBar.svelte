<script lang="ts">
  import { goto } from '$app/navigation';

  interface Props {
    query: string;
    onSearch: (query: string) => void;
    placeholder?: string;
    autofocus?: boolean;
  }

  interface SearchResult {
    word: string;
    pos: string;
    gloss: string;
  }

  let { query = $bindable(), onSearch, placeholder = 'Kelime veya cümle ara... (örn: gelmek, eve geldim)', autofocus = true }: Props = $props();

  // Check if input looks like a sentence (2+ Turkish words)
  function isSentence(text: string): boolean {
    const words = text.trim().split(/\s+/).filter(w => /\p{L}/u.test(w));
    return words.length >= 2;
  }
  let suggestions: SearchResult[] = $state([]);
  let showSuggestions = $state(false);
  let selectedIndex = $state(-1);
  let debounceTimer: ReturnType<typeof setTimeout>;

  async function fetchSuggestions(q: string) {
    if (q.length < 1) {
      suggestions = [];
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json() as { results?: typeof suggestions };
      suggestions = data.results || [];
    } catch (e) {
      suggestions = [];
    }
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(query), 150);
    showSuggestions = true;
    selectedIndex = -1;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    showSuggestions = false;

    // If it looks like a sentence, go to sentence analyzer
    if (isSentence(query)) {
      goto(`/analyze?s=${encodeURIComponent(query.trim())}`);
    } else {
      onSearch(query);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      showSuggestions = false;
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        goto(`/${encodeURIComponent(suggestions[selectedIndex].word)}`);
      } else {
        onSearch(query);
      }
    } else if (e.key === 'Escape') {
      showSuggestions = false;
    }
  }

  function selectSuggestion(word: string) {
    showSuggestions = false;
    goto(`/${encodeURIComponent(word)}`);
  }
</script>

<form onsubmit={handleSubmit} class="relative w-full max-w-xl mx-auto">
  <div class="relative">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
      🔍
    </span>
    <input
      type="text"
      bind:value={query}
      {placeholder}
      {autofocus}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onfocus={() => showSuggestions = suggestions.length > 0}
      onblur={() => setTimeout(() => showSuggestions = false, 200)}
      class="w-full pl-12 pr-4 py-3 rounded-full border border-[var(--color-border)]
             bg-[var(--color-bg)] text-[var(--color-text)] text-lg
             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
             placeholder:text-[var(--color-text-secondary)]"
    />
    {#if query.length > 0}
      <button
        type="button"
        onclick={() => { query = ''; suggestions = []; }}
        class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        ✕
      </button>
    {/if}
  </div>

  <!-- Suggestions Dropdown -->
  {#if showSuggestions && suggestions.length > 0}
    <ul class="absolute z-50 w-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
      {#each suggestions as suggestion, i}
        <li>
          <button
            type="button"
            onclick={() => selectSuggestion(suggestion.word)}
            class="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] {i === selectedIndex ? 'bg-[var(--color-bg-secondary)]' : ''}"
          >
            <span class="font-medium turkish-text">{suggestion.word}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">{suggestion.pos}</span>
            <span class="text-sm text-[var(--color-text-secondary)] truncate flex-1">{suggestion.gloss}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</form>

