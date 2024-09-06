/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The default base size, which is the maximum number of new lines in an extra small pull request.
 */
export const baseSize = 200;

/**
 * The default growth rate, which is applied to the base size for calculating the size of larger pull requests.
 */
export const growthRate = 2.0;

/**
 * The default test factor, which is the number of lines of test code expected for each line of product code.
 */
export const testFactor = 1.0;

/**
 * The default value for always close the size and test comment, instead of leaving it open when requiring attention.
 */
export const alwaysCloseComment = false;

/**
 * The default file matching patterns, which is the set of globs specifying the files and folders to include.
 */
export const fileMatchingPatterns: string[] = ["**/*", "!**/package-lock.json"];

/**
 * The default code file extensions, which is the set of extensions for files containing code so that non-code files can be excluded.
 * @remarks This corresponds to the top 10 languages used on GitHub in 2020 (https://octoverse.github.com/) and uses
 * the language extensions defined in the GitHub language detection logic
 * (https://github.com/github/linguist/blob/master/lib/linguist/languages.yml).
 */
export const codeFileExtensions: string[] = [
  // JavaScript
  "js",
  "_js",
  "bones",
  "cjs",
  "es",
  "es6",
  "frag",
  "gs",
  "jake",
  "jsb",
  "jscad",
  "jsfl",
  "jsm",
  "jss",
  "jsx",
  "mjs",
  "njs",
  "pac",
  "sjs",
  "ssjs",
  "xsjs",
  "xsjslib",
  // JavaScript: Ecere Projects
  "epj",
  // JavaScript: JavaScript+ERB
  "erb",

  // Python
  "py",
  "cgi",
  "fcgi",
  "gyp",
  "gypi",
  "lmi",
  "py3",
  "pyde",
  "pyi",
  "pyp",
  "pyt",
  "pyw",
  "rpy",
  "smk",
  "spec",
  "tac",
  "wsgi",
  "xpy",
  // Python: Cython
  "pyx",
  "pxd",
  "pxi",
  // Python: Easybuild
  "eb",
  // Python: NumPy
  "numpy",
  "numpyw",
  "numsc",
  // Python: Python traceback
  "pytb",

  // Java
  "java",
  // Java: Java Server Pages
  "jsp",

  // TypeScript
  "ts",
  // TypeScript: TSX
  "tsx",

  // C#
  "cs",
  "cake",
  "csx",
  "linq",

  // PHP
  "php",
  "aw",
  "ctp",
  "fcgi",
  "inc",
  "php3",
  "php4",
  "php5",
  "phps",
  "phpt",

  // C++
  "cpp",
  "c++",
  "cc",
  "cp",
  "cxx",
  "h",
  "h++",
  "hh",
  "hpp",
  "hxx",
  "inc",
  "inl",
  "ino",
  "ipp",
  "re",
  "tcc",
  "tpp",

  // C
  "c",
  "cats",
  "h",
  "idc",
  // C: OpenCL
  "cl",
  "opencl",
  // C: Unified Parallel C
  "upc",
  // C: X BitMap
  "xbm",
  // C: X PixMap
  "xpm",
  "pm",

  // Shell
  "sh",
  "bash",
  "bats",
  "cgi",
  "command",
  "env",
  "fcgi",
  "ksh",
  "tmux",
  "tool",
  "zsh",
  // Shell: fish
  "fish",
  // Shell: Gentoo Ebuild
  "ebuild",
  // Shell: Gentoo Eclass
  "eclass",
  // Shell: PowerShell
  "ps1",
  "psd1",
  "psm1",
  // Shell: Tcsh
  "tcsh",
  "csh",

  // Ruby
  "rb",
  "builder",
  "eye",
  "fcgi",
  "gemspec",
  "god",
  "jbuilder",
  "mspec",
  "pluginspec",
  "podspec",
  "prawn",
  "rabl",
  "rake",
  "rbi",
  "rbuild",
  "rbw",
  "rbx",
  "ru",
  "ruby",
  "spec",
  "thor",
  "watchr",
];
