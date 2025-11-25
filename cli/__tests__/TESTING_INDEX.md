# Testing Documentation Index

This directory contains all testing documentation and results for the code map generator.

## Quick Navigation

### 📋 Planning & Strategy
- **[large_codebase_testing_plan.md](./large_codebase_testing_plan.md)** - Comprehensive plan for testing 10 diverse React repositories

### 📊 Test Results
- **[FINDINGS.md](./FINDINGS.md)** - React Admin test results (baseline: 72% accuracy)
- **aggregate-results.json** - Combined results from all repository tests (when available)

### 🛠️ Testing Tools
- **[test-large-codebase.js](./test-large-codebase.js)** - Automated testing script for large codebases
- **[README-testing.md](./README-testing.md)** - Quick start guide for testing

### 📁 Test Data
- **repos/** - Cloned test repositories
- **fixtures/** - Test fixtures for unit tests

---

## Testing Status

### ✅ Completed
- React Admin (marmelab/react-admin)
  - **Accuracy:** 72.00%
  - **Files:** 1,108
  - **Components:** 1,033
  - **Selectors:** 1,346
  - **See:** [FINDINGS.md](./FINDINGS.md)

### ⏳ Planned
- Next.js
- Material-UI
- Gatsby
- Remix
- React Router
- React Hook Form
- Storybook
- TanStack Query
- Ant Design

**See:** [large_codebase_testing_plan.md](./large_codebase_testing_plan.md) for full list

---

## How to Run Tests

### Single Repository
```bash
node cli/__tests__/test-large-codebase.js cli/__tests__/repos/react-admin-test
```

### All Repositories (when script is ready)
```bash
node cli/__tests__/test-all-repos.js
```

---

## Document Structure Decision

**Decision:** Keep documents separate but organized with this index.

**Rationale:**
- ✅ **FINDINGS.md** - Specific to one test run, will be updated per repo
- ✅ **large_codebase_testing_plan.md** - Master plan, reference document
- ✅ **TESTING_INDEX.md** - Navigation hub (this file)
- ✅ **README-testing.md** - Quick reference guide

**Benefits:**
- Easy to find specific test results
- Plan document stays clean and focused
- Can add per-repo findings without cluttering
- Index provides navigation

---

## Contributing

When adding new test results:
1. Update this index
2. Add findings to appropriate document
3. Update aggregate results if applicable

