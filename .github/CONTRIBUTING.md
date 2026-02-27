# Contributing

This project welcomes contributions and suggestions. Most contributions require
you to agree to a Contributor License Agreement (CLA) declaring that you have
the right to, and actually do, grant us the rights to use your contribution. For
details, visit <https://opensource.microsoft.com/cla>.

When you submit a pull request, a CLA-bot will automatically determine whether
you need to provide a CLA and decorate the PR appropriately (e.g., label,
comment). Simply follow the instructions provided by the bot. You will only need
to do this once across all repositories using our CLA.

This project has adopted the
[Microsoft Open Source Code of Conduct][codeofconduct]. For more information see
the [Code of Conduct FAQ][codeofconductfaq] or contact
[opencode@microsoft.com][opencode] with any additional questions or comments.

## Coding Style

There is an [`.editorconfig`][editorconfig] file in the root of the project
specifying formatting guidelines. In addition to adhering to those, you should
follow the pattern of what you see in existing code where possible.

## Testing

### Running Tests Locally

Tests can be run locally using `npm test` from the repository root. This command
builds the project in debug mode, runs the [Mocha][mocha] unit test suite, and
outputs code coverage metrics via [c8][c8]. For faster iteration during
development, `npm run test:fast` skips the full reinstallation step.

### Running Tests in CI/CD

Test validation is automatically performed whenever a pull request is opened
against the `main` branch. The [`build.yml`][buildyml] workflow runs the full
test suite as part of the `Build` job. Additionally:

- **CodeQL** performs static analysis for security vulnerabilities.
- **Super-Linter** validates code style, formatting, and secret scanning.
- **PR Metrics** runs against itself in the `Test GitHub Action` job.

All automated checks must pass before a pull request can be merged.

### Interpreting Results

The `npm test` command outputs:

- **Test results**: Pass/fail status for each test case. All tests must pass.
- **Code coverage**: Line, branch, and function coverage percentages. The
  project maintains extremely high code coverage and contributions should
  maintain or improve coverage levels.

### Test Policy for Major Changes

All major changes to the project must include corresponding test updates:

- **New features**: Must include unit tests covering the new functionality,
  including edge cases.
- **Bug fixes**: Must include a regression test that fails without the fix and
  passes with it.
- **Refactoring**: Existing tests must continue to pass. If the refactoring
  changes internal interfaces, tests should be updated to reflect the new
  structure.

A "major change" is any modification that alters the behavior of the extension,
adds new configuration parameters, changes how metrics are calculated, or
modifies interactions with the GitHub or Azure DevOps APIs. The
[pull request template][pullrequesttemplate] includes a testing checklist to
ensure compliance.

For more details, see the [development documentation][development].

## Documentation

Contributions to documentation are always appreciated. Feel free to submit a
pull request to contribute to any existing documentation file. If you wish to
add new documentation, please add it to the `docs` folder.

## Communicating with the Team

The easiest way to communicate with the team is via
[GitHub issues][githubissues]. Feel free to file bug reports, feature requests,
and suggestions.

## Useful References

- [Azure DevOps REST SDK][azuredevopsrestsdk]
- [Built-in Azure DevOps extensions][builtinextensions]
- [Developing an Azure DevOps extension][developingextension]
- [Predefined Azure DevOps variables][predefinedvariables]
- [Azure DevOps TypeScript SDK reference][typescriptsdk]
- [`vss-extension.json` details][vssextension]
- [`task.json` schema][taskjsonschema]

[azuredevopsrestsdk]: https://docs.microsoft.com/rest/api/azure/devops
[buildyml]: https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/build.yml
[builtinextensions]: https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks
[c8]: https://github.com/bcoe/c8
[codeofconduct]: https://opensource.microsoft.com/codeofconduct/
[codeofconductfaq]: https://opensource.microsoft.com/codeofconduct/faq/
[developingextension]: https://docs.microsoft.com/azure/devops/extend/get-started/node
[development]: ../docs/development.md
[editorconfig]: ../.editorconfig
[githubissues]: https://github.com/microsoft/PR-Metrics/issues
[mocha]: https://mochajs.org/
[opencode]: mailto:opencode@microsoft.com
[predefinedvariables]: https://docs.microsoft.com/azure/devops/pipelines/build/variables
[pullrequesttemplate]: https://github.com/microsoft/PR-Metrics/blob/main/.github/pull_request_template.md
[taskjsonschema]: https://github.com/microsoft/azure-pipelines-task-lib/blob/master/tasks.schema.json
[typescriptsdk]: https://github.com/microsoft/azure-pipelines-task-lib/blob/master/node/README.md
[vssextension]: https://docs.microsoft.com/azure/devops/extend/develop/manifest
