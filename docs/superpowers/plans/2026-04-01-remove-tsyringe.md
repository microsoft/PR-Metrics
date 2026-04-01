# Remove tsyringe DI Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tsyringe dependency injection with manual wiring to eliminate 3 packages (tsyringe, reflect-metadata, tslib) and remove legacy decorator dependency.

**Architecture:** All 19 DI-decorated classes already use pure constructor injection with concrete types -- no tokens, no interfaces for DI, no container.register() calls. The migration is mechanical: remove decorators from each class, then replace the single `container.resolve()` call in `index.ts` with explicit construction in dependency order. Tests are unaffected (none use the container).

**Tech Stack:** TypeScript, Node.js 24

---

## File Map

**Modified files (remove decorator + import):**

- `src/task/src/wrappers/consoleWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/wrappers/axiosWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/wrappers/azureDevOpsApiWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/wrappers/azurePipelinesRunnerWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/wrappers/gitHubRunnerWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/wrappers/octokitWrapper.ts` -- remove `@singleton()` + import
- `src/task/src/runners/azurePipelinesRunnerInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/runners/gitHubRunnerInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/runners/runnerInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/utilities/logger.ts` -- remove `@singleton()` + import
- `src/task/src/git/gitInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/git/octokitGitDiffParser.ts` -- remove `@singleton()` + import
- `src/task/src/metrics/inputs.ts` -- remove `@singleton()` + import
- `src/task/src/metrics/codeMetrics.ts` -- remove `@singleton()` + import
- `src/task/src/repos/tokenManager.ts` -- remove `@singleton()` + import
- `src/task/src/repos/azureReposInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/repos/gitHubReposInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/repos/reposInvoker.ts` -- remove `@singleton()` + import
- `src/task/src/pullRequests/pullRequest.ts` -- remove `@injectable()` + import
- `src/task/src/pullRequests/pullRequestComments.ts` -- remove `@injectable()` + import
- `src/task/src/metrics/codeMetricsCalculator.ts` -- remove `@injectable()` + import
- `src/task/src/pullRequestMetrics.ts` -- remove `@singleton()` + import

**Modified files (composition root + config):**

- `src/task/index.ts` -- replace container.resolve with manual wiring
- `src/task/tsconfig.json` -- remove `experimentalDecorators` and `emitDecoratorMetadata`
- `package.json` -- remove `tsyringe` and `reflect-metadata` from dependencies

---

### Task 1: Remove Decorators from Wrapper Classes (Leaf Nodes)

**Files:**

- Modify: `src/task/src/wrappers/consoleWrapper.ts`
- Modify: `src/task/src/wrappers/axiosWrapper.ts`
- Modify: `src/task/src/wrappers/azureDevOpsApiWrapper.ts`
- Modify: `src/task/src/wrappers/azurePipelinesRunnerWrapper.ts`
- Modify: `src/task/src/wrappers/gitHubRunnerWrapper.ts`
- Modify: `src/task/src/wrappers/octokitWrapper.ts`

These 6 wrapper classes are leaf nodes with zero or one dependency. Each has the same change pattern.

- [ ] **Step 1: Remove `@singleton()` decorator and tsyringe import from each file**

In each of the 6 files, remove:

```typescript
import { singleton } from "tsyringe";
```

and remove the `@singleton()` line immediately above the `export default class` line. Do not change anything else.

- [ ] **Step 2: Verify the build compiles**

Run: `cd src/task && npx tsc --noEmit`
Expected: No errors (the decorators are not needed for compilation when the tsconfig flags are still present).

- [ ] **Step 3: Run existing tests to verify no regressions**

Run: `cd src/task && npm test`
Expected: All tests pass (tests construct classes manually, not via container).

- [ ] **Step 4: Commit**

```bash
git add src/task/src/wrappers/consoleWrapper.ts src/task/src/wrappers/axiosWrapper.ts src/task/src/wrappers/azureDevOpsApiWrapper.ts src/task/src/wrappers/azurePipelinesRunnerWrapper.ts src/task/src/wrappers/gitHubRunnerWrapper.ts src/task/src/wrappers/octokitWrapper.ts
git commit -m "refactor: remove tsyringe decorators from wrapper classes"
```

