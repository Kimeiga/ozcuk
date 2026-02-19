// Content script for Özcük browser extension
// Shows tooltip on double-click of Turkish words

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main/words';

const posLabels = {
  noun: 'İsim',
  verb: 'Fiil',
  adjective: 'Sıfat',
  adverb: 'Zarf',
  pronoun: 'Zamir',
  interjection: 'Ünlem',
  conjunction: 'Bağlaç',
  postposition: 'Edat',
  particle: 'Partikel',
  numeral: 'Sayı'
};

let tooltip = null;

function createTooltip() {
  if (tooltip) return tooltip;
  
  tooltip = document.createElement('div');
  tooltip.id = 'ozcuk-tooltip';
  tooltip.innerHTML = `
    <div class="ozcuk-tooltip-content">
      <div class="ozcuk-loading">Aranıyor...</div>
      <div class="ozcuk-word-header">
        <span class="ozcuk-word"></span>
        <span class="ozcuk-pos"></span>
      </div>
      <div class="ozcuk-definitions"></div>
      <a class="ozcuk-link" href="#" target="_blank">Detaylı bilgi →</a>
    </div>
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(x, y) {
  const tt = createTooltip();
  tt.style.display = 'block';
  
  // Position tooltip near cursor but ensure it stays in viewport
  const rect = tt.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + 10;
  let top = y + 10;
  
  if (left + 300 > viewportWidth) {
    left = viewportWidth - 310;
  }
  if (top + 200 > viewportHeight) {
    top = y - 210;
  }
  
  tt.style.left = `${left + window.scrollX}px`;
  tt.style.top = `${top + window.scrollY}px`;
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

async function lookupAndShow(word, x, y) {
  const normalized = word.toLowerCase().trim();
  if (!normalized || normalized.length < 2) return;
  
  // Only process if word contains Turkish letters or common Latin letters
  if (!/^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/u.test(normalized)) return;
  
  showTooltip(x, y);
  
  const content = tooltip.querySelector('.ozcuk-tooltip-content');
  const loading = tooltip.querySelector('.ozcuk-loading');
  const header = tooltip.querySelector('.ozcuk-word-header');
  const defs = tooltip.querySelector('.ozcuk-definitions');
  const link = tooltip.querySelector('.ozcuk-link');
  
  loading.style.display = 'block';
  header.style.display = 'none';
  defs.style.display = 'none';
  link.style.display = 'none';
  
  try {
    const url = `${CDN_BASE}/${encodeURIComponent(normalized)}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      loading.textContent = 'Kelime bulunamadı';
      return;
    }
    
    const data = await response.json();
    const wordData = Array.isArray(data) ? data[0] : data;
    
    // Update tooltip content
    tooltip.querySelector('.ozcuk-word').textContent = wordData.word;
    tooltip.querySelector('.ozcuk-pos').textContent = posLabels[wordData.pos] || wordData.pos;
    
    defs.innerHTML = '';
    const senses = wordData.senses?.slice(0, 2) || [];
    for (const sense of senses) {
      const gloss = sense.glosses?.[0];
      if (gloss) {
        const div = document.createElement('div');
        div.className = 'ozcuk-definition';
        div.textContent = gloss;
        defs.appendChild(div);
      }
    }
    
    link.href = `https://ozcuk.pages.dev/${encodeURIComponent(wordData.word)}`;
    
    loading.style.display = 'none';
    header.style.display = 'flex';
    defs.style.display = 'block';
    link.style.display = 'inline';
    
  } catch (err) {
    loading.textContent = 'Hata oluştu';
  }
}

// Listen for double-click to show tooltip
document.addEventListener('dblclick', (e) => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  
  if (text && text.length > 0) {
    lookupAndShow(text, e.clientX, e.clientY);
  }
});

// Hide tooltip on click elsewhere
document.addEventListener('click', (e) => {
  if (tooltip && !tooltip.contains(e.target)) {
    hideTooltip();
  }
});

// Hide on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideTooltip();
  }
});

