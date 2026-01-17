chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PARSE_HTML') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(message.html, 'text/html');
    
    // Remove scripts, styles, navs, footers, headers to get clean text
    const selectorsToRemove = [
      'script', 'style', 'noscript', 'iframe', 
      'nav', 'footer', 'header', 'aside', 
      '.metabar', '.js-postShareWidget', '.js-postMetaLockup'
    ];
    
    selectorsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract main content - Medium uses <article> or <main> or section
    const mainContent = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    
    // Get text content
    const text = mainContent.innerText || mainContent.textContent;
    
    // Clean up whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit length for LLM context

    sendResponse({ text: cleanText });
  }
  return true; // Keep channel open
});
