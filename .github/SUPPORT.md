# Support

PR Metrics is provided via Microsoft DevLabs.

Microsoft DevLabs is an outlet for experiments from Microsoft. Experiments that
represent some of the latest ideas around developer tools. Solutions in this
category are designed for broad usage and you are encouraged to use and provide
feedback on them. However, these extensions are not supported nor are any
commitments made as to their longevity.

## Support Lifecycle

PR Metrics follows a rolling release model. Only the **latest release** is
actively supported with bugfixes and security updates. Previous releases do not
receive patches; consumers should upgrade to the latest version to receive
fixes.

Each release is identified by a [Semantic Versioning][semver] number (e.g.,
`v1.0.0`). Patch and minor releases may be issued to address bugs or security
issues. A new release supersedes all prior releases.

## Security Updates

Security vulnerabilities reported through the [security policy][securitypolicy]
are assessed and, where applicable, addressed in the next release. Critical
security issues may result in an expedited patch release.

Once a new version is published, the previous version no longer receives
security updates. Consumers should always run the latest version to benefit from
the most recent security fixes.

## End of Life

As a Microsoft DevLabs project, no formal end-of-life commitments are made.
Should the project become inactive, the last published release will remain
available on the [GitHub Releases page][githubreleases] and the
[Visual Studio Marketplace][marketplace], but will not receive further updates,
including security patches.

Consumers will be notified of any planned end of life through a
[GitHub Discussion][githubdiscussions] and an update to this document.

## Getting Help

- **Bug Reports and Feature Requests**: [GitHub Issues][githubissues]
- **General Questions**: [GitHub Discussions][githubdiscussions]
- **Security Vulnerabilities**: [SECURITY.md][securitypolicy]

[githubdiscussions]: https://github.com/microsoft/PR-Metrics/discussions
[githubissues]: https://github.com/microsoft/PR-Metrics/issues
[githubreleases]: https://github.com/microsoft/PR-Metrics/releases
[marketplace]: https://marketplace.visualstudio.com/items?itemName=ms-omex.PRMetrics
[securitypolicy]: ../SECURITY.md
[semver]: https://semver.org/
