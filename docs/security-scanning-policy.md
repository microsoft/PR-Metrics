# Security Scanning Policy

This document defines the policies for Software Composition Analysis (SCA),
Static Application Security Testing (SAST), and vulnerability exploitability
assessment within the PR Metrics project.

## Software Composition Analysis

### Tools

- [Dependabot alerts](https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
  monitor dependencies for known vulnerabilities.
- [CodeQL](https://codeql.github.com/) analyses dependency usage patterns for
  security issues on every pull request.
- [Component Governance](https://docs.opensource.microsoft.com/tools/cg/)
  performs dependency detection in Azure DevOps pipelines.

### Remediation Threshold

All SCA findings are triaged using the following thresholds:

| Severity | Remediation Target        |
| -------- | ------------------------- |
| Critical | Next patch release        |
| High     | Next patch release        |
| Medium   | Next scheduled release    |
| Low      | Next scheduled release    |

Dependabot alerts classified as critical or high severity are treated as
blocking and must be resolved before the next release. Medium and low severity
findings are addressed in the next scheduled release cycle.

### Pre-Release Policy

Before any release, the following SCA requirements must be satisfied:

1. No unresolved Dependabot alerts of critical or high severity exist in the
   repository.
1. All npm dependencies have been updated to their latest compatible versions
   via the
   [`release-initiate.yml`](https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/release-initiate.yml)
   workflow.
1. Component Governance detection in the Azure DevOps pipeline has completed
   without blocking findings.
1. Any findings that are assessed as non-exploitable in the context of
   PR Metrics are documented in the [VEX section](#vulnerability-exploitability-exchange)
   below.

### Automated Enforcement

All changes to the codebase are automatically evaluated by:

- **CodeQL**: Runs on every pull request via the `Validate` job in
  [`build.yml`](https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/build.yml).
  The CodeQL check is a required status check that must pass before merging.
- **Dependabot alerts**: Configured at the repository level. The repository
  rulesets require that automated checks pass before merging.
- **Component Governance**: Runs in the Azure DevOps PR pipeline with the M365
  Guardian policy.

## Static Application Security Testing

### Tools

- [CodeQL](https://codeql.github.com/) with extended query sets:
  `code-quality`, `code-scanning`, `security-and-quality`,
  `security-experimental`, `security-extended`.
- [ESLint](https://eslint.org/) with security-related rules via the TypeScript
  parser.
- [CredScan](https://secdevtools.azurewebsites.net/helpcredscan.html)
  for credential scanning in Azure DevOps pipelines.
- [PoliCheck](https://eng.ms/docs/security-compliance-identity-and-management-scim/security/policheck)
  for content policy verification in Azure DevOps pipelines.

### Remediation Threshold

All SAST findings are triaged using the following thresholds:

| Severity | Remediation Target        |
| -------- | ------------------------- |
| Critical | Immediate (blocks merge)  |
| High     | Immediate (blocks merge)  |
| Medium   | Before next release       |
| Low      | Best effort               |

Critical and high severity SAST findings block pull request merging via required
status checks. Medium severity findings must be resolved before the next
release. Low severity findings are addressed on a best-effort basis.

### Automated Enforcement

All changes to the codebase are automatically evaluated by:

- **CodeQL**: Required status check on every pull request. Analyses
  JavaScript/TypeScript code using security-and-quality, security-experimental,
  and security-extended query sets.
- **Super-Linter**: Runs ESLint, Gitleaks, and additional linters on every
  pull request.
- **CredScan**: Runs in Azure DevOps pipelines with a suppressions file for
  known non-sensitive patterns.
- **Guardian PostAnalysis**: Enforces the M365 security policy in Azure DevOps
  pipelines.

Findings declared as non-exploitable are suppressed with documented
justification in the relevant configuration files (e.g.,
[`CredScanSuppressions.json`](https://github.com/microsoft/PR-Metrics/blob/main/.github/azure-devops/CredScanSuppressions.json),
[`gitleaks.toml`](https://github.com/microsoft/PR-Metrics/blob/main/.github/linters/gitleaks.toml)).

## Vulnerability Exploitability Exchange

### Policy

When a vulnerability is identified in a dependency that does not affect
PR Metrics (e.g., the vulnerable code path is not reachable), the finding is
assessed and documented as non-exploitable. This assessment is communicated via:

- **GitHub Security Advisories**: The project uses
  [GitHub Security Advisories](https://github.com/microsoft/PR-Metrics/security/advisories)
  to publish exploitability assessments for known vulnerabilities.
- **Dependabot alert dismissals**: Non-exploitable Dependabot alerts are
  dismissed with a documented reason (e.g., "Vulnerable code not reachable")
  that serves as the exploitability assessment.

### Current Status

As of the last assessment, no known vulnerabilities in project dependencies have
been identified as non-exploitable and requiring VEX documentation. All known
vulnerabilities are either:

- Resolved through dependency updates, or
- Actively being addressed per the remediation thresholds above.

This section will be updated when non-exploitable vulnerabilities are identified
and assessed.
