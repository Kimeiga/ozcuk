<script lang="ts">
  import '../app.css';
  import ThemeToggle from '$components/ThemeToggle.svelte';

  let { children, data } = $props();

  // Global keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    // Ignore if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Escape clears focus from input
      if (e.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // "/" focuses the search bar
    if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="text"], input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    // "r" goes to random word (with Shift to avoid accidental triggers)
    if (e.key === 'r' && e.shiftKey) {
      e.preventDefault();
      const randomBtn = document.querySelector('button[data-random-word]') as HTMLButtonElement;
      if (randomBtn) {
        randomBtn.click();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>Özcük - Türkçe Sözlük</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <header class="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 text-xl font-bold text-[var(--color-primary)]">
        <span class="text-2xl">📖</span>
        <span>Özcük</span>
      </a>
      <nav class="flex items-center gap-2 sm:gap-4">
        <a href="/study" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-sm sm:text-base" title="Kelime Çalışması">
          📚
        </a>
        <a href="/about" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-sm sm:text-base">
          Hakkında
        </a>
        <ThemeToggle />

        {#if data.user}
          <div class="flex items-center gap-2">
            {#if data.user.avatarUrl}
              <img
                src={data.user.avatarUrl}
                alt={data.user.name || 'User'}
                class="w-8 h-8 rounded-full"
              />
            {/if}
            <a
              href="/auth/logout"
              class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              Çıkış
            </a>
          </div>
        {:else}
          <a
            href="/auth/login"
            class="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-primary-hover)]"
          >
            Giriş
          </a>
        {/if}
      </nav>
    </div>
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-text-secondary)]">
    <p>Özcük - Türkçe'nin en kapsamlı sözlük uygulaması</p>
    <p class="mt-1">Veri kaynağı: <a href="https://kaikki.org" class="underline hover:text-[var(--color-text)]">Kaikki.org</a> (Wiktionary)</p>
  </footer>
</div>

