<script lang="ts">
  interface Props {
    word: string;
    user: App.Locals['user'];
  }

  let { word, user }: Props = $props();
  
  let note = $state('');
  let savedNote = $state('');
  let isLoading = $state(false);
  let isSaving = $state(false);
  let showEditor = $state(false);

  // Load existing note when word changes
  $effect(() => {
    if (user && word) {
      loadNote();
    }
  });

  async function loadNote() {
    isLoading = true;
    try {
      const response = await fetch(`/api/notes?word=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json() as { note: { note: string } | null };
        if (data.note) {
          note = data.note.note;
          savedNote = data.note.note;
        } else {
          note = '';
          savedNote = '';
        }
      }
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      isLoading = false;
    }
  }

  async function saveNote() {
    if (!user) return;
    
    isSaving = true;
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, note })
      });
      
      if (response.ok) {
        savedNote = note;
        showEditor = false;
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      isSaving = false;
    }
  }

  async function deleteNote() {
    if (!user || !confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    
    isSaving = true;
    try {
      const response = await fetch(`/api/notes?word=${encodeURIComponent(word)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        note = '';
        savedNote = '';
        showEditor = false;
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      isSaving = false;
    }
  }

  const hasChanges = $derived(note !== savedNote);
</script>

<div class="word-note">
  {#if !user}
    <p class="text-sm text-[var(--color-text-secondary)]">
      <a href="/auth/login" class="text-[var(--color-primary)] hover:underline">Giriş yapın</a>
      bu kelimeye not eklemek için.
    </p>
  {:else if isLoading}
    <p class="text-sm text-[var(--color-text-secondary)]">Yükleniyor...</p>
  {:else if showEditor || savedNote}
    <div class="space-y-3">
      <textarea
        bind:value={note}
        placeholder="Bu kelime hakkında notlarınızı yazın..."
        class="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] 
               text-[var(--color-text)] resize-y min-h-24 focus:outline-none 
               focus:ring-2 focus:ring-[var(--color-primary)]"
        rows="3"
      ></textarea>
      
      <div class="flex gap-2">
        <button
          onclick={saveNote}
          disabled={isSaving || !hasChanges}
          class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white 
                 hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        
        {#if savedNote}
          <button
            onclick={deleteNote}
            disabled={isSaving}
            class="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-50"
          >
            Sil
          </button>
        {/if}
        
        {#if !savedNote}
          <button
            onclick={() => { showEditor = false; note = ''; }}
            class="px-4 py-2 rounded-lg border border-[var(--color-border)] 
                   text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            İptal
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <button
      onclick={() => showEditor = true}
      class="flex items-center gap-2 text-[var(--color-primary)] hover:underline"
    >
      <span>📝</span>
      <span>Not ekle</span>
    </button>
  {/if}
</div>

