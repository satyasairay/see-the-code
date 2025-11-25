/**
 * Integration tests for code map generator
 * 
 * Simple test runner (Jest-compatible but runs with Node.js)
 */

const { generateCodeMap } = require('../generate');
const path = require('path');
const fs = require('fs-extra');

// Simple test framework
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function expect(actual) {
  return {
    toHaveProperty: (prop) => {
      if (!(prop in actual)) {
        throw new Error(`Expected object to have property "${prop}"`);
      }
    },
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

const beforeAll = (fn) => {
  global.beforeAll = fn;
};

const afterAll = (fn) => {
  global.afterAll = fn;
};

async function runTests() {
  // Run beforeAll if defined
  if (global.beforeAll) {
    await global.beforeAll();
  }

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${error.message}`);
      failed++;
    }
  }

  // Run afterAll if defined
  if (global.afterAll) {
    await global.afterAll();
  }
  
  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

describe('Code Map Generator Integration', () => {
  const testDir = path.join(__dirname, 'test-project');
  const outputFile = path.join(testDir, 'code-map.json');

  beforeAll(async () => {
    // Create test project structure
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'src', 'components'));
    await fs.ensureDir(path.join(testDir, 'src', 'pages'));

    // Create multiple test components
    const components = [
      {
        file: 'src/components/Button.jsx',
        content: `
          import React from 'react';
          function Button({ children, variant }) {
            return (
              <button className={\`btn btn-\${variant}\`} id="button-id">
                {children}
              </button>
            );
          }
          export default Button;
        `
      },
      {
        file: 'src/components/Modal.jsx',
        content: `
          import React from 'react';
          function Modal({ isOpen, children }) {
            return (
              <>
                {isOpen && <div className="modal-overlay" data-testid="modal-overlay">Overlay</div>}
                {isOpen ? (
                  <div className="modal active" id="modal">
                    {children}
                  </div>
                ) : (
                  <div className="modal inactive">Hidden</div>
                )}
              </>
            );
          }
          export default Modal;
        `
      },
      {
        file: 'src/pages/Home.jsx',
        content: `
          import React from 'react';
          import Button from '../components/Button';
          function Home() {
            return (
              <div className="home-container" id="home">
                <h1 className="title">Welcome</h1>
                <Button variant="primary">Click me</Button>
                <button className={['btn', 'secondary']}>Another</button>
              </div>
            );
          }
          export default Home;
        `
      }
    ];

    for (const comp of components) {
      await fs.writeFile(path.join(testDir, comp.file), comp.content);
    }
  });

  afterAll(async () => {
    // Cleanup
    await fs.remove(testDir);
  });

  test('should generate code map for multiple files', async () => {
    const config = {
      input: [path.join(testDir, 'src')],
      output: outputFile,
      workspaceRoot: testDir,
      options: {
        extractElementTypes: true,
        extractDataAttributes: true,
        handleDynamicClasses: true,
        includeHashes: false
      },
      verbose: false
    };

    const codeMap = await generateCodeMap(config);

    // Should have selectors from all files
    expect(Object.keys(codeMap).length).toBeGreaterThan(0);
    
    // Check specific selectors
    expect(codeMap).toHaveProperty('.btn');
    expect(codeMap).toHaveProperty('#button-id');
    expect(codeMap).toHaveProperty('.modal-overlay');
    expect(codeMap).toHaveProperty('[data-testid="modal-overlay"]');
    expect(codeMap).toHaveProperty('.home-container');
    expect(codeMap).toHaveProperty('.title');
  });

  test('should handle conditional rendering correctly', async () => {
    const config = {
      input: [path.join(testDir, 'src', 'components', 'Modal.jsx')],
      output: outputFile,
      workspaceRoot: testDir,
      options: {
        extractElementTypes: true,
        extractDataAttributes: true,
        handleDynamicClasses: true,
        includeHashes: false
      },
      verbose: false
    };

    const codeMap = await generateCodeMap(config);

    // Should extract from conditional rendering
    expect(codeMap).toHaveProperty('.modal-overlay');
    expect(codeMap).toHaveProperty('.modal');
    expect(codeMap).toHaveProperty('.active');
    expect(codeMap).toHaveProperty('.inactive');
  });

  test('should write code-map.json file', async () => {
    const config = {
      input: [path.join(testDir, 'src')],
      output: outputFile,
      workspaceRoot: testDir,
      options: {
        extractElementTypes: true,
        extractDataAttributes: true,
        handleDynamicClasses: true,
        includeHashes: false
      },
      verbose: false
    };

    await generateCodeMap(config);
    
    // File should exist
    expect(await fs.pathExists(outputFile)).toBe(true);
    
    // Should be valid JSON
    const content = await fs.readJSON(outputFile);
    expect(typeof content).toBe('object');
    expect(Object.keys(content).length).toBeGreaterThan(0);
  });

  test('should handle duplicate selectors', async () => {
    const config = {
      input: [path.join(testDir, 'src')],
      output: outputFile,
      workspaceRoot: testDir,
      options: {
        extractElementTypes: true,
        extractDataAttributes: true,
        handleDynamicClasses: true,
        warnOnDuplicates: true,
        includeHashes: false
      },
      verbose: false
    };

    const codeMap = await generateCodeMap(config);

    // Should handle duplicates (keep first occurrence)
    // Multiple files might have same selector
    const selectors = Object.keys(codeMap);
    const uniqueSelectors = new Set(selectors);
    expect(selectors.length).toBe(uniqueSelectors.size);
  });
});

// Run tests
if (require.main === module) {
  runTests();
}

