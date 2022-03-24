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
      stdout: 'true'
    },
    '/git/git rev-parse --branch origin/develop...pull/12345/merge': {
      code: 1,
      stderr: 'fatal: ambiguous argument \'origin/develop...pull/12345/merge\': unknown revision or path not in the working tree.\n'
    }
  },
  which: {
    git: '/git/git'
  }
}
taskRunner.setAnswers(mockAnswers)

taskRunner.run()
