# See The Code CLI

Command-line tool for generating `code-map.json` files from source code.

## Installation

```bash
cd cli
npm install
```

## Usage

### Basic Usage

```bash
node generate.js
```

### With Options

```bash
node generate.js --input ./src --output ./code-map.json --verbose
```

### Dry Run (Preview)

```bash
node generate.js --dry-run
```

## Options

- `-i, --input <paths...>` - Input directories or files (comma-separated)
- `-o, --output <file>` - Output file path (default: `./code-map.json`)
- `-v, --verbose` - Verbose output
- `--dry-run` - Print mappings to stdout without writing files
- `--hash` - Include content hashes in output

## Configuration

Create a `.see-the-code.json` file in your project root:

```json
{
  "input": ["./src"],
  "output": "./code-map.json",
  "ignore": ["node_modules", "dist"],
  "include": ["*.tsx", "*.jsx", "*.html"],
  "options": {
    "extractElementTypes": true,
    "extractDataAttributes": true,
    "warnOnDuplicates": true
  }
}
```

## Development

This is the core parser engine implementation (Prompt 1). It includes:

- ✅ File discovery system
- ✅ JSX/TSX parsing with Babel
- ✅ AST-based selector extraction
- ✅ Basic CLI interface
- ✅ Configuration file support

Future enhancements (from other prompts):
- Watch mode
- Validation system
- AI fallback
- Framework-specific optimizations
