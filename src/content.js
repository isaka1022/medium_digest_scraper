function extractLinks() {
  const links = Array.from(document.querySelectorAll('a'));
  const articles = [];
  const seenUrls = new Set();

  // Common footer text to exclude
  const excludeTerms = [
    'unsubscribe', 'privacy policy', 'terms of service', 'help center',
    'careers', 'work at medium', 'switch to the', 'control your recommendations',
    'become a member', 'sign in', 'upgrade', 'get started', 'read from anywhere',
    'sent by medium', 'download the', 'app store', 'google play'
  ];

  links.forEach(link => {
    let url = link.href;
    let text = link.innerText.trim().replace(/\n/g, ' ');

    if (!url || !text) return;

    // Filter out short texts (likely icons or "Read more") if they don't look like titles
    if (text.length < 10) return; 

    // Filter duplicates
    if (seenUrls.has(url)) return;

    // Filter by text content
    const lowerText = text.toLowerCase();
    if (excludeTerms.some(term => lowerText.includes(term))) return;

    // Medium Email Specific Heuristics
    // The user's example shows links like: https://medium.com/@author/slug...
    // But also tracking links.
    // We assume mostly medium.com links
    if (url.includes('medium.com') || url.includes('link.medium.com')) {
       // Filter out profile links (usually just the name) if possible, but names can be titles?
       // In the email structure:
       // "Anthropic Just Pulled the Rug..." -> This is the title.
       // "Joe Njenga" -> This is the author. Link might be to profile.
       // We can look at the structure. Usually title is <h2> or has specific styling. 
       // But in raw HTML, we might just grab everything and let the user filter or AI filter.
       
       // Let's try to grab only things that look like stories.
       // Story URLs usually have a hash or slug.
       // Profile URLs are `medium.com/@username` or `medium.com/u/user_id`
       
       const isProfile = /\/@[\w\d_.-]+(\?|$)/.test(url) && !/\/@[\w\d_.-]+\//.test(url);
       const isPublication = /medium\.com\/[\w\d_-]+(\?|$)/.test(url) && !url.includes('-'); // Publications often one word? No.
       
       // Better heuristic: Title usually has spaces.
       if (!text.includes(' ')) return; // Single word link likely not a title (unless "Run!")
       
       // If it is a profile link, skip
       if (isProfile) return;

       seenUrls.add(url);
       articles.push({
         title: text,
         url: url
       });
    }
  });

  return articles;
}

// Return the result to the caller (executeScript)
extractLinks();
