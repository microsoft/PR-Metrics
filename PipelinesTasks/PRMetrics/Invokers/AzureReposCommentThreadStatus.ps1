# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    An enumeration of Azure Repos comment thread statuses.
#>

#Requires -Version 5.0

enum AzureReposCommentThreadStatus {
    Active = 1
    Fixed = 2
    WontFix = 3
    Closed = 4
    ByDesign = 5
    Pending = 6
}
