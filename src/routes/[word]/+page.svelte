<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import SearchBar from '$components/SearchBar.svelte';
  import ConjugationTable from '$components/ConjugationTable.svelte';
  import AudioButton from '$components/AudioButton.svelte';
  import MorphBreakdown from '$components/MorphBreakdown.svelte';
  import WordNote from '$components/WordNote.svelte';
  import ShareButton from '$components/ShareButton.svelte';
  import SaveButton from '$components/SaveButton.svelte';
  import RelatedWords from '$components/RelatedWords.svelte';
  import { getPosLabel, isVerb, isInfinitive } from '$lib/utils/dictionary';
  import { conjugateVerb, getConjugation } from '$lib/utils/conjugate-turkish';
  import { addRecentlyViewed } from '$lib/utils/user-data';

  let { data } = $props();

  // Get user from page data (from layout)
  const user = $derived($page.data.user);
  let searchQuery = $derived(data.query);
  let showConjugation = $state(false);

  function handleSearch(query: string) {
    if (query.trim()) {
      goto(`/${encodeURIComponent(query.trim())}`);
    }
  }

  // Track recently viewed words
  $effect(() => {
    if (data.words.length > 0 && !data.notFound) {
      const word = data.words[0];
      const pos = word.pos || 'unknown';
      const gloss = word.senses?.[0]?.glosses?.[0] || '';
      addRecentlyViewed(word.word, pos, gloss);
    }
  });

  // Generate conjugation table if this is a verb (include compound tenses)
  const conjugationTable = $derived.by(() => {
    if (data.words.length > 0) {
      const word = data.words[0];
      if (isVerb(word) && isInfinitive(word.word)) {
        // Pass true to include compound tenses
        return conjugateVerb(word.word, true);
      }
    }
    return null;
  });
</script>

<svelte:head>
  <title>{data.query} - Özcük Türkçe Sözlük</title>
  <meta name="description" content="'{data.query}' kelimesinin anlamı, çekimi ve kullanımı - Özcük Türkçe Sözlük" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Search Bar -->
  <section class="mb-8">
    <SearchBar bind:query={searchQuery} onSearch={handleSearch} autofocus={false} />
  </section>

  {#if data.notFound}
    <!-- Not Found -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-2xl font-bold mb-2">"{data.query}" bulunamadı</h1>
      <p class="text-[var(--color-text-secondary)]">
        Bu kelime sözlüğümüzde mevcut değil. Başka bir kelime aramayı deneyin.
      </p>
      
      {#if data.deinflectionResults.length > 0}
        <div class="mt-6">
          <p class="text-sm text-[var(--color-text-secondary)] mb-2">Olası kök formlar:</p>
          <div class="flex flex-wrap justify-center gap-2">
            {#each data.deinflectionResults as result}
              <a 
                href="/{result.dictionaryForm}" 
                class="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full text-sm hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              >
                {result.dictionaryForm}
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Word Found -->
    {#each data.words as word, wordIndex}
      <article class="mb-8">
        <!-- Word Header -->
        <header class="mb-6">
          <div class="flex items-start gap-3 flex-wrap">
            <h1 class="text-4xl font-bold turkish-text">{word.word}</h1>
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

        <!-- TDK Turkish Definitions (if available) -->
        {#if data.tdkEntry && wordIndex === 0}
          <section class="mb-6">
            <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
              <span class="text-red-600">🇹🇷</span>
              Türkçe Anlamlar
              <span class="text-xs font-normal text-[var(--color-text-secondary)]">(TDK)</span>
            </h2>
            <ol class="list-decimal list-inside space-y-3">
              {#each data.tdkEntry.anlamlar.slice(0, 10) as anlam}
                <li class="pl-2">
                  <span class="text-[var(--color-text)]">{anlam.anlam}</span>
                  {#if anlam.ozellikler?.length}
                    <span class="ml-2">
                      {#each anlam.ozellikler as oz}
                        <span class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">{oz}</span>
                      {/each}
                    </span>
                  {/if}
                  {#if anlam.ornekler?.length}
                    <div class="ml-6 mt-2 space-y-1">
                      {#each anlam.ornekler.slice(0, 2) as ornek}
                        <div class="text-sm">
                          <span class="text-[var(--color-text)] italic">"{ornek.ornek}"</span>
                          {#if ornek.yazar}
                            <span class="text-[var(--color-text-secondary)]"> — {ornek.yazar}</span>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </li>
              {/each}
            </ol>
            {#if data.tdkEntry.anlamlar.length > 10}
              <p class="text-sm text-[var(--color-text-secondary)] mt-2">
                + {data.tdkEntry.anlamlar.length - 10} daha fazla anlam
              </p>
            {/if}
          </section>
        {/if}

        <!-- English Definitions -->
        <section class="mb-6">
          <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🇬🇧</span>
            İngilizce Anlamlar
          </h2>
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

        <!-- Etymology -->
        {#if word.etymology}
          <section class="mb-6">
            <h2 class="text-lg font-semibold mb-2">Köken</h2>
            <p class="text-[var(--color-text-secondary)]">{word.etymology}</p>
          </section>
        {/if}

        <!-- Related Words (Synonyms/Antonyms) -->
        <RelatedWords senses={word.senses} />

        <!-- Personal Notes -->
        {#if wordIndex === 0}
          <section class="mb-6">
            <h2 class="text-lg font-semibold mb-3">📝 Notlarım</h2>
            <WordNote word={word.word} user={user ?? null} />
          </section>
        {/if}

        <!-- Morphological Breakdown (for verbs) -->
        {#if conjugationTable && wordIndex === 0}
          <section class="mb-6">
            <h2 class="text-lg font-semibold mb-3">Morfolojik Yapı</h2>
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
        {#if conjugationTable && wordIndex === 0}
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
      
      {#if wordIndex < data.words.length - 1}
        <hr class="border-[var(--color-border)] my-8" />
      {/if}
    {/each}
  {/if}
</div>

