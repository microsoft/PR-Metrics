# Required License Update

<!-- markdownlint-disable MD013 -->

Before completing this PR, the license information **must** be updated.

## Step 1: Generate License Information

Use the internal Microsoft Component Governance tooling to generate the license file.

1. Open the Component Governance page for this repository.
1. At the top of the page, ensure the branch is set to `main`.
1. Switch to the **Components** tab.
1. Click **Notice** > **Configure**.
1. Select Pipeline "PR Metrics – Prod".
1. Verify the checked components match those listed as dependencies in `package.json`.
1. If you made any updates, click **Save**, then **Close**.
1. Click **Notice** > **Download**.
1. Select Pipeline "PR Metrics – Prod" and Format "Plain Text".
1. Click **Download**.

If the download dialog displays a notice indicating that license information was not harvested by [Clearly Defined][clearlydefined], proceed to Step 2. Otherwise, skip to Step 3.

## Step 2: Handle Missing Licenses (If Required)

When Component Governance cannot retrieve license information, you must add it to [Clearly Defined][clearlydefined] manually.

1. In the Component Governance download dialog, expand the section to reveal the missing dependencies.
1. For each missing dependency:
   1. Navigate to the [Clearly Defined Harvest page][clearlydefinedharvest].
   1. In the first search box, select "NpmJS".
   1. In the second search box, enter the package name only (without any `npm/npmjs/` or `npm/npmjs/-/` prefix and without any version suffix).
   1. Wait for the dropdown to appear, then select the package from the dropdown.
   1. In the "Pick an npm version" box, enter the version.
   1. Wait for the dropdown to appear, then select the version from the dropdown.
   1. Click **Harvest**.

> **Tip:** You can add multiple dependencies to the page and click **Harvest** once to process them all simultaneously.

After clicking **Harvest**, you can try regenerating the license information by repeating Step 1 to check whether the updates have been applied. Processing may take up to a day, so you may need to wait before the licenses become available.

## Step 3: Update the License File and PR

1. Add the downloaded content to the end of [`src/LICENSE.txt`][licensetxt].

   > **Note:** The ordering of licenses may change between regenerations.

1. Commit all changes to your branch to update the PR.

[clearlydefined]: https://clearlydefined.io/
[clearlydefinedharvest]: https://clearlydefined.io/harvest
[licensetxt]: https://github.com/microsoft/PR-Metrics/blob/main/src/LICENSE.txt
