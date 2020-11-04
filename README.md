# Microsoft OMEX Azure DevOps Extensions

![Build Status](https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/workflows/Build/badge.svg)

This repository contains source code for
[Azure DevOps](https://azure.microsoft.com/services/devops/) Extensions created
by the OMEX team in Microsoft, which is part of the Office organization.

The code is released under the [MIT license](LICENSE.txt).

Other source code released by the OMEX team can be located at
<https://github.com/microsoft/Omex>.

## Projects

This repository layout is structured so that the top level contains a folder
for each extension type, e.g. Pipeline Task. At the lower level, the repo
contains a folder fo each individual extension.

The current set of projects is:

- **Pipelines Tasks**
  - [**PR Metrics:**](PipelinesTasks/PRMetrics/README.md) A task for adding size
    and test coverage indicators to the titles of PRs. This helps ensure
    engineers keeps PRs to an appropriate size and add sufficient test coverage,
    while providing insight to reviewers as to how long a PR is likely to take
    to review.

## Building

To build the projects, first ensure you have
[NuGet](https://docs.microsoft.com/nuget/reference/nuget-exe-cli-reference)
installed and in a location covered by the `PATH` environment variable. Next,
you should invoke
[`msbuild`](https://docs.microsoft.com/visualstudio/msbuild/msbuild) from the
root folder to build the project.

Afterwards, you can use [`tfx-cli`](https://github.com/microsoft/tfs-cli) to
deploy the solution to your Azure DevOps server. More detailed instructions are
available in the `README.md` file in each individual project's folder.

## Testing

For the PowerShell extensions, tests are written in
[Pester 5](https://github.com/pester/Pester). The code is also scanned using
[PSScriptAnalyzer](https://github.com/PowerShell/PSScriptAnalyzer). It is
recommended to use
[PowerShell 7 or above](https://github.com/PowerShell/PowerShell) as some of the
core PowerShell functionality has changed between releases.

Information on removing older built-in versions of Pester can be found at
<https://pester-docs.netlify.app/docs/introduction/installation#removing-the-built-in-version-of-pester>.

Test validation and code scanning will be automatically performed whenever a
PR is opened against the `main` branch. These must pass for the PR to be merged.

## Contributing

Instructions on contributing can be located in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Code of Conduct

This project has adopted the
[Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the
[Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any
additional questions or comments.
