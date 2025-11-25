// JSX/TSX parser using Babel

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const fs = require('fs-extra');
const path = require('path');
const { getRelativePath, readFile, hashContent } = require('../utils/file-utils');

async function parseJSXFile(filePath, config) {
  const content = await readFile(filePath);
  const relativePath = getRelativePath(filePath, config.workspaceRoot);
  const selectors = {};

  try {
    const isTypeScript = path.extname(filePath) === '.tsx';
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        isTypeScript ? 'typescript' : 'flow',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining'
      ],
      sourceFilename: filePath
    });

    traverse(ast, {
      JSXOpeningElement: (path) => {
        const selectorsFromElement = extractSelectorsFromJSXElement(
          path,
          relativePath,
          content,
          config
        );
        
        Object.assign(selectors, selectorsFromElement);
      },
      // handle conditional rendering: {show && <div>}
      JSXExpressionContainer: (path) => {
        const expression = path.node.expression;
        
        // handle logical expressions: {show && <div>}
        if (t.isLogicalExpression(expression) && 
            (expression.operator === '&&' || expression.operator === '||')) {
          if (t.isJSXElement(expression.right)) {
            const jsxSelectors = extractSelectorsFromJSXElement(
              { node: expression.right.openingElement, loc: expression.right.openingElement.loc },
              relativePath,
              content,
              config
            );
            Object.assign(selectors, jsxSelectors);
            
            // handle nested JSX
            traverse(expression.right, {
              JSXOpeningElement: (innerPath) => {
                const nestedSelectors = extractSelectorsFromJSXElement(
                  innerPath,
                  relativePath,
                  content,
                  config
                );
                Object.assign(selectors, nestedSelectors);
              }
            }, path.scope);
          }
        }
        // handle ternary: {show ? <div> : <div>}
        else if (t.isConditionalExpression(expression)) {
          if (t.isJSXElement(expression.consequent)) {
            const consequentSelectors = extractSelectorsFromJSXElement(
              { node: expression.consequent.openingElement, loc: expression.consequent.openingElement.loc },
              relativePath,
              content,
              config
            );
            Object.assign(selectors, consequentSelectors);
            
            traverse(expression.consequent, {
              JSXOpeningElement: (innerPath) => {
                const nestedSelectors = extractSelectorsFromJSXElement(
                  innerPath,
                  relativePath,
                  content,
                  config
                );
                Object.assign(selectors, nestedSelectors);
              }
            }, path.scope);
          }
          // handle false branch
          if (t.isJSXElement(expression.alternate)) {
            const alternateSelectors = extractSelectorsFromJSXElement(
              { node: expression.alternate.openingElement, loc: expression.alternate.openingElement.loc },
              relativePath,
              content,
              config
            );
            Object.assign(selectors, alternateSelectors);
            
            traverse(expression.alternate, {
              JSXOpeningElement: (innerPath) => {
                const nestedSelectors = extractSelectorsFromJSXElement(
                  innerPath,
                  relativePath,
                  content,
                  config
                );
                Object.assign(selectors, nestedSelectors);
              }
            }, path.scope);
          }
        }
      }
    });

  } catch (error) {
    throw new Error(`Parse error in ${filePath}: ${error.message}`);
  }

  return selectors;
}

function extractSelectorsFromJSXElement(path, filePath, content, config) {
  const selectors = {};
  const node = path.node || path;
  const line = (node.loc && node.loc.start) ? node.loc.start.line : null;

  if (!line) return selectors;

  // extract element type
  if (config.options.extractElementTypes) {
    const elementName = getElementName(node.name);
    if (elementName && !elementName.startsWith('_')) {
      selectors[elementName] = createMapping(filePath, line, content, elementName, config);
    }
  }

  // extract attributes
  if (node.attributes && Array.isArray(node.attributes)) {
    for (const attr of node.attributes) {
      if (t.isJSXAttribute(attr)) {
        const attrSelectors = extractSelectorsFromAttribute(
          attr,
          filePath,
          line,
          content,
          config
        );
        Object.assign(selectors, attrSelectors);
      }
    }
  }

  return selectors;
}

