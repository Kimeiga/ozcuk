<script lang="ts">
  import { saveWord, removeSavedWord, isWordSaved } from '$lib/utils/user-data';

  interface Props {
    word: string;
    pos: string;
    gloss: string;
  }

  let { word, pos, gloss }: Props = $props();
  let saved = $state(false);

  // Check if word is saved on mount
  $effect(() => {
    saved = isWordSaved(word);
  });

  function toggleSave() {
    if (saved) {
      removeSavedWord(word);
      saved = false;
    } else {
      saveWord(word, pos, gloss);
      saved = true;
    }
  }
</script>

<button
  onclick={toggleSave}
  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
    {saved 
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'}"
  title={saved ? 'Kayıtlı kelimelerden çıkar' : 'Kelimeyi kaydet'}
>
  {#if saved}
    <span>⭐</span>
    <span>Kayıtlı</span>
  {:else}
    <span>☆</span>
    <span>Kaydet</span>
  {/if}
</button>

