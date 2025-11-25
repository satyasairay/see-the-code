# Large Codebase Testing Plan

**Objective:** Validate code map generator accuracy across 10 diverse React repositories to identify root causes and patterns.

**Status:** Planning Phase  
**Created:** 2024

---

## Testing Strategy

### Goals
1. **Statistical Significance:** Test 10+ repos with 10,000+ components total
2. **Pattern Detection:** Identify if accuracy issues are universal or repo-specific
3. **Edge Case Discovery:** Find issues across different frameworks, patterns, and coding styles
4. **Root Cause Analysis:** Determine if failures cluster by selector type or code pattern

### Methodology
- Clone each repository (shallow clone, depth=1)
- Run code map generator on each
- Validate accuracy using real validation (checks if selectors exist in code)
- Aggregate results and analyze patterns
- Generate comprehensive report

---

## Repository Selection

### Criteria
- ✅ Large React codebase (100+ components)
- ✅ Diverse frameworks/patterns
- ✅ Well-maintained, active projects
- ✅ Different use cases (admin, UI library, framework, etc.)
- ✅ Mix of TypeScript and JavaScript

### Selected Repositories

#### 1. **Next.js** (Framework)
- **Repository:** `vercel/next.js`
- **Category:** Full-stack React framework
- **Why:** Modern React patterns, App Router, Server Components, RSC
- **Focus Area:** `examples/` directory
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/vercel/next.js.git nextjs-test
  cd nextjs-test/examples
  ```
- **Expected Patterns:** Server components, client components, routing patterns

#### 2. **Material-UI (MUI)** (Component Library)
- **Repository:** `mui/material-ui`
- **Category:** Enterprise UI component library
- **Why:** Large component library, many examples, TypeScript-heavy
- **Focus Area:** Component demos and examples
- **Clone Command:**
  ```bash
  git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test
  ```
- **Expected Patterns:** Complex components, styled components, theme system

#### 3. **React Admin** (Admin Framework) ✅ TESTED
- **Repository:** `marmelab/react-admin`
- **Category:** Admin dashboard framework
- **Status:** ✅ Already tested (baseline: 72% accuracy)
- **Results:** See `FINDINGS.md`
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/marmelab/react-admin.git react-admin-test
  ```

#### 4. **Gatsby** (Static Site Generator)
- **Repository:** `gatsbyjs/gatsby`
- **Category:** Static site generator
- **Why:** Different patterns, GraphQL, plugins, page generation
- **Focus Area:** `examples/` or `packages/`
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/gatsbyjs/gatsby.git gatsby-test
  ```
- **Expected Patterns:** Page components, GraphQL queries, plugin patterns

#### 5. **Remix** (Full-Stack Framework)
- **Repository:** `remix-run/remix`
- **Category:** Full-stack React framework
- **Why:** Different architecture, loader patterns, form handling
- **Focus Area:** Examples or templates
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/remix-run/remix.git remix-test
  ```
- **Expected Patterns:** Loaders, actions, nested routes, form patterns

#### 6. **React Router** (Routing Library)
- **Repository:** `remix-run/react-router`
- **Category:** Routing library
- **Why:** Router-specific patterns, nested routes, navigation
- **Focus Area:** Examples
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/remix-run/react-router.git react-router-test
  ```
- **Expected Patterns:** Route components, navigation, nested layouts

#### 7. **React Hook Form** (Form Library)
- **Repository:** `react-hook-form/react-hook-form`
- **Category:** Form management library
- **Why:** Form-heavy, many input components, validation patterns
- **Focus Area:** Examples
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/react-hook-form/react-hook-form.git react-hook-form-test
  ```
- **Expected Patterns:** Form inputs, validation, dynamic forms

#### 8. **Storybook** (Component Development)
- **Repository:** `storybookjs/storybook`
- **Category:** Component development tool
- **Why:** Complex component patterns, addons, examples
- **Focus Area:** Examples or UI components
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/storybookjs/storybook.git storybook-test
  ```
- **Expected Patterns:** Story components, addon patterns, complex UIs

#### 9. **TanStack Query (React Query)** (Data Fetching)
- **Repository:** `TanStack/query`
- **Category:** Data fetching library
- **Why:** Data fetching patterns, hooks, cache management
- **Focus Area:** Examples
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/TanStack/query.git tanstack-query-test
  ```
- **Expected Patterns:** Query hooks, mutation patterns, data display

#### 10. **Ant Design** (Enterprise UI Library)
- **Repository:** `ant-design/ant-design`
- **Category:** Enterprise UI component library
- **Why:** Large component library, TypeScript, complex components, Chinese codebase patterns
- **Focus Area:** Components directory
- **Clone Command:**
  ```bash
  git clone --depth 1 https://github.com/ant-design/ant-design.git ant-design-test
  ```
- **Expected Patterns:** Complex enterprise components, TypeScript patterns

---

## Alternative Repositories (Backup)

If any primary repo is too large or has issues:

