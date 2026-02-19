<script lang="ts">
  import { getWordOfDay, type WordOfDay } from '$lib/utils/user-data';
  import { onMount } from 'svelte';

  let wordOfDay: WordOfDay | null = $state(null);

  onMount(() => {
    wordOfDay = getWordOfDay();
  });
</script>

{#if wordOfDay}
  <a 
    href="/{wordOfDay.word}" 
    class="block word-card border-2 border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-primary)]/10 hover:from-[var(--color-primary)]/10 hover:to-[var(--color-primary)]/20 transition-all"
  >
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">✨</span>
      <span class="text-sm font-medium text-[var(--color-primary)]">Günün Kelimesi</span>
    </div>
    <div class="text-2xl font-bold turkish-text mb-1">{wordOfDay.word}</div>
    <div class="text-sm text-[var(--color-text-secondary)] capitalize">{wordOfDay.pos}</div>
    <div class="mt-2 text-[var(--color-text)]">{wordOfDay.gloss}</div>
  </a>
{/if}