---

### Task 2: Remove Decorators from Runner Classes

**Files:**

- Modify: `src/task/src/runners/azurePipelinesRunnerInvoker.ts`
- Modify: `src/task/src/runners/gitHubRunnerInvoker.ts`
- Modify: `src/task/src/runners/runnerInvoker.ts`

- [ ] **Step 1: Remove `@singleton()` decorator and tsyringe import from each file**

In each of the 3 files, remove:

```typescript
import { singleton } from "tsyringe";
```

and remove the `@singleton()` line immediately above the `export default class` line.

- [ ] **Step 2: Run existing tests**

Run: `cd src/task && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/task/src/runners/azurePipelinesRunnerInvoker.ts src/task/src/runners/gitHubRunnerInvoker.ts src/task/src/runners/runnerInvoker.ts
git commit -m "refactor: remove tsyringe decorators from runner classes"
```

---

### Task 3: Remove Decorators from Utility, Git, and Metrics Classes

**Files:**

- Modify: `src/task/src/utilities/logger.ts`
- Modify: `src/task/src/git/gitInvoker.ts`
- Modify: `src/task/src/git/octokitGitDiffParser.ts`
- Modify: `src/task/src/metrics/inputs.ts`
- Modify: `src/task/src/metrics/codeMetrics.ts`

- [ ] **Step 1: Remove `@singleton()` decorator and tsyringe import from each file**

In each of the 5 files, remove:

```typescript
import { singleton } from "tsyringe";
```

and remove the `@singleton()` line immediately above the `export default class` line.

- [ ] **Step 2: Run existing tests**

Run: `cd src/task && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/task/src/utilities/logger.ts src/task/src/git/gitInvoker.ts src/task/src/git/octokitGitDiffParser.ts src/task/src/metrics/inputs.ts src/task/src/metrics/codeMetrics.ts
git commit -m "refactor: remove tsyringe decorators from utility, git, and metrics classes"
```

---

### Task 4: Remove Decorators from Repos and Pull Request Classes

**Files:**

- Modify: `src/task/src/repos/tokenManager.ts`
- Modify: `src/task/src/repos/azureReposInvoker.ts`
- Modify: `src/task/src/repos/gitHubReposInvoker.ts`
- Modify: `src/task/src/repos/reposInvoker.ts`
- Modify: `src/task/src/pullRequests/pullRequest.ts`
- Modify: `src/task/src/pullRequests/pullRequestComments.ts`

- [ ] **Step 1: Remove decorator and tsyringe import from each file**

In each of the 6 files, remove the tsyringe import line:

```typescript
import { singleton } from "tsyringe";
```

or (for `pullRequest.ts` and `pullRequestComments.ts`):

```typescript
import { injectable } from "tsyringe";
```

and remove the `@singleton()` or `@injectable()` line immediately above the `export default class` line.

- [ ] **Step 2: Run existing tests**

Run: `cd src/task && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/task/src/repos/tokenManager.ts src/task/src/repos/azureReposInvoker.ts src/task/src/repos/gitHubReposInvoker.ts src/task/src/repos/reposInvoker.ts src/task/src/pullRequests/pullRequest.ts src/task/src/pullRequests/pullRequestComments.ts
git commit -m "refactor: remove tsyringe decorators from repos and pull request classes"
```

---

### Task 5: Remove Decorators from Orchestration Classes

**Files:**

- Modify: `src/task/src/metrics/codeMetricsCalculator.ts`
- Modify: `src/task/src/pullRequestMetrics.ts`

- [ ] **Step 1: Remove decorator and tsyringe import from each file**

In `codeMetricsCalculator.ts`, remove:

```typescript
import { injectable } from "tsyringe";
```

and remove the `@injectable()` line.

In `pullRequestMetrics.ts`, remove:

