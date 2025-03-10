/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as path from "path";
import PackageJsonInterface from "./jsonTypes/packageJsonInterface.js";
import ResourcesJsonInterface from "../src/jsonTypes/resourcesJsonInterface.js";
import TaskJsonInterface from "./jsonTypes/taskJsonInterface.js";
import VssExtensionJsonInterface from "./jsonTypes/vssExtensionJsonInterface.js";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

describe("task.json", (): void => {
  const basePath: string = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const taskJsonFile: string = path.join(basePath, "task.json");
  const taskJsonContents: string = fs.readFileSync(taskJsonFile, "utf8");
  const taskJson: TaskJsonInterface = JSON.parse(
    taskJsonContents,
  ) as TaskJsonInterface;
  const version = `${String(taskJson.version.Major)}.${String(taskJson.version.Minor)}.${String(taskJson.version.Patch)}`;

  const languagesPath: string = path.join(
    basePath,
    "Strings",
    "resources.resjson",
  );
  const languages: string[] = fs.readdirSync(languagesPath);
  const testCases: Map<string, ResourcesJsonInterface> = new Map<
    string,
    ResourcesJsonInterface
  >();
  for (const language of languages) {
    const resourcesFile: string = path.join(
      languagesPath,
      language,
      "resources.resjson",
    );
    const resourcesFileContents: string = fs.readFileSync(
      resourcesFile,
      "utf8",
    );
    testCases.set(
      language,
      JSON.parse(resourcesFileContents) as ResourcesJsonInterface,
    );
  }

  it("should have a friendly name ending with the version number", (): void => {
    // Assert
    assert.equal(taskJson.friendlyName.endsWith(version), true);
  });

  testCases.forEach((value: ResourcesJsonInterface, key: string): void => {
    it(`should have a friendly name including the version number in language '${key}'`, (): void => {
      // Assert
      assert.equal(value["loc.friendlyName"]?.includes(version), true);
    });
  });

  it("should have the same version number as task.loc.json", (): void => {
    // Arrange
    const taskLocJsonFile: string = path.join(basePath, "task.loc.json");
    const taskLocJsonContents: string = fs.readFileSync(
      taskLocJsonFile,
      "utf8",
    );
    const taskLocJson: TaskJsonInterface = JSON.parse(
      taskLocJsonContents,
    ) as TaskJsonInterface;

    // Assert
    assert.equal(taskJson.version.Major, taskLocJson.version.Major);
    assert.equal(taskJson.version.Minor, taskLocJson.version.Minor);
    assert.equal(taskJson.version.Patch, taskLocJson.version.Patch);
  });

  it("should have the same version number as vss-extension.json", (): void => {
    // Arrange
    const vssExtensionJsonFile: string = path.join(
      basePath,
      "..",
      "vss-extension.json",
    );
    const vssExtensionJsonFileContents: string = fs.readFileSync(
      vssExtensionJsonFile,
      "utf8",
    );
    const vssExtensionJson: VssExtensionJsonInterface = JSON.parse(
      vssExtensionJsonFileContents,
    ) as VssExtensionJsonInterface;

    // Assert
    assert.equal(vssExtensionJson.version, version);
  });

  it("should have the same version number as package.json", (): void => {
    // Arrange
    const packageJsonFile: string = path.join(
      basePath,
      "..",
      "..",
      "package.json",
    );
    const packageJsonFileContents: string = fs.readFileSync(
      packageJsonFile,
      "utf8",
    );
    const packageJson: PackageJsonInterface = JSON.parse(
      packageJsonFileContents,
    ) as PackageJsonInterface;

    // Assert
    assert.equal(packageJson.version, version);
  });

  it("should have the same version number as package-lock.json", (): void => {
    // Arrange
    const packageLockJsonFile: string = path.join(
      basePath,
      "..",
      "..",
      "package-lock.json",
    );
    const packageLockJsonFileContents: string = fs.readFileSync(
      packageLockJsonFile,
      "utf8",
    );
    const packageLockJson: PackageJsonInterface = JSON.parse(
      packageLockJsonFileContents,
    ) as PackageJsonInterface;

    // Assert
    assert.equal(packageLockJson.version, version);
  });
});
