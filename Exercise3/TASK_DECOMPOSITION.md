# TASK DECOMPOSITION
## Exercise 3: Resilient State Machine & Skeleton Loader

**Course:** Modern React Architecture, Virtual DOM & State Machines
**University:** UIT - VNUHCM
**Instructor:** Tran Vinh Khiem

---


# T-01: Define FSM Contract

## Goal

Describe the async view state as one finite state machine with exactly four states, so that
contradictory UI (skeleton + error, loading + data) cannot be represented at all.

## From the slide (slide 26)

- States restricted to `'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'`.
- Skeleton with a pulsing CSS animation during `LOADING`.
- Human-readable error with a `Retry Connection` button.
- Eliminate race conditions and inconsistent UI states.
- Milestone: `feat(ui): implement multi-state data component with skeleton feedback`.

## State contract (`src/view-state.js`)

```javascript
/**
 * @typedef {{ id: string, title: string, summary: string }} FeedItem
 *
 * @typedef {
 *   | { status: 'IDLE' }
 *   | { status: 'LOADING' }
 *   | { status: 'SUCCESS', data: FeedItem[] }
 *   | { status: 'ERROR', error: string }
 * } ViewState
 *
 * @typedef {
 *   | { type: 'START' }
 *   | { type: 'RESOLVE', data: FeedItem[] }
 *   | { type: 'REJECT', error: string }
 * } FeedEvent
 */

export const STATUS        // frozen { IDLE, LOADING, SUCCESS, ERROR }
export const INITIAL_STATE // frozen { status: 'IDLE' }

export function transition(state: ViewState, event: FeedEvent): ViewState
// Pure. Returns a new frozen state for an allowed transition,
// or the SAME state object for a transition that is not allowed.
// Throws TypeError for an unknown event type, RESOLVE without an array,
// or REJECT without a non-empty string.

export function isViewState(value: unknown): boolean
// Runtime check of the four shapes above (no extra status values,
// SUCCESS has an array `data`, ERROR has a non-empty string `error`).
```

## Transition table

| From \ Event | `START`   | `RESOLVE(data)` | `REJECT(error)` |
|--------------|-----------|-----------------|-----------------|
| `IDLE`       | `LOADING` | ignored         | ignored         |
| `LOADING`    | ignored   | `SUCCESS`       | `ERROR`         |
| `SUCCESS`    | `LOADING` | ignored         | ignored         |
| `ERROR`      | `LOADING` | ignored         | ignored         |

"ignored" = same state object returned → `useState` sees `Object.is(old, new)` → no re-render.

```
          START               RESOLVE(data)
  IDLE ─────────► LOADING ─────────────────► SUCCESS
                  │  ▲  ▲                      │
     REJECT(error)│  │  └──── START (Reload) ──┘
                  ▼  │
                 ERROR
                    START (Retry Connection)
```

Valid edges: `IDLE→LOADING`, `LOADING→SUCCESS`, `LOADING→ERROR`, `ERROR→LOADING` (Retry),
`SUCCESS→LOADING` (Reload). No fifth state; an empty list is `SUCCESS` with `data: []`.

## Invariants

- **F1 – One state:** the view state lives in one `useState` slot; no `isLoading` / `hasError` booleans.
- **F2 – Shape:** every value stored is accepted by `isViewState()`.
- **F3 – Payload:** `SUCCESS` always has `data`, `ERROR` always has `error`; `IDLE`/`LOADING` have neither.
- **F4 – Guarded edges:** only the five edges above change state; everything else is a no-op.
- **F5 – Immutability:** states are frozen; `transition()` never mutates its input.
- **F6 – No duplicate request:** `START` while `LOADING` is ignored, so the loader starts no second fetch.
- **F7 – Latest wins (T-06):** each load gets `requestId = ++latestRequestId`; a result whose
  `requestId !== latestRequestId` is dropped before it reaches `transition()`.
  F4 alone is not enough: after `A start → B start`, A's late `RESOLVE` would still find `LOADING`.
- **F8 – Safe error text:** the `error` string is a fixed user-facing message, never `err.message` or a stack.

## Planned UI contract (implemented in T-03 – T-05)

- One action button `id="feed-action"` that always exists, so `renderApp` can restore focus:
  `IDLE` "Load feed", `LOADING` "Loading…" (`aria-disabled="true"`), `SUCCESS` "Reload feed",
  `ERROR` "Retry Connection". `aria-disabled` instead of `disabled` keeps it focusable.
- Feed region `<section aria-busy>`; skeleton (`aria-hidden`) / `<ul>` of `<article>` / error `role="alert"`.
- Simulated response toggle (Success / Empty / Network error, `aria-pressed`) so every state
  can be reached by hand without randomness.
- Open point for T-05: a live region re-created on every full re-render may not be announced;
  verify in the Accessibility panel and move it outside the re-rendered subtree if needed.

## Test cases (implemented in T-02, `tests/view-state.test.js`)

