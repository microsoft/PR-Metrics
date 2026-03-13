# Codebase Improvement Plan

## Important Notes

### Verification After Every Step

After **every step** in this plan, run:

```bash
npm run lint
npm run test
```

Both must pass cleanly before moving to the next step. The project enforces 100%
code coverage (statements, branches, functions, lines) and strict ESLint rules.
Any failure must be resolved before proceeding.

### User Agent Version String

The hardcoded `userAgent: "PRMetrics/v1.7.12"` in `gitHubReposInvoker.ts` is
updated automatically by the release pipeline via
`.github/workflow-scripts/Update-Version.ps1` (lines 45, 67–68), which also
updates the corresponding test file. Step 6.1 creates a shared
`src/task/src/utilities/version.ts` constant and updates `Update-Version.ps1` to
target this single file instead of the source and test files.

---

## Step 1: Bug / Correctness Fixes [DONE]

### 1.1. Fix `CommentData` Public Underscore-Prefixed Fields [DONE]

**File:** `src/task/src/repos/interfaces/commentData.ts`

Made `_pullRequestComments` and `_fileComments` fields `private readonly`.

### 1.2. Fix Incorrect Type Annotation in `initializeAlwaysCloseComment` [DONE]

**File:** `src/task/src/metrics/inputs.ts`

Removed `| null` from the type annotation since the expression always evaluates
to `boolean`.

---

## Step 2: Redundant Code Removal [DONE]

### 2.1. Deduplicate `codeFileExtensions` [DONE]

**File:** `src/task/src/metrics/inputsDefault.ts`

Removed 7 duplicate entries (`fcgi` x3, `cgi` x1, `h` x1, `inc` x1,
`spec` x1). Added comments noting shared extensions.

### 2.2. Remove Unnecessary `Promise.resolve()` Wrappers [SKIPPED]

The ESLint config enforces `@typescript-eslint/promise-function-async` (adds
`async` to promise-returning methods) alongside `@typescript-eslint/require-await`
(requires await in async methods). Together, these mandate the
`async` + `Promise.resolve()` pattern for synchronous methods that return
promises. No viable simplification.

### 2.3. Remove Unnecessary `else if` After `return` [DONE]

**File:** `src/task/src/utilities/converter.ts`

Replaced `else if` after `return` with a plain `if`.

---

## Step 3: Performance Improvements [DONE]

### 3.1. Hoist Pattern Classification Outside the Per-File Loop [DONE]

**File:** `src/task/src/metrics/codeMetrics.ts`

Moved positive/negative/double-negative pattern classification before the
per-file loop.

### 3.2. Use `minimatch()` Directly Instead of `minimatch.match([])` [DONE]

**File:** `src/task/src/metrics/codeMetrics.ts`

Replaced `minimatch.match([fileName], pattern).length > 0` with
`minimatch(fileName, pattern, options)`. Updated import to use named import.

### 3.3. Short-Circuit Pattern Matching With `.some()` [DONE]

**File:** `src/task/src/metrics/codeMetrics.ts`

Replaced manual loops in `determineIfValidFilePattern` with `.some()`.

### 3.4. Make Access Error Status Codes a Static Field [DONE]

**File:** `src/task/src/repos/baseReposInvoker.ts`

Moved `accessErrorStatusCodes` to a `private static readonly` field.

---

## Step 4: Simplify Data Classes [DONE]

### 4.1. Use `readonly` Fields on Immutable Data Classes [DONE]

- **`CodeMetricsData`**: Replaced 3 private fields + getters with
  `public readonly` fields. Kept `subtotal` and `total` as computed getters.
- **`PullRequestCommentData`**: Replaced 3 private fields + getters with
  `public readonly` fields.
- **`FileCommentData`**: Replaced 1 private field + getter with
  `public readonly` field.

### 4.2. Simplify `PullRequestCommentsData` Getter/Setter Boilerplate [DONE]

**File:** `src/task/src/pullRequests/pullRequestCommentsData.ts`

Replaced 6 private fields with trivial get/set pairs (128 lines) with public
properties (45 lines).

---

## Step 5: Modern Language Features [DONE]

### 5.1. Use `.some()` and `.map()` Instead of Manual Loops [DONE]

- `codeMetrics.ts`: Test file detection → `.some()`.
- `octokitGitDiffParser.ts`: Array building → `.map()`.

### 5.2. Use Ternary for Simple Conditional Assignments [DONE]

**File:** `src/task/src/pullRequests/pullRequestComments.ts`

Replaced `let` + `if` with `const` + ternary.

---

## Step 6: Code Quality / Maintainability [DONE]

### 6.1. Derive User Agent Version Dynamically [DONE]

Created `src/task/src/utilities/version.ts` with a shared version constant.
Updated `gitHubReposInvoker.ts` and its test to import from it. Updated
`.github/workflow-scripts/Update-Version.ps1` to target `version.ts` instead of
the source and test files (removed 2 lines, added 3 lines).

### 6.2. Remove Test-Specific String Handling From Production Code [SKIPPED]

The `\r\nrc:0\r\nsuccess:true` suffix comes from the Azure Pipelines task
library `execSync`, not just test mocks. The production code handling is
necessary. The source comment is misleading but the logic is correct.

### 6.3. Use Array Join for String Building in `getMetricsComment` [SKIPPED]

The string building interleaves with async helpers that each append their own
newlines. Converting to array join would require refactoring all helper methods
for low benefit.

---

## Step 7: Evaluate Dependency Removal (Requires Integration Testing) [TODO]

### 7.1. Assess Whether `isomorphic-fetch` Can Be Removed

**Files:** `package.json`, `src/task/src/repos/gitHubReposInvoker.ts`

The project targets Node 20+ which has native `fetch`. The `isomorphic-fetch`
dependency may be removable, but `azure-devops-node-api` may depend on it
transitively. This requires integration testing on both GitHub Actions and Azure
Pipelines before removal.

**Approach:**

1. Remove the import and dependency.
1. Run `npm run lint` and `npm run test`.
1. Test manually on both platforms via a draft PR if the above passes.
1. Revert if any integration failures occur.
