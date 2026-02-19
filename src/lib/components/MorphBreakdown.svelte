<script lang="ts">
  import type { TurkishTense, Person } from '$lib/types/turkish';
  
  interface Props {
    word: string;
    root: string;
    tense?: TurkishTense;
    person?: Person;
    isNegative?: boolean;
  }
  
  let { word, root, tense, person, isNegative = false }: Props = $props();
  
  // Color scheme for different morpheme types
  const colors = {
    root: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    negative: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    tense: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    person: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    other: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  };
  
  // Tense suffix info
  const tenseSuffixes: Record<string, { suffix: string; meaning: string }> = {
    present: { suffix: '-yor', meaning: 'Present continuous' },
    past: { suffix: '-DI', meaning: 'Simple past' },
    future: { suffix: '-(y)AcAk', meaning: 'Future' },
    aorist: { suffix: '-Ar/-Ir', meaning: 'Aorist/habitual' },
    reported: { suffix: '-mIş', meaning: 'Reported past' },
    conditional: { suffix: '-sA', meaning: 'Conditional' },
    necessitative: { suffix: '-mAlI', meaning: 'Must/should' },
    optative: { suffix: '-(y)A', meaning: 'Wish/desire' },
    imperative: { suffix: '∅', meaning: 'Command' },
    pastContinuous: { suffix: '-yordu', meaning: 'Past continuous' },
    futurePast: { suffix: '-AcAktI', meaning: 'Future in past' },
    pastReported: { suffix: '-mIştI', meaning: 'Past reported' },
    aoristPast: { suffix: '-IrdI', meaning: 'Aorist past' },
    pastContinuousReported: { suffix: '-yormuş', meaning: 'Continuous reported' }
  };
  
  // Person suffix info
  const personSuffixes: Record<Person, { suffix: string; meaning: string }> = {
    ben: { suffix: '-Im/-m', meaning: 'I' },
    sen: { suffix: '-sIn/-n', meaning: 'you (sg.)' },
    o: { suffix: '∅', meaning: 'he/she/it' },
    biz: { suffix: '-Iz/-k', meaning: 'we' },
    siz: { suffix: '-sInIz/-nIz', meaning: 'you (pl.)' },
    onlar: { suffix: '-lAr', meaning: 'they' }
  };
  
  // Break down the word into morphemes
  const morphemes = $derived.by(() => {
    const parts: { text: string; type: keyof typeof colors; label: string }[] = [];
    
    // Add root
    parts.push({ text: root, type: 'root', label: 'kök (root)' });
    
    // If we have tense info, add those morphemes
    if (isNegative) {
      parts.push({ text: '-mA', type: 'negative', label: 'olumsuz (negative)' });
    }
    
    if (tense && tenseSuffixes[tense]) {
      parts.push({ 
        text: tenseSuffixes[tense].suffix, 
        type: 'tense', 
        label: tenseSuffixes[tense].meaning 
      });
    }
    
    if (person && personSuffixes[person]) {
      parts.push({ 
        text: personSuffixes[person].suffix, 
        type: 'person', 
        label: personSuffixes[person].meaning 
      });
    }
    
    return parts;
  });
</script>

<div class="morph-breakdown">
  <div class="flex flex-wrap items-center gap-1 text-lg">
    {#each morphemes as morph, i}
      {#if i > 0}
        <span class="text-gray-400 mx-0.5">+</span>
      {/if}
      <span 
        class="inline-flex flex-col items-center px-2 py-1 rounded border {colors[morph.type].bg} {colors[morph.type].text} {colors[morph.type].border}"
        title={morph.label}
      >
        <span class="font-semibold turkish-text">{morph.text}</span>
        <span class="text-xs opacity-70">{morph.label}</span>
      </span>
    {/each}
  </div>
  
  <div class="mt-2 text-sm text-[var(--color-text-secondary)]">
    <span class="font-mono turkish-text">{word}</span>
  </div>
</div>

<style>
  .morph-breakdown {
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
  }
</style>

