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

$Version = "$Major.$Minor.$Patch"

function Update-FileContent
{
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [hashtable[]]$Replacements,

        [switch]$Raw
    )

    $getContentParams = @{ Path = $Path }
    if ($Raw)
    {
        $getContentParams['Raw'] = $true
    }

    $content = Get-Content @getContentParams
    foreach ($replacement in $Replacements)
    {
        $content = $content -replace $replacement.Pattern, $replacement.Value
    }

    if ($Raw)
    {
        # Remove the trailing newline added by Get-Content -Raw.
        Set-Content -Path $Path -Value $content.Substring(0, $content.Length - 1)
    }
    else
    {
        Set-Content -Path $Path -Value $content
    }
}

# Define shared replacement patterns.
$VersionJsonReplacement = @{ Pattern = '"version": "\d+\.\d+\.\d+"'; Value = "`"version`": `"$Version`"" }
$FriendlyNameReplacement = @{ Pattern = 'PR Metrics v\d+\.\d+\.\d+'; Value = "PR Metrics v$Version" }
$UserAgentReplacement = @{ Pattern = 'PRMetrics\/v\d+\.\d+\.\d+'; Value = "PRMetrics/v$Version" }
$VersionComponentReplacements = @(
    @{ Pattern = '"Major": \d+'; Value = "`"Major`": $Major" }
    @{ Pattern = '"Minor": \d+'; Value = "`"Minor`": $Minor" }
    @{ Pattern = '"Patch": \d+'; Value = "`"Patch`": $Patch" }
)

Update-FileContent -Path 'README.md' -Replacements @(
    @{ Pattern = 'PR-Metrics@v\d+\.\d+\.\d+'; Value = "PR-Metrics@v$Version" }
)

Update-FileContent -Path 'package.json' -Replacements @($VersionJsonReplacement)
Update-FileContent -Path 'src/vss-extension.json' -Replacements @($VersionJsonReplacement)

Update-FileContent -Path 'src/task/task.json' -Replacements (@($FriendlyNameReplacement) + $VersionComponentReplacements)
Update-FileContent -Path 'src/task/task.loc.json' -Replacements $VersionComponentReplacements

Update-FileContent -Path 'src/task/Strings/resources.resjson/en-US/resources.resjson' -Replacements @($FriendlyNameReplacement)

Update-FileContent -Path 'src/task/src/repos/gitHubReposInvoker.ts' -Replacements @($UserAgentReplacement)
Update-FileContent -Path 'src/task/tests/repos/gitHubReposInvoker.spec.ts' -Replacements @($UserAgentReplacement)

# Increment patch for next release.
$IncrementedPatch = $Patch + 1

# .github/workflows/release-phase-1.yml (self-update with incremented patch).
Update-FileContent -Path '.github/workflows/release-phase-1.yml' -Raw -Replacements @(
    @{ Pattern = '(?<Yaml>major: )\d+'; Value = '${Yaml}' + $Major }
    @{ Pattern = '(?<Yaml>minor: )\d+'; Value = '${Yaml}' + $Minor }
    @{ Pattern = '(?<Yaml>patch: )\d+'; Value = '${Yaml}' + $IncrementedPatch }
)
