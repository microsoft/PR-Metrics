// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import * as mocha from 'mocha'
import * as os from 'os'
import * as path from 'path'
import * as taskLibMock from 'azure-pipelines-task-lib/mock-test'

describe('index.ts', (): void => {
  it('should skip when not running as a pull request', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    const file: string = path.join(__dirname, 'testCollateral', 'index.default.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(true)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal([])
    expect(task.stdout.endsWith(`##vso[task.complete result=Skipped;]loc_mock_metrics.codeMetricsCalculator.noPullRequest${os.EOL}`)).to.equal(true)

    // Finalization
    done()
  })

  it('should skip when not running for a supported provider', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
    const file: string = path.join(__dirname, 'testCollateral', 'index.default.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(true)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal([])
    expect(task.stdout.endsWith(`##vso[task.complete result=Skipped;]loc_mock_metrics.codeMetricsCalculator.unsupportedProvider Other${os.EOL}`)).to.equal(true)

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    done()
  })

  it('should fail when no access token is available', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    const file: string = path.join(__dirname, 'testCollateral', 'index.default.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal(['loc_mock_metrics.codeMetricsCalculator.noAzureReposAccessToken'])

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    done()
  })

  it('should fail when called outside of a Git enlistment', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)

    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    const file: string = path.join(__dirname, 'testCollateral', 'index.noGitEnlistment.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal(['loc_mock_metrics.codeMetricsCalculator.noGitEnlistment'])

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_ACCESSTOKEN
    done()
  })

  it('should fail when insufficient Git history is available', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)

    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    const file: string = path.join(__dirname, 'testCollateral', 'index.noGitHistory.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal(['loc_mock_metrics.codeMetricsCalculator.noGitHistory'])

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    done()
  })

  it('should succeed when server access is skipped', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.PRMETRICS_SKIP_APIS = 'true'
    const file: string = path.join(__dirname, 'testCollateral', 'index.default.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(true)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal([])
    expect(task.stdout.endsWith(`##vso[task.complete result=Succeeded;]loc_mock_index.succeeded${os.EOL}`)).to.equal(true)

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.PRMETRICS_SKIP_APIS
    done()
  })

  it('should fail when unable to access the server', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.SYSTEM_TEAMPROJECT = 'Project'
    process.env.BUILD_REPOSITORY_ID = 'RepoID'
    process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/organization'

    const file: string = path.join(__dirname, 'testCollateral', 'index.default.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues.length).to.equal(3)
    expect(task.errorIssues[0]).to.contain('Error – stack: ')
    expect(task.errorIssues[1]).to.equal('Error – statusCode: 401')
    expect(task.errorIssues[2]).to.equal('Failed request: (401)')
    expect(task.stdout.includes('🔁')).to.equal(true)

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.SYSTEM_TEAMPROJECT
    delete process.env.BUILD_REPOSITORY_ID
    delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    done()
  })
})
