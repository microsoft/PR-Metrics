// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import stream from 'stream'

/**
 * A basic stream to which data can be written by the `GitInvoker`.
 */
export class GitWritableStream extends stream.Writable {
  private _message: string = ''

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
    const currentChunk: string = chunk.toString()
    if (!currentChunk.startsWith('[command]')) {
      this._message += currentChunk
    }

    callback()
  }
}
