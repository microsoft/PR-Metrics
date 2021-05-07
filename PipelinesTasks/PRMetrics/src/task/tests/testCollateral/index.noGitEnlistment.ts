// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path'
import * as taskLibMockAnswer from 'azure-pipelines-task-lib/mock-answer'
import * as taskLibMockRun from 'azure-pipelines-task-lib/mock-run'

const taskPath: string = path.join(__dirname, '..', '..', 'index.js')
const taskRunner: taskLibMockRun.TaskMockRunner = new taskLibMockRun.TaskMockRunner(taskPath)

const mockAnswers: taskLibMockAnswer.TaskLibAnswers = {
  checkPath: {
    '/git/git': true
  },
  exec: {
    '/git/git rev-parse --is-inside-work-tree': {
      code: 0,
      stdout: 'false'
    }
  },
  which: {
    git: '/git/git'
  }
}
taskRunner.setAnswers(mockAnswers)

taskRunner.run()
