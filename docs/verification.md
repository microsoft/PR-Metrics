# Verifying Releases

PR Metrics releases include security measures to ensure the integrity and
authenticity of the distributed artifacts. This document explains how to verify
these security features.

## Available Security Features

Each release of PR Metrics includes:

1. **Build Provenance Attestation**: Verifiable proof that the artifact was
   built by GitHub Actions in this repository
1. **Cosign Signature**: Cryptographic signature using Sigstore's keyless
   signing

Both the main artifact (`ms-omex.PRMetrics.vsix`) and the signature bundle
(`ms-omex.PRMetrics.vsix.sigstore.json`) are available on the
[GitHub Releases page][releases].

## Verifying Build Provenance Attestation

Build provenance attestations provide cryptographically verifiable proof about
how, when, and where an artifact was built. This helps ensure the artifact
hasn't been tampered with and was built from the expected source code.

### GitHub CLI Prerequisites

- [GitHub CLI (`gh`)][gh-cli] version 2.49.0 or later

### GitHub CLI Verification Steps

1. Download the VSIX file from the [releases page][releases]:

   ```batchfile
   gh release download {version} --repo microsoft/PR-Metrics --pattern "ms-omex.PRMetrics.vsix"
   ```

1. Verify the attestation:

   ```batchfile
   gh attestation verify ms-omex.PRMetrics.vsix --repo microsoft/PR-Metrics
   ```

1. Expected output (if verification succeeds):

   ```text
   Loaded digest sha256:... for file://ms-omex.PRMetrics.vsix
   Loaded 1 attestation from GitHub API
   ✓ Verification succeeded!

   sha256:... was attested by:
   REPO                PREDICATE_TYPE                  WORKFLOW
   microsoft/PR-Metrics  https://slsa.dev/provenance/v1  .github/workflows/release-publish.yml@refs/heads/main
   ```

### What This Verifies via GitHub CLI

The attestation verification confirms:

- The artifact was built by the official `release-publish.yml` workflow in this
  repository
- The build ran on GitHub Actions infrastructure
- The artifact hasn't been modified since it was built
- The build process is traceable to a specific commit and workflow run

### Using the GitHub API

You can also verify attestations programmatically using the GitHub API:

```powershell
$hash = (Get-FileHash -Path 'ms-omex.PRMetrics.vsix' -Algorithm 'SHA256').Hash.ToLowerInvariant()
$uri = "https://api.github.com/repos/microsoft/PR-Metrics/attestations/sha256:$hash"
$headers = @{ Authorization = "Bearer $env:GITHUB_TOKEN" }
Invoke-RestMethod -Uri $uri -Headers $headers
```

This returns the attestation bundle in JSON format, which you can verify using
standard SLSA verification tools.

## Verifying Cosign Signature

Cosign signatures provide an additional layer of verification using Sigstore's
keyless signing infrastructure. This signature is generated during the release
process and can be verified without needing to manage signing keys.

### Cosign Prerequisites

- [Cosign][cosign-install] version 2.0 or later

### Cosign Verification Steps

1. Download both the VSIX file and the signature bundle:

   ```batchfile
   gh release download {version} --repo microsoft/PR-Metrics --pattern "*.vsix*"
   ```

   This will download:

   - `ms-omex.PRMetrics.vsix` (the artifact)
   - `ms-omex.PRMetrics.vsix.sigstore.json` (the signature bundle)

1. Verify the signature:

   ```batchfile
   cosign verify-blob ms-omex.PRMetrics.vsix ^
     --bundle ms-omex.PRMetrics.vsix.sigstore.json ^
     --certificate-identity-regexp="^https://github.com/microsoft/PR-Metrics/\.github/workflows/release-publish\.yml@refs/heads/main$" ^
     --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
   ```

1. Expected output (if verification succeeds):

   ```text
   Verified OK
   ```

### What This Verifies via Cosign

The cosign signature verification confirms:

- The artifact was signed using GitHub's OIDC token from the release workflow
- The signature was created by a workflow running in the `microsoft/PR-Metrics`
  repository
- The artifact hasn't been modified since it was signed
- The signature is backed by Sigstore's transparency log (Rekor)

### Advanced Verification Options

To verify additional details about the signature, you can use:

```batchfile
cosign verify-blob ms-omex.PRMetrics.vsix ^
  --bundle ms-omex.PRMetrics.vsix.sigstore.json ^
  --certificate-identity-regexp="^https://github.com/microsoft/PR-Metrics/\.github/workflows/release-publish\.yml@refs/heads/main$" ^
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" ^
  --certificate-github-workflow-repository="microsoft/PR-Metrics"
```

