<script lang="ts">
  import { page } from '$app/stores';
  import type { ProcessedWord } from '$lib/utils/dictionary';
  import { getPosLabel, isVerb, isInfinitive } from '$lib/utils/dictionary';
  import { conjugateVerb, getConjugation } from '$lib/utils/conjugate-turkish';
  import ConjugationTable from './ConjugationTable.svelte';
  import AudioButton from './AudioButton.svelte';
  import MorphBreakdown from './MorphBreakdown.svelte';
  import WordNote from './WordNote.svelte';
  import ShareButton from './ShareButton.svelte';
  import SaveButton from './SaveButton.svelte';
  import RelatedWords from './RelatedWords.svelte';
  import type { DeinflectionResult } from '$lib/utils/deinflect';

  interface Props {
    word: ProcessedWord;
    baseWordData?: ProcessedWord | null; // For form-of entries, the base word's data
    deinflectionInfo?: DeinflectionResult | null;
    showNotes?: boolean;
  }

  let { word, baseWordData = null, deinflectionInfo = null, showNotes = false }: Props = $props();

  // Check if the current word is a form-of entry
  const isFormOf = $derived(word.senses?.some(sense => sense.tags?.includes('form-of')) ?? false);

  const user = $derived($page.data.user);
  let showConjugation = $state(false);

  // Generate conjugation table if this is a verb
  const conjugationTable = $derived.by(() => {
    if (isVerb(word) && isInfinitive(word.word)) {
      return conjugateVerb(word.word, true);
    }
    return null;
  });
</script>

<article>
  <!-- Deinflection info if word was conjugated/inflected -->
  {#if deinflectionInfo}
    <div class="mb-4 text-sm bg-[var(--color-bg-secondary)] px-4 py-3 rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <span class="turkish-text font-medium text-[var(--color-text)]">{deinflectionInfo.originalWord || ''}</span>
        <span class="text-[var(--color-text-secondary)]">→</span>
        <span class="turkish-text font-bold text-[var(--color-primary)]">{word.word}</span>
      </div>
      {#if deinflectionInfo.suffixLabels && deinflectionInfo.suffixLabels.length > 0}
        <div class="flex flex-wrap gap-1">
          {#each deinflectionInfo.suffixLabels as label}
            <span class="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
              {label}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Word Header -->
  <header class="mb-6">
    <div class="flex items-start gap-3 flex-wrap">
      <h2 class="text-3xl font-bold turkish-text">{word.word}</h2>
      <AudioButton text={word.word} size="lg" />
      <span class="pos-badge pos-{word.pos === 'adjective' ? 'adj' : word.pos === 'adverb' ? 'adv' : word.pos}">
        {getPosLabel(word.pos).tr}
      </span>
      <div class="ml-auto flex items-center gap-2">
        <SaveButton word={word.word} pos={word.pos} gloss={word.senses?.[0]?.glosses?.[0] || ''} />
        <ShareButton word={word.word} gloss={word.senses?.[0]?.glosses?.[0]} />
      </div>
    </div>

    {#if word.pronunciation}
      <div class="mt-2 text-[var(--color-text-secondary)]">
        <span class="font-mono">/{word.pronunciation}/</span>
      </div>
    {/if}
  </header>

  <!-- English Definitions -->
  <section class="mb-6">
    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
      <span>🇬🇧</span>
      İngilizce Anlamlar
    </h3>
    <ol class="list-decimal list-inside space-y-3">
      {#each word.senses as sense}
        <li class="pl-2">
          {#each sense.glosses as gloss}
            <span class="text-[var(--color-text)]">{gloss}</span>
          {/each}

          {#if sense.tags?.length}
            <div class="ml-6 mt-1">
              {#each sense.tags as tag}
                <span class="text-xs px-2 py-0.5 bg-[var(--color-bg-secondary)] rounded mr-1">{tag}</span>
              {/each}
            </div>
          {/if}

          {#if sense.examples?.length}
            <div class="ml-6 mt-2 space-y-1">
              {#each sense.examples as example}
                <div class="text-sm">
                  <span class="text-[var(--color-text)] italic">"{example.text}"</span>
                  {#if example.translation}
                    <span class="text-[var(--color-text-secondary)]"> — {example.translation}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  </section>

  <!-- Base Word Definition (for form-of entries) -->
  {#if isFormOf && baseWordData}
    <section class="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border-l-4 border-[var(--color-primary)]">
      <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <a href="/{encodeURIComponent(baseWordData.word)}" class="turkish-text text-[var(--color-primary)] hover:underline">
          {baseWordData.word}
        </a>
        <span class="pos-badge pos-{baseWordData.pos === 'adjective' ? 'adj' : baseWordData.pos === 'adverb' ? 'adv' : baseWordData.pos}">
          {getPosLabel(baseWordData.pos).tr}
        </span>
      </h3>
      <ol class="list-decimal list-inside space-y-2">
        {#each baseWordData.senses as sense}
          <li class="pl-2 text-[var(--color-text)]">
            {#each sense.glosses as gloss}
              <span>{gloss}</span>
            {/each}
          </li>
        {/each}
      </ol>
    </section>
  {/if}

  <!-- Etymology -->
  {#if word.etymology}
    <section class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Köken</h3>
      <p class="text-[var(--color-text-secondary)]">{word.etymology}</p>
    </section>
  {/if}

  <!-- Related Words -->
  <RelatedWords senses={word.senses} />

  <!-- Personal Notes (optional) -->
  {#if showNotes}
    <section class="mb-6">
      <h3 class="text-lg font-semibold mb-3">📝 Notlarım</h3>
      <WordNote word={word.word} user={user ?? null} />
    </section>
  {/if}

  <!-- Morphological Breakdown (for verbs) -->
  {#if conjugationTable}
    <section class="mb-6">
      <h3 class="text-lg font-semibold mb-3">Morfolojik Yapı</h3>
      <MorphBreakdown
        word={getConjugation(word.word, 'present', 'ben', false)}
        root={conjugationTable.root}
        tense="present"
        person="ben"
        isNegative={false}
      />
    </section>
  {/if}

  <!-- Conjugation (for verbs) -->
  {#if conjugationTable}
    <section class="mb-6">
      <button
        onclick={() => showConjugation = !showConjugation}
        class="flex items-center gap-2 text-lg font-semibold text-[var(--color-primary)] hover:underline"
      >
        <span>{showConjugation ? '▼' : '▶'}</span>
        <span>Fiil Çekimi</span>
      </button>

      {#if showConjugation}
        <div class="mt-4">
          <ConjugationTable table={conjugationTable} />
        </div>
      {/if}
    </section>
  {/if}
</article>

