<!-- pr-metrics-license-comment -->
# Required License Update

<!-- markdownlint-disable MD013 -->

Before completing this PR, the license information **must** be updated.

The build pipeline encountered an issue, likely due to missing licenses within [Clearly Defined][clearlydefined].

## Step 1: Harvesting Missing Licenses

For each missing dependency:

1. Navigate to the [Clearly Defined Harvest page][clearlydefinedharvest].
1. In the first search box, select "NpmJS".
1. In the second search box, enter the package name only (without any `npm/npmjs/` or `npm/npmjs/-/` prefix and without any version suffix).
1. Wait for the dropdown to appear, then select the package from the dropdown.
1. In the "Pick an npm version" box, enter the version.
1. Wait for the dropdown to appear, then select the version from the dropdown.
1. Click **Harvest**.

> **Tip:** You can add multiple dependencies to the page and click **Harvest** once to process them all simultaneously.

After clicking **Harvest**, you can try regenerating the license information by repeating Step 1 to check whether the updates have been applied. Processing may take up to 24 hours.

> **Tip:** If the update is high priority or harvesting is taking too long, you can proceed with a partially manual update:
>
> 1. Download and add the licenses that are already available from Component Governance.
> 1. For the missing licenses, manually retrieve the license text from the package's repository, which is usually listed at the package page on <https://www.npmjs.com/>.
> 1. Running `git diff main -- src/LICENSE.txt` can help identify which packages have missing licenses and which therefore need attention. Note that this is not a comprehensive method, as some packages may have multiple dependencies whose licenses must be included and these could change between versions, so careful manual review is still vital.

## Step 2: Update the License File and PR

Once harvesting is complete:

1. At the GitHub PR page, under the review checks, click **PR Metrics – PR**.
1. Click **View more details on Azure Pipelines**.
1. Click **Run New**.
   - If the pipeline is currently running, you will need to click **Cancel** first.
1. In the "Run pipeline" window, enable "Force License Generation".
1. Click **Next: Resources**, then **Run**.
1. Wait for the pipeline to complete.

[clearlydefined]: https://clearlydefined.io/
[clearlydefinedharvest]: https://clearlydefined.io/harvest
