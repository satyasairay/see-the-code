# See The Code

A lightweight developer tool that lets you visually browse your local web application and see where each UI element comes from in your source code - file name and line number displayed right on the page.

## Overview

See The Code injects an overlay into your running web app that shows "See the code" badges on UI elements. Click a badge and it shows you the source file and line number where that element is defined. It uses a precomputed mapping file to make this work.

## Documentation

- [API Documentation](docs/API.md) - Complete API reference for overlay and CLI
- [Examples](demo/examples/) - Additional example components
- [CLI README](cli/README.md) - Code map generator usage

## Quick Start

### Step 1: Serve Your Application

Important: See The Code needs your app to be served through a web server. Opening HTML files directly with `file://` won't work because of browser security restrictions.

Quick server options:
- Python: `python -m http.server 8000` (run from project root)
- Node.js: `npx http-server -p 8000` (run from project root)
- PHP: `php -S localhost:8000` (run from project root)
- VS Code: Use the "Live Server" extension

Then open your app at `http://localhost:8000` (or whatever port you used).

### Step 2: Generate a Code Map

Create a `code-map.json` file that maps DOM selectors to source code locations. Check `cli/README.md` for how to generate this using the CLI tool.

There's a sample `code-map.json` in the repo you can use for testing.

### Step 3: Inject the Overlay

#### Option A: Browser Console (Recommended)

This is the most reliable way to do it:

1. Open your browser's developer console (F12) on your local dev server
2. Copy and paste this code. Adjust the paths based on where your page is located:

```javascript
// Set config before loading the script
window.SeeTheCodeConfig = {
  codeMapUrl: './code-map.json',  // Path to your code-map.json relative to current page
  workspaceRoot: '/path/to/your/project'  // Optional: Only needed for VS Code file opening with relative paths
};

// Inject the overlay script
const script = document.createElement('script');
script.src = '../overlay/inject.js';  // Go up one level from demo/ to project root
script.onload = () => {
  console.log('Overlay loaded successfully');
  if (window.SeeTheCode) {
    console.log('SeeTheCode API is ready');
  }
};
script.onerror = () => {
  console.error('Failed to load script from:', script.src);
  console.log('Check that the path is correct relative to your current page');
};
document.head.appendChild(script);
```

3. Press Enter to run it
4. Check the console for any errors

**Path examples:**
- If your page is at `http://localhost:8000/demo/index.html`:
  - Overlay path: `../overlay/inject.js` (goes up to project root)
  - Code map path: `./code-map.json` (if code-map.json is in demo folder) or `../code-map.json` (if at project root)
- If your page is at `http://localhost:8000/index.html`:
  - Overlay path: `./overlay/inject.js`
  - Code map path: `./code-map.json`

#### Option B: Bookmarklet

1. Open `inject-bookmarklet.html` in your browser
2. Drag the bookmarklet to your bookmarks bar
3. Navigate to your local dev server
4. Click the bookmarklet (it will ask for the base URL)

#### Option C: Manual Script Injection

Add this to your HTML (adjust the path):

```html
<script src="path/to/overlay/inject.js"></script>
```

### Configuration

You can configure the overlay by setting `window.SeeTheCodeConfig` before loading the script:

```javascript
window.SeeTheCodeConfig = {
  interactionMode: 'click',  // 'click', 'hover', or 'always'
  codeMapUrl: './code-map.json',  // Path to your code map
  enableDebug: false,  // Show unmatched selectors in red
  openInVSCode: true,  // Open files in VS Code when badge is clicked
  workspaceRoot: '/path/to/your/project'  // Optional: Only needed if code-map.json uses relative paths
};
```

Or you can modify the CONFIG object at the top of `overlay/inject.js` directly, but using `window.SeeTheCodeConfig` is cleaner.

## Code Map Format

The `code-map.json` file is a simple JSON object mapping selectors to file locations:

```json
{
  ".selector-name": {
    "file": "src/components/Component.tsx",
    "line": 42
  },
  "#element-id": {
    "file": "src/layouts/Layout.jsx",
    "line": 15
  }
}
```

### Supported Selector Types

- CSS class selectors: `.class-name`
- ID selectors: `#element-id`
- Attribute selectors: `[data-testid="value"]`
- Element selectors: `button`, `input[type="submit"]`

### Fallback Matching

If exact selector matches don't work, the overlay can try:

- InnerText matching: Match elements by their text content
- Fuzzy matching: Partial text or selector matching

These are enabled by default but can be turned off in the config.

## Project Structure

```
see-the-code/
├── cli/                    # Code map generation tools
│   └── README.md
├── overlay/                 # Overlay script
│   └── inject.js
├── demo/                    # Sample app for testing
│   ├── index.html
│   └── code-map.json
├── code-map.json            # Sample mapping file
├── inject-bookmarklet.html  # Bookmarklet helper
└── README.md                # This file
```

## Features

- Small badges that appear on mapped elements
- Click badges to see file and line number
- Optional VS Code integration - click to open files
- Debug mode highlights unmatched selectors
- Multiple interaction modes: click, hover, or always visible
- Can load code maps from remote URLs
- All styles are namespaced to avoid conflicts with your app

## Troubleshooting

### Script Loading Errors

**Error: "CORS policy" or "ERR_FILE_NOT_FOUND" with file:// protocol**

If you see errors about `file://` protocol or CORS:
- You're opening HTML files directly instead of using a web server
- Solution: Use a web server (see "Testing with Demo App" section)
- Browsers block local file access for security reasons - you need to use `http://` or `https://`

