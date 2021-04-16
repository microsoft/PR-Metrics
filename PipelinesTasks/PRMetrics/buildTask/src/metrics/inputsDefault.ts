
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A module encapsulating default input values.
 */
export module InputsDefault {
  /**
   * The default base size, which is the maximum number of new lines in a small pull request.
   */
  export const baseSize: number = 250

  /**
   * The default growth rate, which is applied to the base size for calculating the size of larger pull requests.
   */
  export const growthRate: number = 2.0

  /**
   * The default test factor , which is the number of lines of test code expected for each line of product code.
   */
  export const testFactor: number = 1.5

  /**
   * The default file matching patterns, which is the set of Azure DevOps file matching patterns specifying the files and folders to include.
   */
  export const fileMatchingPatterns: string[] = ['**/*']

  /**
   * The default code file extensions, which is the set of extensions for files containing code so that non-code files can be excluded.
   */
  export const codeFileExtensions: string[] = [
    'ada',
    'adb',
    'ads',
    'asm',
    'bas',
    'bb',
    'bmx',
    'c',
    'cbl',
    'cbp',
    'cc',
    'clj',
    'cls',
    'cob',
    'cpp',
    'cs',
    'cxx',
    'd',
    'dba',
    'e',
    'efs',
    'egt',
    'el',
    'f',
    'f77',
    'f90',
    'for',
    'frm',
    'frx',
    'fth',
    'ftn',
    'ged',
    'gm6',
    'gmd',
    'gmk',
    'gml',
    'go',
    'h',
    'hpp',
    'hs',
    'hxx',
    'i',
    'inc',
    'js',
    'java',
    'l',
    'lgt',
    'lisp',
    'm',
    'm4',
    'ml',
    'msqr',
    'n',
    'nb',
    'p',
    'pas',
    'php',
    'php3',
    'php4',
    'php5',
    'phps',
    'phtml',
    'piv',
    'pl',
    'pl1',
    'pli',
    'pm',
    'pol',
    'pp',
    'prg',
    'pro',
    'py',
    'r',
    'rb',
    'red',
    'reds',
    'rkt',
    'rktl',
    'rs',
    's',
    'scala',
    'sce',
    'sci',
    'scm',
    'sd7',
    'skb',
    'skc',
    'skd',
    'skf',
    'skg',
    'ski',
    'skk',
    'skm',
    'sko',
    'skp',
    'skq',
    'sks',
    'skt',
    'skz',
    'spin',
    'stk',
    'swg',
    'tcl',
    'ts',
    'vb',
    'xpl',
    'xq',
    'xsl',
    'y'
  ]
}
