<script lang="ts">
  import { goto } from '$app/navigation';

  let loading = $state(false);

  async function goToRandomWord() {
    loading = true;
    try {
      // Fetch the word index
      const res = await fetch('https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main/index.json');
      const words: string[] = await res.json();
      
      // Pick a random word
      const randomIndex = Math.floor(Math.random() * words.length);
      const randomWord = words[randomIndex];
      
      // Navigate to the word
      goto(`/${encodeURIComponent(randomWord)}`);
    } catch (error) {
      console.error('Failed to get random word:', error);
    } finally {
      loading = false;
    }
  }
</script>

<button
  onclick={goToRandomWord}
  disabled={loading}
  data-random-word
  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if loading}
    <span class="animate-spin">🎲</span>
    <span>Yükleniyor...</span>
  {:else}
    <span>🎲</span>
    <span>Şanslı Hissediyorum</span>
  {/if}
</button>

