# Manual Testing

Unfortunately, it is difficult to automatically test everything as the task runs
on the Azure DevOps platform, which the unit tests cannot run on. Therefore, it
is recommended that you perform the following manual test cases whenever
significant changes are made. These don't cover all possible scenarios, but they
complement the unit tests to provide a high level of coverage.

## Step 1: Setup

1. On the Azure DevOps server to which you have administrator access, either
   create a new Git repo or select an empty one.

   To create a new repo, navigate to your chosen project and select Repos >
   Files from the left-hand navigation. Click the drop down with the repo name
   at the top of the page and select "New Repository". Leave "Add a README"
   checked to create a main branch but do not add a `.gitignore` file.
1. Copy the contents of the `step1` subfolder to the root of your repo,
   preserving the folder tree.
1. Commit the changes to your repo.
1. Deploy your local PR Metrics code to the server using:

   ```Batchfile
   tfx login --service-url https://<account>.visualstudio.com/DefaultCollection --token <PAT>
   ```

   You can generate a PAT with at least the "Agent Pools (Read & manage)" scope
   by following the instructions [here][tfxpat]. This will only need to be
   performed the first time you use tfx-cli.
1. To build and deploy, from within the `src/task` folder, run `npm run deploy`.
   Note that the deployment task can intermittently fail to deploy all
   dependencies, which will be seen when you run the build task. If this occurs,
   run `npm run deploy` and try again.

## Step 2: Creating the Pipelines

1. Clone the repo locally.
1. Copy the contents of the `step2` folder to your new repo and commit it to the
   server.
1. On the Azure DevOps server, navigate to Pipelines > Pipelines.
1. Click "New Pipeline".
1. When prompted as to the location of your code, select "Azure Repos Git".
1. When prompted to select your repo, select the repo you recently created as
   part of this test process.
1. When prompted to configure your pipeline, select "Existing Azure Pipelines
   YAML file".
1. In the right-hand pane that appears, select the first of the pipeline YAML
   files.
1. On the review pane, click the drop-down button next to "Run" and select
   "Save".
1. On the subsequent page, it is a good idea to click the "..." and select
   "Rename/Move" to change the pipeline name to something more memorable, as
   well as to potentially move it to a shared folder.
1. Repeat the process for the other three pipeline definitions.
1. On the Azure DevOps server, navigate to Repos > Branches.
1. Next to the main branch for your repo, click "..." and select "Branch
   policies".
1. Under the "Build Validation" section, click "+".
1. For the "Build Pipeline" dropdown, select the first pipeline you added. Copy
   the name of the pipeline to the "Display name" field. Accept all of the other
   defaults and click "Save".
1. Repeat the process for the other three pipeline definitions.

## Step 3: Performing an Initial Pipeline Test

1. On the Azure DevOps server, navigate to Pipelines > Pipelines.
1. Locate the pipeline corresponding to `step2/pipelines/pipeline.yaml` and
   click on it.
1. Under the pipeline page, click "Run pipeline".
1. In the right-hand pane, accept the default options and click "Run".
1. Verify that the pipeline succeeds and that the PR Metrics task is skipped, as
   it is run outside of the context of a PR.

## Step 4: Performing an Initial Pipeline Test via a PR

1. In your Git repo, create a new branch, e.g. `step4`.
1. Copy the files from `step4` to the root folder of your repo.
1. Rename `rename.ts` to `temporary.ts` and `initial/rename.ts` to
   `initial/temporary.ts`.
1. Delete `delete.ts`.
1. Add the following to the end of `linesToAdd.ts` and `temporary.ts`:

   ```TypeScript
   // Added Line
   // Added Line
   // Added Line
   // Added Line
   // Added Line
   ```

1. Delete five lines from the end of `linesToDelete.ts`, i.e. those set to
   `// Delete Lines – to be deleted`.
1. Commit the changes to your new branch.
1. On the Azure DevOps server, navigate to Repos > Pull Requests.
1. Click "Create a pull request" next to your branch name.
1. On the next page, delete all text from the "Description" field and click
   "Create".
1. If everything is set up correctly, you should see the four pipelines you
   added earlier queued to run.
1. Verify that the pipeline corresponding to
   `step2/pipelines/pipeline-insufficient-history.yaml` fails with the error
   message "Could not access sufficient Git history. Disable 'fetchDepth' (YAML)
   or 'Shallow fetch' under the build process phase settings (classic). Or set
   the threshold sufficiently high."