```typescript
import { singleton } from "tsyringe";
```

and remove the `@singleton()` line.

- [ ] **Step 2: Run existing tests**

Run: `cd src/task && npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/task/src/metrics/codeMetricsCalculator.ts src/task/src/pullRequestMetrics.ts
git commit -m "refactor: remove tsyringe decorators from orchestration classes"
```

---

### Task 6: Replace Container Resolution with Manual Wiring

This is the core change. Replace the tsyringe container in `index.ts` with explicit construction.

**Files:**

- Modify: `src/task/index.ts`

- [ ] **Step 1: Rewrite `index.ts` with manual wiring**

Replace the entire contents of `src/task/index.ts` with:

```typescript
/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import AzureDevOpsApiWrapper from "./src/wrappers/azureDevOpsApiWrapper.js";
import AzurePipelinesRunnerInvoker from "./src/runners/azurePipelinesRunnerInvoker.js";
import AzurePipelinesRunnerWrapper from "./src/wrappers/azurePipelinesRunnerWrapper.js";
import AzureReposInvoker from "./src/repos/azureReposInvoker.js";
import AxiosWrapper from "./src/wrappers/axiosWrapper.js";
import CodeMetrics from "./src/metrics/codeMetrics.js";
import CodeMetricsCalculator from "./src/metrics/codeMetricsCalculator.js";
import ConsoleWrapper from "./src/wrappers/consoleWrapper.js";
import GitHubReposInvoker from "./src/repos/gitHubReposInvoker.js";
import GitHubRunnerInvoker from "./src/runners/gitHubRunnerInvoker.js";
import GitHubRunnerWrapper from "./src/wrappers/gitHubRunnerWrapper.js";
import GitInvoker from "./src/git/gitInvoker.js";
import Inputs from "./src/metrics/inputs.js";
import Logger from "./src/utilities/logger.js";
import OctokitGitDiffParser from "./src/git/octokitGitDiffParser.js";
import OctokitWrapper from "./src/wrappers/octokitWrapper.js";
import PullRequest from "./src/pullRequests/pullRequest.js";
import PullRequestComments from "./src/pullRequests/pullRequestComments.js";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import ReposInvoker from "./src/repos/reposInvoker.js";
import RunnerInvoker from "./src/runners/runnerInvoker.js";
import TokenManager from "./src/repos/tokenManager.js";
import { exitCodeForFailure } from "./src/utilities/constants.js";
import { fileURLToPath } from "url";
import path from "path";

const run = async (): Promise<void> => {
  // Wrappers (leaf nodes).
  const axiosWrapper: AxiosWrapper = new AxiosWrapper();
  const azureDevOpsApiWrapper: AzureDevOpsApiWrapper =
    new AzureDevOpsApiWrapper();
  const azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper =
    new AzurePipelinesRunnerWrapper();
  const consoleWrapper: ConsoleWrapper = new ConsoleWrapper();
  const gitHubRunnerWrapper: GitHubRunnerWrapper = new GitHubRunnerWrapper();

  // Runners.
  const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker =
    new AzurePipelinesRunnerInvoker(azurePipelinesRunnerWrapper);
  const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
    azurePipelinesRunnerWrapper,
    consoleWrapper,
    gitHubRunnerWrapper,
  );
  const runnerInvoker: RunnerInvoker = new RunnerInvoker(
    azurePipelinesRunnerInvoker,
    gitHubRunnerInvoker,
  );

  // Utilities.
  const logger: Logger = new Logger(consoleWrapper, runnerInvoker);

  // Git.
  const gitInvoker: GitInvoker = new GitInvoker(logger, runnerInvoker);
  const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(
    axiosWrapper,
    logger,
  );

  // Metrics inputs.
  const inputs: Inputs = new Inputs(logger, runnerInvoker);
  const codeMetrics: CodeMetrics = new CodeMetrics(
    gitInvoker,
    inputs,
    logger,
    runnerInvoker,
  );

  // Repository access.
  const octokitWrapper: OctokitWrapper = new OctokitWrapper(
    octokitGitDiffParser,
  );
  const tokenManager: TokenManager = new TokenManager(
    azureDevOpsApiWrapper,
    logger,
    runnerInvoker,
  );
  const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
    azureDevOpsApiWrapper,
    gitInvoker,
    logger,
    runnerInvoker,
    tokenManager,
  );
  const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
    gitInvoker,
    logger,
    octokitWrapper,
    runnerInvoker,
  );
  const reposInvoker: ReposInvoker = new ReposInvoker(
    azureReposInvoker,
    gitHubReposInvoker,
    logger,
  );

  // Pull request layer.
  const pullRequest: PullRequest = new PullRequest(
    codeMetrics,
    logger,
    runnerInvoker,
  );
  const pullRequestComments: PullRequestComments = new PullRequestComments(
    codeMetrics,
    inputs,
    logger,
    reposInvoker,
    runnerInvoker,
  );

  // Orchestration.
  const codeMetricsCalculator: CodeMetricsCalculator =
    new CodeMetricsCalculator(
      gitInvoker,
      logger,
      pullRequest,
      pullRequestComments,
      reposInvoker,
      runnerInvoker,
    );
  const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
    codeMetricsCalculator,
    logger,
    runnerInvoker,
  );

  await pullRequestMetrics.run(path.dirname(fileURLToPath(import.meta.url)));
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd src/task && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run existing tests**

Run: `cd src/task && npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/task/index.ts
git commit -m "refactor: replace tsyringe container with manual dependency wiring"
```

---

### Task 7: Remove tsyringe Configuration and Dependencies

**Files:**

- Modify: `src/task/tsconfig.json`
- Modify: `package.json`

- [ ] **Step 1: Remove decorator flags from `tsconfig.json`**

In `src/task/tsconfig.json`, remove these two lines:

```json
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
```

- [ ] **Step 2: Verify the build compiles without decorator flags**

Run: `cd src/task && npx tsc --noEmit`
Expected: No errors. All decorators have been removed in prior tasks, so these flags are no longer needed.

- [ ] **Step 3: Remove tsyringe and reflect-metadata from `package.json`**

In `package.json`, remove these two lines from the `dependencies` section:

```json
    "reflect-metadata": "0.2.2",
    "tsyringe": "4.10.0"
