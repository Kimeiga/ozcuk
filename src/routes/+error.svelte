<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="text-center py-12">
    <div class="text-6xl mb-4">
      {#if $page.status === 404}
        🔍
      {:else if $page.status === 500}
        ⚠️
      {:else}
        ❌
      {/if}
    </div>
    
    <h1 class="text-3xl font-bold mb-4">
      {#if $page.status === 404}
        Sayfa Bulunamadı
      {:else if $page.status === 500}
        Sunucu Hatası
      {:else}
        Bir Hata Oluştu
      {/if}
    </h1>
    
    <p class="text-lg text-[var(--color-text-secondary)] mb-6">
      {#if $page.error?.message}
        {$page.error.message}
      {:else if $page.status === 404}
        Aradığınız sayfa bulunamadı.
      {:else}
        Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.
      {/if}
    </p>
    
    <a 
      href="/" 
      class="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
    >
      <span>🏠</span>
      <span>Ana Sayfaya Dön</span>
    </a>
  </div>
</div>

