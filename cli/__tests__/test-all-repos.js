#!/usr/bin/env node

/**
 * Automated testing script for all repositories
 * Runs tests sequentially and generates aggregate report
 * 
 * Usage (run from project root):
 *   node cli/__tests__/test-all-repos.js                    # Test all repos
 *   node cli/__tests__/test-all-repos.js --repo nextjs      # Test specific repo
 *   node cli/__tests__/test-all-repos.js --skip-clone       # Skip cloning (use existing repos)
 * 
 * Or from cli/__tests__ directory:
 *   node test-all-repos.js                    # Test all repos
 *   node test-all-repos.js --repo nextjs      # Test specific repo
 *   node test-all-repos.js --skip-clone       # Skip cloning (use existing repos)
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { generateCodeMap } = require('../generate');

// Import validation functions from test-large-codebase.js
const { validateSelectorInCode, validateAccuracy, countComponents } = require('./test-large-codebase-helpers');

// Repository configuration
const REPOSITORIES = [
  {
    name: 'Next.js',
    org: 'vercel',
    repo: 'next.js',
    category: 'Framework',
    cloneCommand: 'git clone --depth 1 https://github.com/vercel/next.js.git nextjs-test',
    testDir: 'nextjs-test',
    focusArea: 'examples/',
    skip: false
  },
  {
    name: 'Material-UI',
    org: 'mui',
    repo: 'material-ui',
    category: 'Component Library',
    cloneCommand: 'git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test',
    testDir: 'material-ui-test',
    focusArea: 'Component demos and examples',
    skip: false
  },
  {
    name: 'React Admin',
    org: 'marmelab',
    repo: 'react-admin',
    category: 'Admin Framework',
    cloneCommand: 'git clone --depth 1 https://github.com/marmelab/react-admin.git react-admin-test',
    testDir: 'react-admin-test',
    focusArea: 'All',
    skip: false,
    tested: true,
    legacyPath: true // Use legacy location
  },
  {
    name: 'Gatsby',
    org: 'gatsbyjs',
    repo: 'gatsby',
    category: 'Static Site Generator',
    cloneCommand: 'git clone --depth 1 https://github.com/gatsbyjs/gatsby.git gatsby-test',
    testDir: 'gatsby-test',
    focusArea: 'examples/ or packages/',
    skip: false
  },
  {
    name: 'Remix',
    org: 'remix-run',
    repo: 'remix',
    category: 'Full-Stack Framework',
    cloneCommand: 'git clone --depth 1 https://github.com/remix-run/remix.git remix-test',
    testDir: 'remix-test',
    focusArea: 'Examples or templates',
    skip: false
  },
  {
    name: 'React Router',
    org: 'remix-run',
    repo: 'react-router',
    category: 'Routing Library',
    cloneCommand: 'git clone --depth 1 https://github.com/remix-run/react-router.git react-router-test',
    testDir: 'react-router-test',
    focusArea: 'Examples',
    skip: false
  },
  {
    name: 'React Hook Form',
    org: 'react-hook-form',
    repo: 'react-hook-form',
    category: 'Form Library',
    cloneCommand: 'git clone --depth 1 https://github.com/react-hook-form/react-hook-form.git react-hook-form-test',
    testDir: 'react-hook-form-test',
    focusArea: 'Examples',
    skip: false
  },
  {
    name: 'Storybook',
    org: 'storybookjs',
    repo: 'storybook',
    category: 'Component Dev Tool',
    cloneCommand: 'git clone --depth 1 https://github.com/storybookjs/storybook.git storybook-test',
    testDir: 'storybook-test',
    focusArea: 'Examples or UI components',
    skip: false
  },
  {
    name: 'TanStack Query',
    org: 'TanStack',
    repo: 'query',
    category: 'Data Fetching',
    cloneCommand: 'git clone --depth 1 https://github.com/TanStack/query.git tanstack-query-test',
    testDir: 'tanstack-query-test',
    focusArea: 'Examples',
    skip: false
  },
  {
    name: 'Ant Design',
    org: 'ant-design',
    repo: 'ant-design',
    category: 'Enterprise UI Library',
    cloneCommand: 'git clone --depth 1 https://github.com/ant-design/ant-design.git ant-design-test',
    testDir: 'ant-design-test',
    focusArea: 'Components directory',
    skip: false
  }
];

// Check for repos in both locations (legacy and new structure)
const REPOS_DIR = path.join(__dirname, 'repos');
const LEGACY_REPOS_DIR = __dirname; // For existing repos like react-admin-test
const AGGREGATE_RESULTS_FILE = path.join(__dirname, 'aggregate-results.json');

/**
 * Clone repository if it doesn't exist
 */
