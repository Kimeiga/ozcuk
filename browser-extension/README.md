# Özcük Browser Extension

Chrome/Edge/Firefox extension for instant Turkish word lookups.

## Features

- 🔍 **Popup Search**: Click the extension icon to search for any Turkish word
- 📝 **Context Menu**: Select any text on a page, right-click, and choose "Özcük'te ara"
- 💬 **Double-click Tooltip**: Double-click any word on a page to see its definition in a tooltip

## Installation

### Chrome/Edge (Developer Mode)

1. **Generate icons** (required first time):
   - Open `icons/generate.html` in a browser
   - Right-click each canvas and save as `icon-16.png`, `icon-48.png`, `icon-128.png`

2. **Load the extension**:
   - Go to `chrome://extensions` (or `edge://extensions`)
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `browser-extension` folder

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

## Usage

### Popup Search
1. Click the Özcük icon in your browser toolbar
2. Type a Turkish word
3. Press Enter or click the search button

### Context Menu
1. Select any text on a webpage
2. Right-click
3. Click "Özcük'te ara: [selected text]"

### Double-click Tooltip
1. Double-click any word on a page
2. A tooltip will appear with the definition
3. Click the "Detaylı bilgi →" link for full details
4. Press Escape or click elsewhere to close

## Development

The extension fetches word data from the jsDelivr CDN:
```
https://cdn.jsdelivr.net/gh/Kimeiga/ozcuk-data@main/words/{word}.json
```

## Files

- `manifest.json` - Extension configuration
- `popup.html/css/js` - Popup UI
- `content.js/css` - Page content script for tooltips
- `background.js` - Service worker for context menu
- `icons/` - Extension icons

## License

MIT

