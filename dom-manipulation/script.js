// In-memory data model for quotes. Each quote: { id, text, category, updatedAt }
let quotes = [];

// Keys for storage
const LOCAL_STORAGE_QUOTES_KEY = 'dqg.quotes.v1';
const LOCAL_STORAGE_LAST_FILTER_KEY = 'dqg.lastFilter.v1';
const SESSION_STORAGE_LAST_VIEWED_KEY = 'dqg.lastViewed.v1';

// Utility: save quotes to localStorage
function saveQuotes() {
  localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(quotes));
}

// Utility: load quotes from localStorage or seed defaults
function loadQuotes() {
  const stored = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        quotes = parsed;
        return;
      }
    } catch (e) {
      // fall-through to seeding
    }
  }
  const now = Date.now();
  quotes = [
    { id: cryptoRandomId(), text: 'The best way to predict the future is to invent it.', category: 'Inspiration', updatedAt: now },
    { id: cryptoRandomId(), text: 'Simplicity is the soul of efficiency.', category: 'Productivity', updatedAt: now },
    { id: cryptoRandomId(), text: 'Programs must be written for people to read.', category: 'Programming', updatedAt: now }
  ];
  saveQuotes();
}

function cryptoRandomId() {
  // Prefer crypto if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(3);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(n => n.toString(36)).join('');
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// DOM references
const quoteDisplayEl = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilterEl = document.getElementById('categoryFilter');
const addQuoteContainerEl = document.getElementById('addQuoteContainer');
const lastViewedInfoEl = document.getElementById('lastViewedInfo');
const importFileEl = document.getElementById('importFile');
const exportBtn = document.getElementById('exportJson');
const syncNowBtn = document.getElementById('syncNow');
const notificationEl = document.getElementById('notification');

// Mount application
init();

function init() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();
  restoreLastFilter();
  wireEvents();
  showRandomQuote();
  startPeriodicSync();
  window.__APP_MOUNTED__ = true;
}

function wireEvents() {
  newQuoteBtn.addEventListener('click', () => {
    showRandomQuote();
  });

  categoryFilterEl.addEventListener('change', () => {
    filterQuotes();
  });

  exportBtn.addEventListener('click', exportToJsonFile);

  importFileEl.addEventListener('change', importFromJsonFile);

  syncNowBtn.addEventListener('click', () => {
    syncWithServer().catch(() => {});
  });
}

// Display a random quote honoring the current filter
function showRandomQuote() {
  const selectedCategory = categoryFilterEl.value;
  const list = selectedCategory === 'all' ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (list.length === 0) {
    quoteDisplayEl.textContent = 'No quotes available for this category.';
    return;
  }
  const random = list[Math.floor(Math.random() * list.length)];
  renderQuote(random);
  // Save last viewed quote id in session storage
  sessionStorage.setItem(SESSION_STORAGE_LAST_VIEWED_KEY, JSON.stringify({ id: random.id, at: Date.now() }));
  renderLastViewedInfo();
}

function renderQuote(q) {
  quoteDisplayEl.innerHTML = '';
  const block = document.createElement('blockquote');
  block.textContent = q.text;
  const cite = document.createElement('cite');
  cite.textContent = '— ' + q.category;
  cite.style.display = 'block';
  cite.style.marginTop = '8px';
  quoteDisplayEl.appendChild(block);
  quoteDisplayEl.appendChild(cite);
}

function renderLastViewedInfo() {
  const raw = sessionStorage.getItem(SESSION_STORAGE_LAST_VIEWED_KEY);
  if (!raw) {
    lastViewedInfoEl.textContent = '';
    return;
  }
  try {
    const { at } = JSON.parse(raw);
    const d = new Date(at);
    lastViewedInfoEl.textContent = 'Last viewed: ' + d.toLocaleString();
  } catch {
    lastViewedInfoEl.textContent = '';
  }
}

