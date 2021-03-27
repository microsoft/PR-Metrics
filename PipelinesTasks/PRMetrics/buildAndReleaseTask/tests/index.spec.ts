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
    const file: string = path.join(__dirname, 'index.task.js')
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

  it('should fail when no access token is available', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    const file: string = path.join(__dirname, 'index.task.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal(['loc_mock_metrics.codeMetricsCalculator.noAccessToken'])

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    done()
  })

  it('should succeed when server access is skipped', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.SYSTEM_ACCESSTOKEN = '12345'
    process.env.PRMETRICS_SKIP_APIS = 'true'
    const file: string = path.join(__dirname, 'index.task.js')
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
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.PRMETRICS_SKIP_APIS
    done()
  })

  it('should fail when unable to access the server', function test (done: mocha.Done): void {
    // Arrange
    this.timeout(0)
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
    process.env.SYSTEM_ACCESSTOKEN = '12345'
    const file: string = path.join(__dirname, 'index.task.js')
    const task: taskLibMock.MockTestRunner = new taskLibMock.MockTestRunner(file)

    // Act
    task.run()

    // Assert
    expect(task.succeeded).to.equal(false)
    expect(task.warningIssues).to.deep.equal([])
    expect(task.errorIssues).to.deep.equal(['The "url" argument must be of type string. Received type undefined'])

    // Finalization
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.SYSTEM_ACCESSTOKEN
    done()
  })
})
