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
const stateStore = [];      // unknown[]: one slot per useState call, in call order
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

- [x] `resetCursor()` makes the next pass read slot 0 again.
- [x] `setRenderer()` rejects non-functions with TypeError.
- [x] First render returns `initialValue`.
- [x] Two `useState` calls keep independent values.
- [x] Value is kept after re-render (initialValue is ignored on later passes).
- [x] `0`, `false`, `""` and `null` are not re-initialised.
- [x] `setState(5)` stores 5 and triggers one re-render.
- [x] `setState(prev => prev + 1)` uses the previous value.
- [x] Two functional updates in a row both apply (`+1`, `+1` → `+2`).
- [x] Setting the same value (`Object.is`) does not re-render.
- [x] A setter from an earlier pass still updates its own slot.

## Definition of Done

Contract and invariants written and reviewed. No code yet.

**Status:** DONE

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

- [x] Implement `useState()` following invariants I1–I6.
- [x] All T-01 state test cases pass (11 tests, plus "new array with same content does re-render").
- [x] Reproduced the slide-18 init bug: with `stateStore[i] ?? initialValue`, after
      `setState(null)` the next render reads `"initial"` again. The implementation uses
      `index >= stateStore.length` instead, covered by the `0, false, "", null` test.

**Verification:** `npm test` → 38 passed, 0 failed.

**Git milestone 2:** `feat(state): implement reactive useState dispatcher`

**Status:** DONE

---

# T-04: Implement Root Event Delegation Hub

- [x] Change `renderToDOM` to attach the VNode to its DOM node (`element.__vnode`) instead of
      calling `addEventListener`.
- [x] Accept `onClick`, `onInput`, `onKeydown` (functions only), `type` (`button` / `submit` /
      `reset`, on `<button>` only), and tags `ul`, `li`.
- [x] Create `src/events.js` with `setupEventDelegation(rootContainer)`.
- [x] One listener per event type on the root, registered once (a `WeakSet` makes a second
      call a no-op).
- [x] Walk from `event.target` to the root, call the first matching handler, then stop.
- [x] Browser tests (`tests/events.browser.js`, run from `/tests/`): click handled once, no
      listener on the child itself, bubbling from a nested span, only the nearest handler runs,
      new button after 3 re-renders works once, no duplicate root listener, `keydown` with
      `event.key`, `input` delegated, string handler rejected, missing root rejected,
      `type="button"` applied.

**Verification:**
- `npm test` → 38 passed, 0 failed (Exercise 1 factory tests still pass after the engine change).
- Headless Chrome on `http://localhost:5173/tests/` → `Event tests: 12 passed, 0 failed`.
- Still to do by hand in T-06: DevTools → Elements → Event Listeners shows listeners on the root
  only, none on buttons.

**Git milestone 3:** `feat(events): attach root event delegation listener`

**Status:** DONE

---

# T-05: Integrate Rendering and Assemble Task Manager UI

- [x] `renderApp(Component, root)` in `src/reactive-engine.js`: empties the store (one app at a
      time), resets the cursor, runs the component, checks hook count (I8), mounts with
      `replaceChildren`, restores focus by element id (falls back to the first button if the
      focused element was removed, e.g. a task filtered out).
- [x] `TaskApp()` in `src/task-app.js` (separate file so the browser tests can import it
      without mounting the app): `tasks` and `filter` state, `Tasks: N`, `Add Task`,
      `ALL` / `ACTIVE` / `COMPLETED` toggles with `aria-pressed`, `Done` toggle per task,
      empty message when no task matches. Updates are immutable (spread / `map`).
- [x] `src/main.js`: `setupEventDelegation(root)` once, then `renderApp(TaskApp, root)`.
- [x] `src/style.css`: mobile-first, CSS variables, 44px buttons, `:focus-visible`, dark mode.
- [x] Browser tests (`tests/app.browser.js`, 19 checks): initial tasks and count, ALL pressed,
      Add Task, toggle done, ACTIVE / COMPLETED / ALL, empty message, `aria-pressed` follows
      filter, 3 more adds → `Tasks: 6` with unique titles, focus kept on Add Task, focus
      fallback, same-value `setFilter` does not re-render, conditional `useState` throws the
      hook count error, XSS strings stay text.

**Verification:**
- `npm test` → 38 passed, 0 failed. `npm run build` succeeds.
- Headless Chrome `/tests/` → `Event tests: 12 passed`, `App tests: 19 passed`, 0 failed.
- Headless Chrome `/` → DOM matches `TaskApp`, no Console errors, mount assertion passes.
- Inside a 375px iframe: `scrollWidth = 375`, rightmost button ends at 359px (no horizontal scroll).

**Git milestone 4:** `feat(ui): assemble reactive todo application`

**Status:** DONE

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
