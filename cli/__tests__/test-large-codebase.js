#!/usr/bin/env node

/**
 * Test script for validating code map generator against large React codebases
 * Tests success criteria: 100+ components, 95%+ accuracy
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { generateCodeMap } = require('../generate');
const chalk = require('chalk');

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

async function validateAccuracy(codeMap, repoPath) {
  // Real validation: check if selectors actually exist in code
  let validSelectors = 0;
  let invalidSelectors = 0;
  const errors = [];
  const sampleSize = Math.min(100, Object.keys(codeMap).length); // Sample up to 100 selectors
  const selectors = Object.entries(codeMap);
  const sampled = selectors.slice(0, sampleSize); // Take first N for performance
  
  console.log(chalk.gray(`  Validating ${sampled.length} selectors (sampled from ${selectors.length} total)...`));
  
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

async function testLargeCodebase(repoPath, options) {
  console.log(chalk.blue('\n🧪 Testing Large Codebase\n'));
  console.log(chalk.gray(`Repository: ${repoPath}\n`));
  
  // Check if repo exists
  if (!(await fs.pathExists(repoPath))) {
    console.error(chalk.red(`✗ Repository not found: ${repoPath}`));
    console.log(chalk.yellow('\n💡 Clone a test repository first:'));
    console.log(chalk.gray('  git clone --depth 1 https://github.com/marmelab/react-admin.git cli/__tests__/react-admin-test'));
    process.exit(1);
  }
  
  // Count components
  console.log(chalk.blue('📊 Analyzing repository...'));
  const { fileCount, componentCount } = await countComponents(repoPath);
  console.log(chalk.green(`  ✓ Found ${fileCount} JSX/TSX files`));
  console.log(chalk.green(`  ✓ Found ${componentCount} components`));
  
  // Check if meets 100+ components criteria
  if (componentCount < 100) {
    console.log(chalk.yellow(`  ⚠ Component count (${componentCount}) is below 100`));
  } else {
    console.log(chalk.green(`  ✓ Meets 100+ components criteria (${componentCount})`));
  }
  
  // Generate code map
  console.log(chalk.blue('\n🔍 Generating code map...'));
  const outputPath = path.join(repoPath, 'code-map.json');
  
  const config = {
    input: [repoPath],
    output: outputPath,
    workspaceRoot: repoPath,
    verbose: options.verbose,
    options: {
      extractElementTypes: true,
      extractDataAttributes: true,
      handleDynamicClasses: true,
      includeHashes: false
    }
  };
  
  const startTime = Date.now();
  const codeMap = await generateCodeMap(config);
  const duration = Date.now() - startTime;
  
  console.log(chalk.green(`  ✓ Generated code map in ${(duration / 1000).toFixed(2)}s`));
  console.log(chalk.green(`  ✓ Extracted ${Object.keys(codeMap).length} selectors`));
  
  // Validate accuracy (REAL validation - checks if selectors exist in code)
  console.log(chalk.blue('\n✅ Validating accuracy (checking if selectors exist in code)...'));
  const { validSelectors, invalidSelectors, accuracy, total, sampled, totalSelectors, errors } = await validateAccuracy(codeMap, repoPath);
  
  console.log(chalk.green(`  ✓ Valid selectors: ${validSelectors}/${sampled}`));
  if (invalidSelectors > 0) {
    console.log(chalk.yellow(`  ⚠ Invalid selectors: ${invalidSelectors}/${sampled}`));
    if (errors.length > 0) {
      console.log(chalk.yellow(`\n  Sample errors (showing first ${Math.min(5, errors.length)}):`));
      errors.slice(0, 5).forEach(err => {
        console.log(chalk.gray(`    - ${err.selector} in ${err.file}:${err.line || '?'} - ${err.reason}`));
      });
    }
  }
  console.log(chalk.green(`  ✓ Accuracy: ${accuracy.toFixed(2)}% (validated ${sampled} of ${totalSelectors} selectors)`));
  
  // Check if meets 95%+ accuracy criteria
  if (accuracy >= 95) {
    console.log(chalk.green(`  ✓ Meets 95%+ accuracy criteria`));
  } else {
    console.log(chalk.yellow(`  ⚠ Accuracy (${accuracy.toFixed(2)}%) is below 95%`));
  }
  
  // Summary
  console.log(chalk.blue('\n📋 Test Summary:'));
  console.log(chalk.green(`  ✓ Files processed: ${fileCount}`));
  console.log(chalk.green(`  ✓ Components found: ${componentCount}`));
  console.log(chalk.green(`  ✓ Selectors extracted: ${total}`));
  console.log(chalk.green(`  ✓ Accuracy: ${accuracy.toFixed(2)}%`));
  console.log(chalk.green(`  ✓ Processing time: ${(duration / 1000).toFixed(2)}s`));
  
  // Success criteria check
  const meets100Components = componentCount >= 100;
  const meets95Accuracy = accuracy >= 95;
  
  console.log(chalk.blue('\n🎯 Success Criteria:'));
  console.log(meets100Components 
    ? chalk.green('  ✓ Can parse 100+ components')
    : chalk.yellow(`  ⚠ Component count: ${componentCount} (need 100+)`));
  console.log(meets95Accuracy
    ? chalk.green('  ✓ Extracts selectors with 95%+ accuracy')
    : chalk.yellow(`  ⚠ Accuracy: ${accuracy.toFixed(2)}% (need 95%+)`));
  
  if (meets100Components && meets95Accuracy) {
    console.log(chalk.green('\n✅ All success criteria met!'));
    process.exit(0);
  } else {
    console.log(chalk.yellow('\n⚠ Some success criteria not fully met'));
    process.exit(1);
  }
}


program
  .name('test-large-codebase')
  .description('Test code map generator against large React codebase')
  .argument('<repo-path>', 'Path to test repository')
  .option('-v, --verbose', 'Verbose output')
  .action(async (repoPath, options) => {
    const fullPath = path.resolve(repoPath);
    await testLargeCodebase(fullPath, options);
  });

program.parse(process.argv);

