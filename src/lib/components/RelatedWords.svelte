<script lang="ts">
  import type { TurkishSense } from '$lib/types/turkish';

  interface Props {
    senses: TurkishSense[];
  }

  let { senses }: Props = $props();

  // Collect all synonyms and antonyms from all senses
  const synonyms = $derived(
    [...new Set(senses.flatMap(s => s.synonyms ?? []))]
  );

  const antonyms = $derived(
    [...new Set(senses.flatMap(s => s.antonyms ?? []))]
  );

  const hasRelated = $derived(synonyms.length > 0 || antonyms.length > 0);
</script>

{#if hasRelated}
  <section class="mb-6">
    <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
      <span>🔗</span>
      İlgili Kelimeler
    </h2>
    
    <div class="space-y-4">
      {#if synonyms.length > 0}
        <div>
          <h3 class="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Eş Anlamlılar</h3>
          <div class="flex flex-wrap gap-2">
            {#each synonyms as synonym}
              <a 
                href="/{encodeURIComponent(synonym)}"
                class="inline-block px-3 py-1 text-sm rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors turkish-text"
              >
                {synonym}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      {#if antonyms.length > 0}
        <div>
          <h3 class="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Zıt Anlamlılar</h3>
          <div class="flex flex-wrap gap-2">
            {#each antonyms as antonym}
              <a 
                href="/{encodeURIComponent(antonym)}"
                class="inline-block px-3 py-1 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors turkish-text"
              >
                {antonym}
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}

