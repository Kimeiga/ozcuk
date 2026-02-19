<script lang="ts">
  import { browser } from '$app/environment';

  interface Props {
    word: string;
    gloss?: string;
  }

  let { word, gloss = '' }: Props = $props();
  let copied = $state(false);
  let showMenu = $state(false);

  const shareUrl = $derived(browser ? `${window.location.origin}/${encodeURIComponent(word)}` : '');
  const shareText = $derived(`${word}${gloss ? ` - ${gloss}` : ''}`);

  async function copyLink() {
    if (!browser) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    }
    showMenu = false;
  }

  async function shareNative() {
    if (!browser || !navigator.share) return;
    try {
      await navigator.share({
        title: `Özcük - ${word}`,
        text: shareText,
        url: shareUrl
      });
    } catch {
      // User cancelled or error
    }
    showMenu = false;
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    showMenu = false;
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
    showMenu = false;
  }

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.share-menu-container')) {
      showMenu = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="share-menu-container relative">
  <button
    onclick={toggleMenu}
    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
    title="Paylaş"
  >
    <span>📤</span>
    <span>Paylaş</span>
  </button>

  {#if showMenu}
    <div class="absolute right-0 top-full mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[160px] z-50">
      {#if browser && 'share' in navigator}
        <button
          onclick={shareNative}
          class="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] flex items-center gap-2"
        >
          <span>📱</span> Paylaş...
        </button>
      {/if}
      
      <button
        onclick={copyLink}
        class="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] flex items-center gap-2"
      >
        <span>{copied ? '✓' : '🔗'}</span> {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
      </button>
      
      <button
        onclick={shareTwitter}
        class="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] flex items-center gap-2"
      >
        <span>🐦</span> Twitter
      </button>
      
      <button
        onclick={shareWhatsApp}
        class="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] flex items-center gap-2"
      >
        <span>💬</span> WhatsApp
      </button>
    </div>
  {/if}
</div>

