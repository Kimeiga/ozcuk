<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
  }

  let { size = 'md', text }: Props = $props();

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
</script>

<div class="flex flex-col items-center justify-center gap-3">
  <div 
    class="animate-spin rounded-full border-[var(--color-primary)] border-t-transparent {sizeClasses[size]}"
  ></div>
  {#if text}
    <p class="text-sm text-[var(--color-text-secondary)]">{text}</p>
  {/if}
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 0.8s linear infinite;
  }
</style>

