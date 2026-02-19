<script lang="ts">
  import { goto } from '$app/navigation';
  import SearchBar from '$components/SearchBar.svelte';
  import WordOfDay from '$components/WordOfDay.svelte';
  import RecentlyViewed from '$components/RecentlyViewed.svelte';
  import RandomWordButton from '$components/RandomWordButton.svelte';

  let searchQuery = $state('');

  function handleSearch(query: string) {
    if (query.trim()) {
      goto(`/${encodeURIComponent(query.trim())}`);
    }
  }

  // Example words to explore
  const exampleWords = [
    { word: 'gelmek', meaning: 'to come' },
    { word: 'güzel', meaning: 'beautiful' },
    { word: 'kitap', meaning: 'book' },
    { word: 'sevmek', meaning: 'to love' },
    { word: 'çalışmak', meaning: 'to work' },
    { word: 'yemek', meaning: 'food / to eat' },
    { word: 'okumak', meaning: 'to read' },
    { word: 'yazmak', meaning: 'to write' }
  ];
</script>

<svelte:head>
  <title>Özcük - Türkçe Sözlük | Turkish Dictionary</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
  <!-- Hero Section -->
  <section class="text-center mb-12">
    <h1 class="text-4xl md:text-5xl font-bold mb-4">
      <span class="text-[var(--color-primary)]">Özcük</span>
    </h1>
    <p class="text-xl text-[var(--color-text-secondary)] mb-2">
      Türkçe'nin en kapsamlı sözlük uygulaması
    </p>
    <p class="text-[var(--color-text-secondary)]">
      The most comprehensive Turkish dictionary app
    </p>
  </section>

  <!-- Search Section -->
  <section class="mb-8">
    <SearchBar bind:query={searchQuery} onSearch={handleSearch} />
    <div class="flex justify-center mt-4">
      <RandomWordButton />
    </div>
  </section>

  <!-- Word of the Day -->
  <section class="mb-8">
    <WordOfDay />
  </section>

  <!-- Recently Viewed -->
  <div class="mb-8">
    <RecentlyViewed />
  </div>

  <!-- Features -->
  <section class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">📚</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">40.000+ Kelime</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        Wiktionary'den kapsamlı sözlük
      </p>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">🔄</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">Fiil Çekimleri</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        14 zaman, 6 kişi için çekim
      </p>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">🔍</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">Morfolojik Analiz</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        Kök ve ekleri görün
      </p>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">🇹🇷</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">TDK Tanımları</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        Resmi Türkçe tanımlar
      </p>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">🔊</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">Sesli Telaffuz</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        Kelimeleri dinleyin
      </p>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl md:text-3xl mb-2 md:mb-3">📝</div>
      <h3 class="font-semibold mb-1 md:mb-2 text-sm md:text-base">Not Alma</h3>
      <p class="text-xs md:text-sm text-[var(--color-text-secondary)]">
        Kişisel kelime notları
      </p>
    </div>
  </section>

  <!-- Example Words -->
  <section>
    <h2 class="text-lg font-semibold mb-4">Örnek Kelimeler</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each exampleWords as { word, meaning }}
        <a 
          href="/{word}" 
          class="word-card hover:border-[var(--color-primary)] transition-colors"
        >
          <div class="font-semibold turkish-text">{word}</div>
          <div class="text-sm text-[var(--color-text-secondary)]">{meaning}</div>
        </a>
      {/each}
    </div>
  </section>
</div>

