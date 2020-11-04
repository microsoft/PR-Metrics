# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class invoking Azure Repos REST APIs.
#>

#Requires -Version 5.0

class AzureReposInvoker {
    AzureReposInvoker() {
        [Logger]::Log('* [AzureReposInvoker]::new()')
        $this.BaseUri = ("$env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI$env:SYSTEM_TEAMPROJECT/_apis/git/repositories/" +
                         "$env:BUILD_REPOSITORY_ID/pullRequests/$env:SYSTEM_PULLREQUEST_PULLREQUESTID")
        $this.OAuthHeader = @{
            Authorization = "Bearer $env:SYSTEM_ACCESSTOKEN"
        }
    }

    [PSCustomObject] GetDetails() {
        [Logger]::Log('* [AzureReposInvoker]::GetDetails()')
        return $this.InvokeGetMethod('')
    }

    [PSCustomObject] GetIterations() {
        [Logger]::Log('* [AzureReposInvoker]::GetIterations()')
        return $this.InvokeGetMethod('/iterations')
    }

    [PSCustomObject] GetCommentThreads() {
        [Logger]::Log('* [AzureReposInvoker]::GetCommentThreads()')
        return $this.InvokeGetMethod('/threads')
    }

    [void] SetDetails([string] $description, [string] $title) {
        [Logger]::Log('* [AzureReposInvoker]::SetDetails()')
        if ([string]::IsNullOrWhiteSpace($description) -and [string]::IsNullOrWhiteSpace($title)) {
            return
        }

        $title = $title -Replace "`"", "\`""
        if ([string]::IsNullOrWhiteSpace($description)) {
            $body = "{`"title`":`"$title`"}"
        }
        elseif ([string]::IsNullOrWhiteSpace($title)) {
            $body = "{`"description`":`"$description`"}"
        }
        else {
            $body = "{`"description`":`"$description`",`"title`":`"$title`"}"
        }

        $this.InvokeActionMethod('PATCH', '', $body)
    }

    [void] SetCommentThreadStatus([int] $commentThreadId, [AzureReposCommentThreadStatus] $status) {
        [Logger]::Log('* [AzureReposInvoker]::SetCommentThreadStatus()')
        $this.InvokeActionMethod('PATCH', "/threads/$commentThreadId", "{`"status`":$([int]$status)}")
    }

    [PSCustomObject] CreateCommentThread([string] $comment, [string] $fileName, [bool] $withLinesAdded) {
        [Logger]::Log('* [AzureReposInvoker]::CreateCommentThread()')
        $body = "{`"comments`":[{`"content`":`"$comment`"}]";
        if ($fileName) {
            $side = 'right'
            if (!$withLinesAdded) {
                $side = 'left'
            }

            $body += (",`"threadContext`":{`"filePath`":`"/$fileName`"," +
                      "`"$($side)FileStart`":{`"line`":1,`"offset`":1},`"$($side)FileEnd`":{`"line`":1,`"offset`":2}}")
        }

        $body += '}'

        $uri = $this.GetUri('/threads', '')
        [Logger]::Log("POST $uri $body")

        $arguments = @{
            Method = 'POST'
            Uri = $uri
            Headers = $this.OAuthHeader
            Body = $body
            ContentType = 'application/json; charset=utf-8'
        }

        $result = Invoke-RestMethod @arguments
        $this.WriteOutput($result)
        return $result
    }

    [void] CreateComment([int] $commentThreadId, [int] $parentCommentId, [string] $comment) {
        [Logger]::Log('* [AzureReposInvoker]::CreateComment()')
        $this.InvokeActionMethod('POST',
                                 "/threads/$commentThreadId/comments",
                                 "{`"parentCommentId`":$parentCommentId,`"content`":`"$comment`"}")
    }

    [void] AddMetadata([Hashtable] $metadata) {
        [Logger]::Log('* [AzureReposInvoker]::AddMetadata()')
        $result = '['
        $i = 0
        foreach ($key in $metadata.Keys) {
            $value = $metadata[$key]
            if ($value -is [bool] -or $value -is [int]) {
                $value = $value.ToString().ToLowerInvariant()
            }
            else {
                $value = "`"$value`""
            }

            $result += "{`"op`":`"replace`",`"path`":`"$key`",`"value`":$value}"
            if ($i -ne $metadata.Count - 1) {
                $result += ','
            }

            $i++
        }

        $result += ']'

        $uri = $this.GetUri('/properties', '-preview.1')
        [Logger]::Log("PATCH $uri $result")

        $arguments = @{
            Method = 'PATCH'
            Uri = $uri
            Headers = $this.OAuthHeader
            Body = $result
            ContentType = 'application/json-patch+json; charset=utf-8'
        }

        $result = Invoke-RestMethod @arguments
        $this.WriteOutput($result)
    }

    static [bool] IsAccessTokenAvailable() {
        [Logger]::Log('* [AzureReposInvoker]::IsAccessTokenAvailable() static')
        return ![string]::IsNullOrWhiteSpace($env:SYSTEM_ACCESSTOKEN)
    }

    hidden [void] InvokeActionMethod([string] $method, [string] $uriElements, [string] $body) {
        [Logger]::Log('* [AzureReposInvoker]::InvokeActionMethod() hidden')
        $uri = $this.GetUri($uriElements, '')
        [Logger]::Log("$method $uri $body")

        $arguments = @{
            Method = $method
            Uri = $uri
            Headers = $this.OAuthHeader
            Body = $body
            ContentType = 'application/json; charset=utf-8'
        }

        $result = Invoke-RestMethod @arguments
        $this.WriteOutput($result)
    }

    hidden [PSCustomObject] InvokeGetMethod([string] $uriElements) {
        [Logger]::Log('* [AzureReposInvoker]::InvokeGetMethod() hidden')
        $uri = $this.GetUri($uriElements, '')
        [Logger]::Log("GET $uri")

        $arguments = @{
            Method = 'GET'
            Uri = $uri
            Headers = $this.OAuthHeader
        }

        $result = Invoke-RestMethod @arguments
        $this.WriteOutput($result)
        return $result
    }

    hidden [string] GetUri([string] $uriElements, [string] $uriSuffix) {
        [Logger]::Log('* [AzureReposInvoker]::GetUri() hidden')
        return "$($this.BaseUri)$($uriElements)?api-version=5.1$($uriSuffix)"
    }

    hidden [void] WriteOutput([PSCustomObject] $output) {
        [Logger]::Log('* [AzureReposInvoker]::WriteOutput() hidden')
        $json = ConvertTo-Json -InputObject $output -Depth 10
        [Logger]::Log($json)
        [Logger]::Log('')
    }

    hidden [string] $BaseUri
    hidden [Hashtable] $OAuthHeader
}