async function cloneRepository(repoConfig, skipClone) {
  // Check new location first
  let repoPath = path.join(REPOS_DIR, repoConfig.testDir);
  
  // Check legacy location (for existing repos)
  if (!(await fs.pathExists(repoPath))) {
    const legacyPath = path.join(LEGACY_REPOS_DIR, repoConfig.testDir);
    if (await fs.pathExists(legacyPath)) {
      repoPath = legacyPath;
      console.log(chalk.gray(`  ✓ Found repository in legacy location: ${repoConfig.testDir}`));
    }
  }
  
  if (await fs.pathExists(repoPath)) {
    console.log(chalk.gray(`  ✓ Repository already exists: ${repoConfig.testDir}`));
    return repoPath;
  }
  
  if (skipClone) {
    console.log(chalk.yellow(`  ⚠ Repository not found and --skip-clone is set: ${repoConfig.testDir}`));
    return null;
  }
  
  console.log(chalk.blue(`  📥 Cloning ${repoConfig.name}...`));
  try {
    await fs.ensureDir(REPOS_DIR);
    const originalCwd = process.cwd();
    try {
      process.chdir(REPOS_DIR);
      execSync(repoConfig.cloneCommand, { stdio: 'inherit' });
      console.log(chalk.green(`  ✓ Cloned ${repoConfig.name}`));
      return repoPath;
    } finally {
      process.chdir(originalCwd); // Always restore original directory
    }
  } catch (error) {
    console.error(chalk.red(`  ✗ Failed to clone ${repoConfig.name}: ${error.message}`));
    return null;
  }
}

/**
 * Test a single repository
 */
