# Medium Digest Summarizer Extension

This Chrome Extension automates the reading of Medium Daily Digest emails. It extracts article links, fetches the content in the background, summarizes each article using AI, and presents a consolidated view.

## Features
- 🚀 **One-click Analysis**: Open a Medium Digest email and click "Summarize Digest".
- 🤖 **AI Summaries**: Uses OpenAI (or compatible) API to generate concise bullet points.
- 🎨 **Modern UI**: Clean, dark-mode interface with a focus on readability.
- ⚡ **Background Processing**: Fetches and parses articles without opening dozens of tabs.

## Setup Instructions

1. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked".
   - Select the `medium_digest_scraper` folder.

2. **Configure API Key**:
   - Click the extension icon in the toolbar.
   - Click the settings icon (gear) in the top right.
   - Enter your OpenAI API Key (starts with `sk-...`).
   - Click "Save Settings".

3. **Usage**:
   - Open a Medium Daily Digest email in Gmail (or "View in Browser").
   - Click the extension icon.
   - Click "Summarize Digest".
   - Watch as summaries appear!

## Requirements
- An OpenAI API Key (GPT-4o or GPT-4o-mini recommended).
