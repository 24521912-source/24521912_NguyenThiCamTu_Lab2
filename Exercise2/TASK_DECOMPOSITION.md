# TASK DECOMPOSITION
## Exercise 2: Reactive State Machine & Delegation Hub

**Course:** Modern React Architecture, Virtual DOM & State Machines
**University:** UIT - VNUHCM
**Instructor:** Tran Vinh Khiem

---

## Starting Point (review of Exercise 1 engine)

Kept as is:
- VNode POJO contract `{ type, props: { ...props, children } }`.
- `createTextElement`, `createElement`, recursive `renderToDOM`, text through `createTextNode`.

Must change (in T-04):
- `renderToDOM` registers `onClick` with `element.addEventListener("click", ...)` on every
  element. With a root delegation hub this would run the handler twice per click, and every
  re-render would create new per-element listeners. It must instead attach the VNode to the
  DOM node and let the hub call the handler.
- `onInput` and `onKeydown` are rejected as unsupported props today.
- `HTML_TAGS` has no `ul` / `li`, needed for the task list.
- `type` is not an allowed prop, so `<button type="button">` cannot be written.

Risk: the Exercise 1 browser tests check `button.click()` on a detached element. That only
works with direct listeners, so the delegation tests in Exercise 2 replace that check.

---

# T-00: Project Setup

- [x] Create `Exercise2/` with the Exercise 1 engine, `index.html`, `package.json`, `.gitignore`.
- [x] Copy the Exercise 1 Node tests and confirm they pass (`npm test`: 22 passed).
- [x] Write `project-rules.md` and `TASK_DECOMPOSITION.md`.

**Status:** DONE

---

# T-01: Define Reactive State Store Contract

## Module

`src/reactive-engine.js`

## Contract

```javascript
// Module-private state
let stateStore = [];        // unknown[]: one slot per useState call, in call order
let cursor = 0;             // index of the next slot to read
let triggerRender = () => {}; // registered re-render callback

export function resetCursor(): void
// Sets cursor to 0. Called before every render pass.

export function setRenderer(rerenderFn: () => void): void
// Registers the re-render callback. Throws TypeError if rerenderFn is not a function.

export function useState<T>(initialValue: T): [T, (next: T | ((prev: T) => T)) => void]
// Reads slot `cursor`, initialises it once, returns [value, setState], then cursor++.
```

## Invariants

- **I1 – Call order:** the n-th `useState` call in a render pass always reads `stateStore[n]`.
- **I2 – One-time init:** a slot gets `initialValue` only if it was never written
  (`index >= stateStore.length`). `0`, `false`, `""` and `null` survive re-renders.
  The slide-18 version (`stateStore[i] ?? initialValue`) breaks this for `null` / `undefined`.
- **I3 – Closure index:** `setState` uses the index captured when it was created, not the live `cursor`.
- **I4 – Updater:** if `next` is a function, the new value is `next(stateStore[index])`.
- **I5 – No-op updates:** if `Object.is(old, new)`, nothing is written and nothing re-renders.
- **I6 – Re-render:** a real change writes the slot, then calls `triggerRender()` exactly once.
- **I7 – Reset:** `resetCursor()` must run before each pass; otherwise pass 2 reads slots
  after the ones written in pass 1.
- **I8 – Hook count (checked in T-05 `renderApp`):** if a pass makes a different number of
  `useState` calls than the previous pass, throw an Error instead of silently reading the wrong slot.
  Limitation: two hooks swapping order with the same count cannot be detected.

## Why hooks must keep a consistent order

State is matched to a hook only by its position in `stateStore`. If a `useState` call is skipped
(for example inside an `if`), every later hook shifts one slot back and reads another hook's value
(slide 19: `age` receives `'Platinum'`). That is why hooks are never placed inside `if`, loops or
nested functions.

## Test Cases (implemented in T-02 / T-03, `tests/reactive-engine.test.js`)

Each test imports a fresh copy of the module (`import("../src/reactive-engine.js?case=N")`) so
state never leaks between tests, without adding a test-only export.

