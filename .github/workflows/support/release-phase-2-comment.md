# Required License Update

<!-- markdownlint-disable MD013 -->

Before completing this PR, the license information **must** be updated.

1. Wait for the entire PR build to complete.
1. Use the internal Microsoft Component Governance tooling to update [`src/LICENSE.txt`][licensetxt] with the automatically generated license information.
   1. Switch to the Components tab.
   1. Use Notice > Download to generate the file. Select Pipeline "PR Metrics – Prod" and Format "Plain Text". Click "Download".
   1. Add the downloaded content to the end of [`src/LICENSE.txt`][licensetxt]. Note that the ordering of licenses may change.
   1. If the download dialog includes any notice indicating that license information could not be located at [Clearly Defined][clearlydefined], you will need to add the information to that source. To do this, expand the drop down menu in the dialog to reveal the problematic dependencies. For each dependency:
      1. Navigate to the Clearly Defined [Harvest page][clearlydefinedharvest].
      1. In the first search box, select "NpmJS".
      1. In the second search box, select the dependency name.
      1. In the "Pick an npm version" box, select the appropriate version.
      1. Click "Harvest".

      It is also possible to add all dependencies to the page and click "Harvest" afterwards to harvest all license information simultaneously.

      Wait some time for harvesting to complete and try regenerating the license information at the Component Governance page. Repeat the process until all license information is available.

1. Commit all the changes to your branch, updating the PR.

[clearlydefined]: https://clearlydefined.io/
[clearlydefinedharvest]: https://clearlydefined.io/harvest
[licensetxt]: https://github.com/microsoft/PR-Metrics/blob/main/src/LICENSE.txt
