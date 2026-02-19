<script lang="ts">
  import { onMount } from 'svelte';
  import { getSavedWords, removeSavedWord, getFlashcardStats, type SavedWord } from '$lib/utils/user-data';

  let savedWords: SavedWord[] = $state([]);
  let stats = $state({ total: 0, dueToday: 0, mastered: 0 });

  onMount(() => {
    loadWords();
  });

  function loadWords() {
    savedWords = getSavedWords();
    stats = getFlashcardStats();
  }

  function handleRemove(word: string) {
    removeSavedWord(word);
    loadWords();
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('tr-TR');
  }

  function getStatusBadge(word: SavedWord): { text: string; class: string } {
    const now = Date.now();
    if (word.interval >= 21) {
      return { text: 'Öğrenildi', class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    } else if (word.nextReview <= now) {
      return { text: 'Tekrar Gerekli', class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' };
    } else {
      return { text: 'Devam Ediyor', class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
    }
  }
</script>

<svelte:head>
  <title>Kayıtlı Kelimeler - Özcük</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-3xl font-bold mb-2">⭐ Kayıtlı Kelimeler</h1>
    <p class="text-[var(--color-text-secondary)]">Çalışmak için kaydettiğiniz kelimeler</p>
  </header>

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-4 mb-8">
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-[var(--color-primary)]">{stats.total}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Toplam</div>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-orange-500">{stats.dueToday}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Bugün Tekrar</div>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-green-500">{stats.mastered}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Öğrenildi</div>
    </div>
  </div>

  <!-- Study Button -->
  {#if stats.dueToday > 0}
    <div class="mb-8 text-center">
      <a href="/study" class="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg text-lg hover:bg-[var(--color-primary-hover)] transition-colors">
        📚 Çalışmaya Başla ({stats.dueToday} kelime)
      </a>
    </div>
  {/if}

  {#if savedWords.length === 0}
    <div class="word-card text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h2 class="text-xl font-semibold mb-2">Henüz kelime kaydetmediniz</h2>
      <p class="text-[var(--color-text-secondary)] mb-4">
        Kelime sayfalarında "☆ Kaydet" butonuna tıklayarak kelime ekleyebilirsiniz
      </p>
      <a href="/" class="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">
        Kelime Ara
      </a>
    </div>
  {:else}
    <!-- Word List -->
    <div class="space-y-3">
      {#each savedWords as word}
        {@const status = getStatusBadge(word)}
        <div class="word-card flex items-center gap-4">
          <a href="/{encodeURIComponent(word.word)}" class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold turkish-text text-lg">{word.word}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">{word.pos}</span>
              <span class="text-xs px-1.5 py-0.5 rounded {status.class}">{status.text}</span>
            </div>
            <div class="text-sm text-[var(--color-text-secondary)] truncate">{word.gloss}</div>
          </a>
          <div class="text-xs text-[var(--color-text-secondary)] text-right">
            <div>Eklendi: {formatDate(word.addedAt)}</div>
            <div>Tekrar: {formatDate(word.nextReview)}</div>
          </div>
          <button
            onclick={() => handleRemove(word.word)}
            class="p-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
            title="Kelimeyi sil"
          >
            🗑️
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

