# See The Code - Demo

This is a sample application to test the See The Code overlay functionality.

## ⚠️ Important: Use a Web Server

**You must serve this demo through a web server** - opening `index.html` directly in the browser (using `file://` protocol) will not work due to browser security restrictions (CORS).

## Quick Start

### 1. Start a Web Server

From the **project root directory** (not the demo directory), run one of these:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (with npx):**
```bash
npx http-server -p 8000
```

**Node.js (with http-server installed):**
```bash
npm install -g http-server
http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

**VS Code:**
- Install the "Live Server" extension
- Right-click on `demo/index.html` and select "Open with Live Server"

### 2. Open the Demo

Navigate to: `http://localhost:8000/demo/`

### 3. Inject the Overlay

Open the browser console (F12) and run:

```javascript
// Inject the overlay script
const script = document.createElement('script');
script.src = '../overlay/inject.js';
script.onload = () => {
  console.log('✅ Overlay loaded!');
  // Set code map path (relative to demo directory)
  if (window.SeeTheCode) {
    window.SeeTheCode.setCodeMapUrl('../code-map.json');
    console.log('✅ Code map URL set');
  }
};
script.onerror = () => {
  console.error('❌ Failed to load script. Make sure you are using a web server!');
};
document.head.appendChild(script);
```

### 4. Test Features

- Look for "See the code" badges on mapped elements
- Click badges to see file and line information
- Enable debug mode: `window.SeeTheCode.setDebug(true)`
- Check stats: `window.SeeTheCode.getStats()`

## Troubleshooting

### CORS Error

If you see "Access to fetch... has been blocked by CORS policy":
- You're using `file://` protocol - use a web server instead
- See "Quick Start" section above

### Script Not Found

If you see "Failed to load overlay/inject.js":
- Make sure you're running the server from the **project root**, not the demo directory
- Check that `overlay/inject.js` exists in the project root
- Verify the URL in the console injection code matches your server setup

### Code Map Not Loading

If badges don't appear:
- Check that `code-map.json` exists in the project root
- Verify the code map URL is set correctly (should be `../code-map.json` from demo directory)
- Run `window.SeeTheCode.setCodeMapUrl('../code-map.json')` manually
- Enable debug mode to see what's happening