1. Verify that the pipeline corresponding to
   `step2/pipelines/pipeline-no-auth.yaml` fails with the error message "Could
   not access the OAuth token. Add 'SYSTEM_ACCESSTOKEN' as an environment
   variable (YAML) or enable 'Allow scripts to access OAuth token' under the
   build process phase settings (classic)."
1. Verify that the pipeline corresponding to
   `step2/pipelines/pipeline-no-sources.yaml` fails with the error message "No
   Git enlistment present. Remove 'checkout: none' (YAML) or disable 'Don't sync
   sources' under the build process phase settings (classic)."
1. Verify that the pipeline corresponding to `step2/pipelines/pipeline.yaml`
   succeeds.
1. Verify that the title of the PR is prefixed with "XS:heavy_check_mark:
   :black_small_square:".
1. Verify that the description has been changed to ":x: Please add a
   description.".
1. Verify that a metrics comment has been added with the following details:
   - :heavy_check_mark: Thanks for keeping your pull request small.
   - :heavy_check_mark: Thanks for adding tests.
   - Product code: 30
   - Test code: 30
   - Subtotal: 60
   - Ignored: 30
   - Total: 90
1. Verify that the aforementioned metrics comment is closed.

## Step 5: Retrying

1. On the Azure DevOps server, navigate to your existing PR.
1. Next to the build corresponding to `step2/pipelines/pipeline.yaml`, click
   "Re-queue".
1. Using the timestamp, verify that the metrics comment is not updated.
1. Verify that no additional comments have been added.

## Step 6: Adding Parameters

1. Copy the contents of `step6` to your repo, choosing to replace the older
   files with the newer ones.
1. Commit the changes to your branch.
1. On the Azure DevOps server, navigate to your existing PR.
1. Edit the description to a custom description.
1. Next to the build, click "Re-queue".
1. Verify that the pipeline succeeds.
1. Verify that your description is retained.
1. Verify that the title of the PR is now prefixed with "L:warning:
   :black_small_square:".
1. Verify that the metrics comment has been updated with the following details:
   - :x: Try to keep pull requests smaller than 2 lines of new product code by
     following the Single Responsibility Principle (SRP).
   - :warning: Consider adding additional tests.
   - Product code: 10
   - Test code: 30
   - Subtotal: 40
   - Ignored: 62
   - Total: 102
1. Verify that the aforementioned metrics comment is active.
1. Verify that a closed comment with the text ":exclamation: This file doesn't
   require review." has been added to the first character of all `temporary.ts`,
   `add.ts`, `delete.ts`, `linesToAdd.ts`, `linesToDelete.ts` files. The same
   comment should also be added to `binary.png`.

## Step 7: Ignoring Test Coverage

1. Copy the contents of `step7` to your repo, choosing to replace the older
   files with the newer ones.
1. Commit the changes to your branch.
1. On the Azure DevOps server, navigate to your existing PR.
1. Edit the description to a custom description.
1. Next to the build, click "Re-queue".
1. Verify that the pipeline succeeds.
1. Verify that your description is retained.
1. Verify that the title of the PR is now prefixed with
   "L :black_small_square:".
1. Verify that the metrics comment still has with the following details:
   - :x: Try to keep pull requests smaller than 2 lines of new product code by
     following the Single Responsibility Principle (SRP).
   - Product code: 10
   - Test code: 30
   - Subtotal: 40
   - Ignored: 62
   - Total: 102
1. Verify that the aforementioned metrics comment is active.

## Step 8: Testing Comment Deletion

1. Reply to the comment ":exclamation: This file doesn't require review." in the
   file `linesToAdd.ts` with any arbitrary comment.
1. Copy the contents of `step8` to your repo, choosing to replace the older
   files with the newer ones.
1. Delete `add.ts`.
1. Commit the changes to your branch.
1. On the Azure DevOps server, navigate to your existing PR. The build pipelines
   should be running automatically.
1. Verify that the pipeline succeeds.
1. Verify that there is no ":exclamation: This file doesn't require review."
   comment thread associated with either `add.ts` or `linesToAdd.ts`.
1. Verify that your description is retained.
1. Verify that the title of the PR is still prefixed with
   "L :black_small_square:".
1. Verify that the metrics comment has been updated with the following details:
   - :x: Try to keep pull requests smaller than 2 lines of new product code by
     following the Single Responsibility Principle (SRP).
   - Product code: 15
   - Test code: 30
   - Subtotal: 40
   - Ignored: 48
   - Total: 93
1. Verify that the aforementioned metrics comment is active.

[tfxcli]: https://github.com/Microsoft/tfs-cli
