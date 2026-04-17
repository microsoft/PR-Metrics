---
name: update-ci-dependencies
description: >-
  Refreshes pinned CI/CD dependencies in this repository – SHA-pinned actions in
  .github/workflows/, plus task versions and 1ES template refs in
  .github/azure-devops/. Also verifies that the pinned Node.js runtime stays
  consistent across files without bumping its version. Use when asked to update
  CI dependencies, refresh pinned GitHub Actions, bump Azure DevOps task
  versions, update 1ES template tags, audit workflow dependencies, or sync
  Node.js version pins across workflows, pipelines, and package.json.
---

# Update CI Dependencies

Refreshes pinned versions in GitHub Actions workflows and Azure DevOps
pipelines and enforces Node.js runtime consistency.

## When to Use

- Performing a scheduled dependency-refresh sweep before a release.
- Reacting to a CVE that affects a CI dependency.
- Dependabot has stalled or cannot resolve an update.
- A new major version of an Azure DevOps task or 1ES template needs evaluation.
- Verifying the pinned Node.js runtime is consistent across workflows,
  pipelines, and `package.json`.

## Inventory

Catalog every pinned version before editing. Use `grep` to locate each
pattern.

### GitHub Workflows (`.github/workflows/*.yml`)

- **SHA-Pinned Actions**: `uses: owner/repo@<40-char SHA> # vX.Y.Z`. The SHA
  and trailing version comment must stay in sync.
- **Other Pinned Tools**: literal `version:` or `ref:` values in step inputs.

### Azure DevOps Pipelines (`.github/azure-devops/*.yml`)

- **Task Versions**: `task: TaskName@N` (for example, `Npm@1`, `UseNode@1`,
  `EsrpCodeSigning@6`). Only the major version is declared; the latest minor
  or patch resolves at runtime.
- **Template Refs**: `ref: refs/tags/<tag>` inside `resources.repositories`.
  1ES templates use the moving `release` tag; pin a specific tag only when
  compliance requires it.

## Process

1. Ensure the working tree is clean: `git status` should show no uncommitted
   changes on the target branch.
1. For each SHA-pinned GitHub Action, resolve the latest release and tag SHA:

   ```bash
   gh api repos/<owner>/<repo>/releases/latest --jq '.tag_name'
   gh api repos/<owner>/<repo>/git/refs/tags/<tag> --jq '.object.sha'
   ```

   Update the SHA and the trailing `# vX.Y.Z` comment in one edit – never one
   without the other. If the tag points to an annotated tag object, dereference
   it with a second `gh api` call against the tag object.

1. For each Azure DevOps task, check the task's latest major version in the
   [Azure Pipelines task reference][ado-tasks]. Bump the major version only
   after reviewing its release notes and adjusting inputs accordingly. This
   includes `UseNode@1` itself (the task version), but never the `version:`
   input it receives.
1. For template refs, list available tags and compare with the current pin:

   ```bash
   git ls-remote --tags <repo-url>
   ```

   The 1ES templates are hosted in Azure DevOps; authenticate via `az` if the
   listing is restricted.

1. Save changes while preserving formatting: trailing newlines, comment spacing,
   and two-space indentation.

## Node.js Version Consistency

The pinned Node.js runtime must match everywhere it appears. This skill does
not bump Node.js to a newer version – that is a deliberate, standalone change
– but it flags and resolves inconsistencies.

Locate every occurrence with `grep`:

- `.github/workflows/*.yml` – `node-version: X.Y.Z` under `actions/setup-node`.
- `.github/azure-devops/*.yml` – `UseNode@1` with `version: X.Y.Z`.
- `package.json` – `engines.node`.
- `.nvmrc` if present.

If values diverge, align them on the single intended pin. Prefer the value
already set by the most recent deliberate bump (check `git log` on whichever
file changed most recently). Do not change the value itself.

## Output Format

A single commit (or pull request) whose diff touches only CI definition files
under `.github/workflows/` and `.github/azure-devops/`, with:

- Each SHA-pinned action updated atomically (SHA plus `# vX.Y.Z` comment).
- Each Azure DevOps task major version either left unchanged or bumped
  together with any required input adjustments.
- Each 1ES template ref left on its moving tag unless a compliance reason
  dictates otherwise.
- Node.js pins aligned across files if they had diverged.

The commit message should start with `chore:` and reference the dependency
class updated (for example, `chore: refresh GitHub Action pins`).

## Constraints

- **Never desynchronize SHA and version comment**: always update both, in the
  same edit.
- **Never blindly bump an Azure DevOps task major version**: review release
  notes and adjust inputs first.
- **Never bump the Node.js runtime value** from this skill – that is a
  separate, deliberate change.
- **Never duplicate a Dependabot PR**: if Dependabot already has an open PR
  for an action, rebase or merge it rather than producing a competing change.
- **Never hard-pin a 1ES template ref without justification**: the `release`
  tag is intentionally moving.
- **Never modify files outside `.github/workflows/`,
  `.github/azure-devops/`, `package.json`, or `.nvmrc`** during this task.

## Quick Reference

| Dependency Type   | Files                        | Update Source          |
| ----------------- | ---------------------------- | ---------------------- |
| GitHub Action     | `.github/workflows/*.yml`    | `gh api` latest tag    |
| Azure DevOps Task | `.github/azure-devops/*.yml` | ADO task reference     |
| 1ES Template Ref  | `.github/azure-devops/*.yml` | `git ls-remote --tags` |

## Verification

- Lint YAML with the `Build` workflow's `validate-linter` job (Super-Linter) or
  locally: `npx yaml-lint .github/workflows/*.yml .github/azure-devops/*.yml`.
- Confirm each GitHub Action SHA still matches its version comment:

  ```bash
  gh api "repos/<owner>/<repo>/git/refs/tags/v<tag>" --jq '.object.sha'
  ```

- Push to a branch and confirm the `Build` workflow passes on GitHub. For Azure
  DevOps, run `pr-test.yml` against the branch.
- Re-run `npm run build:package` if any action-side behavior shifted, so `dist/`
  stays consistent.

[ado-tasks]: https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/
