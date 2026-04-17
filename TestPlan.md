# Unit Test Improvement Plan

This plan proposes concrete improvements to the PR Metrics unit test suite. The
current suite provides strong coverage, which is vital given that end-to-end
production testing before release is infeasible. The goal here is to reduce
maintenance cost _without_ reducing coverage, so that future refactors become
cheaper and the safety net remains intact.

## Diagnostic Summary

Quantitative picture of the current suite:

- 23 spec files, approximately 16,820 lines total.
- Four files over 1,800 lines: `inputs.spec.ts` (2,175), `codeMetrics.spec.ts`
  (2,065), `azureReposInvoker.spec.ts` (2,042), and `gitHubReposInvoker.spec.ts`
  (1,848).
- 1,118 `verify(logger.log...)` calls across 12 files.
- 302 `process.env` manipulations across 9 files.
- 297 SUT constructor calls across 12 files, roughly one per test case.

The core problem: tests are coupled to implementation, not behaviour. Every
refactor of a private method, every rename of an internal helper, and every new
log line cascades into dozens of test edits. That is the maintenance cost
currently being felt.

## Guiding Principles

1. **Preserve Coverage**: Every change must keep coverage equal or better.
   Branches and data cases must all still be exercised.
2. **Test Observable Behaviour, Not Tracing**: Debug log calls of the form
   `* Class.method()` are internal tracing. Asserting them locks private method
   names into the test suite.
3. **Shift Invariants to Property Tests**: `fast-check` is already in the
   dependency set. Many exhaustive `forEach` data tables are invariants in
   disguise.
4. **Move Integration Testing Up One Layer**: End-to-end-before-release is
   impossible. This argues for a small in-process integration tier that wires
   real components with faked external I/O, not for more mock-heavy unit tests.
5. **Factor Shared Test Infrastructure**: The duplication of mock setup,
   localisation mocks, environment-variable handling, and SUT construction is
   the single biggest source of line count.

## Concrete Proposals

### 1. Stop Verifying Debug-Trace Log Calls

**Observation**: Roughly 800 to 900 of the 1,118 `verify(logger.log...)` calls
assert `* ClassName.methodName()` tracing. For example, a single test in
`inputs.spec.ts` (lines 162 to 202) verifies 30+ log lines including counts for
every private initialiser.

**Proposal**:

- Delete all `verify(logger.logDebug("* X.y()"))` assertions.
- Keep `verify(logger.logWarning(...))` and `verify(logger.logError(...))`
  assertions; those are observable and meaningful.
- Keep `verify(logger.logInfo(...))` only when the info message is part of the
  contract, such as user-facing progress reporting.
