<script lang="ts">
</script>

<svelte:head>
  <title>Hakkında - Özcük Türkçe Sözlük</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-12">
  <h1 class="text-3xl font-bold mb-8">Hakkında</h1>
  
  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Özcük Nedir?</h2>
    <p class="text-[var(--color-text-secondary)] mb-4">
      Özcük, Türkçe'nin en kapsamlı çevrimiçi sözlük uygulamasıdır. 40.000'den fazla kelime, 
      fiil çekimleri, morfolojik analiz ve örnek cümleler içerir.
    </p>
    <p class="text-[var(--color-text-secondary)]">
      Özcük is the most comprehensive Turkish dictionary web application. It contains 
      over 40,000 words with verb conjugations, morphological analysis, and example sentences.
    </p>
  </section>

  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Özellikler</h2>
    <ul class="space-y-2 text-[var(--color-text-secondary)]">
      <li class="flex items-start gap-2">
        <span>📚</span>
        <span><strong>40.000+ Kelime:</strong> Wiktionary'den alınan kapsamlı Türkçe sözlük verisi</span>
      </li>
      <li class="flex items-start gap-2">
        <span>🔄</span>
        <span><strong>Fiil Çekimleri:</strong> Tüm zamanlar ve kişiler için tam çekim tabloları</span>
      </li>
      <li class="flex items-start gap-2">
        <span>🔍</span>
        <span><strong>Morfolojik Analiz:</strong> Kelimelerin kök ve eklerini anında görün</span>
      </li>
      <li class="flex items-start gap-2">
        <span>⚡</span>
        <span><strong>Hızlı Arama:</strong> Anında sonuçlarla otomatik tamamlama</span>
      </li>
      <li class="flex items-start gap-2">
        <span>📱</span>
        <span><strong>Duyarlı Tasarım:</strong> Her cihazda mükemmel görüntüleme</span>
      </li>
    </ul>
  </section>

  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Veri Kaynağı</h2>
    <p class="text-[var(--color-text-secondary)] mb-4">
      Sözlük verisi <a href="https://kaikki.org" class="text-[var(--color-primary)] hover:underline" target="_blank" rel="noopener">Kaikki.org</a> 
      tarafından işlenen <a href="https://tr.wiktionary.org" class="text-[var(--color-primary)] hover:underline" target="_blank" rel="noopener">Wiktionary</a> 
      verilerinden elde edilmiştir.
    </p>
    <p class="text-[var(--color-text-secondary)]">
      Dictionary data is sourced from <a href="https://tr.wiktionary.org" class="text-[var(--color-primary)] hover:underline" target="_blank" rel="noopener">Wiktionary</a>, 
      processed by <a href="https://kaikki.org" class="text-[var(--color-primary)] hover:underline" target="_blank" rel="noopener">Kaikki.org</a>.
    </p>
  </section>

  <section class="mb-8">
    <h2 class="text-xl font-semibold mb-3">Teknoloji</h2>
    <div class="flex flex-wrap gap-2">
      <span class="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full text-sm">SvelteKit</span>
      <span class="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full text-sm">TypeScript</span>
      <span class="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full text-sm">Tailwind CSS</span>
      <span class="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full text-sm">Cloudflare Pages</span>
    </div>
  </section>

  <section>
    <h2 class="text-xl font-semibold mb-3">İletişim</h2>
    <p class="text-[var(--color-text-secondary)]">
      Önerileriniz ve geri bildirimleriniz için GitHub üzerinden iletişime geçebilirsiniz.
    </p>
  </section>
</div>

