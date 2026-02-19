<script lang="ts">
  import '../app.css';
  import ThemeToggle from '$components/ThemeToggle.svelte';

  let { children, data } = $props();
</script>

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

