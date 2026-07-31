/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type LoggerInterface from "../../src/interfaces/loggerInterface.js";

/**
 * A test double for `LoggerInterface`, which records every message logged.
 */
export default class FakeLogger implements LoggerInterface {
  private readonly _messages: string[] = [];

  /**
   * Gets the messages logged, in logging order.
   * @returns The messages.
   */
  public get messages(): string[] {
    return this._messages;
  }

  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug(message: string): void {
    this._messages.push(message);
  }

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  public info(message: string): void {
    this._messages.push(message);
  }
}
