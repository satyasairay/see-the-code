# API Documentation

## Overlay API (`window.SeeTheCode`)

The overlay script exposes a public API for programmatic control.

### `window.SeeTheCode.init()`

Initialize or reinitialize the overlay.

```javascript
await window.SeeTheCode.init();
```

### `window.SeeTheCode.setDebug(enabled)`

Enable or disable debug mode. When enabled, unmatched selectors are highlighted with red outlines.

```javascript
window.SeeTheCode.setDebug(true);
```

**Parameters:**
- `enabled` (boolean) - Whether to enable debug mode

### `window.SeeTheCode.setInteractionMode(mode)`

Set how badges are displayed and interacted with.

```javascript
window.SeeTheCode.setInteractionMode('hover');
```

**Parameters:**
- `mode` (string) - One of: `'click'`, `'hover'`, or `'always'`
  - `'click'`: Badges appear on click
  - `'hover'`: Badges appear on hover
  - `'always'`: Badges are always visible

### `window.SeeTheCode.setCodeMapUrl(url)`

Change the URL or path to load `code-map.json` from.

```javascript
window.SeeTheCode.setCodeMapUrl('./path/to/code-map.json');
```

**Parameters:**
- `url` (string) - URL or path to `code-map.json`

### `window.SeeTheCode.setWorkspaceRoot(rootPath)`

Set the workspace root path for VS Code file opening.

```javascript
window.SeeTheCode.setWorkspaceRoot('/Users/name/project');
```

**Parameters:**
- `rootPath` (string) - Absolute file system path to workspace root

### `window.SeeTheCode.reload()`

Reload the overlay (reprocess DOM and reload code map).

```javascript
window.SeeTheCode.reload();
```

### `window.SeeTheCode.getStats()`

Get statistics about the current overlay state.

```javascript
const stats = window.SeeTheCode.getStats();
console.log(stats);
// {
//   totalSelectors: 150,
//   matchedElements: 120,
//   unmatchedElements: 30
// }
```

**Returns:**
- `Object` with properties:
  - `totalSelectors` (number) - Total selectors in code map
  - `matchedElements` (number) - Number of elements with matched selectors
  - `unmatchedElements` (number) - Number of elements without matches

## Configuration (`window.SeeTheCodeConfig`)

Set configuration before the script loads:

```javascript
window.SeeTheCodeConfig = {
  codeMapUrl: './code-map.json',
  workspaceRoot: '/path/to/project',
  enableDebug: false,
  openInVSCode: true,
  interactionMode: 'click',
  enableInnerTextFallback: true,
  enableFuzzyMatching: true
};
```

**Options:**
- `codeMapUrl` (string) - URL to `code-map.json` (default: `'./code-map.json'`)
- `workspaceRoot` (string) - Workspace root for VS Code (default: `null`)
- `enableDebug` (boolean) - Enable debug mode (default: `false`)
- `openInVSCode` (boolean) - Open files in VS Code on click (default: `true`)
- `interactionMode` (string) - `'click'`, `'hover'`, or `'always'` (default: `'click'`)
- `enableInnerTextFallback` (boolean) - Enable innerText matching fallback (default: `true`)
- `enableFuzzyMatching` (boolean) - Enable fuzzy selector matching (default: `true`)

## CLI API

### `generateCodeMap(options)`

Generate a code map from source files.

```javascript
const { generateCodeMap } = require('./cli/generate');

const codeMap = await generateCodeMap({
  input: ['./src'],
  output: './code-map.json',
  verbose: true
});
```

**Parameters:**
- `options` (Object) - Configuration options
  - `input` (string|string[]) - Input directories or files
  - `output` (string) - Output file path (default: `'./code-map.json'`)
  - `verbose` (boolean) - Enable verbose logging (default: `false`)
  - `dryRun` (boolean) - Print to stdout instead of writing file (default: `false`)
  - `hash` (boolean) - Include content hashes in output (default: `false`)

**Returns:**
- `Promise<Object>` - Generated code map object

## Code Map Format

The code map is a JSON object mapping CSS selectors to source code locations:

```json
{
  ".my-button": {
    "file": "src/components/Button.jsx",
    "line": 42
  },
  "#header": {
    "file": "src/layouts/Header.jsx",
    "line": 10
  },
  "[data-testid=\"submit\"]": {
    "file": "src/forms/LoginForm.jsx",
    "line": 25
  }
}
```

**Selector Types:**
- Class selectors: `".className"`
- ID selectors: `"#id"`
- Data attributes: `"[data-testid=\"value\"]"`
- Element types: `"div"`, `"button"`, etc.

