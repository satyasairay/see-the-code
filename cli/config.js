// config handling

const path = require('path');
const fs = require('fs-extra');

const DEFAULT_CONFIG = {
  input: ['./src'],
  output: './code-map.json',
  ignore: [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.git',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  include: ['*.tsx', '*.jsx', '*.html'],
  workspaceRoot: './',
  options: {
    extractElementTypes: true,
    extractDataAttributes: true,
    handleDynamicClasses: false,
    warnOnDuplicates: true,
    includeHashes: false
  },
  verbose: false
};

async function loadConfig(cliOptions = {}) {
  const configPath = path.resolve('.see-the-code.json');
  let fileConfig = {};

  // load config file if it exists
  if (await fs.pathExists(configPath)) {
    try {
      fileConfig = await fs.readJSON(configPath);
    } catch (error) {
      console.warn(`Warning: Could not parse .see-the-code.json: ${error.message}`);
    }
  }

  // merge: CLI > file > defaults
  const config = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...cliOptions
  };

  // normalize paths
  if (Array.isArray(config.input)) {
    config.input = config.input.map(p => path.resolve(p));
  } else {
    config.input = [path.resolve(config.input)];
  }

  // workspace root should be project root, not cli dir
  if (config.workspaceRoot && path.isAbsolute(config.workspaceRoot)) {
    config.workspaceRoot = path.resolve(config.workspaceRoot);
  } else {
    // default to project root (one level up from cli)
    const cliDir = __dirname;
    const projectRoot = path.resolve(cliDir, '..');
    config.workspaceRoot = path.resolve(projectRoot, config.workspaceRoot || './');
  }
  
  if (path.isAbsolute(config.output)) {
    config.output = path.resolve(config.output);
  } else {
    const projectRoot = path.resolve(__dirname, '..');
    config.output = path.resolve(projectRoot, config.output);
  }

  if (cliOptions.hash) {
    config.options.includeHashes = true;
  }

  if (cliOptions.verbose) {
    config.verbose = true;
  }

  return config;
}

module.exports = { loadConfig, DEFAULT_CONFIG };