async function testRepository(repoConfig, options) {
  console.log(chalk.blue(`\n${'='.repeat(60)}`));
  console.log(chalk.blue.bold(`\n🧪 Testing: ${repoConfig.name}`));
  console.log(chalk.gray(`   Category: ${repoConfig.category}`));
  console.log(chalk.gray(`   Focus: ${repoConfig.focusArea}`));
  console.log(chalk.blue(`${'='.repeat(60)}\n`));
  
  const repoPath = await cloneRepository(repoConfig, options.skipClone);
  if (!repoPath) {
    return {
      repo: repoConfig.name,
      status: 'skipped',
      error: 'Repository not found or clone failed'
    };
  }
  
  const results = {
    repo: repoConfig.name,
    category: repoConfig.category,
    url: `https://github.com/${repoConfig.org}/${repoConfig.repo}`,
    focusArea: repoConfig.focusArea,
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Count components
    console.log(chalk.blue('📊 Analyzing repository...'));
    const { fileCount, componentCount } = await countComponents(repoPath);
    results.files = fileCount;
    results.components = componentCount;
    console.log(chalk.green(`  ✓ Found ${fileCount} JSX/TSX files`));
    console.log(chalk.green(`  ✓ Found ${componentCount} components`));
    
    if (componentCount < 100) {
      console.log(chalk.yellow(`  ⚠ Component count (${componentCount}) is below 100`));
      results.warning = 'Component count below 100';
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
    
    results.selectors = Object.keys(codeMap).length;
    results.processingTime = duration / 1000;
    console.log(chalk.green(`  ✓ Generated code map in ${results.processingTime.toFixed(2)}s`));
    console.log(chalk.green(`  ✓ Extracted ${results.selectors} selectors`));
    
    // Validate accuracy
    console.log(chalk.blue('\n✅ Validating accuracy...'));
    const { validSelectors, invalidSelectors, accuracy, total, sampled, errors } = await validateAccuracy(codeMap, repoPath);
    
    results.accuracy = {
      percentage: accuracy,
      valid: validSelectors,
      invalid: invalidSelectors,
      sampled: sampled,
      total: total,
      errors: errors.slice(0, 10) // Keep first 10 errors
    };
    
    console.log(chalk.green(`  ✓ Valid selectors: ${validSelectors}/${sampled}`));
    if (invalidSelectors > 0) {
      console.log(chalk.yellow(`  ⚠ Invalid selectors: ${invalidSelectors}/${sampled}`));
    }
    console.log(chalk.green(`  ✓ Accuracy: ${accuracy.toFixed(2)}% (validated ${sampled} of ${total} selectors)`));
    
    if (accuracy >= 95) {
      console.log(chalk.green(`  ✓ Meets 95%+ accuracy criteria`));
      results.meetsAccuracyCriteria = true;
    } else {
      console.log(chalk.yellow(`  ⚠ Accuracy (${accuracy.toFixed(2)}%) is below 95%`));
      results.meetsAccuracyCriteria = false;
    }
    
    // Save per-repo results
    const resultsPath = path.join(repoPath, 'results.json');
    await fs.writeJSON(resultsPath, results, { spaces: 2 });
    console.log(chalk.green(`\n✓ Results saved to: ${resultsPath}`));
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Error testing ${repoConfig.name}: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    results.status = 'error';
    results.error = error.message;
  }
  
  return results;
}

/**
 * Generate aggregate report
 */
async function generateAggregateReport(allResults) {
  const aggregate = {
    timestamp: new Date().toISOString(),
    totalRepos: allResults.length,
    completed: allResults.filter(r => r.status === 'completed').length,
    skipped: allResults.filter(r => r.status === 'skipped').length,
    errors: allResults.filter(r => r.status === 'error').length,
    results: allResults
  };
  
  // Calculate aggregate metrics
  const completedResults = allResults.filter(r => r.status === 'completed');
  if (completedResults.length > 0) {
    const totalFiles = completedResults.reduce((sum, r) => sum + (r.files || 0), 0);
    const totalComponents = completedResults.reduce((sum, r) => sum + (r.components || 0), 0);
    const totalSelectors = completedResults.reduce((sum, r) => sum + (r.selectors || 0), 0);
    const totalValidSelectors = completedResults.reduce((sum, r) => sum + (r.accuracy?.valid || 0), 0);
    const totalInvalidSelectors = completedResults.reduce((sum, r) => sum + (r.accuracy?.invalid || 0), 0);
    const totalSampled = completedResults.reduce((sum, r) => sum + (r.accuracy?.sampled || 0), 0);
    const totalProcessingTime = completedResults.reduce((sum, r) => sum + (r.processingTime || 0), 0);
    
    aggregate.metrics = {
      totalFiles,
      totalComponents,
      totalSelectors,
      totalValidSelectors,
      totalInvalidSelectors,
      totalSampled,
      overallAccuracy: totalSampled > 0 ? (totalValidSelectors / totalSampled) * 100 : 0,
      averageAccuracy: completedResults.reduce((sum, r) => sum + (r.accuracy?.percentage || 0), 0) / completedResults.length,
      totalProcessingTime,
      averageProcessingTime: totalProcessingTime / completedResults.length,
      reposMeetingAccuracyCriteria: completedResults.filter(r => r.meetsAccuracyCriteria === true).length,
      reposBelowAccuracyCriteria: completedResults.filter(r => r.meetsAccuracyCriteria === false).length
    };
  }
  
  // Error pattern analysis
  const allErrors = [];
  completedResults.forEach(result => {
    if (result.accuracy?.errors) {
      result.accuracy.errors.forEach(err => {
        allErrors.push({
          repo: result.repo,
          selector: err.selector,
          file: err.file,
          line: err.line,
          reason: err.reason
        });
      });
    }
  });
  
  aggregate.errorPatterns = {
    totalErrors: allErrors.length,
    errorsByType: {},
    errorsByRepo: {},
    commonErrors: allErrors.slice(0, 20)
  };
  
  // Group errors by reason type
  allErrors.forEach(err => {
    const reasonType = err.reason.split(' - ')[0] || err.reason.split(':')[0] || 'Unknown';
    aggregate.errorPatterns.errorsByType[reasonType] = 
      (aggregate.errorPatterns.errorsByType[reasonType] || 0) + 1;
    
    // Group by repo
    if (!aggregate.errorPatterns.errorsByRepo[err.repo]) {
      aggregate.errorPatterns.errorsByRepo[err.repo] = 0;
    }
    aggregate.errorPatterns.errorsByRepo[err.repo]++;
  });
  
  // Accuracy by selector type
  const selectorTypeBreakdown = {
    classSelectors: { valid: 0, invalid: 0 },
    idSelectors: { valid: 0, invalid: 0 },
    dataAttributes: { valid: 0, invalid: 0 },
    elementTypes: { valid: 0, invalid: 0 }
  };
  
  allErrors.forEach(err => {
    if (err.selector.startsWith('.')) {
      selectorTypeBreakdown.classSelectors.invalid++;
    } else if (err.selector.startsWith('#')) {
      selectorTypeBreakdown.idSelectors.invalid++;
    } else if (err.selector.startsWith('[')) {
      selectorTypeBreakdown.dataAttributes.invalid++;
    } else {
      selectorTypeBreakdown.elementTypes.invalid++;
    }
  });
  
  // Count valid selectors by type (approximate from sampled)
  completedResults.forEach(result => {
    if (result.accuracy?.errors) {
      const validCount = result.accuracy.valid;
      const invalidCount = result.accuracy.invalid;
      // Estimate based on error types
      const elementErrors = result.accuracy.errors.filter(e => !e.selector.startsWith('.') && !e.selector.startsWith('#') && !e.selector.startsWith('[')).length;
      selectorTypeBreakdown.elementTypes.valid += validCount - elementErrors;
      selectorTypeBreakdown.elementTypes.invalid += elementErrors;
    }
  });
  
  aggregate.selectorTypeBreakdown = selectorTypeBreakdown;
  
  return aggregate;
}

/**
 * Print summary report
 */
function printSummary(aggregate) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('📊 AGGREGATE TEST RESULTS'));
  console.log(chalk.blue('='.repeat(60) + '\n'));
  
  console.log(chalk.green(`✓ Completed: ${aggregate.completed}/${aggregate.totalRepos} repositories`));
  if (aggregate.skipped > 0) {
    console.log(chalk.yellow(`⚠ Skipped: ${aggregate.skipped}`));
  }
  if (aggregate.errors > 0) {
    console.log(chalk.red(`✗ Errors: ${aggregate.errors}`));
  }
  
  if (aggregate.metrics) {
    console.log(chalk.blue('\n📈 Aggregate Metrics:'));
    console.log(chalk.green(`  ✓ Total Files: ${aggregate.metrics.totalFiles.toLocaleString()}`));
    console.log(chalk.green(`  ✓ Total Components: ${aggregate.metrics.totalComponents.toLocaleString()}`));
    console.log(chalk.green(`  ✓ Total Selectors: ${aggregate.metrics.totalSelectors.toLocaleString()}`));
    console.log(chalk.green(`  ✓ Overall Accuracy: ${aggregate.metrics.overallAccuracy.toFixed(2)}%`));
    console.log(chalk.green(`  ✓ Average Accuracy: ${aggregate.metrics.averageAccuracy.toFixed(2)}%`));
    console.log(chalk.green(`  ✓ Total Processing Time: ${aggregate.metrics.totalProcessingTime.toFixed(2)}s`));
    console.log(chalk.green(`  ✓ Average Processing Time: ${aggregate.metrics.averageProcessingTime.toFixed(2)}s`));
    console.log(chalk.green(`  ✓ Repos Meeting 95%+ Criteria: ${aggregate.metrics.reposMeetingAccuracyCriteria}/${aggregate.completed}`));
    if (aggregate.metrics.reposBelowAccuracyCriteria > 0) {
      console.log(chalk.yellow(`  ⚠ Repos Below 95% Criteria: ${aggregate.metrics.reposBelowAccuracyCriteria}/${aggregate.completed}`));
    }
  }
  
  if (aggregate.errorPatterns && aggregate.errorPatterns.totalErrors > 0) {
    console.log(chalk.blue('\n🔍 Error Pattern Analysis:'));
    console.log(chalk.yellow(`  Total Errors: ${aggregate.errorPatterns.totalErrors}`));
    console.log(chalk.yellow('  Errors by Type:'));
    Object.entries(aggregate.errorPatterns.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(chalk.gray(`    - ${type}: ${count}`));
      });
    
    if (Object.keys(aggregate.errorPatterns.errorsByRepo).length > 0) {
      console.log(chalk.yellow('\n  Errors by Repository:'));
      Object.entries(aggregate.errorPatterns.errorsByRepo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([repo, count]) => {
          console.log(chalk.gray(`    - ${repo}: ${count} errors`));
        });
    }
  }
  
  if (aggregate.selectorTypeBreakdown) {
    console.log(chalk.blue('\n📊 Selector Type Breakdown:'));
    const breakdown = aggregate.selectorTypeBreakdown;
    Object.entries(breakdown).forEach(([type, stats]) => {
      const total = stats.valid + stats.invalid;
      const accuracy = total > 0 ? (stats.valid / total) * 100 : 0;
      const typeName = type.replace(/([A-Z])/g, ' $1').trim();
      if (total > 0) {
        console.log(chalk.gray(`  ${typeName}: ${stats.valid}/${total} valid (${accuracy.toFixed(1)}%)`));
      }
    });
  }
  
  // Per-repo summary
  if (aggregate.results && aggregate.results.length > 0) {
    console.log(chalk.blue('\n📋 Per-Repository Summary:'));
    aggregate.results.forEach(result => {
      if (result.status === 'completed') {
        const statusIcon = result.meetsAccuracyCriteria ? '✓' : '⚠';
        const statusColor = result.meetsAccuracyCriteria ? chalk.green : chalk.yellow;
        console.log(statusColor(`  ${statusIcon} ${result.repo}: ${result.accuracy?.percentage.toFixed(2) || 'N/A'}% accuracy (${result.components || 0} components, ${result.selectors || 0} selectors)`));
      } else if (result.status === 'skipped') {
        console.log(chalk.yellow(`  ⏭ ${result.repo}: Skipped`));
      } else if (result.status === 'error') {
        console.log(chalk.red(`  ✗ ${result.repo}: Error - ${result.error || 'Unknown error'}`));
      }
    });
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60)));
  const relativePath = path.relative(process.cwd(), AGGREGATE_RESULTS_FILE);
  console.log(chalk.green(`✓ Aggregate results saved to: ${relativePath}`));
  console.log(chalk.blue('='.repeat(60) + '\n'));
}

