// Grabbing the 'Show New Quote' button & display area
const newQuoteBtn = document.getElementById("newQuote");
const quoteDisplay = document.getElementById("quoteDisplay");

// Declaring quotes
let quotesArray = [
  { text: "text", category: "category" },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    category: "Motivation",
  },
  {
    text: "Love is composed of a single soul inhabiting two bodies.",
    category: "Love",
  },
  {
    text: "Courage is not the absence of fear, but rather the judgment that something else is more important than fear.",
    category: "Courage",
  },
  {
    text: "The function of leadership is to produce more leaders, not more followers.",
    category: "Leadership",
  },
  {
    text: "A real friend is one who walks in when the rest of the world walks out.",
    category: "Friendship",
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    category: "Success",
  },
  {
    text: "In the end, it's not the years in your life that count, it's the life in your years.",
    category: "Life",
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    category: "Wisdom",
  },
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    category: "Happiness",
  },
  {
    text: "It always seems impossible until it's done.",
    category: "Perseverance",
  },
];

// Check if there are stored quotes in localStorage and load them if they exist
if (localStorage.getItem("Quotes")) {
  quotesArray = JSON.parse(localStorage.getItem("Quotes"));
}

// Display last viewed quote from sessionStorage when page loads
function showLastViewedQuote() {
  const lastViewedQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastViewedQuote) {
    const parsedQuote = JSON.parse(lastViewedQuote);
    let para = document.createElement("p");
    para.id = "quoteParagraph";
    quoteDisplay.appendChild(para);
    para.innerHTML = `Quote: ${parsedQuote.text} Category: ${parsedQuote.category}`;
  }
}

// Ensure the last viewed quote is shown when the page loads
document.addEventListener("DOMContentLoaded", () => {
  showLastViewedQuote();
});

function createAddQuoteForm() {
  // create new div to contain the form inputs and button
  const form = document.createElement("div");

  // create input to add new quote, set class & ID and append it to the form div
  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  form.appendChild(quoteInput);

  // create input to add new category, set class & ID and append it to the form div
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  form.appendChild(categoryInput);

  // create add new quote button & append it to the form div
  const addQuoteBtn = document.createElement("button");
  addQuoteBtn.innerHTML = "Add Quote";
  form.appendChild(addQuoteBtn);

  // append the form div to the display area div
  quoteDisplay.appendChild(form);

  // add function to handle 'Add Quote' button click
  addQuoteBtn.addEventListener("click", () => {
    if (quoteInput.value === "" || categoryInput.value === "") {
      alert("Please enter a quote and a category!");
    } else {
      const newQuote = {
        text: quoteInput.value,
        category: categoryInput.value,
      };
      quotesArray.push(newQuote);
      quoteInput.value = "";
      categoryInput.value = "";

      // save the quotes array to local storage
      localStorage.setItem("Quotes", JSON.stringify(quotesArray));

      // Update categories and refresh the dropdown
      populateCategories();

      // Apply the current filter to show the new quote if applicable
      filterQuotes();
    }
  });
}
createAddQuoteForm();

// Create export Button
const exportBtn = document.getElementById("exportBtn");
exportBtn.addEventListener("click", () => {
  // Convert quotes array to JSON string
  const quotesJSON = JSON.stringify(quotesArray, null, 2);

  // Create a Blob from the JSON string
  const blob = new Blob([quotesJSON], { type: "application/json" });

  // Create a temporary link to download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Quotes.json"; // Filename for the exported file
  a.click();

  // Revoke the URL to free up resources
  URL.revokeObjectURL(url);
});

// Create import button
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotesArray.push(...importedQuotes);
    localStorage.setItem("Quotes", JSON.stringify(quotesArray));
    populateCategories(); // Update categories after import
    filterQuotes(); // Apply current filter to show new quotes
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Handling 'Show New Quote' button click
newQuoteBtn.addEventListener("click", () => {
  // Show a random quote and store it in sessionStorage
  function showRandomQuote() {
    let para = document.getElementById("quoteParagraph");
    if (!para) {
      para = document.createElement("p");
      para.id = "quoteParagraph";
      quoteDisplay.appendChild(para);
    }
    const randomIndex = Math.floor(Math.random() * quotesArray.length);
    const randomQuote = quotesArray[randomIndex];
    para.innerHTML = `Quote: ${randomQuote.text} Category: ${randomQuote.category}`;

    // Store the last viewed quote in sessionStorage
    sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
  }

  // Invoke the functions to show random quote & create add quote form
  showRandomQuote();
});

function populateCategories() {
  // Get the select element
  const categoryFilter = document.getElementById("categoryFilter");

  // Extract unique categories from the quotesArray
  const uniqueCategories = [...new Set(quotesArray.map((quote) => quote.category))];

  // Save the current selection
  const currentSelection = categoryFilter.value;

  // Remove any existing options (except 'All Categories')
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Create and append options for each unique category
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore the previous selection if it still exists, otherwise default to 'all'
  if (uniqueCategories.includes(currentSelection)) {
    categoryFilter.value = currentSelection;
  } else {
    categoryFilter.value = 'all';
  }

  // Save categories to localStorage
  localStorage.setItem("Categories", JSON.stringify(uniqueCategories));
}

function filterQuotes() {
  // Get the selected category from the dropdown
  const selectedCategory = document.getElementById("categoryFilter").value;

  // Save the selected category to localStorage
  localStorage.setItem("selectedCategory", selectedCategory);

  // Filter quotes based on the selected category
  const filteredQuotes = quotesArray.filter((quote) => {
    return selectedCategory === "all" || quote.category === selectedCategory;
  });

  // Clear the current displayed quote(s)
  quoteDisplay.innerHTML = "";

  // Display the filtered quotes
  if (filteredQuotes.length > 0) {
    filteredQuotes.forEach((quote) => {
      const para = document.createElement("p");
      para.textContent = `Quote: ${quote.text} Category: ${quote.category}`;
      quoteDisplay.appendChild(para);
    });
  } else {
    // If no quotes match, show a message
    const para = document.createElement("p");
    para.textContent = "No quotes found for the selected category.";
    quoteDisplay.appendChild(para);
  }

  // Re-create the add quote form after clearing the display
  createAddQuoteForm();
}

// Restore the last selected category from localStorage
function restoreCategoryFilter() {
  const savedCategory = localStorage.getItem("selectedCategory");

  // If a category was saved, set the dropdown to that category and apply the filter
  if (savedCategory) {
    const categoryFilter = document.getElementById("categoryFilter");
    categoryFilter.value = savedCategory;
    filterQuotes(); // Apply the filter for the restored category
  }
}

// Populate categories and restore filter on page load
document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  restoreCategoryFilter(); // Restore the last selected category when the page loads
});

// Call filterQuotes when the dropdown changes
document.getElementById("categoryFilter").addEventListener("change", filterQuotes);