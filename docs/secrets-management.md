# Secrets Management

This document describes the policy for managing secrets and credentials used by
the PR Metrics project.

## Secrets in Use

The following secrets and credentials are used across the project's CI/CD
pipelines.

| Secret                    | Purpose                                            | Scope                         |
| ------------------------- | -------------------------------------------------- | ----------------------------- |
| `GITHUB_TOKEN`            | GitHub-provided token for workflow operations       | Per-workflow run, auto-expires |
| `PR_METRICS_TOKEN`        | PAT for operations requiring elevated permissions  | Repository-scoped             |
| `PR_METRICS_ACCESS_TOKEN` | Access token passed to the PR Metrics action        | Per-workflow run               |
| ESRP service connection   | Code signing for Azure DevOps marketplace releases | Azure DevOps pipeline-scoped  |

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
- **`PR_METRICS_TOKEN`**: Reviewed and rotated periodically by the repository
  maintainer. The token is scoped to the minimum permissions required for its
  purpose.
- **ESRP Credentials**: Managed by the Microsoft ESRP service and rotated
  according to Microsoft's internal policies.

## Prevention

The project employs multiple layers of defence to prevent accidental secret
exposure:

- [Gitleaks](https://github.com/gitleaks/gitleaks) scans every pull request
  for accidentally committed secrets via
  [Super-Linter](https://github.com/super-linter/super-linter).
- Secrets are passed to processes via environment variables, not command-line
  arguments, preventing exposure in process listings.
- CI/CD pipeline logs are configured to mask secret values automatically.
- The [security assessment](security-assessment.md) identifies access token
  exposure as a tracked threat with specific mitigations.
