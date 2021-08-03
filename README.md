# Microsoft OMEX Azure DevOps Extensions

This repository contains source code for
[Azure DevOps](https://azure.microsoft.com/services/devops/) Extensions created
by the OMEX team in Microsoft, which is part of the Office organization.

The code is released under the [MIT license](LICENSE.txt).

Additional source code released by the OMEX team can be located at
<https://github.com/microsoft/Omex>.

## Projects

This repository layout is structured so that the top level contains a folder
for each extension type, e.g. Pipeline Task. At the lower level, the repo
contains a folder for each individual extension.

The current set of projects is:

- **Pipelines Tasks**
  - [**PR Metrics:**](PipelinesTasks/PRMetrics/README.md) A task for adding
    size and test coverage indicators to the titles of PRs. This helps ensure
    engineers keep PRs to an appropriate size and add sufficient test coverage,
    while providing insight to reviewers as to how long a PR is likely to take
    to review. **It can be downloaded from the Visual Studio Marketplace at
    <https://aka.ms/PRMetrics>.**

## Building & Testing

For instructions on building and testing each project, navigate to the project
in question and follow the README.md provided.

Test validation and static analysis of all projects will be automatically
performed whenever a PR is opened against the `main` branch. These validations
must succeed for the PR to be merged.

## Contributing

Instructions on contributing can be located in
[CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Code of Conduct

This project has adopted the
[Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the
[Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any
additional questions or comments.
