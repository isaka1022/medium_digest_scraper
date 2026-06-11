document.addEventListener('DOMContentLoaded', async () => {
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const saveSettingsBtn = document.getElementById('save-settings');
  const apiKeyInput = document.getElementById('api-key');
  const modelSelect = document.getElementById('api-model');
  const analyzeBtn = document.getElementById('analyze-btn');
  const statusText = document.getElementById('status-text');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');
  const resultsList = document.getElementById('results-list');

  // Deprecated model IDs from previous versions mapped to their current replacements.
  // Users who saved an old ID in storage will be silently upgraded on next open.
  const MODEL_MIGRATIONS = {
    'gpt-4o': 'gpt-4.1',
    'gpt-4o-mini': 'gpt-4.1-mini',
    'gemini-1.5-flash': 'gemini-2.0-flash',
  };

  // Load settings
  const { apiKey, model } = await chrome.storage.local.get(['apiKey', 'model']);
  if (apiKey) apiKeyInput.value = apiKey;
  const resolvedModel = MODEL_MIGRATIONS[model] || model;
  if (resolvedModel) {
    modelSelect.value = resolvedModel;
    // Persist the migrated ID so future reads use the new value.
    if (resolvedModel !== model) {
      chrome.storage.local.set({ model: resolvedModel });
    }
  }

  // Toggle Settings
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
  });

  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    const mod = modelSelect.value;
    if (key) {
      chrome.storage.local.set({ apiKey: key, model: mod }, () => {
        settingsPanel.classList.add('hidden');
        statusText.textContent = "Settings saved. Ready to analyze.";
      });
    } else {
      alert("Please enter a valid API Key.");
    }
  });

  // Analyze
  analyzeBtn.addEventListener('click', async () => {
    // Check key
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    if (!apiKey) {
      settingsPanel.classList.remove('hidden');
      alert("Please set your API Key first.");
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Reset UI
    resultsList.innerHTML = '';
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    statusText.textContent = "Initializing...";
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Processing...";

    // Send message to background
    chrome.runtime.sendMessage({ type: 'START_ANALYSIS', tabId: tab.id });
  });

  // Listen for updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
      statusText.textContent = message.status;
    } 
    else if (message.type === 'PROGRESS_UPDATE') {
      const pct = Math.round((message.completed / message.total) * 100);
      progressFill.style.width = `${pct}%`;
      statusText.textContent = `Processed ${message.completed} of ${message.total}`;
    }
    else if (message.type === 'ARTICLE_COMPLETE') {
      addResultCard(message.data);
    }
    else if (message.type === 'ANALYSIS_COMPLETE') {
      statusText.textContent = "Analysis Complete!";
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span class="btn-icon">🚀</span> Summarize Digest';
      setTimeout(() => {
        progressBar.classList.add('hidden');
      }, 2000);
    }
    else if (message.type === 'ERROR') {
      statusText.textContent = "Error occurred.";
      alert(message.message);
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Summarize Digest";
    }
    else if (message.type === 'ARTICLE_ERROR') {
      console.error("Article error:", message.error);
    }
  });

  function addResultCard(data) {
    const card = document.createElement('div');
    card.className = 'article-card';
    
    // Convert newlines to breaks for summary
    const formattedSummary = data.summary.replace(/\n/g, '<br>');

    card.innerHTML = `
      <h3><a href="${data.url}" target="_blank" style="color: inherit; text-decoration: none;">${data.title}</a></h3>
      <div style="margin-top: 8px;">${formattedSummary}</div>
      <div class="article-meta">
        <a href="${data.url}" target="_blank" style="color: var(--accent-secondary);">Read Article &rarr;</a>
      </div>
    `;
    resultsList.appendChild(card);
  }
});