1. **RedwoodJS** (`redwoodjs/redwood`) - Full-stack framework
2. **React Native Web** (`necolas/react-native-web`) - Cross-platform
3. **Chakra UI** (`chakra-ui/chakra-ui`) - Component library
4. **React Bootstrap** (`react-bootstrap/react-bootstrap`) - Bootstrap components
5. **React DnD** (`react-dnd/react-dnd`) - Drag and drop library

---

## Testing Execution Plan

### Phase 1: Setup (1 hour)
1. Create test directory structure
2. Clone all 10 repositories
3. Verify each repo has sufficient JSX/TSX files
4. Set up automated testing script

### Phase 2: Execution (2-3 hours)
1. Run code map generator on each repo
2. Run accuracy validation on each
3. Collect metrics:
   - Files processed
   - Components found
   - Selectors extracted
   - Accuracy percentage
   - Processing time
   - Error samples

### Phase 3: Analysis (1-2 hours)
1. Aggregate results across all repos
2. Identify patterns:
   - Accuracy by repo
   - Accuracy by selector type
   - Common error patterns
   - Framework-specific issues
3. Generate comprehensive report

### Phase 4: Root Cause Analysis (1 hour)
1. Analyze failure patterns
2. Identify root causes
3. Prioritize fixes
4. Document findings

---

## Expected Metrics

### Per Repository
- Files processed
- Components found
- Selectors extracted
- Accuracy percentage
- Processing time
- Error breakdown by type

### Aggregate
- Total files: ~10,000+
- Total components: ~10,000+
- Total selectors: ~15,000+
- Overall accuracy: TBD
- Processing time: TBD

---

## Success Criteria

### Minimum Requirements
- ✅ Test 10 diverse repositories
- ✅ Validate 100+ selectors per repo (sampled)
- ✅ Collect accuracy metrics
- ✅ Identify error patterns
- ✅ Generate comprehensive report

### Analysis Goals
- Identify if 72% accuracy is consistent
- Determine if failures cluster by selector type
- Find if React component names are the main issue
- Discover any other patterns causing failures

---

## Automation Script

### Script: `test-all-repos.js` ✅ CREATED

**Location:** `cli/__tests__/test-all-repos.js`

**Features:**
- ✅ Clone repositories (if not exists)
- ✅ Run code map generation
- ✅ Run accuracy validation
- ✅ Collect metrics
- ✅ Generate aggregate report
- ✅ Export results to JSON (`aggregate-results.json`)
- ✅ Per-repo results saved to `repos/[repo-name]/results.json`

**Usage:**
```bash
# Test all repositories
node cli/__tests__/test-all-repos.js

# Test specific repository
node cli/__tests__/test-all-repos.js --repo nextjs

# Skip cloning (use existing repos)
node cli/__tests__/test-all-repos.js --skip-clone

# Verbose output
node cli/__tests__/test-all-repos.js --verbose
```

**Output:**
- Per-repo: `cli/__tests__/repos/[repo-name]/results.json`
- Aggregate: `cli/__tests__/aggregate-results.json`
- Console: Summary report with metrics and error patterns

---

## Output Structure

### Per-Repository Results
```
cli/__tests__/
  ├── repos/
  │   ├── nextjs-test/
  │   │   ├── code-map.json
  │   │   └── results.json
  │   ├── material-ui-test/
  │   │   ├── code-map.json
  │   │   └── results.json
  │   └── ...
  └── aggregate-results.json
```

### Aggregate Report
- Overall statistics
- Per-repo breakdown
- Error pattern analysis
- Root cause identification
- Recommendations

---

## Timeline

- **Setup:** 1 hour
- **Execution:** 2-3 hours (can run in parallel)
- **Analysis:** 1-2 hours
- **Total:** 4-6 hours

---

## Notes

- Use shallow clones (`--depth 1`) to save time and disk space
- Focus on `examples/` or `packages/` directories for most repos
- Sample 100-200 selectors per repo for validation (performance)
- Keep original test results for comparison after fixes

---

## Next Steps

1. ✅ Create testing plan (this document)
2. ⏳ Create automated testing script
3. ⏳ Execute tests on all 10 repositories
4. ⏳ Generate aggregate report
5. ⏳ Analyze results and identify root causes
6. ⏳ Implement fixes based on findings
7. ⏳ Re-test to validate improvements

---

## Testing Prompt Template

Use this prompt template to test each repository. Copy-paste and replace placeholders with actual repo details.

### Prompt Template

