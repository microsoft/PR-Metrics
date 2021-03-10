# Contributing

This project welcomes contributions and suggestions. Most contributions require
you to agree to a Contributor License Agreement (CLA) declaring that you have
the right to, and actually do, grant us the rights to use your contribution. For
details, visit <https://cla.microsoft.com>.

When you submit a pull request, a CLA-bot will automatically determine whether
you need to provide a CLA and decorate the PR appropriately (e.g., label,
comment). Simply follow the instructions provided by the bot. You will only need
to do this once across all repositories using our CLA.

This project has adopted the
[Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the
[Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any
additional questions or comments.

## Coding Style

There is an [`.editorconfig`](../.editorconfig) file in the root of the project
specifying some simple formatting guidelines. In addition to adhering to those,
you should follow the pattern of what you see in existing code where possible.

## Code Overview

The repository is organized into a set of different extensions, as outlined in
the [README](../README.md).

## Updating an Extension

Contributions to existing extensions are appreciated.

Any update will need to increment the version in the task's `task.json` and
`vss-extension.json` files. The version numbers follow the
[Semantic Versioning](https://semver.org/) rules.

## Adding an Extension

If you wish to create a new extension, please discuss this beforehand using
[GitHub issues](https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/issues).

The following instructions can be used for adding an extension.

1. If instances of the extension category do not already exist in the repo,
   create a new folder for this category.
1. Within the category folder, create a new folder with the name of the task.
1. To start, copy the necessary files from one of the existing extensions. The
   set of files can vary by extension type, but, in general, the following files
   are required:
     - `icon.png`: A PNG file of size 32×32 pixels with transparencies set
       appropriately.
     - `task.json`: The metadata describing the extension and its inputs. The
       file also references the script files containing the extension logic.
       Note that the `id` field must be a unique GUID.
     - `vss-extension.json`: The metadata describing the extension, which will
       be used for deploying the extension to the
       [Marketplace](https://marketplace.visualstudio.com/azuredevops).
     - `TaskName.ps1`: The PowerShell logic to run. TypeScript is recommended
       for newer extensions as it can be run on all platforms, unlike PowerShell
       extensions, which can only be run on Windows.
     - `TaskName.copyproj`: The project file specifying the files to include in
       the release.
1. Make the necessary changes to the scripts.
1. Update `./OMEXAzureDevOpsExtensions.proj` as well as the `.proj` file in the
   extension category folder.

## Documentation

Contributions to documentation are always appreciated. Feel free to submit a
pull request to contribute to any existing documentation file. If you wish to
add new documentation, please add it to the `doc` folder.

## Communicating with the Team

The easiest way to communicate with the team is via
[GitHub issues](https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/issues).
Feel free to file bug reports, feature requests, and suggestions.

## Useful References

- [Azure DevOps REST SDK](https://docs.microsoft.com/rest/api/azure/devops)
- [Built-in extensions](https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks)
- [Developing an extension](https://docs.microsoft.com/azure/devops/extend/get-started/node)
- [Predefined variables](https://docs.microsoft.com/azure/devops/pipelines/build/variables)
- [TypeScript SDK reference](https://github.com/microsoft/azure-pipelines-task-lib/blob/master/node/README.md)
- [PowerShell SDK reference](https://github.com/microsoft/azure-pipelines-task-lib/blob/master/powershell/Docs/README.md)
- [`vss-extension.json` details](https://docs.microsoft.com/azure/devops/extend/develop/manifest)
- [`task.json` schema](https://github.com/microsoft/azure-pipelines-task-lib/blob/master/tasks.schema.json)
