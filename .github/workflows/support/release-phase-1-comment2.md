# On Pull Request Closure

<!-- markdownlint-disable MD013 -->

When this PR is merged to `main`, the following actions must be performed:

1. Wait for the new GitHub release to be created.
1. Click into the release and download the `ms-omex.PRMetrics` asset.
1. Extract the `.vsix` file from the compressed asset.
1. Go to the Visual Studio Marketplace page for the [`ms-omex` publisher][marketplace]. You will need to have appropriate permissions to access this page.
1. Click "..." next "PR Metrics" and click "Update".
1. Follow the instructions to upload .vsix file.
1. Click "Upload".
1. Wait for validation to complete and the new version of the extension to be published.

[marketplace]: https://marketplace.visualstudio.com/manage/publishers/ms-omex
