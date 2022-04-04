# Development

This file details implementation, testing, and other development details to
facilitate contributions in accordance with
[the contributing guidelines][contributing].

## Implementation

This task is written in [TypeScript][typescript] using the
[Azure Pipelines Task SDK][sdk] and [Octokit][octokit].

It works by querying Git for changes using the command
`git diff --numstat origin/<target>...pull/<pull_request_id>/merge`. Files with
`test` in the file or directory name or `.spec` in the filename (irrespective
of case) are considered test files. All other files are considered product code
files.

Note that this task is designed to give a quick estimate of the size of a change
and its test coverage. It is not an authoritative metric and should not be
treated as such. For example, the task should not be used to replace
comprehensive and thorough code coverage metrics. Instead, the task should
merely be considered a guideline for influencing optimal PR behavior.

The task can be built using `npm run build` from the `src/task`
folder. `npm run clean` can be used to clean the build outputs.

The code formatting complies with the [ESLint][eslint] "Standard" rules. The
formatting can be checked and automatically fixed by running `npm run lint`
from within the `src/task` folder. [TypeDoc][typedoc] comments are
present on public methods and are converted to HTML during the `npm run build`
process. [Dependency injection][depinjection] is used throughout the project to
facilitate testability.

## Wrappers

This task has the unique property that it runs under both GitHub Actions and
Azure Pipelines. A single codebase supports both platforms, allowing
improvements or bug fixes to be applied everywhere, immediately after each
release.

In turn, the Azure Pipelines task can run against Azure DevOps or GitHub repos.

This mechanism is facilitated by the aforementioned dependency injection and a
set of wrappers that abstract the underlying platform. There are two such
abstractions present:

- [**repos**][reposfolder]: Manages access to the underlying repo functionality.
  [`reposInvoker.ts`][reposinvoker] decides whether to forward the requests to
  [`azureReposInvoker.ts`][azurereposinvoker] or
  [`gitHubReposInvoker.ts`][githubreposinvoker] based on the location of the
  repo in use.
- [**runners**][runnersfolder]: Manages access to the runner (or platform) on
  which the functionality is being executed. [`runnerInvoker.ts`][runnerinvoker]
  decides whether to forward the requests to
  [`azurePipelinesRunnerInvoker.ts`][azurepipelinesrunnerinvoker] or
  [`gitHubRunnerInvoker.ts`][githubrunnerinvoker] based on the platform in use.

These abstractions can potentially be reused for other projects as well,
although the functionality in these is currently scoped to the requirements of
this project. Therefore, reuse would likely entail the expansion of the
interfaces to add additional methods, while retaining the same access pattern.

## Deploying to Azure Pipelines

1. Acquire administrator access to the server to which you wish to deploy.
1. Install [tfx-cli][tfxcli] using [npm][npm] via the command-line
   `npm install -g tfx-cli`.
1. Sign in to the server using:

   ```bat
   tfx login --service-url https://<account>.visualstudio.com/DefaultCollection --token <PAT>
   ```

   You can generate a PAT with at least the "Agent Pools (Read & manage)" scope
   by following the instructions [here][tfxpat]. This will only need to be
   performed the first time you use tfx-cli.
1. To build and deploy, from within the `src/task` folder, run
   `npm run deploy:release`. Note that the deployment task can intermittently
   fail to deploy all dependencies, which will be seen when you run the build
   task. If this occurs, run `npm run deploy:release` or `npm run deploy:debug`
   and try again.

## Testing

This task is tested via unit and integration tests constructed using the
[Mocha][mocha] test framework, the [Chai][chai] assertion library and the
[ts-mockito][tsmockito] mocking library. Tests follow the
[Arrange-Act-Assert pattern][aaa], and they can be run using `npm test` from
within the `src/task` folder. This command will output both the test
results and code coverage metrics.

The code coverage is currently extremely high, and a high rate of coverage
should be maintained for all changes. There are a large number of edge cases
which were only discovered through experience and the unit tests ensure that
these edge case fixes do not regress. Moreover, validating this extension on the
server is significantly more time consuming than validating locally.

You can use `npm run deploy:release` or `npm run deploy:debug` for server-based
testing. Note that the deployment task can intermittently fail to deploy all
dependencies, which will be seen when you run the build task. If this occurs,
run `npm run deploy:release` or `npm run deploy:debug` and try again.

Test validation and static analysis will be automatically performed whenever a
PR is opened against the `main` branch. These validations must succeed for the
PR to be merged.

### Manual Test Cases

Unfortunately, it is difficult to automatically test everything as the task runs
on the Azure DevOps or GitHub platforms, which the unit tests cannot run on.
Therefore, for Azure DevOps, it is recommended that you perform the following
manual test cases outlined in [here][manualtesting] whenever significant changes
are made. Similar instructions can be followed for testing the GitHub
functionality.

## Debugging

To gain greater insight into the cause of failures, you can set the
`system.debug` variable to `true` for your build pipeline. This will output
significant additional debugging information, including a full trace of the
methods called, which can be used for posting bug reports, etc.

If a failure occurs during the task, full debugging information will be
outputted by default irrespective of the value of the `system.debug` variable.

[contributing]: ../.github/CONTRIBUTING.md
[typescript]: https://www.typescriptlang.org/
[sdk]: https://github.com/microsoft/azure-pipelines-task-lib
[octokit]: https://github.com/octokit
[tfxcli]: https://github.com/Microsoft/tfs-cli
[npm]: https://www.npmjs.com/
[tfxpat]: https://docs.microsoft.com/azure/devops/extend/publish/command-line
[mocha]: https://mochajs.org/
[chai]: https://www.chaijs.com/
[tsmockito]: https://github.com/NagRock/ts-mockito
[aaa]: https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/
[eslint]: https://eslint.org/
[typedoc]: https://typedoc.org/
[depinjection]: https://wikipedia.org/wiki/Dependency_injection
[reposfolder]: ../src/task/src/repos/
[reposinvoker]: ../src/task/src/repos/reposInvoker.ts
[azurereposinvoker]: ../src/task/src/repos/azureReposInvoker.ts
[githubreposinvoker]: ../src/task/src/repos/gitHubReposInvoker.ts
[runnersfolder]: ../src/task/src/runners/
[runnerinvoker]: ../src/task/src/runners/runnerInvoker.ts
[azurepipelinesrunnerinvoker]: ../src/task/src/runners/azurePipelinesRunnerInvoker.ts
[githubrunnerinvoker]: ../src/task/src/runners/gitHubRunnerInvoker.ts
[manualtesting]: ../src/task/tests/manualTests/Instructions.md