/**
 * Main execution
 */
async function main() {
  // Verify we can find required modules
  try {
    require('../generate');
    require('./test-large-codebase-helpers');
  } catch (error) {
    console.error(chalk.red('✗ Error: Cannot find required modules.'));
    console.error(chalk.yellow('  Make sure you are running from the project root directory.'));
    console.error(chalk.gray(`  Current directory: ${process.cwd()}`));
    console.error(chalk.gray(`  Script location: ${__dirname}`));
    process.exit(1);
  }
  
  program
    .name('test-all-repos')
    .description('Automated testing script for all repositories')
    .option('--repo <name>', 'Test specific repository (by name)')
    .option('--skip-clone', 'Skip cloning, use existing repositories')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      console.log(chalk.blue.bold('\n🚀 Automated Repository Testing\n'));
      
      let reposToTest = REPOSITORIES;
      
      // Filter to specific repo if requested
      if (options.repo) {
        reposToTest = REPOSITORIES.filter(r => 
          r.name.toLowerCase().includes(options.repo.toLowerCase()) ||
          r.testDir.toLowerCase().includes(options.repo.toLowerCase())
        );
        
        if (reposToTest.length === 0) {
          console.error(chalk.red(`✗ No repository found matching: ${options.repo}`));
          process.exit(1);
        }
      }
      
      console.log(chalk.blue(`Testing ${reposToTest.length} repository/repositories...\n`));
      
      const allResults = [];
      
      for (const repoConfig of reposToTest) {
        if (repoConfig.skip) {
          console.log(chalk.yellow(`\n⏭ Skipping ${repoConfig.name} (marked as skip)`));
          continue;
        }
        
        const result = await testRepository(repoConfig, options);
        allResults.push(result);
      }
      
      // Generate aggregate report
      const aggregate = await generateAggregateReport(allResults);
      await fs.writeJSON(AGGREGATE_RESULTS_FILE, aggregate, { spaces: 2 });
      
      // Print summary
      printSummary(aggregate);
      
      // Exit with appropriate code
      const hasErrors = aggregate.errors > 0;
      const lowAccuracy = aggregate.metrics && aggregate.metrics.averageAccuracy < 95;
      
      if (hasErrors || lowAccuracy) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  
  program.parse(process.argv);
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = { testRepository, generateAggregateReport };

