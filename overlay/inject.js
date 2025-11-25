// See The Code - Overlay script
// Injects badges that show where UI elements come from in the source code

// Config can be set before script loads via window.SeeTheCodeConfig
const PRE_CONFIG = (typeof window !== 'undefined' && window.SeeTheCodeConfig) || {};

const CONFIG = {
  interactionMode: PRE_CONFIG.interactionMode || 'click', // 'click', 'hover', or 'always'
  codeMapUrl: PRE_CONFIG.codeMapUrl || './code-map.json',
  enableDebug: PRE_CONFIG.enableDebug || false,
  openInVSCode: PRE_CONFIG.openInVSCode !== undefined ? PRE_CONFIG.openInVSCode : true,
  workspaceRoot: PRE_CONFIG.workspaceRoot || null, // needed for VS Code file opening
  namespace: 'see-the-code',
  enableInnerTextFallback: PRE_CONFIG.enableInnerTextFallback !== undefined ? PRE_CONFIG.enableInnerTextFallback : true,
  enableFuzzyMatching: PRE_CONFIG.enableFuzzyMatching !== undefined ? PRE_CONFIG.enableFuzzyMatching : true
};

let codeMap = {};
let unmatchedSelectors = new Set();
let matchedElements = new Map();

function debugLog(...args) {
  if (CONFIG.enableDebug) {
    console.log('[SeeTheCode]', ...args);
  }
}

function warnLog(...args) {
  console.warn('[SeeTheCode]', ...args);
}

function ns(className) {
  return `${CONFIG.namespace}-${className}`;
}

