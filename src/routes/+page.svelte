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

  // Common verbs - conjugation examples
  const commonVerbs = [
    { word: 'gelmek', meaning: 'to come', note: 'Irregular' },
    { word: 'gitmek', meaning: 'to go', note: 'Irregular' },
    { word: 'yapmak', meaning: 'to do/make' },
    { word: 'almak', meaning: 'to take/buy' },
    { word: 'vermek', meaning: 'to give' },
    { word: 'görmek', meaning: 'to see' },
    { word: 'bilmek', meaning: 'to know' },
    { word: 'istemek', meaning: 'to want' },
  ];

  // Common nouns
  const commonNouns = [
    { word: 'ev', meaning: 'house/home' },
    { word: 'su', meaning: 'water' },
    { word: 'kitap', meaning: 'book' },
    { word: 'yol', meaning: 'road/way' },
    { word: 'gün', meaning: 'day' },
    { word: 'iş', meaning: 'work/job' },
    { word: 'zaman', meaning: 'time' },
    { word: 'insan', meaning: 'human/person' },
  ];

  // Adjectives & Adverbs
  const descriptiveWords = [
    { word: 'güzel', meaning: 'beautiful' },
    { word: 'büyük', meaning: 'big/large' },
    { word: 'küçük', meaning: 'small' },
    { word: 'yeni', meaning: 'new' },
    { word: 'eski', meaning: 'old' },
    { word: 'çok', meaning: 'very/much' },
    { word: 'hızlı', meaning: 'fast' },
    { word: 'kolay', meaning: 'easy' },
  ];

  // Example sentences showing grammar
  const exampleSentences = [
    {
      sentence: 'Ben dün akşam eve geldim',
      translation: 'I came home last night',
      grammar: 'Past tense (-di)'
    },
    {
      sentence: 'Yarın İstanbul\'a gideceğiz',
      translation: 'We will go to Istanbul tomorrow',
      grammar: 'Future tense (-ecek)'
    },
    {
      sentence: 'Şimdi kitap okuyorum',
      translation: 'I am reading a book now',
      grammar: 'Present continuous (-iyor)'
    },
    {
      sentence: 'Her gün kahve içerim',
      translation: 'I drink coffee every day',
      grammar: 'Aorist/Habitual (-ir)'
    },
    {
      sentence: 'Türkçe öğrenmek istiyorum',
      translation: 'I want to learn Turkish',
      grammar: 'Infinitive + verb'
    },
    {
      sentence: 'Bu kitabı okumuş muydun?',
      translation: 'Had you read this book?',
      grammar: 'Past perfect question'
    },
  ];
</script>

<svelte:head>
  <title>Özcük - Türkçe Sözlük | Turkish Dictionary</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  <!-- Hero Section -->
  <section class="text-center mb-8">
    <h1 class="text-4xl md:text-5xl font-bold mb-3">
      <span class="text-[var(--color-primary)]">Özcük</span>
    </h1>
    <p class="text-lg text-[var(--color-text-secondary)]">
      Türkçe-İngilizce Sözlük
    </p>
  </section>

  <!-- Search Section -->
  <section class="mb-8 max-w-2xl mx-auto">
    <SearchBar bind:query={searchQuery} onSearch={handleSearch} />
    <div class="flex justify-center mt-4">
      <RandomWordButton />
    </div>
  </section>

  <!-- Word of the Day -->
  <section class="mb-8 max-w-2xl mx-auto">
    <WordOfDay />
  </section>

  <!-- Recently Viewed -->
  <div class="mb-10 max-w-2xl mx-auto">
    <RecentlyViewed />
  </div>

  <!-- Example Sentences Section -->
  <section class="mb-10">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      💬 Örnek Cümleler
      <span class="text-sm font-normal text-[var(--color-text-secondary)]">— tıklayarak analiz edin</span>
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each exampleSentences as { sentence, translation, grammar }}
        <a
          href="/analyze?s={encodeURIComponent(sentence)}"
          class="word-card hover:border-[var(--color-primary)] transition-colors block"
        >
          <div class="flex flex-col gap-1">
            <span class="font-semibold turkish-text text-lg">{sentence}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] w-fit">{grammar}</span>
          </div>
          <div class="text-sm text-[var(--color-text-secondary)] mt-1">{translation}</div>
        </a>
      {/each}
    </div>
  </section>

  <!-- Common Verbs -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold mb-4">🔄 Yaygın Fiiller</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each commonVerbs as { word, meaning, note }}
        <a
          href="/{word}"
          class="word-card hover:border-[var(--color-primary)] transition-colors"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold turkish-text">{word}</span>
            {#if note}
              <span class="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">{note}</span>
            {/if}
          </div>
          <div class="text-sm text-[var(--color-text-secondary)]">{meaning}</div>
        </a>
      {/each}
    </div>
  </section>

  <!-- Common Nouns -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold mb-4">📦 Yaygın İsimler</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each commonNouns as { word, meaning }}
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

  <!-- Adjectives & Adverbs -->
  <section class="mb-10">
    <h2 class="text-lg font-semibold mb-4">✨ Sıfatlar ve Zarflar</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      {#each descriptiveWords as { word, meaning }}
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

  <!-- Features (moved to bottom) -->
  <section class="mb-8">
    <h2 class="text-lg font-semibold mb-4 text-center">🚀 Özellikler</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="word-card text-center">
        <div class="text-2xl mb-2">📚</div>
        <h3 class="font-semibold text-sm">40.000+ Kelime</h3>
      </div>
      <div class="word-card text-center">
        <div class="text-2xl mb-2">🔄</div>
        <h3 class="font-semibold text-sm">Fiil Çekimleri</h3>
      </div>
      <div class="word-card text-center">
        <div class="text-2xl mb-2">🔍</div>
        <h3 class="font-semibold text-sm">Cümle Analizi</h3>
      </div>
      <div class="word-card text-center">
        <div class="text-2xl mb-2">🇹🇷</div>
        <h3 class="font-semibold text-sm">TDK Tanımları</h3>
      </div>
      <div class="word-card text-center">
        <div class="text-2xl mb-2">🔊</div>
        <h3 class="font-semibold text-sm">Sesli Telaffuz</h3>
      </div>
      <div class="word-card text-center">
        <div class="text-2xl mb-2">📝</div>
        <h3 class="font-semibold text-sm">Flashcard</h3>
      </div>
    </div>
  </section>

  <!-- About link -->
  <div class="text-center">
    <a href="/about" class="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm">
      Hakkında / About →
    </a>
  </div>
</div>

