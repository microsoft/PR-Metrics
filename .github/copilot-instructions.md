# Copilot Instructions for PR Metrics

## Project Overview

PR Metrics is a cross-platform GitHub Action and Azure DevOps task that analyzes pull request size and test coverage, updating PR titles with indicators (XS, S, M, L, XL, 2XL, etc) and test coverage symbols (✔ or ⚠️).

## Architecture

### Multi-Platform Abstraction Pattern

The codebase uses a unique dual-platform architecture with dependency injection:

- **Runners**: `src/task/src/runners/` - Abstracts GitHub Actions vs Azure Pipelines execution
  - `runnerInvoker.ts` routes to `gitHubRunnerInvoker.ts` or `azurePipelinesRunnerInvoker.ts`
  - Detection: `process.env.GITHUB_ACTION` determines platform
- **Repos**: `src/task/src/repos/` - Abstracts GitHub vs Azure DevOps repository APIs
  - `reposInvoker.ts` routes to `gitHubReposInvoker.ts` or `azureReposInvoker.ts`
  - Single codebase handles both GitHub and Azure DevOps repositories

### Core Components

- **Entry Point**: `src/task/index.ts` - Simple DI container resolution and error handling
- **Main Logic**: `src/task/src/pullRequestMetrics.ts` - Orchestrates the workflow with parallel execution of `updateDetails()` and `updateComments()`
- **Metrics Engine**: `src/task/src/metrics/codeMetricsCalculator.ts` - Validates conditions, calculates PR metrics
- **Git Integration**: `src/task/src/git/gitInvoker.ts` - Executes Git commands for diff analysis

### Key Patterns

- **Dependency Injection**: Uses `tsyringe` with `@singleton()` and `@injectable()` decorators
- **Interface Abstraction**: All major components implement interfaces (e.g., `ReposInvokerInterface`, `RunnerInvokerInterface`)
- **Localization**: Resource strings in `src/task/Strings/resources.resjson/` with `runnerInvoker.loc()` calls

## Development Workflows

### Build Commands (from root)

```bash
npm run build:debug    # Builds with sourcemaps for debugging
npm run build:release  # Production build with minification
npm run build:package  # Creates dist/ for GitHub Action
npm run lint           # ESLint with strict TypeScript rules
npm run test:fast      # Quick test run during development
```

### File Structure Conventions

- **Production**: `src/task/src/` - Main source code
- **Tests**: `src/task/tests/` - Mirror source structure for test files
- **Interfaces**: Separate `.d.ts` files for all major interfaces
- **Build Outputs**: `debug/`, `release/`, `dist/` (git-ignored)

### Critical Git Command

The core functionality relies on: `git diff --numstat --ignore-all-space origin/<target>...pull/<pull_request_id>/merge`

## Code Standards

### TypeScript Conventions

- **Strict ESLint**: Uses `typescript-eslint/strict` with extensive custom rules
- **Explicit Types**: `@typescript-eslint/explicit-function-return-type` enforced
- **Member Ordering**: Specific ordering enforced (fields → constructor → methods)
- **ES Modules**: Uses `.js` extensions in imports for Node.js ESM compatibility

### Testing Patterns

- **Framework**: Mocha + ts-mockito + c8 for coverage
- **Pattern**: Arrange-Act-Assert structure
- **Coverage**: Maintain high coverage rates (critical for edge cases)
- **Test Files**: `.spec.ts` files mirror source structure

### Error Handling

- Early return pattern for validation failures
- Localized error messages via `runnerInvoker.loc()`
- Status setting: `setStatusFailed()`, `setStatusSkipped()`, `setStatusSucceeded()`

## Integration Points

### Environment Variables

- `PR_METRICS_ACCESS_TOKEN` - GitHub PAT or Azure DevOps PAT
- `GITHUB_TOKEN` - Built-in GitHub Actions token (requires `pull-requests: write`, `statuses: write`)

### External APIs

- **GitHub**: Octokit for REST API calls (`@octokit/plugin-rest-endpoint-methods`)
- **Azure DevOps**: `azure-devops-node-api` for TFS API calls
- **Git**: Shell execution via runner abstraction

### Configuration Files

- **GitHub Action**: `action.yml` defines inputs/outputs
- **Azure Task**: `src/task/task.json` defines task metadata and inputs
- Both configs must stay synchronized for input definitions

## Development Tips

- Use `npm run test:fast` for rapid iteration during development
- Debug builds include sourcemaps; check `debug/` folder
- Manual testing instructions in `src/task/tests/manualTests/Instructions.md`
- Set `system.debug: true` in pipelines for verbose logging
- The localization system requires `locInitialize()` before using `loc()` calls
