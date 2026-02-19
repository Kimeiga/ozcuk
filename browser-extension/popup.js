const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main/words';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('error-message');

const wordText = document.getElementById('word-text');
const wordPos = document.getElementById('word-pos');
const wordPronunciation = document.getElementById('word-pronunciation');
const wordDefinitions = document.getElementById('word-definitions');
const wordLink = document.getElementById('word-link');

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
  numeral: 'Sayı',
  affix: 'Ek',
  suffix: 'Sonek',
  prefix: 'Önek'
};

async function lookupWord(word) {
  const normalized = word.toLowerCase().trim();
  if (!normalized) return;

  showLoading();
  
  try {
    const url = `${CDN_BASE}/${encodeURIComponent(normalized)}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Kelime bulunamadı');
    }
    
    const data = await response.json();
    displayWord(data);
  } catch (err) {
    showError(err.message || 'Bir hata oluştu');
  }
}

function displayWord(data) {
  // If array, take first entry
  const word = Array.isArray(data) ? data[0] : data;
  
  wordText.textContent = word.word;
  wordPos.textContent = posLabels[word.pos] || word.pos;
  
  if (word.pronunciation) {
    wordPronunciation.textContent = `/${word.pronunciation}/`;
    wordPronunciation.style.display = 'block';
  } else {
    wordPronunciation.style.display = 'none';
  }
  
  // Show top 3 definitions
  wordDefinitions.innerHTML = '';
  const senses = word.senses?.slice(0, 3) || [];
  for (const sense of senses) {
    const gloss = sense.glosses?.[0];
    if (gloss) {
      const div = document.createElement('div');
      div.className = 'definition';
      div.textContent = gloss;
      wordDefinitions.appendChild(div);
    }
  }
  
  wordLink.href = `https://ozcuk.pages.dev/${encodeURIComponent(word.word)}`;
  
  hideAll();
  resultDiv.classList.remove('hidden');
}

function showLoading() {
  hideAll();
  loadingDiv.classList.remove('hidden');
}

function showError(msg) {
  hideAll();
  errorMessage.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideAll() {
  resultDiv.classList.add('hidden');
  loadingDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');
}

// Event listeners
searchBtn.addEventListener('click', () => {
  lookupWord(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    lookupWord(searchInput.value);
  }
});

// Check for word passed from context menu
chrome.storage.local.get(['selectedWord'], (result) => {
  if (result.selectedWord) {
    searchInput.value = result.selectedWord;
    lookupWord(result.selectedWord);
    // Clear after use
    chrome.storage.local.remove('selectedWord');
  }
});