This additionally verifies the specific workflow repository that created the
signature.

## Security Guarantees

These verification mechanisms provide the following security guarantees.

### Protection Against Tampering

Both attestations and signatures cryptographically bind the artifact to its
build process. If the artifact is modified after building/signing, verification
will fail. This protects against:

- Malicious modification of downloaded artifacts
- Supply chain attacks where artifacts are replaced with compromised versions
- Accidental corruption during download or storage

### Verifiable Provenance

Build provenance attestations provide a verifiable chain from source code to
artifact:

- **Transparency**: Anyone can verify exactly which commit and workflow produced
  an artifact
- **Traceability**: Each artifact can be traced back to a specific GitHub
  Actions workflow run
- **Accountability**: The build process is tied to GitHub's infrastructure and
  identity system

### Keyless Signing

Cosign's keyless signing eliminates key management overhead while maintaining
security:

- **No Secret Keys**: The signing process uses GitHub's OIDC tokens instead of
  long-lived keys
- **Ephemeral Credentials**: Signing credentials are short-lived and
  automatically rotated
- **Public Transparency Log**: All signatures are recorded in Sigstore's public
  Rekor log
- **Certificate Transparency**: The signing certificates are publicly verifiable

### Combined Assurance

Using both verification methods together provides defense in depth:

- **Attestations** verify the build environment and process (SLSA provenance)
- **Signatures** verify the artifact integrity and authenticity (Sigstore)
- **Complementary**: Each method uses different infrastructure and cryptographic
  approaches

## Verification Best Practices

To maximize security when using PR Metrics:

1. **Always Verify**: Make verification part of your deployment process,
   especially in security-sensitive environments
1. **Verify Before Installation**: Run verification checks before installing the
   VSIX in Azure DevOps or using it in workflows
1. **Automate Verification**: Incorporate verification into your CI/CD
   pipelines:

   ```yaml
   - name: Verify PR Metrics
     run: |
       gh attestation verify ms-omex.PRMetrics.vsix --repo microsoft/PR-Metrics
       cosign verify-blob ms-omex.PRMetrics.vsix \
         --bundle ms-omex.PRMetrics.vsix.sigstore.json \
         --certificate-identity-regexp="^https://github.com/microsoft/PR-Metrics/.github/workflows/release-publish\.yml@refs/heads/main$" \
         --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
   ```

1. **Use Specific Versions**: Pin to specific release versions rather than using
   latest
1. **Review Release Notes**: Check the release notes and discussion for each
   version before deploying

## Troubleshooting

### Verification Fails

If verification fails, do not use the artifact. Possible causes:

- **Downloaded Wrong File**: Ensure you downloaded from the official releases
  page
- **File Corruption**: Re-download the files and try again
- **Network Issues**: Check your internet connection and retry
- **Malicious Tampering**: If repeated downloads fail verification, report it as
  a [security issue][security]

### GitHub CLI Not Available

If you cannot install GitHub CLI, you can use the GitHub API directly (see the
API examples above) or verify signatures using only cosign.

### Cosign Not Available

If you cannot install cosign, you can still verify using GitHub CLI
attestations, which provide strong provenance guarantees.

## Additional Resources

- [GitHub Artifact Attestations Documentation][gh-attestations]
- [Cosign Documentation][cosign-docs]
- [SLSA Framework][slsa]
- [Sigstore Project][sigstore]
- [PR Metrics Security Policy][security]

## Questions and Support

If you have questions about verifying releases or encounter issues with
verification:

1. Check the [troubleshooting guide][troubleshooting]
1. Review existing [GitHub Discussions][discussions]
1. Open a new discussion in the [Q&A category][discussions-qa]

For security concerns, follow the [security policy][security].

[cosign-docs]: https://docs.sigstore.dev/cosign/overview/
[cosign-install]: https://docs.sigstore.dev/cosign/system_config/installation/
[discussions-qa]: https://github.com/microsoft/PR-Metrics/discussions/new?category=q-a
[discussions]: https://github.com/microsoft/PR-Metrics/discussions
[gh-attestations]: https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds
[gh-cli]: https://cli.github.com/
[releases]: https://github.com/microsoft/PR-Metrics/releases
[security]: ../SECURITY.md
[sigstore]: https://www.sigstore.dev/
[slsa]: https://slsa.dev/
[troubleshooting]: troubleshooting.md
