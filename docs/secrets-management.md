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
  permissions on `microsoft/PR-Metrics`. Minted via Azure Key Vault key
  signing in GitHub-hosted workflows (private key never leaves Key Vault) and
  via the gh-aw native `github-app:` block in the agentic
  `Update CI Dependencies` workflow.
- **`PR_METRICS_APP_PRIVATE_KEY`**: GitHub Actions secret holding a mirror of
  the App's RSA private key, used only by the agentic
  `Update CI Dependencies` workflow (gh-aw does not natively support Key Vault
  signing). The Key Vault copy is the source of truth; this mirror is rotated
  manually when the App key rotates.
- **`PR_METRICS_ACCESS_TOKEN`**: Access token passed to the PR Metrics action.
  Environment variable scoped to the workflow/job run; populated with the
  short-lived App installation token described above.
- **ESRP service connection**: Code signing for Azure DevOps marketplace
  releases. Azure DevOps pipeline-scoped.

### Repository variables

Non-secret references used by the App-token-minting composite action:

- `PR_METRICS_APP_CLIENT_ID` – GitHub App client ID
- `PR_METRICS_APP_INSTALLATION_ID` – Installation ID on `microsoft/PR-Metrics`
- `AZURE_CLIENT_ID` – Federated identity client ID
- `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- `AZURE_KEYVAULT_NAME`, `AZURE_KEYVAULT_KEY_NAME`

These are stored as Actions *variables* rather than secrets because they are
not themselves credentials; only the federated identity acting via OIDC can
exercise the corresponding Azure resources.

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
- **App private key (Key Vault)**: Rotated by the repository maintainer when
  required, with a recommended cadence of annually or on suspected compromise.
  Rotation is performed in Key Vault; no GitHub-side change is needed for the
  conventional workflows.
- **`PR_METRICS_APP_PRIVATE_KEY` (mirror)**: When the Key Vault key rotates,
  the mirrored copy in GitHub Actions secrets must be updated by hand so the
  agentic workflow continues to function.
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
