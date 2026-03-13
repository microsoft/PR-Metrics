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
updates the corresponding test file. If Step 6.1 changes the source to read the
version dynamically, `Update-Version.ps1` must be adapted to remove the
now-unnecessary source-code replacement (lines 67–68) and any associated test
replacement.

---

## Step 1: Bug / Correctness Fixes

### 1.1. Fix `CommentData` Public Underscore-Prefixed Fields

**File:** `src/task/src/repos/interfaces/commentData.ts`

`_pullRequestComments` and `_fileComments` are declared `public` with `_`
prefixes (private convention) yet also have public getters that return the same
fields. This allows unintended direct mutation from outside the class.

**Change:** Make the fields `private readonly` and initialise them in the
constructor or as field initialisers. The existing getters already provide the
public API.

### 1.2. Fix Incorrect Type Annotation in `initializeAlwaysCloseComment`

**File:** `src/task/src/metrics/inputs.ts:276`

```typescript
const convertedValue: boolean | null =
  alwaysCloseComment?.toLowerCase() === "true";
```

The expression always evaluates to `boolean` (never `null`), because
`undefined === "true"` is `false`. Remove `| null` from the type annotation.

---

## Step 2: Redundant Code Removal

### 2.1. Deduplicate `codeFileExtensions`

**File:** `src/task/src/metrics/inputsDefault.ts:47–222`

Extensions are listed per-language, causing duplicates:

- `"fcgi"`: 4 occurrences (Python, PHP, Shell, Ruby)
- `"cgi"`: 2 occurrences (Python, Shell)
- `"h"`: 2 occurrences (C++, C)
- `"inc"`: 2 occurrences (PHP, C++)
- `"spec"`: 2 occurrences (Python, Ruby)

Since the array is converted to a `Set<string>` at runtime, duplicates are
functionally harmless but add unnecessary source bloat. Remove duplicates and
reorganise with a comment noting that shared extensions appear once under the
first language that uses them.

### 2.2. Remove Unnecessary `Promise.resolve()` Wrappers

**Files:**

- `src/task/src/repos/gitHubReposInvoker.ts:74–80` –
  `isAccessTokenAvailable()` is `async` but wraps returns in
  `Promise.resolve()`. Since `async` functions already wrap return values in a
  promise, return the value directly.
- `src/task/src/runners/azurePipelinesRunnerInvoker.ts:46` – `exec()` is
  `async` but wraps a synchronous result in `Promise.resolve()`. Return the
  object directly.

### 2.3. Remove Unnecessary `else if` After `return`

**File:** `src/task/src/utilities/converter.ts:18–22`

```typescript
if (value === null) {
  return "null";
} else if (typeof value === "undefined") {
```

The `else` is unnecessary after a `return`. Change to a plain `if`.

---

## Step 3: Performance Improvements

### 3.1. Hoist Pattern Classification Outside the Per-File Loop

**File:** `src/task/src/metrics/codeMetrics.ts:194–215`

In `initializeMetrics()`, the file matching patterns are split into
positive/negative/double-negative arrays inside the `for` loop over every file.
Since the classification depends only on the patterns (which don't change per
file), hoist it before the loop.

### 3.2. Use `minimatch()` Directly Instead of `minimatch.match([])`

**File:** `src/task/src/metrics/codeMetrics.ts:277–290`

`performGlobCheck` wraps a single filename in an array and checks
`minimatch.match([fileName], pattern).length > 0`. Use the `minimatch()`
function directly to avoid unnecessary array allocation:

```typescript
private performGlobCheck(fileName: string, fileMatchingPattern: string): boolean {
  return minimatch(fileName, fileMatchingPattern, CodeMetrics._minimatchOptions);
}
```

### 3.3. Short-Circuit Pattern Matching With `.some()`

**File:** `src/task/src/metrics/codeMetrics.ts:248–270`

`determineIfValidFilePattern` iterates through all positive patterns even after
finding a match (no `break`). Replace the manual loops with `.some()` to
short-circuit on first match.

