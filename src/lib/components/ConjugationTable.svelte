<script lang="ts">
  import type { ConjugationTable as ConjugationTableType } from '$lib/types/turkish';
  import { SIMPLE_TENSES, COMPOUND_TENSES } from '$lib/utils/conjugate-turkish';

  interface Props {
    table: ConjugationTableType;
  }

  let { table }: Props = $props();
  let selectedTense = $state(0);
  let showNegative = $state(false);
  let showQuestion = $state(false);
  let showCompound = $state(false);

  const persons = [
    { key: 'ben', label: 'Ben (I)' },
    { key: 'sen', label: 'Sen (You)' },
    { key: 'o', label: 'O (He/She/It)' },
    { key: 'biz', label: 'Biz (We)' },
    { key: 'siz', label: 'Siz (You pl.)' },
    { key: 'onlar', label: 'Onlar (They)' }
  ] as const;

  // Filter tenses based on whether compound tenses are shown
  const visibleTenses = $derived(
    showCompound
      ? table.tenses
      : table.tenses.filter(t => SIMPLE_TENSES.includes(t.tense))
  );

  // Ensure selected tense is within bounds
  const safeSelectedTense = $derived(
    selectedTense >= visibleTenses.length ? 0 : selectedTense
  );

  const currentTense = $derived(visibleTenses[safeSelectedTense]);

  // Check if we have compound tenses available
  const hasCompoundTenses = $derived(
    table.tenses.some(t => COMPOUND_TENSES.includes(t.tense))
  );

  function getForm(personKey: string): string {
    const personForms = currentTense.forms[personKey as keyof typeof currentTense.forms];
    if (showNegative && showQuestion) {
      return personForms.negativeQuestion;
    } else if (showNegative) {
      return personForms.negative;
    } else if (showQuestion) {
      return personForms.question;
    }
    return personForms.positive;
  }
</script>

<div class="border border-[var(--color-border)] rounded-lg overflow-hidden">
  <!-- Tense Tabs -->
  <div class="flex flex-wrap gap-1 p-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
    {#each visibleTenses as tense, index}
      <button
        onclick={() => selectedTense = index}
        class="px-3 py-1.5 text-sm rounded transition-colors {safeSelectedTense === index
          ? 'bg-[var(--color-primary)] text-white'
          : 'hover:bg-[var(--color-border)]'}"
      >
        {tense.labelTr}
      </button>
    {/each}
  </div>

  <!-- Polarity and Compound Tense Toggles -->
  <div class="flex flex-wrap gap-4 p-3 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={showNegative} class="accent-[var(--color-primary)]" />
      <span class="text-sm">Olumsuz (Negative)</span>
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" bind:checked={showQuestion} class="accent-[var(--color-primary)]" />
      <span class="text-sm">Soru (Question)</span>
    </label>
    {#if hasCompoundTenses}
      <label class="flex items-center gap-2 cursor-pointer ml-auto">
        <input type="checkbox" bind:checked={showCompound} class="accent-[var(--color-primary)]" />
        <span class="text-sm font-medium text-[var(--color-primary)]">Bileşik Zamanlar (Compound)</span>
      </label>
    {/if}
  </div>

  <!-- Tense Header -->
  <div class="p-3 bg-[var(--color-bg)]">
    <h3 class="font-semibold">{currentTense.labelTr}</h3>
    <p class="text-sm text-[var(--color-text-secondary)]">{currentTense.label}</p>
  </div>

  <!-- Conjugation Table -->
  <table class="conjugation-table">
    <thead>
      <tr>
        <th class="w-1/3">Kişi (Person)</th>
        <th>Çekim (Conjugation)</th>
      </tr>
    </thead>
    <tbody>
      {#each persons as person}
        <tr>
          <td class="text-[var(--color-text-secondary)]">{person.label}</td>
          <td class="font-medium turkish-text">{getForm(person.key)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- Info Footer -->
  <div class="p-3 bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]">
    <div class="flex flex-wrap gap-4">
      <span><strong>Kök:</strong> {table.root}</span>
      <span><strong>Ünlü tipi:</strong> {table.vowelType === 'e-type' ? 'İnce ünlü' : 'Kalın ünlü'}</span>
      {#if showCompound}
        <span class="text-[var(--color-primary)]">📚 Bileşik zamanlar gösteriliyor</span>
      {/if}
    </div>
  </div>
</div>