```
Execute a complete end-to-end test of the code map generator against [REPO_NAME] repository.

**Repository Details:**
- **Name:** [REPO_NAME]
- **GitHub URL:** https://github.com/[ORG]/[REPO]
- **Category:** [CATEGORY] (e.g., Framework, Component Library, Admin Framework)
- **Clone Command:** [CLONE_COMMAND]
- **Focus Area:** [FOCUS_AREA] (e.g., examples/, packages/, src/)

**Test Requirements:**

1. **Repository Setup:**
   - Clone the repository to `cli/__tests__/repos/[REPO_NAME]-test` using the provided clone command
   - Verify the repository has sufficient JSX/TSX files (100+ components expected)
   - If the repo is too large, focus on the specified focus area

2. **Code Map Generation:**
   - Run the code map generator on the repository
   - Use workspace root as the cloned repository directory
   - Generate `code-map.json` in the repository root
   - Capture all output including:
     - Files processed count
     - Components found count
     - Selectors extracted count
     - Processing time
     - Any errors or warnings

3. **Accuracy Validation:**
   - Run real accuracy validation (not just file path checks)
   - Sample at least 100 selectors for validation
   - Verify selectors actually exist in code at specified line numbers
   - Collect error samples (first 10 errors)
   - Calculate true accuracy percentage

4. **Results Documentation:**
   - Update `cli/__tests__/FINDINGS.md` with a new section for this repository
   - Include:
     - Repository statistics (files, components, selectors)
     - Accuracy results (valid/invalid selectors, percentage)
     - Processing time
     - Error breakdown by type
     - Sample errors (first 5-10)
     - Success criteria status
     - Any repo-specific findings or patterns
   - Format the section consistently with existing findings

5. **Analysis:**
   - Identify any repo-specific patterns or issues
   - Note if accuracy is consistent with baseline (72% from react-admin)
   - Document any unique edge cases discovered
   - Compare error patterns with other tested repositories

**Expected Deliverables:**
- ✅ Cloned repository in `cli/__tests__/repos/[REPO_NAME]-test`
- ✅ Generated `code-map.json` in repository root
- ✅ Updated `FINDINGS.md` with comprehensive test results
- ✅ Summary of findings and any patterns discovered

**Constraints:**
- Do NOT modify any existing code (parser, generator, etc.)
- Only run tests and document findings
- Use shallow clones (--depth 1) to save time and disk space
- If repository is extremely large (>5000 files), focus on examples/ or specific subdirectory

**Success Criteria:**
- Repository successfully cloned and processed
- Code map generated without crashes
- Accuracy validation completed
- Findings documented in FINDINGS.md
- Any patterns or issues identified and documented

Execute this test end-to-end and provide a summary of results.
```

### Example Usage

**For Next.js:**
```
Execute a complete end-to-end test of the code map generator against Next.js repository.

**Repository Details:**
- **Name:** Next.js
- **GitHub URL:** https://github.com/vercel/next.js
- **Category:** Full-stack React framework
- **Clone Command:** git clone --depth 1 https://github.com/vercel/next.js.git nextjs-test
- **Focus Area:** examples/ directory

[... rest of prompt ...]
```

**For Material-UI:**
```
Execute a complete end-to-end test of the code map generator against Material-UI repository.

**Repository Details:**
- **Name:** Material-UI (MUI)
- **GitHub URL:** https://github.com/mui/material-ui
- **Category:** Enterprise UI component library
- **Clone Command:** git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test
- **Focus Area:** Component demos and examples

[... rest of prompt ...]
```

### Quick Reference: Repository Details

Copy these details into the prompt template:

| Repo | Name | URL | Category | Clone Command | Focus Area |
|------|------|-----|----------|---------------|------------|
| 1 | Next.js | `vercel/next.js` | Framework | `git clone --depth 1 https://github.com/vercel/next.js.git nextjs-test` | `examples/` |
| 2 | Material-UI | `mui/material-ui` | Component Library | `git clone --depth 1 --branch master https://github.com/mui/material-ui.git material-ui-test` | Component demos |
| 3 | React Admin | `marmelab/react-admin` | Admin Framework | `git clone --depth 1 https://github.com/marmelab/react-admin.git react-admin-test` | ✅ Tested |
| 4 | Gatsby | `gatsbyjs/gatsby` | Static Site Generator | `git clone --depth 1 https://github.com/gatsbyjs/gatsby.git gatsby-test` | `examples/` or `packages/` |
| 5 | Remix | `remix-run/remix` | Full-Stack Framework | `git clone --depth 1 https://github.com/remix-run/remix.git remix-test` | Examples or templates |
| 6 | React Router | `remix-run/react-router` | Routing Library | `git clone --depth 1 https://github.com/remix-run/react-router.git react-router-test` | Examples |
| 7 | React Hook Form | `react-hook-form/react-hook-form` | Form Library | `git clone --depth 1 https://github.com/react-hook-form/react-hook-form.git react-hook-form-test` | Examples |
| 8 | Storybook | `storybookjs/storybook` | Component Dev Tool | `git clone --depth 1 https://github.com/storybookjs/storybook.git storybook-test` | Examples or UI components |
| 9 | TanStack Query | `TanStack/query` | Data Fetching | `git clone --depth 1 https://github.com/TanStack/query.git tanstack-query-test` | Examples |
| 10 | Ant Design | `ant-design/ant-design` | Enterprise UI Library | `git clone --depth 1 https://github.com/ant-design/ant-design.git ant-design-test` | Components directory |

---

## Related Documents

- `FINDINGS.md` - React Admin test results (baseline)
- `README-testing.md` - Testing instructions
- `test-large-codebase.js` - Testing script
- `TESTING_INDEX.md` - Navigation hub for all testing docs

