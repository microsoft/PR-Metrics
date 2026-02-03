# Troubleshooting

If PR Metrics doesn't work for you, please follow the below steps to
troubleshoot the issue.

You should try all these steps before opening an issue. If you do open an issue,
please include the output of all the steps you tried.

## Check Pipeline Creation Date

First, check the pipeline creation date. If you are using Azure DevOps and see a
notification that insufficient Git history is available, this may be resulting
from
[a change in the September 2022 Azure DevOps sprint 209 update][azuredevops209].
Pipelines created after this release will have shallow fetch set by default,
unlike in earlier releases. This issue can be resolved by adding the following
as the first step in your pipeline jobs:

```yaml
- checkout: self
  displayName: Checkout
  fetchDepth: 0
```

## Checking Git Output

Next, run the following Git command as part of your build pipeline.

```batchfile
git diff --numstat --ignore-all-space origin/<target>...pull/<pull_request_id>/merge
```

- `<target>` is typically set to `main` and represents the branch to which you
  are merging the PR.
- `<pull_request_id>` is the ID of the pull request that you are merging.
  `pull/<pull_request_id>/merge` is a temporary branch created by the runtime
  that contains the changes in the PR.

This is the command that PR Metrics uses to determine the number of lines
changed in the PR. If this command doesn't work, then PR Metrics won't work
either, so this is often useful for determining the source of the errors.

## Debug Mode

Next, you should try running PR Metrics in debug mode. This will output
additional information to the logs, which can help you determine the source of
the issue.

### Azure Pipelines

If you are using Azure Pipelines, you can enable debug mode by setting the
`system.debug` variable to `true` in your pipeline.

```yaml
variables:
  system.debug: true
```

More information can be located in the
[Azure Pipelines troubleshooting documentation][azurepipelines].

### GitHub Actions

If you are using GitHub Actions, you can enable debug mode by setting the
`ACTIONS_STEP_DEBUG` environment variable to `true` in your workflow.

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

More information can be located in the
[GitHub Actions debugging documentation][github].

[azuredevops209]: https://learn.microsoft.com/azure/devops/pipelines/yaml-schema/steps-checkout#shallow-fetch
[azurepipelines]: https://learn.microsoft.com/azure/devops/pipelines/troubleshooting/review-logs
[github]: https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
