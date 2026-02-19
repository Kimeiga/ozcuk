<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getWordsForReview,
    updateWordReview,
    getFlashcardStats,
    type SavedWord
  } from '$lib/utils/user-data';
  import AudioButton from '$components/AudioButton.svelte';

  let dueCards: SavedWord[] = $state([]);
  let currentIndex = $state(0);
  let showAnswer = $state(false);
  let stats = $state({ total: 0, dueToday: 0, mastered: 0 });
  let completed = $state(false);

  const currentCard = $derived(dueCards[currentIndex] || null);

  onMount(() => {
    loadCards();
  });

  function loadCards() {
    dueCards = getWordsForReview();
    stats = getFlashcardStats();
    currentIndex = 0;
    showAnswer = false;
    completed = dueCards.length === 0;
  }

  function handleAnswer(quality: number) {
    if (!currentCard) return;

    updateWordReview(currentCard.word, quality);
    showAnswer = false;

    if (currentIndex < dueCards.length - 1) {
      currentIndex++;
    } else {
      completed = true;
      stats = getFlashcardStats();
    }
  }

  function restart() {
    loadCards();
    completed = false;
  }
</script>

<svelte:head>
  <title>Kelime Çalışması - Özcük</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
  <header class="mb-8 text-center">
    <h1 class="text-3xl font-bold mb-2">📚 Kelime Çalışması</h1>
    <p class="text-[var(--color-text-secondary)]">Spaced Repetition ile kelime öğrenin</p>
  </header>

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-4 mb-8">
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-[var(--color-primary)]">{stats.total}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Toplam</div>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-orange-500">{stats.dueToday}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Bugün</div>
    </div>
    <div class="word-card text-center">
      <div class="text-2xl font-bold text-green-500">{stats.mastered}</div>
      <div class="text-sm text-[var(--color-text-secondary)]">Öğrenildi</div>
    </div>
  </div>

  {#if stats.total === 0}
    <!-- No cards saved -->
    <div class="word-card text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h2 class="text-xl font-semibold mb-2">Henüz kelime eklemediniz</h2>
      <p class="text-[var(--color-text-secondary)] mb-4">
        Kelime sayfalarında "Kaydet" butonuna tıklayarak kelime ekleyebilirsiniz
      </p>
      <a href="/" class="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">
        Kelime Ara
      </a>
    </div>
  {:else if completed}
    <!-- All done -->
    <div class="word-card text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-xl font-semibold mb-2">Tebrikler!</h2>
      <p class="text-[var(--color-text-secondary)] mb-4">
        Bugünkü çalışmanızı tamamladınız
      </p>
      <div class="flex gap-4 justify-center">
        <button onclick={restart} class="px-4 py-2 bg-[var(--color-bg-secondary)] rounded-lg">
          Tekrar Başla
        </button>
        <a href="/" class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">
          Ana Sayfa
        </a>
      </div>
    </div>
  {:else if currentCard}
    <!-- Flashcard -->
    <div class="word-card p-8 min-h-[300px] flex flex-col items-center justify-center">
      <div class="text-sm text-[var(--color-text-secondary)] mb-4">
        {currentIndex + 1} / {dueCards.length}
      </div>

      <!-- Question: Turkish word -->
      <div class="text-4xl font-bold turkish-text mb-2">{currentCard.word}</div>
      <div class="flex items-center gap-2 mb-6">
        <span class="text-sm text-[var(--color-text-secondary)]">{currentCard.pos}</span>
        <AudioButton text={currentCard.word} size="sm" />
      </div>

      {#if !showAnswer}
        <!-- Show Answer Button -->
        <button
          onclick={() => showAnswer = true}
          class="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg text-lg hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Cevabı Göster
        </button>
      {:else}
        <!-- Answer: English meaning -->
        <div class="text-xl text-[var(--color-text)] mb-6 text-center">
          {currentCard.gloss}
        </div>

        <!-- Rating buttons -->
        <div class="text-sm text-[var(--color-text-secondary)] mb-3">Ne kadar hatırladınız?</div>
        <div class="flex gap-2 flex-wrap justify-center">
          <button
            onclick={() => handleAnswer(0)}
            class="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            😵 Hiç
          </button>
          <button
            onclick={() => handleAnswer(2)}
            class="px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50"
          >
            😕 Zor
          </button>
          <button
            onclick={() => handleAnswer(3)}
            class="px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
          >
            🤔 Orta
          </button>
          <button
            onclick={() => handleAnswer(4)}
            class="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
          >
            😊 Kolay
          </button>
          <button
            onclick={() => handleAnswer(5)}
            class="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            🤩 Mükemmel
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Link to view all saved words -->
  {#if stats.total > 0}
    <div class="mt-8 text-center">
      <a href="/saved" class="text-[var(--color-primary)] hover:underline">
        Tüm kayıtlı kelimeleri görüntüle ({stats.total})
      </a>
    </div>
  {/if}
</div>
