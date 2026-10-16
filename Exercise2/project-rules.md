# PROJECT RULES
## Lab 02 – Exercise 2: Reactive State Machine & Delegation Hub

**Technology:** HTML5, CSS3, Vanilla JavaScript ES6+, ES Modules, Vite
**Quality target:** WCAG 2.2 AA, Mobile-First, Core Web Vitals, Secure DOM
**Builds on:** Exercise 1 Mini-React engine (`createTextElement`, `createElement`, `renderToDOM`)

---

## 1. General Engineering Principles

- Read `project-rules.md` and `TASK_DECOMPOSITION.md` before modifying code.
- Contract first: every task defines inputs, outputs, invariants and acceptance criteria before code is written.
- One task per AI request. Verify it before starting the next one.
- Never accept AI-generated code without running its tests and reading the diff.
- Prefer simple, readable code over abstractions.
- Change the Exercise 1 engine only where state or event delegation requires it.
- Never mark a task as done unless it was actually verified.

## 2. Technology & Dependency Rules

- Vanilla JavaScript ES6+ with `import` / `export`. Vite is the only dev dependency.
- Do not use React, ReactDOM, Redux, Zustand, another VDOM library or any CSS framework.
- No external CDNs, no Babel standalone. Serve through localhost, never `file://`.
- `const` by default, `let` only for reassignment. Never `var` or implicit globals.

## 3. Module Layout

| File | Responsibility |
|------|----------------|
| `src/mini-react.js` | Exercise 1 VNode factory and DOM renderer (adapted for delegation in T-04) |
| `src/reactive-engine.js` | `stateStore`, `cursor`, `resetCursor`, `setRenderer`, `useState`, `renderApp` |
| `src/events.js` | `setupEventDelegation(rootContainer)` |
| `src/main.js` | `TaskApp` component and application bootstrap |
| `src/style.css` | Styles |

## 4. Reactive State Rules

- State lives outside the component in a module-private `stateStore` array.
- A module-private `cursor` selects the slot for each `useState` call.
- `resetCursor()` runs before every render pass.
- A slot is initialised only if it has never been written. Valid values such as `0`, `false`, `""` and `null` must never be replaced by `initialValue`.
- The setter captures its own slot index in a closure. It never reads the live `cursor`.
- The setter supports a direct value and a functional updater `(prev) => next`.
- Use `Object.is()` to detect change. Same value: no write, no re-render.
- Hooks are called only at the top level of a component, never inside `if`, loops or nested functions.
- If the number of hook calls changes between render passes, report it as an error instead of reading the wrong slot silently.

## 5. Event Delegation Rules

- Exactly one listener per supported event type (`click`, `input`, `keydown`) on the root container, registered once.
- No listeners on child elements. One click runs exactly one handler.
- Find handlers by walking from `event.target` up to the root and reading the VNode props attached to each DOM node.
- Handler prop names: `onClick`, `onInput`, `onKeydown`. Handler values must be functions.
- No inline HTML event attributes, no `keypress`, no `event.keyCode`.
- Do not build a full SyntheticEvent system.

## 6. Rendering Rules

- `renderApp()` resets the cursor, runs the root component, renders the VNode tree and mounts it with `replaceChildren()`.
- The root container and its delegated listeners are created once, not per render.
- Data flow is one-way: State → UI → User Event → State Update → Re-render.
- No diffing, Fiber, scheduling, `useEffect`, `useMemo` or `useCallback`.
- Because the whole subtree is replaced, keyboard focus must be restored after each render.

## 7. Task Manager Scope

- `TaskApp()` holds the task list and the filter in two separate `useState` calls.
- Initial tasks: `Review PR`, `Verify AST`. Initial filter: `ALL`.
- Header shows `Tasks: <count>`. An `Add Task` button appends a task immutably.
- Filter toggles `ALL` / `ACTIVE` / `COMPLETED`. To support them, each task is `{ id, title, done }` and can be toggled done. This is an implementation decision derived from "dynamic filter toggles".
- No backend, storage, API, login, editing, drag and drop or other extra features.
- Nothing from Exercise 3 (async state, skeleton loader).

## 8. Accessibility – WCAG 2.2 AA

- Semantic HTML: `main`, `header`, `section`, `h1`, `h2`, `ul`, `li`, `button`. No div-soup.
- One `h1`, logical heading order.
- Everything works with Tab, Shift+Tab, Enter and Space. No keyboard traps.
- Visible `:focus-visible` indicator. Text contrast ≥ 4.5:1, UI boundaries ≥ 3:1.
- Filter toggles expose their state with `aria-pressed`. No redundant ARIA.
- Targets at least 24×24 CSS px, ideally 44×44.

## 9. Responsive & CSS

- Mobile-first, baseline 375px, no horizontal scroll. Test 375px, 768px, desktop.
- `box-sizing: border-box`, design tokens as CSS variables in `:root`, Flexbox or Grid.
- Separate stylesheet, no unnecessary inline styles.

## 10. Performance

- No root listener re-registration and no listener leaks across renders.
- Same-value updates must not re-render.
- Full subtree replacement is a learning simplification, not React's reconciliation. Document it, do not add diffing.
- Measure LCP, INP and CLS with DevTools/Lighthouse where possible. Never invent numbers.

## 11. Security

- Task titles render only through `document.createTextNode()`.
- Never `innerHTML`, `eval()` or inline event attributes.
- XSS test strings: `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>`.

## 12. Testing

- Node tests (`npm test`) for the state engine, independent of the DOM.
- Browser tests in the dev server Console for event delegation and the Task Manager.
- Manual DevTools audit: Elements, Accessibility, Event Listeners, Console, Lighthouse, 375px.
- Do not report a test as passed unless it was run.

## 13. Git Milestones (exact messages, in order, separate commits)

1. `feat(state): implement stateStore and resetCursor engine`
2. `feat(state): implement reactive useState dispatcher`
3. `feat(events): attach root event delegation listener`
4. `feat(ui): assemble reactive todo application`

- Check `git status` and `git diff` before every commit.
- Never commit `node_modules`. Never rewrite Exercise 1 history.
- Extra `docs:` / `chore:` / `test:` commits are allowed as long as the four milestones stay intact.
