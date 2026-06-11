let creatingOffscreenParams = null; // Promise to prevent race conditions

// Deprecated model IDs from previous versions mapped to their current replacements.
// Applied when reading saved settings so users with old storage values get the new model.
const MODEL_MIGRATIONS = {
  'gpt-4o': 'gpt-4.1',
  'gpt-4o-mini': 'gpt-4.1-mini',
  'gemini-1.5-flash': 'gemini-2.0-flash',
};

/**
 * Send a fire-and-forget message to the extension runtime.
 * The popup may be closed by the time background sends progress updates,
 * which causes "Could not establish connection" errors. Checking
 * chrome.runtime.lastError inside the callback silences those safely.
 */
function sendRuntimeMessage(msg) {
  chrome.runtime.sendMessage(msg, () => {
    // Suppress "Could not establish connection" when the popup is closed.
    void chrome.runtime.lastError;
  });
}

async function setupOffscreenDocument(path) {
  // Check for existing offscreen document
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [path]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create offscreen document
  if (creatingOffscreenParams) {
    await creatingOffscreenParams;
  } else {
    creatingOffscreenParams = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'Parse HTML content in background'
    });
    await creatingOffscreenParams;
    creatingOffscreenParams = null;
  }
}

async function parseHtmlInOffscreen(html) {
  await setupOffscreenDocument('src/offscreen.html');
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'PARSE_HTML',
      html: html
    }, (response) => {
      resolve(response?.text || '');
    });
  });
}

// LLM API Call
async function summarizeWithLLM(apiKey, model, text) {
  if (!apiKey) return "Error: API Key is missing. Please set it in settings.";

  // Detect if it's an OpenAI-like key (sk-...) or Gemini (AIza...)
  // For simplicity, assume OpenAI compatible endpoint for now, or handle both.
  // The user prompt mentions "Gemini" in passing (directory), but OpenAI is common for these tools.
  // I will support OpenAI interface.
  
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_MIGRATIONS[model] || model || 'gpt-4.1-mini',
        messages: [
          { role: "system", content: "You are a helpful assistant. Summarize the following article in Japanese in 3 concise bullet points." },
          { role: "user", content: text }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();
    if (data.error) {
      return `Error: ${data.error.message}`;
    }
    return data.choices[0].message.content;
  } catch (error) {
    return `Network Error: ${error.message}`;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_ANALYSIS') {
    (async () => {
      try {
        // 1. Get links (Passed from popup usually, or we inject here if not passed)
        // Ideally popup injects and passes links to background to keep popup logic simple?
        // Actually, popup context dies if closed. Persistent tasks should run here.
        // So popup should just say "Start", and background does the injection.
        
        // However, `chrome.scripting` requires target tab.
        // We need the tab ID.
        const tabId = message.tabId;
        
        // Inject extractor
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['src/content.js']
        });
        
        const articles = results[0].result;
        
        console.log(`Found ${articles.length} articles`);
        
        // Notify popup of count (popup may be closed; sendRuntimeMessage suppresses the resulting error).
        sendRuntimeMessage({ type: 'STATUS_UPDATE', status: `Found ${articles.length} articles. Processing...`, total: articles.length });

        const { apiKey, model } = await chrome.storage.local.get(['apiKey', 'model']);

        let completed = 0;
        const summaries = [];

        for (const article of articles) {
          try {
            // Update status for specific article
             sendRuntimeMessage({ type: 'ARTICLE_START', articleId: article.url });

             // Fetch
             const res = await fetch(article.url, { credentials: 'include' });
             const html = await res.text();
             
             // Parse
             const text = await parseHtmlInOffscreen(html);
             
             // Summarize
             const summary = await summarizeWithLLM(apiKey, model, text);
             
             const result = {
               title: article.title,
               url: article.url,
               summary: summary
             };
             
             summaries.push(result);
             
             // Send incremental result
             sendRuntimeMessage({ type: 'ARTICLE_COMPLETE', data: result });
             
          } catch (e) {
            console.error(e);
            sendRuntimeMessage({ type: 'ARTICLE_ERROR', url: article.url, error: e.toString() });
          }

          completed++;
          sendRuntimeMessage({ type: 'PROGRESS_UPDATE', completed: completed, total: articles.length });
        }

        sendRuntimeMessage({ type: 'ANALYSIS_COMPLETE', summaries: summaries });

      } catch (err) {
        console.error(err);
        sendRuntimeMessage({ type: 'ERROR', message: err.toString() });
      }
    })();
    return true; // async
  }
});
