# Azure Pipelines Task

The task can be added to a pipeline as detailed [here][addingtask].

The Azure Pipelines task can run against Azure or GitHub repositories.

For Azure repositories, the task will require access to the PR resources. You
can try remapping `System.AccessToken` to `PR_Metrics_Access_Token` using

```YAML
env:
  PR_METRICS_ACCESS_TOKEN: $(System.AccessToken)
```

However, the scope of `System.AccessToken` may be limited by your system
administrator. In this case, you will need to create a new Personal Access
Token (PAT) with scopes 'Code' > 'Read & write' and 'Pull Request Threads' >
'Read & write', which you can then map to `PR_Metrics_Access_Token`.

For GitHub repositories, you will need to create a PAT according to the
instructions [here][githubpat]. The scope should be 'repos'. The resulting PAT
should then be added to your repository as a secret with the name
`PR_Metrics_Access_Token` according to the instructions [here][githubsecret] and
mapped to `PR_Metrics_Access_Token` within the task definition. Alternatively,
you can use the in-built `GITHUB_TOKEN`.

It is recommended to run the task as one of the first operations in your build,
after code check out is complete. Running the task early in the build process
allows for the title to be updated quickly, avoiding the need for engineers to
wait a long time for the title update.

## YAML

The default input values are expected to be appropriate for most builds.
Therefore, the following YAML definition is recommended:

```YAML
steps:
- task: ms-omex.prmetrics.prmetrics.PRMetrics@1
  displayName: 'PR Metrics'
  env:
    PR_METRICS_ACCESS_TOKEN: $(PR_Metrics_Access_Token)
  continueOnError: true
```

If you wish to modify the inputs, YAML akin the to the following can be used:

```YAML
steps:
- task: ms-omex.prmetrics.prmetrics.PRMetrics@1
  displayName: 'PR Metrics'
  env:
    PR_METRICS_ACCESS_TOKEN: $(PR_Metrics_Access_Token)
  inputs:
    BaseSize: 200
    GrowthRate: 2.0
    TestFactor: 1.0
    AlwaysCloseComment: true
    FileMatchingPatterns: |
      **/*
      !Ignore.cs
    CodeFileExtensions: |
      cs
      ps1
  continueOnError: true
```

## Always Close Comment

The `AlwaysCloseComment` option is not available for GitHub PRs as the main size
and test comment there cannot be open by default.

By default in Azure DevOps, the comment is left open if it requires further
attention, such as when a smaller PR or increased test coverage is suggested. If
this input is set to `true`, the comment will be closed, to prevent it blocking
automatic closure of the PR.

[addingtask]: https://docs.microsoft.com/azure/devops/pipelines/customize-pipeline
[githubpat]: https://docs.github.com/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token
[githubsecret]: https://docs.github.com/actions/reference/encrypted-secrets
