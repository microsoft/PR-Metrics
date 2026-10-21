# Secrets Management

This document describes the policy for managing secrets and credentials used by
the PR Metrics project.

## Secrets in Use

The following secrets and credentials are used across the project's CI/CD
pipelines.

- **`GITHUB_TOKEN`**: GitHub-provided token for workflow operations.
  Per-workflow run, auto-expires.
- **`microsoft-pr-metrics` GitHub App installation token**: One-hour
  installation token minted at job start for operations requiring elevated
  permissions on `microsoft/PR-Metrics`. The App JWT is signed by Azure Key
  Vault – the App private key lives in the vault as a non-exportable key and is
  never exported – then exchanged for the installation token. GitHub Actions
  workflows mint it through the `mint-github-app-token` composite action
  (`azure/login` OIDC, then Key Vault signing); the Azure DevOps pipeline mints
  it through the shared `New-GitHubAppToken.ps1` under its workload identity
  federation service connection. Each job requests only the permissions it needs
  – for example, `contents: write` for branch pushes or `pull-requests: write`
  for PR comments.
- **App signing key (Azure Key Vault)**: The App's RSA private key, imported
  into the `PRMetrics-KeyVault` Azure Key Vault as a non-exportable key named
  `github-app-signing-key`. Key Vault performs the RS256 signing of the App JWT,
  so the private key is never read by CI. The signing identities – a GitHub OIDC
  federated identity for GitHub Actions and the `PR Metrics` workload identity
  federation service connection for Azure DevOps – hold the
  `Key Vault Crypto User` role on the vault.
- **`PR_METRICS_ACCESS_TOKEN`**: Access token passed to the PR Metrics action.
  The candidate GitHub Actions job uses its limited native `GITHUB_TOKEN`.
  Trusted production jobs can use the short-lived App installation token
  described above. Azure PR validation must not have access to the production
  signing service connection.
- **ESRP service connection**: Code signing for Azure DevOps marketplace
  releases. Azure DevOps pipeline-scoped.

## Storage

All secrets are stored exclusively in platform-managed secret stores:

- **GitHub Secrets**: Repository-level secrets configured via the GitHub
  repository settings. Secrets are encrypted at rest and are not exposed in
  workflow logs.
- **Azure DevOps Variable Groups and Service Connections**: Pipeline-scoped
  secrets for Azure DevOps builds and releases. Managed through Azure DevOps
  project settings with role-based access controls.
- **Azure Key Vault**: The App signing key (`github-app-signing-key` in the
  `PRMetrics-KeyVault` vault), stored as a non-exportable key so the private key
  material cannot be exported. Access is governed by Azure role-based access
  control.

Secrets are **never** stored in source code, configuration files, or version
control. The `.gitignore` file excludes common environment file patterns
(`.env`, `.env.local`, `.env.*.local`).

## Access Control

- **GitHub Secrets**: Accessible only to workflows running in the repository.
  Repository administrators control which secrets are available. Secrets are not
  available to workflows triggered from forks.
- **Azure DevOps Secrets**: Scoped to specific pipelines and service
  connections. Access is restricted by Azure DevOps project-level role-based
  access controls.
- **`GITHUB_TOKEN`**: Automatically provisioned by GitHub for each workflow
  run. Each workflow sets `permissions: {}` at the top level, granting no
  permissions by default; individual jobs request only the minimum permissions
  required.

## Pull Request Trust Boundary

The PR-controlled Build workflow has no production environment, OIDC permission,
or App-token mint step. Its PR Metrics job builds and runs the candidate action
with `contents: read` and `pull-requests: write`. Native workflow tokens must
not be allowed to approve pull requests or bypass protected `main`.

The `pr-automation.yml` controller uses `workflow_run` and checks out only its
immutable default-branch workflow SHA. It validates the source Build workflow,
repository, event, attempt, PR, branch, and head SHA through authenticated API
metadata. It does not trust PR numbers or branch names supplied in artifacts.
Forks are not eligible for privileged automation.

Only the controller's separate generated-commit and approval jobs use the
`production` environment and OIDC. They mint fixed `contents: write` and
`pull_requests: write` App tokens, respectively. Metadata uses the native read
token; the App token is selected only for the required mutation.

Generated patches are untrusted data. The controller downloads one expected
file from the validated producer attempt, uses a temporary Git index without a
PR checkout, and reads binary contents from Git blobs. It rejects unsafe paths,
symlinks, gitlinks, and unsupported file modes. Empty patches do not require a
`contents-write` token. The signed commit mutation specifies `expectedHeadOid`;
new generated heads must pass fresh candidate checks.

A failed-job rerun can reuse a successful producer from the same run and source
SHA only after validating that earlier attempt. The artifact keeps its original
producer attempt and time bounds. If Update Code ran again, its new artifact is
required; an earlier artifact is not a fallback.

Dependabot approval requires verified bot identity, GitHub's verified signature
and committer metadata, and the complete PR commit history. Generated
descendants also require a provenance artifact from a successful default-branch
controller job, bound to the repository, PR, source attempt, parent, and
generated SHA. Commit trailers only locate that record. Missing or expired
records require human review; API failures are reported as errors.

Approval and head-check helpers derive the expected SHA from the validated
context's `PullRequest.head.sha`; they do not accept a separate SHA argument.
This captured value is compared with fresh API responses, not replaced by them.
The original source SHA remains `Run.head_sha` for artifact validation,
generated-commit parents, and source status results. Historical run and attempt
identifiers remain explicit for reruns and provenance checks.

Generated output eligible for automatic approval is limited to the action bundle
and resources, task source and test TypeScript files, documentation under
`docs`, and the two generated license files. Generated workflow, dependency,
build, and security-configuration changes require human review. Provenance
proves the generation origin, not dependency safety. All required tests and
human-review rules remain in force. Reviews specify `commit_id`, and the
controller withdraws its review if the head changes during submission.

## Rotation

- **`GITHUB_TOKEN`**: Rotated automatically by GitHub for each workflow run.
  No manual rotation is required.
- **App installation tokens**: Minted per job with a one-hour lifetime and
  discarded at job end. No standing token exists to rotate.
- **App signing key**: The App's RSA private key. Rotation is a runbook, not
  automatic: generate a new private key in the GitHub App settings (the App may
  hold up to 25 keys, so the current key stays valid for a zero-downtime swap),
  import it as a new version of the Key Vault key, confirm a pipeline run
  succeeds on it, then delete the superseded key in the GitHub App settings.
  Rotate at least quarterly or immediately on suspected compromise.
- **ESRP Credentials**: Managed by the Microsoft ESRP service and rotated
  according to Microsoft's internal policies.

## Prevention

The project employs multiple layers of defense to prevent accidental secret
exposure:

- [Gitleaks][gitleaks] scans every pull request for accidentally committed
  secrets via [Super-Linter][superlinter].
- Secrets are passed to processes via environment variables, not command-line
  arguments, preventing exposure in process listings.
- CI/CD pipeline logs are configured to mask secret values automatically.
- The [security assessment][securityassessment] identifies access token
  exposure as a tracked threat with specific mitigations.

[gitleaks]: https://github.com/gitleaks/gitleaks
[securityassessment]: security-assessment.md
[superlinter]: https://github.com/super-linter/super-linter
