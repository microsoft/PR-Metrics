# Governance

This document describes the governance structure, project members, and roles for
[PR Metrics](https://github.com/microsoft/PR-Metrics).

## Project Owner

PR Metrics is owned and maintained by the
[Microsoft OMEX](https://github.com/orgs/microsoft/teams/omex) team within
Microsoft. The OMEX team has overall responsibility for the project's direction,
releases, and security.

## Members with Access to Sensitive Resources

The following table lists individuals and teams with access to sensitive
resources, including the repository, release pipelines, and signing
infrastructure.

| Member                  | Role       | Sensitive Resources                                                 |
| ----------------------- | ---------- | ------------------------------------------------------------------- |
| @microsoft/omex         | Team       | Code review ownership (CODEOWNERS), repository maintainer access    |
| @muiriswoulfe           | Maintainer | Repository write access, release initiation, CI/CD configuration    |
| Repository maintainers  | Maintainer | Repository write access, pull request approval                      |
| Microsoft GitHub admins | Admin      | Repository administration, branch protection, security settings     |
| Dependabot              | Automation | Automated dependency pull requests for GitHub Actions               |
| CLA bot                 | Automation | Contributor License Agreement verification on pull requests         |

Access to the release signing infrastructure (Sigstore for GitHub releases,
ESRP for Azure DevOps marketplace) is restricted to CI/CD pipelines and cannot
be invoked by individual contributors.

## Roles and Responsibilities

### Maintainer

- Reviews and approves pull requests.
- Triages issues and feature requests.
- Initiates and publishes releases.
- Maintains CI/CD pipelines and repository configuration.
- Responds to security reports in coordination with the
  [Microsoft Security Response Center (MSRC)](https://msrc.microsoft.com/).

### Contributor

- Submits bug reports, feature requests, and pull requests.
- Agrees to the
  [Contributor License Agreement (CLA)](https://opensource.microsoft.com/cla)
  before contributions are accepted.
- Follows the coding style and contribution guidelines described in
  [CONTRIBUTING.md](https://github.com/microsoft/PR-Metrics/blob/main/.github/CONTRIBUTING.md).

### Automation

- **Dependabot**: Opens pull requests to update GitHub Actions dependencies on a
  quarterly schedule.
- **CLA bot**: Verifies that contributors have signed the Microsoft CLA.
- **CI/CD pipelines**: Run automated tests, linting, security scanning, and
  release signing.

## Collaborator Review Policy

Before any contributor is granted escalated permissions to sensitive resources
(e.g., repository write access, merge approval, release pipeline access, or
access to secrets), the following review process is required:

1. **Nomination**: An existing maintainer nominates the contributor based on a
   sustained history of quality contributions to the project.
1. **Identity Verification**: The contributor's identity is verified through
   their association with a known trusted organisation (e.g., Microsoft) or
   through a demonstrable history of open-source contributions.
1. **Approval**: At least one existing maintainer must approve the permission
   grant.
1. **Scope**: Permissions are granted at the minimum level required for the
   contributor's role. Write access does not imply release or administrative
   permissions.

Access to signing infrastructure (Sigstore for GitHub releases, ESRP for Azure
DevOps marketplace) is restricted to automated CI/CD pipelines and cannot be
granted to individual contributors.

## Decision-Making

Decisions are made through
[GitHub Issues](https://github.com/microsoft/PR-Metrics/issues) for proposals
and [Pull Requests](https://github.com/microsoft/PR-Metrics/pulls) for code
changes. New extensions or significant changes must be discussed via GitHub
Issues before implementation, as described in
[CONTRIBUTING.md](https://github.com/microsoft/PR-Metrics/blob/main/.github/CONTRIBUTING.md).
