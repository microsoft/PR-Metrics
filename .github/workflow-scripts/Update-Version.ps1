# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [Parameter(Mandatory)]
    [int]$Major,

    [Parameter(Mandatory)]
    [int]$Minor,

    [Parameter(Mandatory)]
    [int]$Patch
)

$version = "$Major.$Minor.$Patch"

function Update-FileContent
{
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [hashtable[]]$Replacements
    )

    $content = Get-Content -Path $Path -Raw
    foreach ($replacement in $Replacements)
    {
        $content = $content -replace $replacement.Pattern, $replacement.Value
    }

    # Remove the trailing newline added by Get-Content -Raw.
    if ($PSCmdlet.ShouldProcess($Path, 'Update file content'))
    {
        Set-Content -Path $Path -Value $content.Substring(0, $content.Length - 1)
    }
}

# Define shared replacement patterns.
$versionPattern = '\d+\.\d+\.\d+'
$versionJsonReplacement = @{ Pattern = "`"version`": `"$versionPattern`""; Value = "`"version`": `"$version`"" }
$friendlyNameReplacement = @{ Pattern = "PR Metrics v$versionPattern"; Value = "PR Metrics v$version" }
$userAgentReplacement = @{ Pattern = "PRMetrics/v$versionPattern"; Value = "PRMetrics/v$version" }
$versionComponentReplacements = @(
    @{ Pattern = '"Major": \d+'; Value = "`"Major`": $Major" }
    @{ Pattern = '"Minor": \d+'; Value = "`"Minor`": $Minor" }
    @{ Pattern = '"Patch": \d+'; Value = "`"Patch`": $Patch" }
)

# GitHub Action reference.
Update-FileContent -Path 'README.md' -Replacements @(
    @{ Pattern = "PR-Metrics@v$versionPattern"; Value = "PR-Metrics@v$version" }
)

# Package and extension manifests.
Update-FileContent -Path 'package.json' -Replacements @($versionJsonReplacement)
Update-FileContent -Path 'src/vss-extension.json' -Replacements @($versionJsonReplacement)

# Azure DevOps task definitions.
Update-FileContent -Path 'src/task/task.json' -Replacements (@($friendlyNameReplacement) + $versionComponentReplacements)
Update-FileContent -Path 'src/task/task.loc.json' -Replacements $versionComponentReplacements
Update-FileContent -Path 'src/task/Strings/resources.resjson/en-US/resources.resjson' -Replacements @($friendlyNameReplacement)

# Source code user-agent.
Update-FileContent -Path 'src/task/src/repos/gitHubReposInvoker.ts' -Replacements @($userAgentReplacement)
Update-FileContent -Path 'src/task/tests/repos/gitHubReposInvoker.spec.ts' -Replacements @($userAgentReplacement)

# Release workflow defaults.
Update-FileContent -Path '.github/workflows/release-phase-1.yml' -Replacements @(
    @{ Pattern = '(?<Yaml>major: )\d+'; Value = '${Yaml}' + $Major }
    @{ Pattern = '(?<Yaml>minor: )\d+'; Value = '${Yaml}' + $Minor }
    @{ Pattern = '(?<Yaml>patch: )\d+'; Value = '${Yaml}' + $Patch }
)
