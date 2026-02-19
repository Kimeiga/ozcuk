<script lang="ts">
  import { browser } from '$app/environment';

  type Theme = 'light' | 'dark';

  let currentTheme = $state<Theme>('light');

  // Initialize theme from localStorage on mount
  $effect(() => {
    if (browser) {
      const saved = localStorage.getItem('theme');
      // Convert 'system' to 'light' for backwards compatibility
      if (saved === 'dark') {
        currentTheme = 'dark';
      } else {
        currentTheme = 'light';
      }
      applyTheme(currentTheme);
    }
  });

  function applyTheme(theme: Theme) {
    if (!browser) return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
  }

  const icons = {
    light: '☀️',
    dark: '🌙'
  };

  const labels = {
    light: 'Açık tema',
    dark: 'Koyu tema'
  };
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
  title={labels[currentTheme]}
  aria-label="Tema değiştir"
>
  <span class="text-lg">{icons[currentTheme]}</span>
</button>