### 3.4. Make Access Error Status Codes a Static Field

**File:** `src/task/src/repos/baseReposInvoker.ts:37–41`

`accessErrorStatusCodes` is allocated as a new array on every call to
`invokeApiCall`. Move it to a `private static readonly` field.

---

## Step 4: Simplify Data Classes

### 4.1. Use `readonly` Fields on Immutable Data Classes

Replace private fields + trivial getters with `public readonly` constructor
parameters on these immutable classes:

- **`CodeMetricsData`** (`src/task/src/metrics/codeMetricsData.ts`): 3 private
  fields + 5 getters. Keep `subtotal` and `total` as computed getters; make
  `productCode`, `testCode`, and `ignoredCode` `public readonly`.
- **`PullRequestCommentData`**
  (`src/task/src/repos/interfaces/pullRequestCommentData.ts`): 3 private fields
  + 3 getters → `public readonly`.
- **`FileCommentData`** (`src/task/src/repos/interfaces/fileCommentData.ts`): 1
  private field + 1 getter → `public readonly`.

### 4.2. Simplify `PullRequestCommentsData` Getter/Setter Boilerplate

**File:** `src/task/src/pullRequests/pullRequestCommentsData.ts`

The class has 6 private fields with trivial get/set pairs that add no logic
(128 lines). Replace with public properties.

---

## Step 5: Modern Language Features

### 5.1. Use `.some()` and `.map()` Instead of Manual Loops

- **`codeMetrics.ts:319–325`**: Test file detection inner loop → `.some()`.
- **`octokitGitDiffParser.ts:117–119`**: Array building with `push` in loop →
  `.map()`.

### 5.2. Use Ternary for Simple Conditional Assignments

**File:** `src/task/src/pullRequests/pullRequestComments.ts:276–279`

```typescript
let surround = "";
if (highlight) {
  surround = "**";
}
```

Change to:

```typescript
const surround = highlight ? "**" : "";
```

---

## Step 6: Code Quality / Maintainability

### 6.1. Derive User Agent Version Dynamically

**File:** `src/task/src/repos/gitHubReposInvoker.ts:290`

```typescript
userAgent: "PRMetrics/v1.7.12",
```

This is currently updated automatically by
`.github/workflow-scripts/Update-Version.ps1` (lines 67–68) via regex
replacement. Change the source to read the version from `package.json` at
runtime (or import a shared constant), then update `Update-Version.ps1` to
remove lines 67–68 (the source-code and test-file user-agent replacements), as
they would no longer be needed.

### 6.2. Remove Test-Specific String Handling From Production Code

**File:** `src/task/src/metrics/codeMetrics.ts:372–379`

`createFileMetricsMap` strips the suffix `"\r\nrc:0\r\nsuccess:true"` with the
comment "Removing the ending that can be created by test mocks." Test artefacts
should not leak into production logic. Move this normalisation into the test
setup or mock configuration instead.

### 6.3. Use Array Join for String Building in `getMetricsComment`

**File:** `src/task/src/pullRequests/pullRequestComments.ts:104–145`

The metrics comment is built via repeated `+=` string concatenation. Refactor to
build an array of lines and join with `\n` for clarity.

---

## Step 7: Evaluate Dependency Removal (Requires Integration Testing)

### 7.1. Assess Whether `isomorphic-fetch` Can Be Removed

**Files:** `package.json:60`, `src/task/src/repos/gitHubReposInvoker.ts:6`

The project targets Node 20+ (`"engines": { "node": ">=20.20.0" }`), which has
native `fetch`. The side-effect import `import "isomorphic-fetch"` and the
dependency may be removable. However, `azure-devops-node-api` may depend on it
transitively. This requires integration testing on both GitHub Actions and Azure
Pipelines before removal.

**Approach:**

1. Remove the import and dependency.
1. Run `npm run lint` and `npm run test`.
1. Test manually on both platforms via a draft PR if the above passes.
1. Revert if any integration failures occur.
