// file discovery and utils

const { glob } = require('glob');
const path = require('path');
const fs = require('fs-extra');

async function discoverFiles(config) {
  const files = new Set();
  const includePatterns = config.include || ['*.tsx', '*.jsx', '*.html'];
  const ignorePatterns = config.ignore || [];

  for (const inputPath of config.input) {
    if (!(await fs.pathExists(inputPath))) {
      console.warn(`Warning: Input path does not exist: ${inputPath}`);
      continue;
    }

    const stat = await fs.stat(inputPath);
    
    if (stat.isFile()) {
      files.add(path.resolve(inputPath));
    } else if (stat.isDirectory()) {
      // search directory for matching files
      for (const pattern of includePatterns) {
        const globPattern = path.join(inputPath, '**', pattern).replace(/\\/g, '/');
        const matches = await glob(globPattern, {
          ignore: ignorePatterns,
          absolute: true,
          nodir: true
        });
        
        matches.forEach(file => files.add(file));
      }
    }
  }

  return Array.from(files).sort();
}

function getRelativePath(filePath, workspaceRoot) {
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

async function readFile(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

function hashContent(content) {
  // simple hash - could use crypto.createHash('sha256') if needed
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // convert to 32bit int
  }
  return Math.abs(hash).toString(16);
}

module.exports = {
  discoverFiles,
  getRelativePath,
  readFile,
  hashContent
};