- [ ] `resetCursor()` makes the next pass read slot 0 again.
- [ ] `setRenderer()` rejects non-functions with TypeError.
- [ ] First render returns `initialValue`.
- [ ] Two `useState` calls keep independent values.
- [ ] Value is kept after re-render (initialValue is ignored on later passes).
- [ ] `0`, `false`, `""` and `null` are not re-initialised.
- [ ] `setState(5)` stores 5 and triggers one re-render.
- [ ] `setState(prev => prev + 1)` uses the previous value.
- [ ] Two functional updates in a row both apply (`+1`, `+1` → `+2`).
- [ ] Setting the same value (`Object.is`) does not re-render.
- [ ] A setter from an earlier pass still updates its own slot.

## Definition of Done

Contract and invariants written and reviewed. No code yet.

**Status:** DONE (waiting for review before T-02)

---

# T-02: Implement stateStore and resetCursor Engine

- [x] Create `src/reactive-engine.js` with `stateStore`, `cursor`, `triggerRender`.
- [x] Implement `resetCursor()` and `setRenderer()`.
- [x] Tests: exports exist, `setRenderer` accepts functions and rejects non-functions,
      `stateStore` / `cursor` are not exported.
- Note: what `resetCursor()` actually does (next pass reads slot 0) can only be observed
  through `useState`, so that test is part of T-03.

**Verification:** `npm test` → 27 passed, 0 failed (5 new T-02 tests + 22 Exercise 1 tests).

**Git milestone 1:** `feat(state): implement stateStore and resetCursor engine`

**Status:** DONE

---

# T-03: Implement Reactive useState Dispatcher

- [ ] Implement `useState()` following invariants I1–I6.
- [ ] All T-01 state test cases pass.

**Git milestone 2:** `feat(state): implement reactive useState dispatcher`

**Status:** NOT STARTED

---

# T-04: Implement Root Event Delegation Hub

- [ ] Change `renderToDOM` to attach the VNode to its DOM node instead of calling `addEventListener`.
- [ ] Accept `onClick`, `onInput`, `onKeydown` (functions only), `type`, and tags `ul`, `li`.
- [ ] Create `src/events.js` with `setupEventDelegation(rootContainer)`.
- [ ] One listener per event type on the root, registered once (second call is a no-op).
- [ ] Walk from `event.target` to the root, call the first matching handler, then stop.
- [ ] Browser tests: click handled once, bubbling from a nested child, new button after re-render
      works, no listeners on children, no duplicate root listener.

**Git milestone 3:** `feat(events): attach root event delegation listener`

**Status:** NOT STARTED

---

# T-05: Integrate Rendering and Assemble Task Manager UI

- [ ] `renderApp(Component, root)`: reset cursor, run component, check hook count (I8),
      mount with `replaceChildren`, restore focus.
- [ ] `TaskApp()` with `tasks` and `filter` state, `Tasks: N`, `Add Task`, filter toggles with
      `aria-pressed`, toggle done per task.
- [ ] `src/main.js` bootstrap and `src/style.css`.
- [ ] Browser tests: initial tasks and count, Add Task, filters, toggle, repeated interactions, XSS.

**Git milestone 4:** `feat(ui): assemble reactive todo application`

**Status:** NOT STARTED

---

# T-06: Testing, Accessibility, Security and Performance Audit

- [ ] `npm test` and browser tests pass.
- [ ] DevTools Elements / Accessibility / Event Listeners / Console checked.
- [ ] Keyboard: Tab, Shift+Tab, Enter, Space; focus is kept after re-render.
- [ ] 375px, 768px, desktop, 200% zoom.
- [ ] XSS strings render as text.
- [ ] Lighthouse results recorded.

**Status:** NOT STARTED

---

# T-07: Git History and Final Submission

- [ ] `git log --oneline` shows the four milestone commits, separate and in order.
- [ ] Documentation updated. No Exercise 3 features.

**Status:** NOT STARTED
