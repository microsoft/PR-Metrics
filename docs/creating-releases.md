# Creating Releases

In general, there is one release for PR Metrics toward the start of each
quarter, but there is no guaranteed release cadence.

High priority issues, such as security issues within dependencies, are fixed and
released as soon as possible.

Feature releases are also typically released outside of the quarterly cadence.

## Quarterly Release

To create the quarterly release, follow these steps:

1. Enter

   ```Batchfile
   npm install -g npm-check-updates
   ncu -u
   npm update
   npm run build:package
   ```

   This will update all dependencies to the latest versions and update the
   contents of the `dist` folder.
1. Enter `npm run test` to ensure that all tests continue to pass. Make the
   appropriate changes if this is not the case.
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
1. Once everything is working, commit the changes to the `main` branch.
1. Wait for the `main` branch build loop to complete successfully.
1. Search for all instances of the version number and increment the build
  element of the number (i.e., the third element) by 1 throughout.
1. Enter `npm run test` and ensure that all tests pass. If you have not updated
   one or more instances of the version number, the tests will fail.
1. Update `src/LICENSE.txt` with the automatic license information collated
   internally within Microsoft. Ensure, when generating this file, that only
   the `dependencies` from `package.json` are included and that the
   `devDependencies` are excluded.

   When updating this file, retain the content to the first line, which is the
   license for PR Metrics itself. All content following this line should b
   replaced. Note that the ordering of licenses may change. This is expected.
1. Enter `npm run build:package` to update the contents of the `dist` folder.
1. Commit all the changes to a new branch.
1. Open a PR with the changes.
1. Commit the changes to the `main` branch.
1. Wait for the `main` branch build loop to complete successfully.

[tfxcli]: https://github.com/Microsoft/tfs-cli
