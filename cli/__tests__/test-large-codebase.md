# Testing Large React Codebases

## Recommended Repositories for Testing

### Option 1: React Admin Demo (Best Choice)
**Repository:** https://github.com/marmelab/react-admin
**Why:** 
- Well-maintained React admin framework
- Contains 100+ components in the demo
- Real-world patterns (forms, tables, filters)
- Good mix of JSX/TSX files

**Clone Command:**
```bash
cd cli/__tests__
git clone --depth 1 https://github.com/marmelab/react-admin.git react-admin-test
```

### Option 2: Material-UI Examples
**Repository:** https://github.com/mui/material-ui
**Why:**
- Large component library
- Many example components
- Well-structured codebase

**Clone Command:**
```bash
cd cli/__tests__
git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test
```

### Option 3: React Boilerplate
**Repository:** https://github.com/react-boilerplate/react-boilerplate
**Why:**
- Production-ready React setup
- Multiple components and patterns
- Good for testing real-world scenarios

**Clone Command:**
```bash
cd cli/__tests__
git clone --depth 1 https://github.com/react-boilerplate/react-boilerplate.git react-boilerplate-test
```

### Option 4: Next.js Examples
**Repository:** https://github.com/vercel/next.js
**Why:**
- Large Next.js codebase
- Many example apps with components
- Modern React patterns

**Clone Command:**
```bash
cd cli/__tests__
git clone --depth 1 https://github.com/vercel/next.js.git nextjs-test
cd nextjs-test/examples
```

## Test Script

Run the test script to validate against a large codebase:

```bash
node cli/__tests__/test-large-codebase.js --repo react-admin-test
```