- [x] `INITIAL_STATE` is `{ status: 'IDLE' }` and frozen.
- [x] `IDLE + START → LOADING`.
- [x] `LOADING + RESOLVE(data) → SUCCESS` with the same `data`.
- [x] `LOADING + RESOLVE([]) → SUCCESS` with `data: []` (empty is not a new state).
- [x] `LOADING + REJECT(msg) → ERROR` with `error: msg`.
- [x] `ERROR + START → LOADING` (Retry) and `SUCCESS + START → LOADING` (Reload).
- [x] Every "ignored" cell of the table returns the same object (`strictEqual`).
- [x] Unknown event, `RESOLVE` with non-array, `REJECT` with empty/non-string → TypeError.
- [x] `transition()` does not mutate the input state.
- [x] `isViewState()` accepts the four shapes and rejects `{status:'DONE'}`, `SUCCESS` without
      `data`, `ERROR` without `error`, `null`, arrays.
- [x] Every state reached through `transition()` passes `isViewState()`.

## Definition of Done

Contract, transition table, invariants and test list written and reviewed. No code yet.

**Commit:** `docs: define exercise 3 rules and view state contract`

**Status:** DONE

---

# T-02: Implement FSM and Async Data Loader

- [x] `src/view-state.js` + `tests/view-state.test.js` (all T-01 test cases).
      `npm test` → 49 passed (11 new). Mutation check: RESOLVE accepted from any state,
      data not copied, and a fresh LOADING object per START are each caught by a failing test.
      Note: because `LOADING_STATE` is one shared frozen object, `LOADING + START` already
      returns the same object; the explicit guard documents F6 rather than changing output.
- [x] `src/feed-api.js`: `fetchFeed({ mode, delayMs })` → `Promise<FeedItem[]>`; `mode` is
      `'success' | 'empty' | 'error'`, rejects with an `Error` on `'error'`. Node tests.
      `npm test` → 57 passed (8 new). Mutation check: returning the shared array, error mode
      resolving, and skipping the delay are each caught by a failing test.
      The feed includes an XSS probe title (`<img src=x onerror=alert(1)>`) for T-04/T-07.
- [ ] `renderApp()` in `reactive-engine.js` (copy from Exercise 2 T-05, commit `273c576`).
- [ ] `loadFeed(setState, fetcher)` with `async/await`, `try/catch`, fixed error message.

**Commits:** `feat(state): implement view state transitions`, `feat(data): add simulated fetchFeed`, …

# T-03: Implement Skeleton Loader

- [ ] Skeleton list in `LOADING`, pulse `@keyframes` on `opacity`, `prefers-reduced-motion`.

# T-04: Implement SUCCESS UI

- [ ] `<ul>` of `<article>` items, empty-list message, XSS item renders as text.

# T-05: Implement ERROR & Retry

- [ ] Error `role="alert"`, `Retry Connection` restarts the load, focus kept on `#feed-action`.

**Milestone commit:** `feat(ui): implement multi-state data component with skeleton feedback`

# T-06: Race Condition Protection

- [ ] `latestRequestId` guard (F7). Node tests with manually resolved Promises: reverse-order
      completion, old request fails after new one succeeded, START during LOADING.

# T-07: Accessibility, Security & Performance Audit

- [ ] Keyboard, focus, Accessibility tree, 375px/768px/desktop, XSS, Event Listeners, Lighthouse.

# T-08: Final Verification & Submission

- [ ] All acceptance criteria, Git history, Exercise 1/2 still pass, docs updated.

---

# Verification log (T-02 – T-08)

- `src/feed-loader.js`: `loadFeed()` with F6 (no request while LOADING) and F7 (`latestRequestId`).
  `npm test` → 68 passed, 0 failed. Mutation check: removing either `requestId` check, the
  LOADING guard, or the fixed error message each makes a test fail.
- Key finding: stale results arriving *after* the new request settled are already blocked by F4;
  the dangerous case is a stale result arriving while the new request is still LOADING (tests added).
- `src/data-feed.js`: skeleton (LOADING, `aria-hidden`, opacity pulse, reduced-motion off),
  `<ul>` of `<article>` (SUCCESS, empty message), `role="alert"` + `Retry Connection` (ERROR),
  one `#feed-action` button whose focus survives every re-render (`aria-disabled` while loading).
- Headless Chrome `http://localhost:5173/tests/` → events 12 passed, data-feed 31 passed:
  one view per state, focus kept, XSS title rendered as text with no `<img>`, no "503" in UI,
  Retry fail → ERROR, Retry success → SUCCESS, empty → SUCCESS.
- 375px (iframe at true width): no horizontal overflow in IDLE, SUCCESS, ERROR. 768px: 2-column grid.
- `vite build` succeeds.
- Not measured yet (do by hand): Lighthouse, screen reader announcement of the re-created
  `role="status"` region (full-subtree replacement may skip it; `role="alert"` is announced).
