#!/usr/bin/env node

// validation for code-map.json

const fs = require('fs-extra');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');

async function validateCodeMap(codeMapPath, workspaceRoot) {
  const errors = [];
  const warnings = [];
  
  if (!(await fs.pathExists(codeMapPath))) {
    console.error(chalk.red(`✗ Code map file not found: ${codeMapPath}`));
    process.exit(1);
  }

  const codeMap = await fs.readJSON(codeMapPath);
  const workspace = path.resolve(workspaceRoot || '.');

  console.log(chalk.blue('🔍 Validating code-map.json...\n'));

  if (Object.keys(codeMap).length === 0) {
    warnings.push('Code map is empty');
  }

  const fileMap = new Map();
  const duplicateSelectors = new Map();

  for (const [selector, mapping] of Object.entries(codeMap)) {
    if (!mapping.file || !mapping.line) {
      errors.push(`Selector "${selector}" missing file or line`);
      continue;
    }

    // check if file exists
    const filePath = path.isAbsolute(mapping.file) 
      ? mapping.file 
      : path.join(workspace, mapping.file);
    
    if (!(await fs.pathExists(filePath))) {
      errors.push(`Selector "${selector}" references non-existent file: ${mapping.file}`);
      continue;
    }

    // validate line number
    if (typeof mapping.line !== 'number' || mapping.line < 1) {
      errors.push(`Selector "${selector}" has invalid line number: ${mapping.line}`);
    }

    // check line is within file bounds
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      if (mapping.line > lines.length) {
        warnings.push(`Selector "${selector}" line ${mapping.line} exceeds file length (${lines.length} lines) in ${mapping.file}`);
      }
    } catch (err) {
      warnings.push(`Could not validate line number for "${selector}": ${err.message}`);
    }

    // track duplicates
    if (duplicateSelectors.has(selector)) {
      duplicateSelectors.get(selector).push(mapping);
    } else {
      duplicateSelectors.set(selector, [mapping]);
    }

    // track by file
    if (!fileMap.has(mapping.file)) {
      fileMap.set(mapping.file, []);
    }
    fileMap.get(mapping.file).push(selector);
  }

  // check for duplicate selectors
  for (const [selector, mappings] of duplicateSelectors.entries()) {
    if (mappings.length > 1) {
      warnings.push(`Duplicate selector "${selector}" found in ${mappings.length} locations`);
    }
  }

  console.log(chalk.blue('📊 Validation Results:\n'));
  console.log(chalk.green(`  ✓ Total selectors: ${Object.keys(codeMap).length}`));
  console.log(chalk.green(`  ✓ Files referenced: ${fileMap.size}`));
  
  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n  ⚠ Warnings: ${warnings.length}`));
    warnings.forEach(w => console.log(chalk.yellow(`    - ${w}`)));
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n  ✗ Errors: ${errors.length}`));
    errors.forEach(e => console.log(chalk.red(`    - ${e}`)));
    console.log(chalk.red('\n✗ Validation failed'));
    return false;
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log(chalk.green('\n✓ Validation passed - no issues found'));
  } else {
    console.log(chalk.yellow('\n⚠ Validation passed with warnings'));
  }

  return errors.length === 0;
}

async function main() {
  program
    .name('see-the-code validate')
    .description('Validate code-map.json for errors')
    .argument('[file]', 'Path to code-map.json', './code-map.json')
    .option('-w, --workspace <path>', 'Workspace root path', './')
    .action(async (file, options) => {
      const codeMapPath = path.resolve(file);
      const isValid = await validateCodeMap(codeMapPath, options.workspace);
      process.exit(isValid ? 0 : 1);
    });

  program.parse(process.argv);
}

if (require.main === module) {
  main();
}

module.exports = { validateCodeMap };

