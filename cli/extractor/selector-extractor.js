// selector extraction and normalization

function normalizeSelector(selector) {
  // remove leading dot, hash, or bracket
  const clean = selector.replace(/^[.#\[]/, '').replace(/\]$/, '');
  
  // convert camelCase to kebab-case
  const kebab = clean.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  
  // reconstruct with original prefix
  if (selector.startsWith('.')) {
    return `.${kebab}`;
  } else if (selector.startsWith('#')) {
    return `#${kebab}`;
  } else if (selector.startsWith('[')) {
    return selector; // keep data attributes as-is
  } else {
    return kebab;
  }
}

function deduplicateSelectors(selectors) {
  const seen = new Set();
  const unique = {};

  for (const [selector, mapping] of Object.entries(selectors)) {
    const normalized = normalizeSelector(selector);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique[selector] = mapping;
    }
  }

  return unique;
}

function extractSelectors(astResults) {
  let allSelectors = {};

  // combine selectors from all files
  for (const fileSelectors of Object.values(astResults)) {
    Object.assign(allSelectors, fileSelectors);
  }

  return deduplicateSelectors(allSelectors);
}

module.exports = {
  normalizeSelector,
  deduplicateSelectors,
  extractSelectors
};

