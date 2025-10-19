// -------------------------------
// Dynamic Quote Generator - Full
// Features: dynamic DOM, local/session storage, import/export JSON,
// filtering, server sync with conflict detection + manual resolution
// -------------------------------

/* ----------------- DOM elements ----------------- */
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");
const syncNowBtn = document.getElementById("syncNow");
const syncStatusEl = document.getElementById("sync-status");
const conflictNotice = document.getElementById("conflictNotice");
const conflictMessage = document.getElementById("conflictMessage");
const useServerBtn = document.getElementById("useServerBtn");
const keepLocalBtn = document.getElementById("keepLocalBtn");
const mergeBtn = document.getElementById("mergeBtn");

/* ----------------- Storage keys ----------------- */
const LOCAL_KEY = "Quotes";
const CATEGORY_KEY = "Categories";
const SELECTED_FILTER_KEY = "selectedCategory";
const LAST_VIEWED_KEY = "lastViewedQuote";

/* ----------------- Mock server URL ----------------- */
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

/* ----------------- Initial default quotes ----------------- */
let quotesArray = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation" },
  { id: 2, text: "Do one thing every day that scares you.", category: "Courage" },
  { id: 3, text: "Everything you can imagine is real.", category: "Creativity" }
];

/* Keep track of last fetched server snapshot for conflict detection */
let lastServerSnapshot = null;

/* ----------------- Utility functions ----------------- */
function saveLocalQuotes() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotesArray));
  populateCategories();
}

function showStatus(text, type = "info") {
  syncStatusEl.textContent = text;
  syncStatusEl.className = "";
  if (type === "ok") syncStatusEl.classList.add("sync-ok");
  else if (type === "warn") syncStatusEl.classList.add("sync-warn");
  else if (type === "error") syncStatusEl.classList.add("sync-error");
}

/* ----------------- Display & random quote ----------------- */
function renderQuotes(list = quotesArray) {
  quoteDisplay.innerHTML = "";
  if (!list.length) {
    const p = document.createElement("p");
    p.textContent = "No quotes available.";
    quoteDisplay.appendChild(p);
    return;
  }
  list.forEach(q => {
    const div = document.createElement("div");
    div.className = "quote-item";
    const t = document.createElement("div");
    t.className = "quote-text";
    t.textContent = q.text;
    const m = document.createElement("div");
    m.className = "quote-meta";
    m.textContent = `Category: ${q.category}`;
    div.appendChild(t);
    div.appendChild(m);
    quoteDisplay.appendChild(div);
  });
}

function showRandomQuote() {
  if (!quotesArray.length) return;
  const idx = Math.floor(Math.random() * quotesArray.length);
  const q = quotesArray[idx];
  renderQuotes([q]);
  // store last viewed in sessionStorage
  sessionStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(q));
}

/* ----------------- Add quote ----------------- */
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim() || "Uncategorized";
  if (!text) {
    alert("Please enter a quote text.");
    return;
  }
  // generate id
  const id = quotesArray.length ? Math.max(...quotesArray.map(x => x.id)) + 1 : 1;
  const newQ = { id, text, category };
  quotesArray.push(newQ);
  saveLocalQuotes();
  filterQuotes(); // re-render with current filter
  newQuoteText.value = "";
  newQuoteCategory.value = "";
  showStatus("Saved local quote.", "ok");
}

/* ----------------- Categories and Filtering ----------------- */
function populateCategories() {
  const unique = [...new Set(quotesArray.map(q => q.category))].filter(Boolean);
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(unique));
  // re-populate dropdown
  const prev = categoryFilter.value || "all";
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  unique.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  // restore selection if possible
  const saved = localStorage.getItem(SELECTED_FILTER_KEY) || prev;
  if ([...categoryFilter.options].some(o => o.value === saved)) categoryFilter.value = saved;
  else categoryFilter.value = "all";
}

function filterQuotes() {
  const sel = categoryFilter.value || "all";
  localStorage.setItem(SELECTED_FILTER_KEY, sel);
  const filtered = quotesArray.filter(q => sel === "all" || q.category === sel);
  renderQuotes(filtered);
}