**Error: "Could not load overlay/inject.js" or 404 errors**

The script path is wrong. Here's how to fix it:

1. Use the console method - it gives better error messages
2. Check the path relative to your current page:
   - If your page is at `http://localhost:8000/demo/index.html` and overlay is at project root, use `../overlay/inject.js`
   - If your page is at `http://localhost:8000/index.html` and overlay is in same directory, use `./overlay/inject.js`
   - If your page is at `http://localhost:8000/app/index.html` and overlay is at project root, use `../../overlay/inject.js`
3. Test the path: Open `overlay/inject.js` directly in your browser to confirm it's accessible
4. Check CORS: If loading from a different origin, make sure CORS headers are set

### Badges Not Appearing

1. Check code map accessibility: Make sure `code-map.json` is accessible from your page. If it's a local file, check the relative path is correct.
2. Verify selector matching: Use browser DevTools to inspect elements and compare with selectors in `code-map.json`. Selectors are case-sensitive.
3. Enable debug mode: Run `window.SeeTheCode.setDebug(true)` in the console to see unmatched selectors highlighted in red.
4. Check browser console: Look for error messages about loading the code map or script injection.
5. Verify script injection: Make sure the overlay script loaded. Check the Network tab to confirm `inject.js` loaded successfully.
6. Set code map URL manually: If the code map fails to load, try:
   ```javascript
   window.SeeTheCode.setCodeMapUrl('./code-map.json'); // adjust path as needed
   window.SeeTheCode.reload();
   ```

### Selectors Not Matching

- Exact match required: Selectors in `code-map.json` must exactly match your DOM (case-sensitive). Use browser DevTools to copy the exact selectors.
- Use stable selectors: Prefer IDs, data attributes, or unique class names over generic element selectors like `div` or `button`.
- Fallback matching: The overlay supports innerText and fuzzy matching, enabled by default. You can turn these off in the config if needed.
- Dynamic content: Elements added after page load are automatically detected, but there might be a short delay (500ms debounce).

### VS Code Not Opening

- Protocol handler: Make sure VS Code is installed and registered as a URI handler for `vscode://` protocol.
- Workspace root: If your `code-map.json` uses relative paths, you need to set `workspaceRoot` in the config:
  ```javascript
  window.SeeTheCodeConfig = {
    workspaceRoot: '/path/to/your/project'  // Windows: 'C:/path/to/project' or Mac/Linux: '/Users/name/project'
  };
  ```
  Or set it after loading:
  ```javascript
  window.SeeTheCode.setWorkspaceRoot('/path/to/your/project');
  ```
- File paths: You can use absolute or relative paths in `code-map.json`:
  - Absolute: `E:/project/src/file.tsx` (Windows) or `/Users/name/project/src/file.tsx` (Mac/Linux)
  - Relative: `src/components/Button.tsx` (requires `workspaceRoot` to be set)
- Path format: Use forward slashes (`/`) in paths - they work on all platforms.
- Browser security: Some browsers might block `vscode://` links. Check the console for blocked protocol errors.
- Manual alternative: You can always manually open files using the displayed file path and line number.

### Debug Mode

Debug mode shows you what's happening:

Enable it:
```javascript
window.SeeTheCode.setDebug(true);
```

What you'll see:
- Unmatched selectors highlighted with red outline
- Console logs of matching attempts
- Performance stats

Get statistics:
```javascript
window.SeeTheCode.getStats();
// Returns: { totalSelectors, matchedElements, unmatchedElements }
```

Disable it:
```javascript
window.SeeTheCode.setDebug(false);
```

### Common Issues

**Script fails to load**
- Check the path to `overlay/inject.js`. Make sure it's correct relative to your current page URL.

**Code map loads but no badges appear**
- Verify selectors match your DOM. Enable debug mode to see which elements are unmatched. Make sure elements are visible (not hidden or too small).

**Badges appear but clicking doesn't work**
- Check the interaction mode in the config. Make sure you're using 'click' mode, or try 'hover' or 'always' modes.

**Dynamic content not detected**
- The overlay uses MutationObserver to detect new elements. If content is added very quickly, try calling `window.SeeTheCode.reload()` manually.

### Testing

1. Test with demo app: Open `demo/index.html` and inject the overlay to verify it works.
2. Check console: Look for initialization messages and any errors.
3. Verify mappings: Compare visible badges with entries in `code-map.json`.
4. Test interactions: Click badges to verify file info shows and VS Code opens.
5. Test debug mode: Enable it and verify unmatched selectors are highlighted.
6. Test dynamic content: Add new elements to the page and verify they're detected.

## Development

### Testing with Demo App

Important: The demo must be served through a web server. Opening the HTML file directly won't work due to CORS restrictions.

1. Start a web server from the project root:
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server -p 8000`
   - PHP: `php -S localhost:8000`
   - Or use VS Code's "Live Server" extension

2. Open `http://localhost:8000/demo/` in your browser

3. Inject the overlay using the console method (see Quick Start section above)

4. Verify badges appear on mapped elements

5. Test click interactions and VS Code opening

See `demo/README.md` for more detailed instructions.

## Future Enhancements

- Framework-specific adapters (React, Vue)
- Live DevTools integration
- Browser extension
- VS Code plugin
- AI-powered automatic map generation

## Author

**Satyasai Ray**

- GitHub: [@satyasairay](https://github.com/satyasairay)
- LinkedIn: [satyasairay](https://in.linkedin.com/in/satyasairay)

## License

MIT

