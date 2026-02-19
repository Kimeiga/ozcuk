<script lang="ts">
  import { getRecentlyViewed, clearRecentlyViewed, type RecentWord } from '$lib/utils/user-data';
  import { onMount } from 'svelte';

  let recentWords: RecentWord[] = $state([]);

  onMount(() => {
    recentWords = getRecentlyViewed();
  });

  function handleClear() {
    clearRecentlyViewed();
    recentWords = [];
  }
</script>

{#if recentWords.length > 0}
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold flex items-center gap-2">
        <span>🕐</span>
        <span>Son Bakılanlar</span>
      </h2>
      <button 
        onclick={handleClear}
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
      >
        Temizle
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each recentWords as { word, pos, gloss }}
        <a 
          href="/{word}" 
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
        >
          <span class="turkish-text font-medium">{word}</span>
          <span class="text-xs text-[var(--color-text-secondary)]">{pos}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}

