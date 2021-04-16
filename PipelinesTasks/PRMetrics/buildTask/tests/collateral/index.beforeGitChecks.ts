// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path'
import * as taskLibMockRun from 'azure-pipelines-task-lib/mock-run'

const taskPath: string = path.join(__dirname, '..', '..', 'index.js')
const taskRunner: taskLibMockRun.TaskMockRunner = new taskLibMockRun.TaskMockRunner(taskPath)

taskRunner.run()
