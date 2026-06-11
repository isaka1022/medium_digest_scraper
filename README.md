# Medium Digest Summarizer

A Chrome extension that reads your Medium Daily Digest email, extracts article links, fetches each article in the background, and summarizes them using OpenAI (or any OpenAI-compatible API) — all in one click.

> **For personal use only.** This extension scrapes article content from Medium. Use it only for your own reading and note-taking purposes, and respect Medium's [Terms of Service](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f).

## Features

- **One-click analysis** — Open a Medium Digest email and hit "Summarize Digest"
- **AI summaries** — Generates concise bullet points via OpenAI GPT-4.1 / GPT-4.1 mini (or compatible endpoints)
- **Background processing** — Fetches and parses articles without opening dozens of tabs (uses Chrome's Offscreen API)
- **Incremental results** — Summaries stream into the popup as each article finishes
- **Model selector** — Choose between GPT-4.1, GPT-4.1 mini, or Gemini 2.0 Flash (via OpenAI-compatible endpoint)
- **Dark-mode UI** — Clean, readable interface built with vanilla JS

## How It Works

```
Gmail (Medium Digest email)
  └── content.js          extracts article links from the page DOM
  └── background.js       fetches each article URL, calls offscreen.js to parse HTML
  └── offscreen.js        strips nav/scripts/ads, extracts clean article text
  └── background.js       calls OpenAI API, streams results back to popup
  └── popup.js            renders summary cards in real time
```

## Installation

Chrome Web Store submission is not planned — load it manually in Developer Mode.

1. **Download or clone this repository**

   ```bash
   git clone https://github.com/isaka1022/medium_digest_scraper.git
   ```

2. **Open Chrome Extensions**

   Navigate to `chrome://extensions/` and enable **Developer mode** (toggle in the top-right corner).

3. **Load the unpacked extension**

   Click **Load unpacked** and select the `medium_digest_scraper` folder (the one containing `manifest.json`).

4. **Pin the extension** (optional)

   Click the puzzle icon in the Chrome toolbar and pin "Medium Digest Summarizer" for easy access.

## Configuration

1. Click the extension icon in the toolbar.
2. Click the gear icon (top-right of the popup).
3. Enter your **OpenAI API Key** (starts with `sk-...`).
4. Select a model (GPT-4.1 mini is recommended for cost efficiency).
5. Click **Save Settings** — the key is stored locally via `chrome.storage.local` and never sent anywhere except the OpenAI API.

## Usage

1. Open Gmail and navigate to a **Medium Daily Digest** email (or click "View in Browser").
2. Click the extension icon.
3. Click **Summarize Digest**.
4. Watch as AI-generated summaries appear for each article.

## Requirements

- Google Chrome (Manifest V3 compatible — Chrome 116+)
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))
  - GPT-4.1 mini is recommended for low cost per digest
  - Any OpenAI-compatible endpoint works (set the key accordingly)

## Project Structure

```
medium_digest_scraper/
├── manifest.json        Chrome extension manifest (MV3)
└── src/
    ├── background.js    Service worker: orchestrates fetch → parse → summarize
    ├── content.js       Injected into Gmail tab to extract article links
    ├── offscreen.html   Offscreen document shell (DOM_PARSER reason)
    ├── offscreen.js     Parses raw HTML, strips boilerplate, returns clean text
    ├── popup.html       Extension popup UI
    ├── popup.js         Popup logic: settings, progress, result rendering
    └── style.css        Dark-mode styles
```

## Roadmap

### Now
- Replace `alert()` error dialogs with inline status messages in the popup UI
- Detect paywall-truncated articles and display a badge on the result card
- Integrate Readability.js for more accurate body text extraction (fewer nav/footer scraps)

### Next
- Chrome Built-in AI (Summarizer API) fallback — works without any API key
- Ollama support via OpenAI-compatible endpoint setting
- Markdown export of all summaries in one click

### Later
- RAG-style Q&A chat over the summarized articles
- Local summary cache to avoid re-fetching articles across sessions
- Chrome Web Store submission

## Limitations

- Requires the Medium Digest email to be open in the active tab
- Medium articles behind the paywall may return partial content
- Summaries are generated in Japanese by default (configurable in `background.js` system prompt)

## License

MIT License — see [LICENSE](LICENSE) for details.
