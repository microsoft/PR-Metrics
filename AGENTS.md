# AI Agent Instructions for PR Metrics

## Project Overview

PR Metrics is a cross-platform GitHub Action and Azure DevOps task that analyzes
pull request size and test coverage, updating PR titles with indicators (XS, S,
M, L, XL, 2XL, etc) and test coverage symbols (✔ or ⚠️).

## Architecture

### Multi-Platform Abstraction Pattern

The codebase uses a unique dual-platform architecture with dependency injection:

- **Runners**: `src/task/src/runners/` - Abstracts GitHub Actions vs Azure
  Pipelines execution
  - `runnerInvoker.ts` routes to `gitHubRunnerInvoker.ts` or
    `azurePipelinesRunnerInvoker.ts`
  - Detection: `process.env.GITHUB_ACTION` determines platform
- **Repos**: `src/task/src/repos/` - Abstracts GitHub vs Azure DevOps repository
  APIs
  - `reposInvoker.ts` routes to `gitHubReposInvoker.ts` or
    `azureReposInvoker.ts`
  - Both extend `baseReposInvoker.ts`, which provides shared API error handling
    (e.g., mapping 401/403/404 to access-error messages)
  - `tokenManager.ts` handles workload identity federation as an alternative to
    Personal Access Tokens
  - Single codebase handles both GitHub and Azure DevOps repositories

### Core Components

- **Entry Point**: `src/task/index.ts` - Simple DI container resolution and
  error handling
- **Main Logic**: `src/task/src/pullRequestMetrics.ts` - Orchestrates the
  workflow, calling `codeMetricsCalculator.updateDetails()` and
  `codeMetricsCalculator.updateComments()` in parallel via `Promise.all()`
- **Metrics Engine**: `src/task/src/metrics/codeMetricsCalculator.ts` -
  Validates conditions, calculates PR metrics, and defines `updateDetails()` and
  `updateComments()`
- **Git Integration**: `src/task/src/git/gitInvoker.ts` - Executes Git commands
  for diff analysis (numstat-based metrics)
- **Diff Parsing**: `src/task/src/git/octokitGitDiffParser.ts` - Uses the
  `parse-git-diff` library to determine, for each file, the first diff hunk
  start line (a diff line suitable as a comment anchor) for precise comment
  placement on GitHub PRs

### Key Patterns

- **Dependency Injection**: Uses `tsyringe` with `@singleton()` and
  `@injectable()` decorators
- **Interface Abstraction**: All major components implement interfaces (e.g.,
  `ReposInvokerInterface`, `RunnerInvokerInterface`)
- **Localization**: Resource strings in the
  `src/task/Strings/resources.resjson/` folder with `runnerInvoker.loc()` calls

## Development Workflows

### Build Commands (from root)

```bash
npm run build:debug    # Builds with source maps for debugging
npm run build:release  # Production build with minification
npm run build:package  # Creates dist/ for GitHub Action
npm run lint           # ESLint with autofix (strict TypeScript rules)
npm run test:fast      # Quick test run during development
```

### File Structure Conventions

- **Production**: `src/task/src/` - Main source code
- **Tests**: `src/task/tests/` - Mirror source structure for test files
- **Interfaces**: Separate `.d.ts` files for all major interfaces
- **Build Outputs**: `debug/`, `release/`, `dist/` (git-ignored)

### Critical Git Command

The core functionality relies on:
`git diff --numstat --ignore-all-space origin/<target>...pull/<pull_request_id>/merge`

## Code Standards

### TypeScript Conventions

- **Strict ESLint**: Flat config (`eslint.config.mjs`) extending
  `strictTypeChecked` and `stylisticTypeChecked` presets with extensive custom
  rules
- **Explicit Types**: `@typescript-eslint/explicit-function-return-type`
  enforced
- **Member Ordering**: Specific ordering enforced (fields → constructor →
  methods)
- **ES Modules**: Uses `.js` extensions in imports for Node.js ESM compatibility

### Testing Patterns

- **Framework**: Mocha + ts-mockito + c8 for coverage + fast-check for
  property-based testing
- **Pattern**: Arrange-Act-Assert structure
- **Coverage**: Maintain high coverage rates (critical for edge cases)
- **Test Files**: `.spec.ts` files mirror source structure; `.property.spec.ts`
  files contain property-based (fuzz) tests

### Error Handling

- Early return pattern for validation failures
- Localized error messages via `runnerInvoker.loc()`
- Status setting: `setStatusFailed()`, `setStatusSkipped()`,
  `setStatusSucceeded()`

## Integration Points

### Environment Variables

`PR_METRICS_ACCESS_TOKEN` - The only token variable read by the source code.
Typically set to `${{ secrets.GITHUB_TOKEN }}` in workflows (requires
`pull-requests: write`, `statuses: write` permissions) or to an Azure DevOps
PAT. Can also be populated automatically by workload identity federation via
`TokenManager`.

### External APIs

- **GitHub**: Octokit for REST API calls
  (`@octokit/plugin-rest-endpoint-methods`)
- **Azure DevOps**: `azure-devops-node-api` for TFS API calls
- **Git**: Shell execution via runner abstraction

### Configuration Files

- **GitHub Action**: `action.yml` defines inputs/outputs
- **Azure Task**: `src/task/task.json` defines task metadata and inputs
- Both configs must stay synchronized for input definitions

## Development Tips

- Use `npm run test:fast` for rapid iteration during development
- Debug builds include source maps; check `debug/` folder
- Manual testing instructions in `src/task/tests/manualTests/Instructions.md`
- Set `system.debug: true` in pipelines for verbose logging
- The localization system requires `locInitialize()` before using `loc()` calls
