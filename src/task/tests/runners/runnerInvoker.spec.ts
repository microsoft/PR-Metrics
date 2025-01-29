/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import AzurePipelinesRunnerInvoker from "../../src/runners/azurePipelinesRunnerInvoker";
import { EndpointAuthorization } from "azure-pipelines-task-lib";
import ExecOutput from "../../src/runners/execOutput";
import GitHubRunnerInvoker from "../../src/runners/gitHubRunnerInvoker";
import RunnerInvoker from "../../src/runners/runnerInvoker";
import assert from "node:assert/strict";

describe("runnerInvoker.ts", (): void => {
  let azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker;
  let gitHubRunnerInvoker: GitHubRunnerInvoker;

  beforeEach((): void => {
    azurePipelinesRunnerInvoker = mock(AzurePipelinesRunnerInvoker);
    gitHubRunnerInvoker = mock(GitHubRunnerInvoker);
  });

  describe("isGitHub()", (): void => {
    it("should return false when running on Azure Pipelines", (): void => {
      // Act
      const result: boolean = RunnerInvoker.isGitHub;

      // Assert
      assert.equal(result, false);
    });

    it("should return true when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";

      // Act
      const result: boolean = RunnerInvoker.isGitHub;

      // Assert
      assert.equal(result, true);

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("exec()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", async (): Promise<void> => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      const execResult: ExecOutput = {
        exitCode: 1,
        stderr: "Error",
        stdout: "Output",
      };
      when(
        azurePipelinesRunnerInvoker.exec("TOOL", "Argument1 Argument2"),
      ).thenResolve(execResult);

      // Act
      const result: ExecOutput = await runnerInvoker.exec(
        "TOOL",
        "Argument1 Argument2",
      );

      // Assert
      assert.equal(result.exitCode, 1);
      assert.equal(result.stderr, "Error");
      assert.equal(result.stdout, "Output");
      verify(
        azurePipelinesRunnerInvoker.exec("TOOL", "Argument1 Argument2"),
      ).once();
      verify(gitHubRunnerInvoker.exec("TOOL", "Argument1 Argument2")).never();
    });

    it("should call the underlying method when running on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      const execResult: ExecOutput = {
        exitCode: 1,
        stderr: "Error",
        stdout: "Output",
      };
      when(gitHubRunnerInvoker.exec("TOOL", "Argument1 Argument2")).thenResolve(
        execResult,
      );

      // Act
      const result: ExecOutput = await runnerInvoker.exec(
        "TOOL",
        "Argument1 Argument2",
      );

      // Assert
      assert.equal(result.exitCode, 1);
      assert.equal(result.stderr, "Error");
      assert.equal(result.stdout, "Output");
      verify(
        azurePipelinesRunnerInvoker.exec("TOOL", "Argument1 Argument2"),
      ).never();
      verify(gitHubRunnerInvoker.exec("TOOL", "Argument1 Argument2")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should call the underlying method each time when running on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      const execResult: ExecOutput = {
        exitCode: 1,
        stderr: "Error",
        stdout: "Output",
      };
      when(gitHubRunnerInvoker.exec("TOOL", "Argument1 Argument2")).thenResolve(
        execResult,
      );

      // Act
      const result1: ExecOutput = await runnerInvoker.exec(
        "TOOL",
        "Argument1 Argument2",
      );
      const result2: ExecOutput = await runnerInvoker.exec(
        "TOOL",
        "Argument1 Argument2",
      );

      // Assert
      assert.equal(result1.exitCode, 1);
      assert.equal(result1.stderr, "Error");
      assert.equal(result1.stdout, "Output");
      assert.equal(result2.exitCode, 1);
      assert.equal(result2.stderr, "Error");
      assert.equal(result2.stdout, "Output");
      verify(
        azurePipelinesRunnerInvoker.exec("TOOL", "Argument1 Argument2"),
      ).never();
      verify(gitHubRunnerInvoker.exec("TOOL", "Argument1 Argument2")).twice();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("getInput()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      when(
        azurePipelinesRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).thenReturn("VALUE");

      // Act
      const result: string | null = runnerInvoker.getInput([
        "Test",
        "Suffix",
      ]);

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).once();
      verify(
        gitHubRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      when(
        gitHubRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).thenReturn("VALUE");

      // Act
      const result: string | null = runnerInvoker.getInput([
        "Test",
        "Suffix",
      ]);

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).never();
      verify(
        gitHubRunnerInvoker.getInput(deepEqual(["Test", "Suffix"])),
      ).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("getEndpointAuthorization()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      const endpointAuthorization: EndpointAuthorization = {
        parameters: {
          key: "value",
        },
        scheme: "scheme",
      };
      when(
        azurePipelinesRunnerInvoker.getEndpointAuthorization("id"),
      ).thenReturn(endpointAuthorization);

      // Act
      const result: EndpointAuthorization | null =
        runnerInvoker.getEndpointAuthorization("id");

      // Assert
      assert.deepEqual(result, endpointAuthorization);
      verify(azurePipelinesRunnerInvoker.getEndpointAuthorization("id")).once();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubRunnerInvoker.getEndpointAuthorization("id")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      const endpointAuthorization: EndpointAuthorization = {
        parameters: {
          key: "value",
        },
        scheme: "scheme",
      };
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      when(gitHubRunnerInvoker.getEndpointAuthorization("id")).thenReturn(
        endpointAuthorization,
      );

      // Act
      const result: EndpointAuthorization | null =
        runnerInvoker.getEndpointAuthorization("id");

      // Assert
      assert.deepEqual(result, endpointAuthorization);
      verify(
        azurePipelinesRunnerInvoker.getEndpointAuthorization("id"),
      ).never();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubRunnerInvoker.getEndpointAuthorization("id")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("getEndpointAuthorizationScheme()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      when(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationScheme("id"),
      ).thenReturn("VALUE");

      // Act
      const result: string | null =
        runnerInvoker.getEndpointAuthorizationScheme("id");

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationScheme("id"),
      ).once();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubRunnerInvoker.getEndpointAuthorizationScheme("id")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      when(gitHubRunnerInvoker.getEndpointAuthorizationScheme("id")).thenReturn(
        "VALUE",
      );

      // Act
      const result: string | null =
        runnerInvoker.getEndpointAuthorizationScheme("id");

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationScheme("id"),
      ).never();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubRunnerInvoker.getEndpointAuthorizationScheme("id")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("getEndpointAuthorizationParameter()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      when(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationParameter(
          "id",
          "key",
        ),
      ).thenReturn("VALUE");

      // Act
      const result: string | null =
        runnerInvoker.getEndpointAuthorizationParameter("id", "key");

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationParameter(
          "id",
          "key",
        ),
      ).once();
      verify(
        // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
        gitHubRunnerInvoker.getEndpointAuthorizationParameter("id", "key"),
      ).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      when(
        // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
        gitHubRunnerInvoker.getEndpointAuthorizationParameter("id", "key"),
      ).thenReturn("VALUE");

      // Act
      const result: string | null =
        runnerInvoker.getEndpointAuthorizationParameter("id", "key");

      // Assert
      assert.equal(result, "VALUE");
      verify(
        azurePipelinesRunnerInvoker.getEndpointAuthorizationParameter(
          "id",
          "key",
        ),
      ).never();
      verify(
        // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
        gitHubRunnerInvoker.getEndpointAuthorizationParameter("id", "key"),
      ).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("locInitialize()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.locInitialize("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.locInitialize("TEST")).once();
      verify(gitHubRunnerInvoker.locInitialize("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.locInitialize("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.locInitialize("TEST")).never();
      verify(gitHubRunnerInvoker.locInitialize("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should throw when locInitialize is called twice", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.locInitialize("TEST");
      const func: () => void = () => {
        runnerInvoker.locInitialize("TEST");
      };

      // Assert
      assert.throws(
        func,
        Error("RunnerInvoker.locInitialize must not be called multiple times."),
      );
    });
  });

  describe("loc()", (): void => {
    it("should throw when locInitialize is not called beforehand", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      const func: () => void = () => runnerInvoker.loc("TEST");

      // Assert
      assert.throws(
        func,
        Error(
          "RunnerInvoker.locInitialize must be called before RunnerInvoker.loc.",
        ),
      );
    });

    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      runnerInvoker.locInitialize("TEST");
      when(azurePipelinesRunnerInvoker.loc("TEST")).thenReturn("VALUE");

      // Act
      const result: string = runnerInvoker.loc("TEST");

      // Assert
      assert.equal(result, "VALUE");
      verify(azurePipelinesRunnerInvoker.loc("TEST")).once();
      verify(gitHubRunnerInvoker.loc("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );
      runnerInvoker.locInitialize("TEST");
      when(gitHubRunnerInvoker.loc("TEST")).thenReturn("VALUE");

      // Act
      const result: string = runnerInvoker.loc("TEST");

      // Assert
      assert.equal(result, "VALUE");
      verify(azurePipelinesRunnerInvoker.loc("TEST")).never();
      verify(gitHubRunnerInvoker.loc("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("logDebug()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logDebug("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logDebug("TEST")).once();
      verify(gitHubRunnerInvoker.logDebug("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logDebug("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logDebug("TEST")).never();
      verify(gitHubRunnerInvoker.logDebug("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("logError()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logError("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logError("TEST")).once();
      verify(gitHubRunnerInvoker.logError("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logError("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logError("TEST")).never();
      verify(gitHubRunnerInvoker.logError("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("logWarning()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logWarning("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logWarning("TEST")).once();
      verify(gitHubRunnerInvoker.logWarning("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.logWarning("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.logWarning("TEST")).never();
      verify(gitHubRunnerInvoker.logWarning("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("setStatusFailed()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusFailed("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusFailed("TEST")).once();
      verify(gitHubRunnerInvoker.setStatusFailed("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusFailed("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusFailed("TEST")).never();
      verify(gitHubRunnerInvoker.setStatusFailed("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("setStatusSkipped()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusSkipped("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSkipped("TEST")).once();
      verify(gitHubRunnerInvoker.setStatusSkipped("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusSkipped("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSkipped("TEST")).never();
      verify(gitHubRunnerInvoker.setStatusSkipped("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("setStatusSucceeded()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusSucceeded("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSucceeded("TEST")).once();
      verify(gitHubRunnerInvoker.setStatusSucceeded("TEST")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setStatusSucceeded("TEST");

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSucceeded("TEST")).never();
      verify(gitHubRunnerInvoker.setStatusSucceeded("TEST")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("setSecret()", (): void => {
    it("should call the underlying method when running on Azure Pipelines", (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setSecret("id");

      // Assert
      verify(azurePipelinesRunnerInvoker.setSecret("id")).once();
      verify(gitHubRunnerInvoker.setSecret("id")).never();
    });

    it("should call the underlying method when running on GitHub", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(
        instance(azurePipelinesRunnerInvoker),
        instance(gitHubRunnerInvoker),
      );

      // Act
      runnerInvoker.setSecret("id");

      // Assert
      verify(azurePipelinesRunnerInvoker.setSecret("id")).never();
      verify(gitHubRunnerInvoker.setSecret("id")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });
});
