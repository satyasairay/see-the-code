/**
 * Helper functions for testing large codebases
 * Extracted from test-large-codebase.js for reuse
 */

const path = require('path');
const fs = require('fs-extra');

/**
 * Count components in repository
 */
async function countComponents(repoPath) {
  const { glob } = require('glob');
  const jsxFiles = await glob('**/*.{jsx,tsx}', { 
    cwd: repoPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  let componentCount = 0;
  const parser = require('@babel/parser');
  const traverse = require('@babel/traverse').default;
  const t = require('@babel/types');
  
  for (const file of jsxFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      traverse(ast, {
        ExportDefaultDeclaration: () => componentCount++,
        ExportNamedDeclaration: (path) => {
          if (path.node.declaration) {
            if (t.isFunctionDeclaration(path.node.declaration) || 
                t.isVariableDeclaration(path.node.declaration)) {
              componentCount++;
            }
          }
        },
        FunctionDeclaration: (path) => {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            componentCount++;
          }
        }
      });
    } catch (err) {
      // Skip parse errors
    }
  }
  
  return { fileCount: jsxFiles.length, componentCount };
}

/**
 * Real accuracy validation: Check if selectors actually exist in code at specified lines
 */
async function validateSelectorInCode(selector, filePath, lineNumber, content) {
  const lines = content.split('\n');
  if (lineNumber < 1 || lineNumber > lines.length) {
    return { valid: false, reason: 'Line number out of bounds' };
  }

  const targetLine = lines[lineNumber - 1]; // Convert to 0-based index
  const lineContent = targetLine.trim();

  // Parse selector type
  if (selector.startsWith('.')) {
    // Class selector: .className
    const className = selector.substring(1);
    // Check for className="..." or className={`...`} or className={...}
    const classNamePatterns = [
      new RegExp(`className=["'\`]\\s*[^"'\`]*\\b${className}\\b[^"'\`]*["'\`]`, 'i'),
      new RegExp(`className=\\{["'\`]\\s*[^"'\`]*\\b${className}\\b[^"'\`]*["'\`]\\}`, 'i'),
      new RegExp(`className=\\{[^}]*['"\`]\\s*${className}\\s*['"\`]`, 'i')
    ];
    const found = classNamePatterns.some(pattern => pattern.test(lineContent));
    return { valid: found, reason: found ? 'Found' : `Class "${className}" not found in className attribute` };
  } else if (selector.startsWith('#')) {
    // ID selector: #id
    const id = selector.substring(1);
    const idPatterns = [
      new RegExp(`id=["'\`]${id}["'\`]`, 'i'),
      new RegExp(`id=\\{["'\`]${id}["'\`]\\}`, 'i')
    ];
    const found = idPatterns.some(pattern => pattern.test(lineContent));
    return { valid: found, reason: found ? 'Found' : `ID "${id}" not found in id attribute` };
  } else if (selector.startsWith('[') && selector.includes('data-')) {
    // Data attribute: [data-testid="value"]
    const match = selector.match(/\[data-([^=]+)="([^"]+)"\]/);
    if (match) {
      const attrName = `data-${match[1]}`;
      const attrValue = match[2];
      const dataPatterns = [
        new RegExp(`${attrName}=["'\`]${attrValue}["'\`]`, 'i'),
        new RegExp(`${attrName}=\\{["'\`]${attrValue}["'\`]\\}`, 'i')
      ];
      const found = dataPatterns.some(pattern => pattern.test(lineContent));
      return { valid: found, reason: found ? 'Found' : `Data attribute "${attrName}"="${attrValue}" not found` };
    }
    return { valid: false, reason: 'Invalid data attribute selector format' };
  } else {
    // Element type selector: div, button, etc.
    // Check if the element type appears on this line (could be opening or closing tag)
    const elementPattern = new RegExp(`<${selector}[\\s>]|</${selector}>`, 'i');
    const found = elementPattern.test(lineContent);
    return { valid: found, reason: found ? 'Found' : `Element type "${selector}" not found on line` };
  }
}

/**
 * Validate accuracy of code map
 */
async function validateAccuracy(codeMap, repoPath) {
  // Real validation: check if selectors actually exist in code
  let validSelectors = 0;
  let invalidSelectors = 0;
  const errors = [];
  const sampleSize = Math.min(100, Object.keys(codeMap).length); // Sample up to 100 selectors
  const selectors = Object.entries(codeMap);
  const sampled = selectors.slice(0, sampleSize); // Take first N for performance
  
  // Note: chalk is not available in helpers, so logging is done in caller
  
  for (const [selector, mapping] of sampled) {
    const filePath = path.isAbsolute(mapping.file) 
      ? mapping.file 
      : path.join(repoPath, mapping.file);
    
    if (!(await fs.pathExists(filePath))) {
      invalidSelectors++;
      errors.push({ selector, file: mapping.file, reason: 'File not found' });
      continue;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const validation = await validateSelectorInCode(selector, filePath, mapping.line, content);
      
      if (validation.valid) {
        validSelectors++;
      } else {
        invalidSelectors++;
        errors.push({ 
          selector, 
          file: mapping.file, 
          line: mapping.line, 
          reason: validation.reason 
        });
      }
    } catch (error) {
      invalidSelectors++;
      errors.push({ selector, file: mapping.file, reason: `Error reading file: ${error.message}` });
    }
  }
  
  const total = validSelectors + invalidSelectors;
  const accuracy = total > 0 ? (validSelectors / total) * 100 : 0;
  
  return { 
    validSelectors, 
    invalidSelectors, 
    accuracy, 
    total,
    sampled: sampled.length,
    totalSelectors: selectors.length,
    errors: errors.slice(0, 10) // Show first 10 errors
  };
}

module.exports = {
  countComponents,
  validateSelectorInCode,
  validateAccuracy
};