/* ----------------- Import / Export JSON ----------------- */
function exportQuotes() {
  const json = JSON.stringify(quotesArray, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  a.click();
  URL.revokeObjectURL(url);
  showStatus("Exported quotes to JSON.", "ok");
}

function importFromJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format: expected an array.");
      // assign new ids to imported items if missing
      const nextId = quotesArray.length ? Math.max(...quotesArray.map(x => x.id)) + 1 : 1;
      imported.forEach((item, i) => {
        const obj = {
          id: item.id || (nextId + i),
          text: item.text || item.title || `Imported quote ${i+1}`,
          category: item.category || "Imported"
        };
        quotesArray.push(obj);
      });
      saveLocalQuotes();
      filterQuotes();
      showStatus("Imported quotes successfully.", "ok");
      alert("Quotes imported successfully!");
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import JSON: " + err.message);
      showStatus("Import failed.", "error");
    }
  };
  reader.readAsText(file);
}

/* ----------------- Server sync + conflict handling ----------------- */
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();
    // Simplify server data into our shape (use title as text)
    // Limit count to avoid huge payload; in real app we'd use endpoints for quotes
    const simplified = data.slice(0, 20).map((item, idx) => ({
      // keep id stable based on server id if present
      id: item.id || idx + 1,
      text: item.title || (`Server quote ${idx+1}`),
      category: "Server"
    }));
    return simplified;
  } catch (err) {
    console.error("Fetch server failed:", err);
    throw err;
  }
}

function detectConflict(local, server) {
  // Simple conflict detection:
  //  - different lengths OR
  //  - any server item text differs from local item with same id
  if (local.length !== server.length) return true;
  const localById = new Map(local.map(q => [q.id, q]));
  for (const s of server) {
    const l = localById.get(s.id);
    if (!l) return true;
    if (l.text !== s.text || l.category !== s.category) return true;
  }
  return false;
}

function showConflictUI(message, serverData) {
  conflictMessage.textContent = message;
  conflictNotice.classList.remove("hidden");
  // wire temporary handlers
  const onUseServer = () => {
    quotesArray = serverData.slice(); // replace
    saveLocalQuotes();
    filterQuotes();
    showStatus("Server data applied.", "ok");
    hideConflictUI();
  };
  const onKeepLocal = () => {
    // push local to storage (no change), keep local as source of truth
    saveLocalQuotes();
    showStatus("Kept local data.", "warn");
    hideConflictUI();
  };
  const onMerge = () => {
    // basic merge: union by text (avoid duplicates)
    const texts = new Set();
    const merged = [];
    [...serverData, ...quotesArray].forEach(q => {
      if (!texts.has(q.text)) {
        texts.add(q.text);
        merged.push(q);
      }
    });
    // reassign ids
    merged.forEach((m, i) => m.id = i + 1);
    quotesArray = merged;
    saveLocalQuotes();
    filterQuotes();
    showStatus("Merged server + local data.", "ok");
    hideConflictUI();
  };

  // Remove previous listeners to avoid duplicates
  useServerBtn.replaceWith(useServerBtn.cloneNode(true));
  keepLocalBtn.replaceWith(keepLocalBtn.cloneNode(true));
  mergeBtn.replaceWith(mergeBtn.cloneNode(true));

  // Re-select nodes
  const newUse = document.getElementById("useServerBtn");
  const newKeep = document.getElementById("keepLocalBtn");
  const newMerge = document.getElementById("mergeBtn");

  newUse.addEventListener("click", onUseServer);
  newKeep.addEventListener("click", onKeepLocal);
  newMerge.addEventListener("click", onMerge);
}

function hideConflictUI() {
  conflictNotice.classList.add("hidden");
  conflictMessage.textContent = "";
}

/* Core sync function */
async function syncWithServer(showNotifications = true) {
  showStatus("Syncing with server...", "info");
  try {
    const serverQuotes = await fetchServerQuotes();

    // If we have a previous server snapshot, compare to detect incoming server updates
    const incomingChange = !lastServerSnapshot || JSON.stringify(lastServerSnapshot) !== JSON.stringify(serverQuotes);

    if (incomingChange) {
      // Check for conflict with local
      const conflict = dete
