<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import SearchBar from '$components/SearchBar.svelte';
  import SentenceAnalyzer from '$components/SentenceAnalyzer.svelte';

  // Get sentence from URL query parameter
  let sentence = $derived($page.url.searchParams.get('s') || '');
  let searchQuery = $state('');

  // Initialize search query from URL
  $effect(() => {
    searchQuery = sentence;
  });

  function handleSearch(query: string) {
    if (query.trim()) {
      // Check if it's a sentence or single word
      const words = query.trim().split(/\s+/).filter(w => /\p{L}/u.test(w));
      if (words.length >= 2) {
        goto(`/analyze?s=${encodeURIComponent(query.trim())}`);
      } else {
        goto(`/${encodeURIComponent(query.trim())}`);
      }
    }
  }
</script>

<svelte:head>
  <title>Cümle Analizi - Özcük Türkçe Sözlük</title>
  <meta name="description" content="Türkçe cümleleri analiz edin - her kelimeye tıklayarak anlamını öğrenin" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Search Bar -->
  <section class="mb-8">
    <SearchBar bind:query={searchQuery} onSearch={handleSearch} autofocus={false} />
  </section>

  {#if sentence}
    <!-- Sentence Analysis -->
    <section>
      <div class="flex items-center gap-2 mb-4">
        <h1 class="text-2xl font-bold">Cümle Analizi</h1>
        <span class="text-sm text-[var(--color-text-secondary)]">
          (kelimeye tıklayarak anlamını görün)
        </span>
      </div>
      
      <SentenceAnalyzer {sentence} />
      
      <div class="mt-6 text-sm text-[var(--color-text-secondary)]">
        <p>💡 <strong>İpucu:</strong> Her kelimeye tıklayarak tanımını görün. Altı çizili kelimeler sözlükte bulundu.</p>
      </div>
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

