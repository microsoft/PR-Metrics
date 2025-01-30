/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as actionsExec from "@actions/exec";
import * as path from "path";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import AzurePipelinesRunnerWrapper from "../../src/wrappers/azurePipelinesRunnerWrapper.js";
import ConsoleWrapper from "../../src/wrappers/consoleWrapper.js";
import { EndpointAuthorization } from "azure-pipelines-task-lib";
import ExecOutput from "../../src/runners/execOutput.js";
import GitHubRunnerInvoker from "../../src/runners/gitHubRunnerInvoker.js";
import GitHubRunnerWrapper from "../../src/wrappers/gitHubRunnerWrapper.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";

describe("gitHubRunnerInvoker.js", (): void => {
  const resourcePath: string = path.join(
    import.meta.dirname,
    "../../Strings/resources.resjson/en-US/",
  );

  let azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper;
  let consoleWrapper: ConsoleWrapper;
  let gitHubRunnerWrapper: GitHubRunnerWrapper;

  beforeEach((): void => {
    azurePipelinesRunnerWrapper = mock(AzurePipelinesRunnerWrapper);
    consoleWrapper = mock(ConsoleWrapper);
    gitHubRunnerWrapper = mock(GitHubRunnerWrapper);
  });

  describe("exec()", (): void => {
    it("should call the underlying method", async (): Promise<void> => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );
      const execResult: actionsExec.ExecOutput = {
        exitCode: 1,
        stderr: "Error",
        stdout: "Output",
      };
      when(
        gitHubRunnerWrapper.exec("TOOL", "Argument1 Argument2", any()),
      ).thenResolve(execResult);

      // Act
      const result: ExecOutput = await gitHubRunnerInvoker.exec(
        "TOOL",
        "Argument1 Argument2",
      );

      // Assert
      assert.equal(result.exitCode, 1);
      assert.equal(result.stderr, "Error");
      assert.equal(result.stdout, "Output");
      const options: actionsExec.ExecOptions = {
        failOnStdErr: true,
        silent: true,
      };
      verify(
        gitHubRunnerWrapper.exec(
          "TOOL",
          "Argument1 Argument2",
          deepEqual(options),
        ),
      ).once();
    });
  });

  describe("getInput()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );
      when(azurePipelinesRunnerWrapper.getInput("TEST-SUFFIX")).thenReturn(
        "VALUE",
      );

      // Act
      const result: string | undefined = gitHubRunnerInvoker.getInput([
        "Test",
        "Suffix",
      ]);

      // Assert
      assert.equal(result, "VALUE");
      verify(azurePipelinesRunnerWrapper.getInput("TEST-SUFFIX")).once();
    });
  });

  describe("getEndpointAuthorization()", (): void => {
    it("should result in an exception", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      const func: () => EndpointAuthorization | undefined = () =>
        gitHubRunnerInvoker.getEndpointAuthorization();

      // Assert
      assert.throws(
        func,
        Error("getEndpointAuthorization() unavailable in GitHub."),
      );
    });
  });

  describe("getEndpointAuthorizationScheme()", (): void => {
    it("should result in an exception", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      const func: () => string | undefined = () =>
        gitHubRunnerInvoker.getEndpointAuthorizationScheme();

      // Assert
      assert.throws(
        func,
        Error("getEndpointAuthorizationScheme() unavailable in GitHub."),
      );
    });
  });

  describe("getEndpointAuthorizationParameter()", (): void => {
    it("should result in an exception", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      const func: () => string | undefined = () =>
        gitHubRunnerInvoker.getEndpointAuthorizationParameter();

      // Assert
      assert.throws(
        func,
        Error("getEndpointAuthorizationParameter() unavailable in GitHub."),
      );
    });
  });

  describe("locInitialize()", (): void => {
    it("should succeed", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      const func: () => void = () => {
        gitHubRunnerInvoker.locInitialize(resourcePath);
      };

      // Assert
      try {
        func();
      } catch {
        assert.fail("Function should not have thrown an error");
      }
    });
  });

  describe("loc()", (): void => {
    it("should retrieve the correct resource when no placeholders are present", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );
      gitHubRunnerInvoker.locInitialize(resourcePath);

      // Act
      const result: string = gitHubRunnerInvoker.loc(
        "metrics.codeMetrics.titleSizeL",
      );

      // Assert
      assert.equal(result, "L");
    });

    it("should retrieve and format the correct resource when placeholders are present", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );
      gitHubRunnerInvoker.locInitialize(resourcePath);

      // Act
      const result: string = gitHubRunnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "Parameter 1",
        "[Parameter 2]",
      );

      // Assert
      assert.equal(result, "Parameter 1[Parameter 2]");
    });
  });

  describe("logDebug()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.logDebug("TEST");

      // Assert
      verify(gitHubRunnerWrapper.debug("TEST")).once();
    });
  });

  describe("logError()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.logError("TEST");

      // Assert
      verify(gitHubRunnerWrapper.error("TEST")).once();
    });
  });

  describe("logWarning()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.logWarning("TEST");

      // Assert
      verify(gitHubRunnerWrapper.warning("TEST")).once();
    });
  });

  describe("setStatusFailed()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.setStatusFailed("TEST");

      // Assert
      verify(gitHubRunnerWrapper.setFailed("TEST")).once();
    });
  });

  describe("setStatusSkipped()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.setStatusSkipped("TEST");

      // Assert
      verify(consoleWrapper.log("TEST")).once();
    });
  });

  describe("setStatusSucceeded()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.setStatusSucceeded("TEST");

      // Assert
      verify(consoleWrapper.log("TEST")).once();
    });
  });

  describe("setSecret()", (): void => {
    it("should call the underlying method", (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
        instance(azurePipelinesRunnerWrapper),
        instance(consoleWrapper),
        instance(gitHubRunnerWrapper),
      );

      // Act
      gitHubRunnerInvoker.setSecret("value");

      // Assert
      verify(gitHubRunnerWrapper.setSecret("value")).once();
    });
  });
});
