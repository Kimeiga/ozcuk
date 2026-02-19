<script lang="ts">
  interface Props {
    text: string;
    lang?: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  let { text, lang = 'tr-TR', size = 'md' }: Props = $props();
  let isPlaying = $state(false);
  let isSupported = $state(true);
  
  // Check if Web Speech API is supported
  $effect(() => {
    isSupported = 'speechSynthesis' in window;
  });
  
  function speak() {
    if (!isSupported || isPlaying) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    
    // Try to find a Turkish voice
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(v => v.lang.startsWith('tr'));
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }
    
    utterance.onstart = () => {
      isPlaying = true;
    };
    
    utterance.onend = () => {
      isPlaying = false;
    };
    
    utterance.onerror = () => {
      isPlaying = false;
    };
    
    window.speechSynthesis.speak(utterance);
  }
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };
</script>

{#if isSupported}
  <button
    onclick={speak}
    disabled={isPlaying}
    class="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white 
           hover:bg-[var(--color-primary-hover)] transition-all duration-200 
           disabled:opacity-50 disabled:cursor-wait {sizeClasses[size]}"
    title="Sesli dinle"
    aria-label="Kelimeyi sesli dinle"
  >
    {#if isPlaying}
      <span class="animate-pulse">🔊</span>
    {:else}
      <span>🔈</span>
    {/if}
  </button>
{/if}

