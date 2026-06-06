# Secrets Management

This document describes the policy for managing secrets and credentials used by
the PR Metrics project.

## Secrets in Use

The following secrets and credentials are used across the project's CI/CD
pipelines.

- **`GITHUB_TOKEN`**: GitHub-provided token for workflow operations.
  Per-workflow run, auto-expires.
- **`pr-metrics-access-app` GitHub App installation token**: One-hour
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
  Environment variable scoped to the workflow/job run; populated with the
  short-lived App installation token described above, in both GitHub Actions and
  the Azure DevOps test pipeline.
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
