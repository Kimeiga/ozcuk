<script lang="ts">
  import '../app.css';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ThemeToggle from '$components/ThemeToggle.svelte';

  let { children, data } = $props();

  let headerSearchQuery = $state('');

  // Check if we're on the homepage
  const isHomepage = $derived($page.url.pathname === '/');

  function handleHeaderSearch(e: Event) {
    e.preventDefault();
    const query = headerSearchQuery.trim();
    if (query) {
      // Check if it looks like a sentence (2+ words)
      const words = query.split(/\s+/).filter(w => /\p{L}/u.test(w));
      if (words.length >= 2) {
        goto(`/analyze?s=${encodeURIComponent(query)}`);
      } else {
        goto(`/${encodeURIComponent(query)}`);
      }
      headerSearchQuery = '';
    }
  }

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
  <header class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
      <a href="/" class="flex items-center gap-2 text-xl font-bold text-[var(--color-primary)] shrink-0">
        <span class="text-2xl">📖</span>
        <span class="hidden sm:inline">Özcük</span>
      </a>

      <!-- Header Search Bar -->
      {#if !isHomepage}
        <form onsubmit={handleHeaderSearch} class="flex-1 max-w-md">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-sm">🔍</span>
            <input
              type="text"
              bind:value={headerSearchQuery}
              placeholder="Kelime veya cümle ara..."
              class="w-full pl-9 pr-3 py-2 rounded-full border border-[var(--color-border)]
                     bg-[var(--color-bg)] text-[var(--color-text)] text-sm
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                     placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
        </form>
      {:else}
        <div class="flex-1"></div>
      {/if}

      <nav class="flex items-center gap-1 sm:gap-2 shrink-0">
        <a href="/study" class="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]" title="Kelime Çalışması">
          📚
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

