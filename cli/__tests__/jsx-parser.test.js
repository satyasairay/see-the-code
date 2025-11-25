/**
 * Unit tests for JSX parser
 * 
 * Simple test runner (Jest-compatible but runs with Node.js)
 */

const { parseJSXFile } = require('../parser/jsx-parser');
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
    },
    toContain: (substring) => {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    }
  };
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// Mock config
const mockConfig = {
  workspaceRoot: path.resolve(__dirname, '..', '..'),
  options: {
    extractElementTypes: true,
    extractDataAttributes: true,
    handleDynamicClasses: false,
    includeHashes: false
  }
};

describe('JSX Parser', () => {
  test('should extract class names from string literals', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'basic-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <div className="container primary">Content</div>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    expect(selectors).toHaveProperty('.container');
    expect(selectors).toHaveProperty('.primary');
    expect(selectors['.container'].line).toBeGreaterThan(0);
    
    await fs.remove(testFile);
  });

  test('should extract ID selectors', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'id-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <div id="main-content">Content</div>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    expect(selectors).toHaveProperty('#main-content');
    expect(selectors['#main-content'].file).toContain('id-component.jsx');
    
    await fs.remove(testFile);
  });

  test('should extract data attributes', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'data-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <button data-testid="submit-btn">Submit</button>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    expect(selectors).toHaveProperty('[data-testid="submit-btn"]');
    
    await fs.remove(testFile);
  });

  test('should extract element types', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'element-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <button>Click me</button>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    expect(selectors).toHaveProperty('button');
    
    await fs.remove(testFile);
  });

  test('should handle template literals in className', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'template-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <div className={\`btn \${active ? 'active' : ''}\`}>Button</div>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    // Should extract static part 'btn'
    expect(selectors).toHaveProperty('.btn');
    
    await fs.remove(testFile);
  });

  test('should handle array classNames', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'array-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return <div className={['btn', 'primary']}>Button</div>;
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    expect(selectors).toHaveProperty('.btn');
    expect(selectors).toHaveProperty('.primary');
    
    await fs.remove(testFile);
  });

  test('should handle conditional rendering', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'conditional-component.jsx');
    await fs.ensureDir(path.dirname(testFile));
    await fs.writeFile(testFile, `
      function Component() {
        return (
          <div>
            {show && <div className="modal">Modal</div>}
            {isActive ? <button className="active-btn">Active</button> : <button className="inactive-btn">Inactive</button>}
          </div>
        );
      }
    `);

    const selectors = await parseJSXFile(testFile, mockConfig);
    
    // Should extract from conditional rendering
    expect(selectors).toHaveProperty('.modal');
    expect(selectors).toHaveProperty('.active-btn');
    expect(selectors).toHaveProperty('.inactive-btn');
    
    await fs.remove(testFile);
  });
});

// Run tests
if (require.main === module) {
  (async () => {
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
    
    console.log(`\nTests: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })();
}
