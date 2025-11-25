#!/usr/bin/env node

/**
 * See The Code - Code Map Generator CLI
 * Main entry point for generating code-map.json from source files
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { discoverFiles } = require('./utils/file-utils');
const { parseJSXFile } = require('./parser/jsx-parser');
const { extractSelectors } = require('./extractor/selector-extractor');
const { loadConfig } = require('./config');
const { logger } = require('./utils/logger');

async function generateCodeMap(options = {}) {
  const config = await loadConfig(options);
  const codeMap = {};
  let filesProcessed = 0;
  let errors = 0;

  logger.info(chalk.blue('🔍 Discovering files...'));
  const files = await discoverFiles(config);
  logger.info(chalk.green(`✓ Found ${files.length} files to process`));

  if (files.length === 0) {
    logger.warn(chalk.yellow('⚠ No files found matching the criteria'));
    return codeMap;
  }

  logger.info(chalk.blue('📝 Parsing files and extracting selectors...'));

  for (const filePath of files) {
    try {
      const selectors = await parseAndExtract(filePath, config);
      
      // merge selectors into code map
      for (const [selector, mapping] of Object.entries(selectors)) {
        if (codeMap[selector]) {
          // duplicate selector - keep first
          if (config.options.warnOnDuplicates) {
            logger.warn(
              chalk.yellow(`⚠ Duplicate selector "${selector}" found in:`),
              `\n  - ${codeMap[selector].file}:${codeMap[selector].line}`,
              `\n  - ${mapping.file}:${mapping.line}`
            );
          }
        } else {
          codeMap[selector] = mapping;
        }
      }

      filesProcessed++;
      if (config.verbose) {
        logger.info(chalk.gray(`  ✓ ${filePath} (${Object.keys(selectors).length} selectors)`));
      }
    } catch (error) {
      errors++;
      logger.error(chalk.red(`✗ Error processing ${filePath}:`), error.message);
      if (config.verbose) {
        logger.error(error.stack);
      }
    }
  }

  logger.info(chalk.blue('\n📊 Summary:'));
  logger.info(chalk.green(`  ✓ Files processed: ${filesProcessed}`));
  logger.info(chalk.green(`  ✓ Selectors found: ${Object.keys(codeMap).length}`));
  if (errors > 0) {
    logger.warn(chalk.yellow(`  ⚠ Errors: ${errors}`));
  }

  return codeMap;
}

async function parseAndExtract(filePath, config) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.jsx' || ext === '.tsx') {
    return await parseJSXFile(filePath, config);
  } else if (ext === '.html') {
    // TODO: HTML parsing
    return {};
  } else {
    return {};
  }
}

async function main() {
  program
    .name('see-the-code')
    .description('Generate code-map.json from source files')
    .version('1.0.0')
    .option('-i, --input <paths...>', 'Input directories or files', (val) => val.split(','))
    .option('-o, --output <file>', 'Output file path', './code-map.json')
    .option('-v, --verbose', 'Verbose output')
    .option('--dry-run', 'Print mappings to stdout without writing files')
    .option('--hash', 'Include content hashes in output')
    .action(async (options) => {
      try {
        const codeMap = await generateCodeMap(options);

        if (options.dryRun) {
          console.log(JSON.stringify(codeMap, null, 2));
        } else {
          const outputPath = path.resolve(options.output || './code-map.json');
          await fs.ensureDir(path.dirname(outputPath));
          await fs.writeJSON(outputPath, codeMap, { spaces: 2 });
          logger.info(chalk.green(`\n✓ Code map written to: ${outputPath}`));
        }
      } catch (error) {
        logger.error(chalk.red('✗ Fatal error:'), error.message);
        if (options.verbose) {
          logger.error(error.stack);
        }
        process.exit(1);
      }
    });

  program
    .command('validate')
    .alias('test')
    .description('Validate code-map.json for errors')
    .argument('[file]', 'Path to code-map.json', './code-map.json')
    .option('-w, --workspace <path>', 'Workspace root path', './')
    .action(async (file, options) => {
      const { validateCodeMap } = require('./validator/validate');
      const codeMapPath = path.resolve(file);
      const isValid = await validateCodeMap(codeMapPath, options.workspace);
      process.exit(isValid ? 0 : 1);
    });

  program.parse(process.argv);
}

if (require.main === module) {
  main();
}

module.exports = { generateCodeMap };
