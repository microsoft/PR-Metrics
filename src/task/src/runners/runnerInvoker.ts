/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import AzurePipelinesRunnerInvoker from "./azurePipelinesRunnerInvoker.js";
import { EndpointAuthorization } from "./endpointAuthorization.js";
import ExecOutput from "./execOutput.js";
import GitHubRunnerInvoker from "./gitHubRunnerInvoker.js";
import RunnerInvokerInterface from "./runnerInvokerInterface.js";

/**
 * A wrapper around the runner functionality, to facilitate testability. This class cannot use logging functionality as
 * the logger forms part of the runner functionality, and using logging here could result in circular dependencies.
 */
export default class RunnerInvoker implements RunnerInvokerInterface {
	private readonly _azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker;
	private readonly _gitHubRunnerInvoker: GitHubRunnerInvoker;

	private _runnerInvoker: RunnerInvokerInterface | null = null;
	private _localizationInitialized = false;

	/**
	 * Initializes a new instance of the `RunnerInvoker` class.
	 * @param azurePipelinesRunnerInvoker The Azure Pipelines runner logic.
	 * @param gitHubRunnerInvoker The GitHub runner logic.
	 */
	public constructor(
		azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker,
		gitHubRunnerInvoker: GitHubRunnerInvoker,
	) {
		this._azurePipelinesRunnerInvoker = azurePipelinesRunnerInvoker;
		this._gitHubRunnerInvoker = gitHubRunnerInvoker;
	}

	/**
	 * Gets a value indicating whether a GitHub runner is in use.
	 */
	public static get isGitHub(): boolean {
		return typeof process.env.GITHUB_ACTION !== "undefined";
	}

	private get runner(): RunnerInvokerInterface {
		if (this._runnerInvoker !== null) {
			return this._runnerInvoker;
		}

		this._runnerInvoker = RunnerInvoker.isGitHub
			? this._gitHubRunnerInvoker
			: this._azurePipelinesRunnerInvoker;
		return this._runnerInvoker;
	}

	public async exec(tool: string, args: string): Promise<ExecOutput> {
		return this.runner.exec(tool, args);
	}

	public getInput(name: string[]): string | null {
		return this.runner.getInput(name);
	}

	public getEndpointAuthorization(id: string): EndpointAuthorization | null {
		return this.runner.getEndpointAuthorization(id);
	}

	public getEndpointAuthorizationScheme(id: string): string | null {
		return this.runner.getEndpointAuthorizationScheme(id);
	}

	public getEndpointAuthorizationParameter(
		id: string,
		key: string,
	): string | null {
		return this.runner.getEndpointAuthorizationParameter(id, key);
	}

	public locInitialize(folder: string): void {
		if (this._localizationInitialized) {
			throw new Error(
				"RunnerInvoker.locInitialize must not be called multiple times.",
			);
		}

		this._localizationInitialized = true;
		this.runner.locInitialize(folder);
	}

	public loc(key: string, ...param: string[]): string {
		if (!this._localizationInitialized) {
			throw new Error(
				"RunnerInvoker.locInitialize must be called before RunnerInvoker.loc.",
			);
		}

		return this.runner.loc(key, ...param);
	}

	public logDebug(message: string): void {
		this.runner.logDebug(message);
	}

	public logError(message: string): void {
		this.runner.logError(message);
	}

	public logWarning(message: string): void {
		this.runner.logWarning(message);
	}

	public setStatusFailed(message: string): void {
		this.runner.setStatusFailed(message);
	}

	public setStatusSkipped(message: string): void {
		this.runner.setStatusSkipped(message);
	}

	public setStatusSucceeded(message: string): void {
		this.runner.setStatusSucceeded(message);
	}

	public setSecret(value: string): void {
		this.runner.setSecret(value);
	}
}
