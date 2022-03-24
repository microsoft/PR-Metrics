# Azure Pipelines Task

The task can be added to a pipeline as detailed [here][addingtask].

The Azure Pipelines task can run against Azure or GitHub repositories.

For Azure repositories, the agent running the task must allow access to the
OAuth token. If access is unavailable, the task will generate an error. Should
the OAuth token scope have been limited, you may need to create a new Personal
Access Token (PAT) with scopes 'Code' > 'Read' and 'Pull Request Threads' >
'Read & write', which you can then map to `System.AccessToken` within the task
definition.

For GitHub repositories, you will need to create a PAT according to the
instructions [here][githubpat]. The scope should be 'repos'. The resulting PAT
should then be added to your repository as a secret with the name
`System.AccessToken` according to the instructions [here][githubsecret] and
mapped to `System.AccessToken` within the task definition.

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
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
  continueOnError: true
```

If you wish to modify the inputs, YAML akin the to the following can be used:

```YAML
steps:
- task: ms-omex.prmetrics.prmetrics.PRMetrics@1
  displayName: 'PR Metrics'
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
  inputs:
    BaseSize: 200
    GrowthRate: 2.0
    TestFactor: 1.0
    FileMatchingPatterns: |
      **/*
      !Ignore.cs
    CodeFileExtensions: |
      cs
      ps1
  continueOnError: true
```

[addingtask]: https://docs.microsoft.com/azure/devops/pipelines/customize-pipeline
[githubpat]: https://docs.github.com/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token
[githubsecret]: https://docs.github.com/actions/reference/encrypted-secrets
