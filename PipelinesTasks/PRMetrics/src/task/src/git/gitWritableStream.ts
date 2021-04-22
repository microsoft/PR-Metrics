// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import stream from 'stream'

import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A basic stream to which data can be written by the `GitInvoker`.
 */
export class GitWritableStream extends stream.Writable {
  private readonly _taskLibWrapper: TaskLibWrapper
  private _message: string = ''

  /**
   * Initializes a new instance of the `GitWritableStream` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    super()
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the message written to the stream.
   * @returns The stream message.
   */
  public get message (): string {
    return this._message
  }

  /**
   * Writes data to the stream.
   * @param chunk The chunk of data to write.
   * @param _ The unused chunk encoding information.
   * @param callback The callback to invoke once writing is complete.
   */
  public _write (chunk: any, _: string, callback: (error?: Error | null) => void): void {
    const messageChunk: string = chunk.toString()

    this._taskLibWrapper.debug(messageChunk)

    if (!messageChunk.startsWith('[command]')) {
      this._message += messageChunk
    }

    callback()
  }
}
