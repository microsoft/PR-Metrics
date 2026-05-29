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
  permissions on `microsoft/PR-Metrics`. Minted by
  `actions/create-github-app-token` from the App private key
  (`PR_METRICS_APP_PRIVATE_KEY`); the agentic `Update CI Dependencies` workflow
  mints the same token through gh-aw's native `github-app:` block.
- **`PR_METRICS_APP_PRIVATE_KEY`**: GitHub Actions secret holding the App's RSA
  private key. Every workflow that needs the App installation token reads this
  secret via `actions/create-github-app-token`.
- **`PR_METRICS_ACCESS_TOKEN`**: Access token passed to the PR Metrics action.
  Environment variable scoped to the workflow/job run; populated with the
  short-lived App installation token described above.
- **ESRP service connection**: Code signing for Azure DevOps marketplace
  releases. Azure DevOps pipeline-scoped.

### Repository variables

Non-secret references used when minting the App installation token:

- `PR_METRICS_APP_CLIENT_ID` – GitHub App client ID

This is stored as an Actions *variable* rather than a secret because the client
ID is not itself a credential.

## Storage

All secrets are stored exclusively in platform-managed secret stores:

- **GitHub Secrets**: Repository-level secrets configured via the GitHub
  repository settings. Secrets are encrypted at rest and are not exposed in
  workflow logs.
- **Azure DevOps Variable Groups and Service Connections**: Pipeline-scoped
  secrets for Azure DevOps builds and releases. Managed through Azure DevOps
  project settings with role-based access controls.

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
- **`PR_METRICS_APP_PRIVATE_KEY`**: The App's RSA private key. Rotate by
  generating a new key for the App and updating the GitHub Actions secret, with
  a recommended cadence of annually or on suspected compromise.
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