function extractSelectorsFromAttribute(attr, filePath, line, content, config) {
  const selectors = {};
  const name = attr.name.name;
  
  // unwrap JSXExpressionContainer if needed
  let value = attr.value;
  if (t.isJSXExpressionContainer(value)) {
    value = value.expression;
  }

  if (name === 'className') {
    const classSelectors = extractClassNames(value, filePath, line, content, config);
    Object.assign(selectors, classSelectors);
  } else if (name === 'id') {
    const idSelector = extractID(attr.value, filePath, line, content, config);
    if (idSelector) {
      Object.assign(selectors, idSelector);
    }
  } else if (name.startsWith('data-')) {
    if (config.options.extractDataAttributes) {
      const dataSelector = extractDataAttribute(attr, filePath, line, content, config);
      if (dataSelector) {
        Object.assign(selectors, dataSelector);
      }
    }
  }

  return selectors;
}

function extractClassNames(value, filePath, line, content, config) {
  const selectors = {};

  if (!value) return selectors;

  // string literal: className="btn primary"
  if (t.isStringLiteral(value)) {
    const classes = value.value.split(/\s+/).filter(c => c.trim());
    for (const className of classes) {
      if (className) {
        selectors[`.${className}`] = createMapping(filePath, line, content, `.${className}`, config);
      }
    }
  }
  // template literal: className={`btn ${active ? 'active' : ''}`}
  else if (t.isTemplateLiteral(value)) {
    // extract static parts
    for (const quasis of value.quasis) {
      if (t.isTemplateElement(quasis)) {
        const staticClasses = quasis.value.raw.split(/\s+/).filter(c => c.trim());
        for (const className of staticClasses) {
          if (className) {
            selectors[`.${className}`] = createMapping(filePath, line, content, `.${className}`, config);
          }
        }
      }
    }
    if (config.options.handleDynamicClasses) {
      // could extract more, but template literals are complex
    }
  }
  // array: className={['btn', 'primary']}
  else if (t.isArrayExpression(value)) {
    for (const element of value.elements) {
      if (t.isStringLiteral(element)) {
        const className = element.value;
        if (className) {
          selectors[`.${className}`] = createMapping(filePath, line, content, `.${className}`, config);
        }
      }
    }
  }
  // CSS modules: className={styles.button}
  else if (t.isMemberExpression(value)) {
    if (t.isIdentifier(value.property)) {
      const className = value.property.name;
      // note: this is the CSS module class name, not the actual class
      // would need to parse CSS file to get real class
      if (config.options.handleDynamicClasses) {
        selectors[`.${className}`] = createMapping(filePath, line, content, `.${className}`, config);
      }
    }
  }

  return selectors;
}

function extractID(value, filePath, line, content, config) {
  if (!value) return null;
  
  // unwrap JSXExpressionContainer if needed
  if (t.isJSXExpressionContainer(value)) {
    value = value.expression;
  }

  if (t.isStringLiteral(value)) {
    const id = value.value;
    if (id) {
      return {
        [`#${id}`]: createMapping(filePath, line, content, `#${id}`, config)
      };
    }
  }

  return null;
}

/**
 * Extract data attribute selector
 */
function extractDataAttribute(attr, filePath, line, content, config) {
  const name = attr.name.name;
  let value = attr.value;
  
  // Unwrap JSXExpressionContainer if needed
  if (t.isJSXExpressionContainer(value)) {
    value = value.expression;
  }

  if (t.isStringLiteral(value)) {
    const attrValue = value.value;
    const selector = `[${name}="${attrValue}"]`;
    return {
      [selector]: createMapping(filePath, line, content, selector, config)
    };
  }

  return null;
}

function getElementName(nameNode) {
  if (t.isJSXIdentifier(nameNode)) {
    return nameNode.name.toLowerCase();
  } else if (t.isJSXMemberExpression(nameNode)) {
    // Component.Button -> button
    if (t.isJSXIdentifier(nameNode.property)) {
      return nameNode.property.name.toLowerCase();
    }
  }
  return null;
}

function createMapping(filePath, line, content, selector, config) {
  const mapping = {
    file: filePath,
    line: line
  };

  if (config.options.includeHashes) {
    const hashInput = `${content}${selector}${line}`;
    mapping.hash = hashContent(hashInput);
  }

  return mapping;
}

module.exports = { parseJSXFile };

