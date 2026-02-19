<script lang="ts">
  import { browser } from '$app/environment';
  
  type Theme = 'light' | 'dark' | 'system';
  
  let currentTheme = $state<Theme>('system');
  
  // Initialize theme from localStorage on mount
  $effect(() => {
    if (browser) {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        currentTheme = saved;
      }
      applyTheme(currentTheme);
    }
  });
  
  function applyTheme(theme: Theme) {
    if (!browser) return;
    
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    }
    // 'system' means no class, let CSS media query handle it
    
    localStorage.setItem('theme', theme);
  }
  
  function toggleTheme() {
    // Cycle: system -> light -> dark -> system
    if (currentTheme === 'system') {
      currentTheme = 'light';
    } else if (currentTheme === 'light') {
      currentTheme = 'dark';
    } else {
      currentTheme = 'system';
    }
    applyTheme(currentTheme);
  }
  
  const icons = {
    light: '☀️',
    dark: '🌙',
    system: '💻'
  };
  
  const labels = {
    light: 'Açık tema',
    dark: 'Koyu tema',
    system: 'Sistem'
  };
</script>

<button
  onclick={toggleTheme}
  class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] 
         border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
  title={labels[currentTheme]}
  aria-label="Tema değiştir"
>
  <span class="text-lg">{icons[currentTheme]}</span>
  <span class="text-sm hidden sm:inline">{labels[currentTheme]}</span>
</button>