- Optionally, verify that tracing exists via a single test per class ("emits
  entry trace when called") using `ts-mockito`'s `atLeast(1)` with a regex
  matcher, rather than exhaustively per test.

**Rationale**: Debug tracing is a cross-cutting side effect. It is useful in
production but is not the SUT's contract. Asserting it forces tests to know
about private method names and call ordering. Removing these saves roughly
5,000 lines and unblocks refactoring.

**Coverage Impact**: None. Coverage measures code execution; these assertions
do not add execution.

### 2. Replace Localisation Mock `beforeEach` Blocks With a Helper

**Observation**: `codeMetrics.spec.ts` has a 186-line `beforeEach` that stubs
every `(size, coverage)` combination. `pullRequest.spec.ts` similarly has
roughly 100 lines of `runnerInvoker.loc(...)` stubs. The stubs are largely
identity mappings, such as `"titleSizeXS"` returning `"XS"`.

**Proposal**:

- Add `tests/testUtilities/localisationMock.ts` that reads the actual
  `resources.resjson` file and wires `runnerInvoker.loc()` to return real
  values.
- Each spec file replaces its 100 to 186 lines with one line, for example
  `stubLocalisation(runnerInvoker)`.

**Rationale**: The current code re-implements the resource file in mock stubs,
then tests against those mocked values. It is testing the mock. Reading the
real resource file removes the duplication and makes the tests resilient to
resource file changes. Localisation is a stable, low-risk boundary to treat as
real in tests.

**Coverage Impact**: None. The localisation wiring is not exercised by those
stubs anyway.

### 3. Replace `process.env` Juggling With a Scoped Helper

**Observation**: 302 manual `process.env.X = ...` and
`delete process.env.X` pairs exist across tests. Tests often set up in an
Arrange section, repeat in a Finalisation section, and rely on `beforeEach`
and `afterEach` to clean up. Some files miss cleanups, introducing
cross-test leak risk.

**Proposal**:

- Add `tests/testUtilities/envSandbox.ts` exporting `withEnv(overrides, fn)`
  and `stubEnv(overrides)`, the latter auto-restoring in `afterEach` via a
  global hook.
- Tests become
  `stubEnv({ GITHUB_ACTION: "PR-Metrics", GITHUB_REF: "refs/pull/12345/merge" })`
  with no cleanup required.

**Rationale**: Deterministic cleanup, no cross-test leak, and elimination of
the finalisation boilerplate. The existing code in `gitInvoker.spec.ts` that
sets environment variables and then deletes them at the end of each test
(lines 89 to 90, 114 to 115, 142 to 143, 174 to 175, and elsewhere) is pure
noise.

### 4. Split Oversized Files by Describe Block

**Proposal**:

- `codeMetrics.spec.ts` (2,065 lines): split into
  `codeMetrics.sizeIndicator.spec.ts`, `codeMetrics.testCoverage.spec.ts`,
  `codeMetrics.fileMatching.spec.ts`, and so on, based on the existing
  `describe` blocks.
- `inputs.spec.ts` (2,175 lines): split per input, for example
  `inputs.baseSize.spec.ts`, `inputs.growthRate.spec.ts`, and
  `inputs.testFactor.spec.ts`.
- `azureReposInvoker.spec.ts` and `gitHubReposInvoker.spec.ts`: split per
  public method.

**Rationale**: Files over roughly 800 lines are hard to navigate and lead to
copy-paste rot. Smaller files also parallelise better in Mocha and make test
failures easier to triage.

**Coverage Impact**: None. Tests just move.

### 5. Introduce Test Data Builders

**Proposal**: Add `tests/testUtilities/builders/` with factories such as
`aCodeMetricsData()`, `aPullRequestDetails()`, and `aCommentData()`:

```typescript
const data = aCodeMetricsData().withProductCode(400).withTestCode(0).build();
```

**Rationale**: Tests currently pass raw constructor positional arguments such
as `new CodeMetricsData(400, 399, 0)`, forcing the reader to count commas.
Builders give each test a one-liner that reads as intent.

### 6. Extract a SUT Factory Per Spec

**Proposal**: Each spec file adds a local `createSut(overrides?)` that
constructs the SUT with all its dependency instances. Tests become:

```typescript
const sut = createSut();
// or, with a swap:
const sut = createSut({ gitInvoker: customGitInvoker });
```

**Rationale**: 297 SUT `new X(...)` calls across tests. One factory per spec
collapses that to one constructor call site and makes dependency swaps
obvious.

### 7. Expand Property-Based Testing to Replace Exhaustive Tables

**Observation**: Many `forEach` tables are property tests in disguise. For
example, the size-indicator boundaries in `codeMetrics.spec.ts` can be stated
as: "for any `productCode` in `[0, baseSize)`, the indicator is `XS`." The
invalid-input tables in `inputs.spec.ts` can be stated as: "for any string
that does not parse to a positive number, the default is returned."

**Proposal**:

- Keep example-based tests for boundaries (199 vs 200, 399 vs 400); those
  document the contract.
- Replace bulk interior cases with property tests. A single `fc.property` with
  100 runs covers more than 20 hand-picked `forEach` entries.
- Add property files for `inputs.ts`, `codeMetrics.ts` size bands, and file
  pattern matching.

**Rationale**: Property tests are shorter, catch edge cases that hand-picked
tables miss, and are less coupled to specific values. `fast-check` is already
a dependency; deepen that investment.

### 8. Add a Small In-Process Integration Tier – THIS WON'T WORK, SKIP THIS

**Observation**: There is a gap between 23 mock-heavy unit spec files and
manual test instructions in `manualTests/`.

**Proposal**: Add `tests/integration/` with 5 to 10 tests that exercise
`pullRequestMetrics.run()` end-to-end with:

- Real `Inputs`, `CodeMetrics`, `Logger`, `RunnerInvoker`, and
  `PullRequestComments`.
- Faked `RunnerInvoker.exec` (canned Git output) and `ReposInvoker` (in-memory).
- Golden scenarios such as "small PR with tests", "XL PR without tests", and
  "PR with ignored files".

**Rationale**: This is the layer that catches regressions where unit tests
pass but integration is broken. Given that end-to-end production testing
before release is impossible, this is the insurance policy. Unit tests verify
behaviour of pieces; integration tests verify the pieces compose correctly.

**Coverage Impact**: Strictly additive.

### 9. Consolidate Common Invalid-Input Fixtures

**Proposal**: A single `tests/testUtilities/fixtures/invalidInputs.ts` exports
shared sets such as `INVALID_STRINGS = [null, "", " ", "abc", "==="]` and
`NEGATIVE_NUMBERS = ["0", "-1", "-1000"]`. Specs import them.

**Rationale**: `validator.spec.ts` lines 12 and 50, `inputs.spec.ts` lines
293 to 302 and 487 to 496, and other locations enumerate overlapping "invalid
string" sets. Sharing prevents drift and captures domain knowledge once.

### 10. Document a Testing Style Guide –DON'T BOTHER

**Proposal**: Add `docs/testing.md`, or a section in `AGENTS.md`, that
codifies:

- When to mock a collaborator and when to use the real thing.
- The rule that debug-trace log calls are not asserted.
- The preference for property tests for invariants, and example tests for
  boundaries.
- How to use the new helpers (`withEnv`, `stubLocalisation`, builders, and
  `createSut`).
- The distinction between the integration tier and the unit tier.

**Rationale**: Prevents regression to the current style once the helpers
exist.

## Prioritisation

Ranked by impact per unit of work:

1. **Remove Debug-Trace Log Assertions**: Biggest single win on maintenance
   burden (roughly 5,000 lines removed, refactors unblocked). Low risk,
   preserves coverage. Do first.
2. **`stubLocalisation` Helper**: Eliminates the largest single block of
   setup boilerplate. Low risk.
3. **`withEnv` and `stubEnv` Helpers**: Removes roughly 600 lines and a class
   of cross-test-leak bugs.
4. **SUT Factory and Builders**: Tidies remaining code and enables later
   splits.
5. **Split Oversized Files**: Do after steps 1 to 4 so splits happen on clean
   code.
6. **Expand Property Tests**: Higher engineering investment; do last among
   the unit-suite items.
7. **Integration Tier**: Separate project; worth doing but orthogonal to the
   unit-test cleanup.
8. **Consolidate Invalid-Input Fixtures and Style Guide**: Cleanup sweep.

Rough estimate: steps 1 to 4 alone cut the test codebase by roughly 30% and
eliminate the "one private method rename equals 50 test edits" problem.

## Open Questions

Two items to resolve before executing the plan:

1. **Intent Behind Debug-Trace Assertions**: The current approach treats
   tracing assertions as accidental complexity. If the `* Class.method()`
   tracing was added deliberately to verify call paths (for instance, to
   confirm that the correct helper was reached in routing logic), proposal 1
   should be narrowed: keep trace verification only where the call path
   itself is the thing being tested (probably a handful of cases in
   `reposInvoker.spec.ts`) and delete the rest.
2. **Scope Preference**: One big design document covering all 10 proposals,
   or a two-phase split where phase A covers the high-impact, low-risk
   cleanup (proposals 1 to 4) and phase B covers the deeper changes
   (proposals 5 to 10) as a follow-up once the ground is clear.
