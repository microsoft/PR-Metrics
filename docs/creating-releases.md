# Creating Releases

In general, there is one release for PR Metrics toward the start of each
quarter, but there is no guaranteed release cadence.

High priority issues, such as security issues within dependencies, are fixed and
released as soon as possible.

Feature releases are also typically released outside of the quarterly cadence.

**Ensure you are using npm v8 or earlier, which will generate a
[`package-lock.json`][packagelockjson] file with `lockfileVersion` 2. npm v9 and
above use `lockfileVersion` 3, which is currently incompatible with the
Component Governance tooling. This will prevent updated licenses from being
generated.**

## Quarterly Releases

To create the quarterly release, follow the steps below.

### Updating Dependencies

1. If possible, you should start by removing any entries within the `overrides`
   section of [`package.json`][packagejson] that are no longer required.
1. Enter

   ```Batchfile
   npm install -g npm-check-updates
   ncu -u
   npm update
   ```

   This will update all dependencies to the latest versions.
1. Search for all instances of the version number and increment the build
   element of the number (i.e., the third element) by 1 throughout.
1. Enter `npm run test` to ensure that all tests pass. If you have not updated
   one or more instances of the version number, the tests will fail.
1. Enter `npm run build:package` to update the contents of the `dist` folder.
1. Enter

   ```Batchfile
   tfx login --service-url https://<account>.visualstudio.com/DefaultCollection --token <PAT>
   ```

   You can generate a PAT with at least the "Agent Pools (Read & manage)" scope
   by following the instructions [here][tfxcli]. This will only need to be
   performed the first time you use tfx-cli.
1. Enter `npm run deploy` to deploy the change to your test server.
1. Commit all the changes to a new branch.
1. Open a PR with the changes.
1. Ensure all build stages run successfully. Make the appropriate changes if
   this is not the case, and repeat steps 2 to 7.
1. Use the internal Microsoft Component Governance tooling to update
   [`src/LICENSE.txt`][licensetxt] with the automatically generated license
   information.

   1. At the top of the page, change the `main` branch to `refs/pull/#/merge`,
      where `#` is the GitHub PR number. **It is very important that this is
      selected correctly or the wrong license information will be generated.**
   1. Use Notice > Configure to ensure that only the `dependencies` from
      [`package.json`][packagejson] are included and that the `devDependencies`
      are excluded.
   1. Use Notice > Download to generate the file. Select Pipeline "PR" and
      Format "Plain Text". Click "Download".
   1. Update [`src/LICENSE.txt`][licensetxt], retaining the content to the first
      horizontal rule, which is the license for PR Metrics itself. All content
      following this line should be replaced with the downloaded licenses. Note
      that the ordering of licenses may change.
   1. If the download dialog includes any notice indicating that license
      information could not be located at [Clearly Defined][clearlydefined], you
      will need to add the information to that source. To do this, expand the
      drop down menu in the dialog to reveal the problematic dependencies. For
      each dependency:

      1. Navigate to the Clearly Defined [Harvest page][clearlydefinedharvest].
      1. In the first search box, select "NpmJS".
      1. In the second search box, select the dependency name.
      1. In the "Pick an npm version" box, select the appropriate version.
      1. Click "Harvest".

      It is also possible to add all dependencies to the page and click
      "Harvest" afterwards to harvest all license information simultaneously.

      Wait some time for harvesting to complete and try regenerating the license
      information at the Component Governance page. Repeat the process until all
      license information is available.
1. Commit all the changes to your branch, updating the PR.
1. Ensure all build stages continue to run successfully
1. Commit the changes to the `main` branch.
1. Wait for the [`main` branch build loop][mainbuild] to complete successfully.

### Creating the Release

1. Open the [Releases][releases] page.
1. Click "Draft a new release".
1. Enter the new version number in the format of "vX.X.X" in the "Choose a tag"
   field, replacing the "X.X.X" with the version number. Click "Create new tag:
   vX.X.X on publish".
1. Enter "Release vX.X.X" in the "Release title" field, replacing the "X.X.X"
   with the version number.
1. Click "Generate release notes".
1. At the top of the "Describe this release" field, add "## Summary" and a
   bulleted list of the major changes since the last release.
1. Enable "Create a discussion for this release" and select category "Releases".
1. Click "Publish release".
1. Wait for the [Release build loop][releasebuild] to complete successfully.
1. Click into the completed build and download the `ms-omex.PRMetrics` artifact.
1. Extract the .vsix file from the compressed artifact.
1. Go to the Visual Studio Marketplace page for the
   [`ms-omex` publisher][marketplace]. You will need to have appropriate
   permissions to access this page.
1. Click "..." next "PR Metrics" and click "Update".
1. Follow the instructions to upload .vsix file.
1. Click "Upload".
1. Wait for validation to complete and the new version of the extension to be
   published.

## Security Updates

If Dependabot opens an out-of-band security fix PR, complete the PR and follow
the [Quarterly Releases](#quarterly-releases) steps.

If you need to update a dependency without an automatically created Dependabot
PR, the easier solution is to immediately follow the process for
[Quarterly Releases](#quarterly-releases).

## Feature Releases

Feature releases should be completed by following the
[Quarterly Releases](#quarterly-releases) steps.

[clearlydefined]: https://clearlydefined.io/
[clearlydefinedharvest]: https://clearlydefined.io/harvest
[licensetxt]: ../src/LICENSE.txt
[mainbuild]: https://github.com/microsoft/PR-Metrics/actions/workflows/build.yml
[marketplace]: https://marketplace.visualstudio.com/manage/publishers/ms-omex
[packagejson]: ../package.json
[packagelockjson]: ../package-lock.json
[releasebuild]: https://github.com/microsoft/PR-Metrics/actions/workflows/release.yml
[releases]: https://github.com/microsoft/PR-Metrics/releases
[tfxcli]: https://github.com/Microsoft/tfs-cli
