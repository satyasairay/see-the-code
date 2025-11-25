# Testing Large Codebases

## Quick Start

### 1. Clone a Test Repository

**Recommended: React Admin Demo**
```bash
cd cli/__tests__
git clone --depth 1 https://github.com/marmelab/react-admin.git react-admin-test
```

**Alternative: Material-UI**
```bash
cd cli/__tests__
git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test
```

### 2. Run the Test

```bash
node cli/__tests__/test-large-codebase.js cli/__tests__/react-admin-test
```

## What It Tests

1. **100+ Components**: Counts React components in the codebase
2. **95%+ Accuracy**: Validates that extracted selectors point to valid files
3. **Performance**: Measures processing time
4. **Line Numbers**: Validates line number accuracy

## Expected Results

- ✅ Component count: 100+
- ✅ Accuracy: 95%+
- ✅ All selectors have valid file paths
- ✅ Processing time: < 30s for 1000 files

## Troubleshooting

If accuracy is below 95%:
- Check for file path issues (relative vs absolute)
- Verify workspace root configuration
- Check for symlinks or special file structures

