/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock, verify } from "ts-mockito";
import ConsoleWrapper from "../../src/wrappers/consoleWrapper.js";
import HttpError from "../testUtilities/httpError.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { httpNotFound } from "../../src/utilities/constants.js";

describe("logger.ts", (): void => {
  let consoleWrapper: ConsoleWrapper;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper);
    runnerInvoker = mock(RunnerInvoker);
  });

  describe("logDebug()", (): void => {
    {
      const testCases: string[] = [
        "##[test]Message",
        "##vso[test]Message",
        "##VSO[test]Message",
      ];

      testCases.forEach((value: string): void => {
        it(`should log the filtered message for '${value}'`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );

          // Act
          logger.logDebug(value);

          // Assert
          verify(runnerInvoker.logDebug("test]Message")).once();
        });
      });
    }

    it("should log the message", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );

      // Act
      logger.logDebug("Message");

      // Assert
      verify(runnerInvoker.logDebug("Message")).once();
    });
  });

  describe("logDebugJson()", (): void => {
    it("should log the JSON-serialized value", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );
      const value = { key: "value" };

      // Act
      logger.logDebugJson(value);

      // Assert
      verify(runnerInvoker.logDebug('{"key":"value"}')).once();
    });
  });

  describe("logInfo()", (): void => {
    {
      const testCases: string[] = [
        "##[test]Message",
        "##vso[test]Message",
        "##VSO[test]Message",
      ];

      testCases.forEach((value: string): void => {
        it(`should log the filtered message for '${value}'`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );

          // Act
          logger.logInfo(value);

          // Assert
          verify(consoleWrapper.log("test]Message")).once();
        });
      });
    }

    it("should log the message", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );

      // Act
      logger.logInfo("Message");

      // Assert
      verify(consoleWrapper.log("Message")).once();
    });
  });

  describe("logWarning()", (): void => {
    {
      const testCases: string[] = [
        "##[test]Message",
        "##vso[test]Message",
        "##VSO[test]Message",
      ];

      testCases.forEach((value: string): void => {
        it(`should log the filtered message for '${value}'`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );

          // Act
          logger.logWarning(value);

          // Assert
          verify(runnerInvoker.logWarning("test]Message")).once();
        });
      });
    }

    it("should log the message", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );

      // Act
      logger.logWarning("Message");

      // Assert
      verify(runnerInvoker.logWarning("Message")).once();
    });
  });

  describe("logError()", (): void => {
    {
      const testCases: string[] = [
        "##[test]Message",
        "##vso[test]Message",
        "##VSO[test]Message",
      ];

      testCases.forEach((value: string): void => {
        it(`should log the filtered message for '${value}'`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );

          // Act
          logger.logError(value);

          // Assert
          verify(runnerInvoker.logError("test]Message")).once();
        });
      });
    }

    it("should log the message", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );

      // Act
      logger.logError("Message");

      // Assert
      verify(runnerInvoker.logError("Message")).once();
    });
  });

  describe("logErrorObject()", (): void => {
    {
      const testCases: string[] = ["##[test]", "##vso[test]", "##VSO[test]"];

      testCases.forEach((value: string): void => {
        it(`should log all filtered properties '${value}' of the error object`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );
          const error: Error = new Error(`${value}Message`);
          error.name = `${value}Error`;
          error.stack = `${value}Stack contents`;

          // Act
          logger.logErrorObject(error);

          // Assert
          verify(consoleWrapper.log('test]Error – name: "test]Error"')).once();
          verify(
            consoleWrapper.log('test]Error – message: "test]Message"'),
          ).once();
          verify(
            consoleWrapper.log('test]Error – stack: "test]Stack contents"'),
          ).once();
        });
      });
    }

    it("should log all properties of the error object", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );
      const error: Error = new Error("Message");
      error.name = "Error";
      error.stack = "Stack contents";

      // Act
      logger.logErrorObject(error);

      // Assert
      verify(consoleWrapper.log('Error – name: "Error"')).once();
      verify(consoleWrapper.log('Error – message: "Message"')).once();
      verify(consoleWrapper.log('Error – stack: "Stack contents"')).once();
    });

    it("should log all properties of a complex error object", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );
      const error: HttpError = new HttpError(
        httpNotFound,
        "Not Found",
      );
      error.stack = "Stack contents";

      // Act
      logger.logErrorObject(error);

      // Assert
      verify(consoleWrapper.log('HttpError – name: "HttpError"')).once();
      verify(consoleWrapper.log('HttpError – message: "Not Found"')).once();
      verify(consoleWrapper.log('HttpError – stack: "Stack contents"')).once();
      verify(consoleWrapper.log("HttpError – status: 404")).once();
    });
  });

  describe("replay()", (): void => {
    {
      const testCases: string[] = ["##[test]", "##vso[test]", "##VSO[test]"];

      testCases.forEach((value: string): void => {
        it(`should replay all filtered messages '${value}'`, (): void => {
          // Arrange
          const logger: Logger = new Logger(
            instance(consoleWrapper),
            instance(runnerInvoker),
          );
          logger.logDebug(`${value}Debug Message 1`);
          logger.logInfo(`${value}Info Message 1`);
          logger.logWarning(`${value}Warning Message 1`);
          logger.logError(`${value}Error Message 1`);
          logger.logDebug(`${value}Debug Message 2`);
          logger.logInfo(`${value}Info Message 2`);
          logger.logWarning(`${value}Warning Message 2`);
          logger.logError(`${value}Error Message 2`);

          // Act
          logger.replay();

          // Assert
          verify(runnerInvoker.logDebug("test]Debug Message 1")).once();
          verify(consoleWrapper.log("test]Info Message 1")).once();
          verify(runnerInvoker.logWarning("test]Warning Message 1")).once();
          verify(runnerInvoker.logError("test]Error Message 1")).once();
          verify(runnerInvoker.logDebug("test]Debug Message 2")).once();
          verify(consoleWrapper.log("test]Info Message 2")).once();
          verify(runnerInvoker.logWarning("test]Warning Message 2")).once();
          verify(runnerInvoker.logError("test]Error Message 2")).once();
          verify(
            consoleWrapper.log("🔁 debug   – test]Debug Message 1"),
          ).once();
          verify(consoleWrapper.log("🔁 info    – test]Info Message 1")).once();
          verify(
            consoleWrapper.log("🔁 warning – test]Warning Message 1"),
          ).once();
          verify(
            consoleWrapper.log("🔁 error   – test]Error Message 1"),
          ).once();
          verify(
            consoleWrapper.log("🔁 debug   – test]Debug Message 2"),
          ).once();
          verify(consoleWrapper.log("🔁 info    – test]Info Message 2")).once();
          verify(
            consoleWrapper.log("🔁 warning – test]Warning Message 2"),
          ).once();
          verify(
            consoleWrapper.log("🔁 error   – test]Error Message 2"),
          ).once();
        });
      });
    }

    it("should replay all messages", (): void => {
      // Arrange
      const logger: Logger = new Logger(
        instance(consoleWrapper),
        instance(runnerInvoker),
      );
      logger.logDebug("Debug Message 1");
      logger.logInfo("Info Message 1");
      logger.logWarning("Warning Message 1");
      logger.logError("Error Message 1");
      logger.logDebug("Debug Message 2");
      logger.logInfo("Info Message 2");
      logger.logWarning("Warning Message 2");
      logger.logError("Error Message 2");

      // Act
      logger.replay();

      // Assert
      verify(runnerInvoker.logDebug("Debug Message 1")).once();
      verify(consoleWrapper.log("Info Message 1")).once();
      verify(runnerInvoker.logWarning("Warning Message 1")).once();
      verify(runnerInvoker.logError("Error Message 1")).once();
      verify(runnerInvoker.logDebug("Debug Message 2")).once();
      verify(consoleWrapper.log("Info Message 2")).once();
      verify(runnerInvoker.logWarning("Warning Message 2")).once();
      verify(runnerInvoker.logError("Error Message 2")).once();
      verify(consoleWrapper.log("🔁 debug   – Debug Message 1")).once();
      verify(consoleWrapper.log("🔁 info    – Info Message 1")).once();
      verify(consoleWrapper.log("🔁 warning – Warning Message 1")).once();
      verify(consoleWrapper.log("🔁 error   – Error Message 1")).once();
      verify(consoleWrapper.log("🔁 debug   – Debug Message 2")).once();
      verify(consoleWrapper.log("🔁 info    – Info Message 2")).once();
      verify(consoleWrapper.log("🔁 warning – Warning Message 2")).once();
      verify(consoleWrapper.log("🔁 error   – Error Message 2")).once();
    });
  });
});