```

- [ ] **Step 4: Reinstall dependencies**

Run: `npm install`
Expected: `package-lock.json` updated. `tsyringe`, `reflect-metadata`, and `tslib` are no longer present.

- [ ] **Step 5: Verify the removed packages are gone**

Run: `ls node_modules/tsyringe 2>/dev/null && echo "STILL PRESENT" || echo "REMOVED"`
Run: `ls node_modules/reflect-metadata 2>/dev/null && echo "STILL PRESENT" || echo "REMOVED"`
Run: `ls node_modules/tslib 2>/dev/null && echo "STILL PRESENT" || echo "REMOVED"`
Expected: All three report "REMOVED" (unless tslib is a transitive dependency of another package -- verify with `npm ls tslib`).

- [ ] **Step 6: Run full build and tests**

Run: `cd src/task && npx tsc --noEmit && npm test`
Expected: Build succeeds, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/task/tsconfig.json package.json package-lock.json
git commit -m "refactor: remove tsyringe and reflect-metadata dependencies"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Verify no tsyringe references remain in source**

Run: `grep -r "tsyringe\|reflect-metadata\|@singleton\|@injectable" src/task/src/ src/task/index.ts`
Expected: No matches.

- [ ] **Step 2: Full clean build**

Run: `rm -rf src/task/dist && cd src/task && npx tsc && npm test`
Expected: Build and all tests pass.

- [ ] **Step 3: Verify the bundled output works**

Run: `cd src/task && npx ncc build index.ts -o dist`
Expected: Bundle succeeds without errors.

- [ ] **Step 4: Commit any remaining changes (if any)**

Only if prior steps revealed issues that needed fixing.