function openInVSCode(filePath, lineNumber) {
  if (!CONFIG.openInVSCode) return;
  
  try {
    let absolutePath = filePath;
    const isAbsolute = /^([A-Za-z]:|\\|\/)/.test(filePath);
    
    if (!isAbsolute && CONFIG.workspaceRoot) {
      // resolve relative path
      const normalizedWorkspace = CONFIG.workspaceRoot.replace(/\\/g, '/').replace(/\/$/, '');
      const normalizedFilePath = filePath.replace(/\\/g, '/').replace(/^\//, '');
      absolutePath = `${normalizedWorkspace}/${normalizedFilePath}`;
    } else if (!isAbsolute) {
      warnLog('Workspace root not set. Cannot resolve:', filePath);
      absolutePath = filePath; // try anyway
    }
    
    absolutePath = absolutePath.replace(/\\/g, '/'); // VS Code wants forward slashes
    const vscodeUrl = `vscode://file/${absolutePath}:${lineNumber}`;
    
    debugLog('Opening:', vscodeUrl);
    window.location.href = vscodeUrl;
  } catch (error) {
    warnLog('Failed to open in VS Code:', error);
  }
}

function matchByInnerText(element, codeMap) {
  if (!CONFIG.enableInnerTextFallback) return null;
  
  const text = element.innerText?.trim();
  if (!text || text.length > 100) return null; // skip long text
  
  for (const [selector, mapping] of Object.entries(codeMap)) {
    if (mapping.innerText && mapping.innerText.toLowerCase() === text.toLowerCase()) {
      return mapping;
    }
  }
  return null;
}

function fuzzyMatchSelector(element, codeMap) {
  if (!CONFIG.enableFuzzyMatching) return null;
  
  const classes = Array.from(element.classList || []);
  const id = element.id;
  
  // try partial class matches
  for (const className of classes) {
    for (const [selector, mapping] of Object.entries(codeMap)) {
      if (selector.includes(className) || className.includes(selector.replace('.', ''))) {
        return mapping;
      }
    }
  }
  
  // try partial ID matches
  if (id) {
    for (const [selector, mapping] of Object.entries(codeMap)) {
      if (selector.includes(id) || id.includes(selector.replace('#', ''))) {
        return mapping;
      }
    }
  }
  
  return null;
}

function findCodeMapping(element) {
  // try exact match first
  for (const [selector, mapping] of Object.entries(codeMap)) {
    try {
      if (element.matches && element.matches(selector)) {
        return mapping;
      }
    } catch (e) {
      // invalid selector, skip it
      debugLog('Invalid selector:', selector, e);
    }
  }
  
  // fallback to innerText matching
  const innerTextMatch = matchByInnerText(element, codeMap);
  if (innerTextMatch) {
    debugLog('Matched by innerText');
    return innerTextMatch;
  }
  
  // try fuzzy matching
  const fuzzyMatch = fuzzyMatchSelector(element, codeMap);
  if (fuzzyMatch) {
    debugLog('Matched by fuzzy selector');
    return fuzzyMatch;
  }
  
  return null;
}

function injectStyles() {
  const styleId = ns('styles');
  
  // Remove existing styles if re-injecting
  const existing = document.getElementById(styleId);
  if (existing) existing.remove();
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* See The Code Overlay Styles */
    .${ns('badge')} {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(0, 123, 255, 0.9);
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      line-height: 1.4;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      pointer-events: auto;
      white-space: nowrap;
      user-select: none;
    }
    
    .${ns('badge')}:hover {
      background: rgba(0, 123, 255, 1);
      transform: scale(1.05);
    }
    
    .${ns('badge')}.${ns('expanded')} {
      background: rgba(0, 123, 255, 0.95);
      padding: 4px 8px;
      font-size: 11px;
      max-width: 300px;
      white-space: normal;
      word-break: break-word;
    }
    
    .${ns('badge')}.${ns('expanded')} .${ns('file-info')} {
      display: block;
      margin-top: 2px;
      font-size: 9px;
      opacity: 0.9;
    }
    
    .${ns('file-info')} {
      display: none;
    }
    
    .${ns('element-wrapper')} {
      position: relative;
    }
    
    /* Debug mode: highlight unmatched selectors */
    .${ns('debug-unmatched')} {
      outline: 2px solid red !important;
      outline-offset: 2px;
    }
    
    /* Hover mode styles */
    .${ns('badge')}.${ns('hover-mode')} {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .${ns('element-wrapper')}:hover .${ns('badge')}.${ns('hover-mode')} {
      opacity: 1;
    }
    
    /* Always visible mode */
    .${ns('badge')}.${ns('always-visible')} {
      opacity: 1;
    }
  `;
  
  document.head.appendChild(style);
  debugLog('Styles injected');
}

function createBadge(mapping) {
  const badge = document.createElement('div');
  badge.className = ns('badge');
  
  if (CONFIG.interactionMode === 'hover') {
    badge.classList.add(ns('hover-mode'));
  } else if (CONFIG.interactionMode === 'always') {
    badge.classList.add(ns('always-visible'));
  }
  
  badge.textContent = 'See the code';
  
  const fileInfo = document.createElement('div');
  fileInfo.className = ns('file-info');
  fileInfo.textContent = `${mapping.file}:${mapping.line}`;
  badge.appendChild(fileInfo);
  
  // click handler
  if (CONFIG.interactionMode === 'click') {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      badge.classList.toggle(ns('expanded'));
      
      if (CONFIG.openInVSCode && badge.classList.contains(ns('expanded'))) {
        openInVSCode(mapping.file, mapping.line);
      }
    });
  } else {
    // hover/always modes also show info on click
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      badge.classList.toggle(ns('expanded'));
      
      if (CONFIG.openInVSCode && badge.classList.contains(ns('expanded'))) {
        openInVSCode(mapping.file, mapping.line);
      }
    });
  }
  
  return badge;
}

function processElement(element) {
  if (matchedElements.has(element)) return;
  
  // skip non-visual elements
  const tagName = element.tagName?.toLowerCase();
  if (['script', 'style', 'meta', 'link', 'head'].includes(tagName)) return;
  
  // skip tiny elements
  const rect = element.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  
  const mapping = findCodeMapping(element);
  
  if (mapping) {
    // make sure parent is positioned relatively
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
      element.style.position = 'relative';
    }
    
    // wrap element if needed for positioning
    if (!element.classList.contains(ns('element-wrapper'))) {
      const wrapper = document.createElement('div');
      wrapper.className = ns('element-wrapper');
      wrapper.style.position = 'relative';
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
      element = wrapper;
    }
    
    const badge = createBadge(mapping);
    element.appendChild(badge);
    
    matchedElements.set(element, { mapping, badge });
    debugLog('Matched element:', element, mapping);
  } else {
    // Track unmatched for debug mode
    const selectors = Object.keys(codeMap);
    unmatchedSelectors.add(element);
    
    if (CONFIG.enableDebug) {
      element.classList.add(ns('debug-unmatched'));
    }
  }
}

/**
 * Process all elements in the DOM
 */
function processDOM() {
  debugLog('Processing DOM...');
  
  const allElements = document.querySelectorAll('*');
  let processed = 0;
  
  allElements.forEach((element) => {
    try {
      processElement(element);
      processed++;
    } catch (error) {
      debugLog('Error processing element:', element, error);
    }
  });
  
  debugLog(`Processed ${processed} elements, matched ${matchedElements.size}`);
  
  if (CONFIG.enableDebug && unmatchedSelectors.size > 0) {
    warnLog(`Unmatched selectors: ${unmatchedSelectors.size} elements`);
  }
}

// ============================================================================
// CODE MAP LOADING
// ============================================================================

/**
 * Load code-map.json from URL
 */
async function loadCodeMap(url) {
  try {
    debugLog('Loading code map from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load code map: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    codeMap = data;
    debugLog('Code map loaded:', Object.keys(codeMap).length, 'selectors');
    
    return true;
  } catch (error) {
    warnLog('Failed to load code map:', error);
    return false;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the overlay
 * 
 * Loads the code map, injects styles, and processes the DOM to add badges.
 * This function is called automatically when the script loads, but can be
 * called manually to reinitialize.
 * 
 * @async
 * @returns {Promise<void>}
 * @example
 * // Manual initialization
 * await window.SeeTheCode.init();
 */
async function init() {
  debugLog('Initializing See The Code overlay...');
  
  // Inject styles
  injectStyles();
  
  // Load code map
  const loaded = await loadCodeMap(CONFIG.codeMapUrl);
  if (!loaded) {
    warnLog('Code map not loaded. Overlay will not function.');
    warnLog('Current code map URL:', CONFIG.codeMapUrl);
    warnLog('Try setting it manually: window.SeeTheCode.setCodeMapUrl("../code-map.json")');
    return;
  }
  
  // Process DOM
  processDOM();
  
  // Watch for DOM changes (for dynamic content)
  const observer = new MutationObserver((mutations) => {
    let shouldReprocess = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldReprocess = true;
      }
    });
    
    if (shouldReprocess) {
      // Debounce reprocessing
      clearTimeout(window._seeTheCodeReprocessTimeout);
      window._seeTheCodeReprocessTimeout = setTimeout(() => {
        processDOM();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  debugLog('Overlay initialized');
}

// public API
window.SeeTheCode = {
  setDebug: (enabled) => {
    CONFIG.enableDebug = enabled;
    if (enabled) {
      unmatchedSelectors.forEach(el => el.classList.add(ns('debug-unmatched')));
    } else {
      document.querySelectorAll(`.${ns('debug-unmatched')}`).forEach(el => {
        el.classList.remove(ns('debug-unmatched'));
      });
    }
    debugLog('Debug mode:', enabled ? 'enabled' : 'disabled');
  },
  
  setInteractionMode: (mode) => {
    if (['click', 'hover', 'always'].includes(mode)) {
      CONFIG.interactionMode = mode;
      init(); // re-init to apply new mode
    } else {
      warnLog('Invalid interaction mode:', mode);
    }
  },
  
  setCodeMapUrl: (url) => {
    CONFIG.codeMapUrl = url;
    debugLog('Code map URL set to:', url);
    if (Object.keys(codeMap).length > 0 || document.getElementById(ns('styles'))) {
      matchedElements.clear();
      unmatchedSelectors.clear();
      document.querySelectorAll(`.${ns('badge')}`).forEach(badge => badge.remove());
      document.querySelectorAll(`.${ns('element-wrapper')}`).forEach(wrapper => {
        const child = wrapper.firstElementChild;
        if (child) {
          wrapper.parentNode.replaceChild(child, wrapper);
        }
      });
      init();
    }
  },
  
  reload: () => {
    matchedElements.clear();
    unmatchedSelectors.clear();
    document.querySelectorAll(`.${ns('badge')}`).forEach(badge => badge.remove());
    document.querySelectorAll(`.${ns('element-wrapper')}`).forEach(wrapper => {
      const child = wrapper.firstElementChild;
      if (child) {
        wrapper.parentNode.replaceChild(child, wrapper);
      }
    });
    init();
  },
  
  getStats: () => {
    return {
      totalSelectors: Object.keys(codeMap).length,
      matchedElements: matchedElements.size,
      unmatchedElements: unmatchedSelectors.size
    };
  },
  
  setWorkspaceRoot: (rootPath) => {
    CONFIG.workspaceRoot = rootPath;
    debugLog('Workspace root set to:', rootPath);
  },
  
  init: init
};

// ============================================================================
// AUTO-INITIALIZE
// ============================================================================

// Initialize when DOM is ready
// Use a small delay to allow setCodeMapUrl to be called first if needed
(function() {
  const doInit = () => {
    // Small delay to allow configuration before init
    setTimeout(init, 50);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doInit);
  } else {
    doInit();
  }
})();

