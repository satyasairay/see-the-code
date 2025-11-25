# Development Setup

## Prerequisites

- Node.js 14+ 
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/satyasairay/see-the-code.git
cd see-the-code
```

2. Install dependencies:
```bash
# Root dependencies (if any)
npm install

# CLI dependencies
cd cli
npm install
cd ..
```

## Development Tools

### Code Quality

The project uses ESLint and Prettier for code quality:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks (Optional)

To enable pre-commit hooks that automatically lint and format code:

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install

# The pre-commit hook is already configured in .husky/pre-commit
```

Now, every commit will automatically:
- Run ESLint and fix issues
- Format code with Prettier

### Testing

```bash
# Run CLI tests
npm run test:cli

# Generate code map for demo
npm run test
```

## Project Structure

```
see-the-code/
├── cli/              # Code map generator CLI
│   ├── parser/       # AST parsers
│   ├── utils/        # Utility functions
│   └── __tests__/    # Test files
├── overlay/          # Browser overlay script
├── demo/             # Demo application
│   └── examples/     # Additional examples
├── docs/             # Documentation
└── package.json      # Root package config
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting: `npm run lint:fix && npm run format`
4. Commit your changes (pre-commit hooks will run automatically if enabled)
5. Push and create a pull request