// Create the Add Quote form into the container
function createAddQuoteForm() {
  addQuoteContainerEl.innerHTML = '';
  const wrapper = document.createElement('div');

  const row = document.createElement('div');
  row.className = 'row';

  const inputText = document.createElement('input');
  inputText.id = 'newQuoteText';
  inputText.type = 'text';
  inputText.placeholder = 'Enter a new quote';
  inputText.setAttribute('aria-label', 'New quote text');

  const inputCategory = document.createElement('input');
  inputCategory.id = 'newQuoteCategory';
  inputCategory.type = 'text';
  inputCategory.placeholder = 'Enter quote category';
  inputCategory.setAttribute('aria-label', 'New quote category');

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', () => {
    addQuote(inputText.value.trim(), inputCategory.value.trim());
    inputText.value = '';
    inputCategory.value = '';
    inputText.focus();
  });

  row.appendChild(inputText);
  row.appendChild(inputCategory);
  row.appendChild(addBtn);

  wrapper.appendChild(row);
  addQuoteContainerEl.appendChild(wrapper);
}

// Add quote to model and persist
function addQuote(text, category) {
  if (!text || !category) {
    alert('Please provide both quote text and category.');
    return;
  }
  const newQuote = { id: cryptoRandomId(), text, category, updatedAt: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  // If current filter is this category or all, show it
  if (categoryFilterEl.value === 'all' || categoryFilterEl.value === category) {
    renderQuote(newQuote);
  }
}

// Populate category options dynamically
function populateCategories() {
  const selected = categoryFilterEl.value || 'all';
  const categories = Array.from(new Set(quotes.map(q => q.category))).sort();
  // Clear existing (keep the first All option)
  categoryFilterEl.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All Categories';
  categoryFilterEl.appendChild(allOpt);
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilterEl.appendChild(opt);
  });
  // restore selected if exists
  const found = Array.from(categoryFilterEl.options).some(o => o.value === selected);
  categoryFilterEl.value = found ? selected : 'all';
}

// Filter quotes based on selection
function filterQuotes() {
  const selected = categoryFilterEl.value;
  localStorage.setItem(LOCAL_STORAGE_LAST_FILTER_KEY, selected);
  showRandomQuote();
}

function restoreLastFilter() {
  const stored = localStorage.getItem(LOCAL_STORAGE_LAST_FILTER_KEY);
  if (stored) {
    const found = Array.from(categoryFilterEl.options).some(o => o.value === stored);
    categoryFilterEl.value = found ? stored : 'all';
  }
}

// Export quotes to JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file input
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      let importedCount = 0;
      imported.forEach(item => {
        if (item && typeof item.text === 'string' && typeof item.category === 'string') {
          const q = {
            id: item.id || cryptoRandomId(),
            text: item.text,
            category: item.category,
            updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now()
          };
          quotes.push(q);
          importedCount++;
        }
      });
      saveQuotes();
      populateCategories();
      notify(importedCount + ' quotes imported successfully.');
      showRandomQuote();
    } catch (err) {
      alert('Failed to import JSON: ' + err.message);
    } finally {
      event.target.value = '';
    }
  };
  fileReader.readAsText(file);
}

function notify(message) {
  notificationEl.textContent = message;
  setTimeout(() => {
    if (notificationEl.textContent === message) {
      notificationEl.textContent = '';
    }
  }, 4000);
}

// Simulated server sync using JSONPlaceholder for demonstration
let syncTimer = null;
function startPeriodicSync() {
  // every 30 seconds
  clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    syncWithServer().catch(() => {});
  }, 30000);
}

async function syncWithServer() {
  notify('Syncing with server...');
  // Simulate fetch of remote quotes (map posts to quotes)
  const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
  const data = await response.json();

  // Convert to quote shape with category derived from userId
  const serverQuotes = data.map(p => ({
    id: 'srv-' + p.id,
    text: p.title,
    category: 'Remote-' + p.userId,
    updatedAt: Date.now()
  }));

  // Merge strategy: server wins on id collisions; otherwise add
  const byId = new Map(quotes.map(q => [q.id, q]));
  serverQuotes.forEach(sq => {
    const local = byId.get(sq.id);
    if (!local) {
      quotes.push(sq);
    } else if ((local.updatedAt || 0) < (sq.updatedAt || 0)) {
      Object.assign(local, sq);
    }
  });

  saveQuotes();
  populateCategories();
  notify('Sync complete.');
}

// Expose some functions for inline handlers compatibility if needed
window.showRandomQuote = showRandomQuote;
window.addQuote = addQuote;
window.populateCategories = populateCategories;
window.filterQuotes = filterQuotes;
window.importFromJsonFile = importFromJsonFile;
window.exportToJsonFile = exportToJsonFile;

