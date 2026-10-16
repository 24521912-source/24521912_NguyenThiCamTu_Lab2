# PROJECT RULES
## Lab 02 – Exercise 3: Resilient State Machine & Skeleton Loader

**Technology:** HTML5, CSS3, Vanilla JavaScript ES6+, ES Modules, Vite
**Quality target:** WCAG 2.2 AA, Mobile-First, Core Web Vitals, Secure DOM
**Builds on:** Exercise 1 Mini-React engine + Exercise 2 Reactive State Engine and Delegation Hub

---

## 1. General Engineering Principles

- Read `project-rules.md` and `TASK_DECOMPOSITION.md` before modifying code.
- Contract first: every task defines inputs, outputs, invariants and acceptance criteria before code is written.
- One task per AI request. Verify it before starting the next one.
- Never accept AI-generated code without running its tests and reading the diff.
- Prefer simple, readable code over abstractions.
- Change the Exercise 1/2 engine only where Exercise 3 requires it, and keep its existing tests passing.
- Never mark a task as done unless it was actually verified.

## 2. Technology & Dependency Rules

- Vanilla JavaScript ES6+ with `import` / `export`. Vite is the only dev dependency.
- Do not use React, ReactDOM, Redux, Zustand, XState, another VDOM library, animation library or CSS framework.
- No backend, database, authentication, external API or CDN. Data comes from a local simulated `fetchFeed()`.
- `const` by default, `let` only for reassignment. Never `var` or implicit globals.
- Not in scope: Fiber, Suspense, Server Components, diffing, `useEffect`, a React Error Boundary.

## 3. Module Layout

| File | Responsibility |
|------|----------------|
| `src/mini-react.js` | Exercise 1 VNode factory and DOM renderer (from Exercise 2) |
| `src/reactive-engine.js` | `useState`, `resetCursor`, `setRenderer`, `renderApp` (from Exercise 2) |
| `src/events.js` | Root event delegation hub (from Exercise 2) |
| `src/view-state.js` | FSM contract: state factories, `transition()`, `isViewState()` – pure, no DOM |
| `src/feed-api.js` | Simulated `fetchFeed()` that can succeed, fail or return an empty list |
| `src/data-feed.js` | `DataFeed()` component: loader, race guard, IDLE/LOADING/SUCCESS/ERROR views |
| `src/main.js` | Bootstrap: delegation hub + `renderApp(DataFeed, root)` |
| `src/style.css` | Styles, skeleton animation |

## 4. Finite State Machine Rules

- The view state is one object held in **one** `useState` slot. It is always exactly one of:
  `{ status: 'IDLE' }`, `{ status: 'LOADING' }`, `{ status: 'SUCCESS', data }`, `{ status: 'ERROR', error }`.
- No parallel booleans (`isLoading`, `hasError`, …) for the same request.
- `SUCCESS` always carries `data` (an array, may be empty). `ERROR` always carries a non-empty, user-readable `error` string.
- All state changes go through `transition(state, event)`. Components never build state objects by hand.
- A transition that is not allowed returns the **same** state object, so `useState` (Object.is) skips the re-render.
- An empty list is `SUCCESS` with `data: []`, never a fifth state.

## 5. Async & Race Condition Rules

- `async/await` with `try/catch`. No unhandled Promise rejection.
- Errors are normalised to a fixed user-facing message. Never show `error.stack` or raw technical details.
- Each load gets a request id from a module-level counter. Only the latest request may update state; stale results are ignored.
- A load request while `LOADING` is ignored (no duplicate request).

## 6. Rendering Rules

- `renderApp()` resets the cursor, runs the root component, renders and mounts with `replaceChildren()`, restores focus by element `id`.
- The root container and its delegated listeners are created once.
- Data flow: State → UI → User Event → `transition()` → setState → Re-render.
- Exactly one view per state: skeleton only in `LOADING`, list only in `SUCCESS`, error only in `ERROR`.

## 7. Skeleton Rules

- Pure CSS `@keyframes` pulse on `opacity` (compositor-only, no layout).
- Same item count and approximate size as the real list, to keep CLS low.
- `prefers-reduced-motion: reduce` disables the animation.
- Skeleton is decorative: `aria-hidden="true"`; the loading state is announced by text instead.

## 8. Accessibility – WCAG 2.2 AA

- Semantic HTML: `main`, `header`, `section`, `h1`, `h2`, `ul`, `li`, `article`, `p`, `button`. No div-soup.
- One `h1`, logical heading order.
- Everything works with Tab, Shift+Tab, Enter and Space. No keyboard traps.
- Visible `:focus-visible` indicator. Text contrast ≥ 4.5:1, UI boundaries ≥ 3:1.
- The feed region has `aria-busy="true"` while loading.
- State changes are announced once through a live region; errors use `role="alert"`. No noisy live regions.
- Focus must not fall back to `<body>` when the action button changes between states.
- Targets at least 24×24 CSS px, ideally 44×44.

## 9. Responsive & CSS

- Mobile-first, baseline 375px, no horizontal scroll. Test 375px, 768px, desktop.
- `box-sizing: border-box`, design tokens as CSS variables in `:root`, Flexbox or Grid.
- Visual style consistent with Exercises 1 and 2. No unnecessary inline styles.

## 10. Performance

- Skeleton animates `opacity` only. No interleaved DOM reads/writes.
- No listener re-registration across renders. Same-state updates do not re-render.
- Measure LCP, INP and CLS with DevTools/Lighthouse where possible. Never invent numbers.

## 11. Security

- Feed text renders only through `document.createTextNode()`.
- Never `innerHTML`, `eval()` or inline event attributes. No `keypress` / `event.keyCode`.
- XSS test: a feed item titled `<img src=x onerror=alert(1)>` renders as plain text.

## 12. Testing

- Node tests (`npm test`) for `transition()`, `fetchFeed()` and the race guard, independent of the DOM.
- Browser tests in the dev server Console for the rendered states and Retry.
- Manual DevTools audit: Elements, Accessibility, Event Listeners, Console, Performance, Lighthouse, 375px.
- Do not report a test as passed unless it was run.

## 13. Git

- Mandatory milestone (exact message): `feat(ui): implement multi-state data component with skeleton feedback`
- One commit per verified task; extra `chore:` / `docs:` / `feat:` / `test:` commits are allowed.
- Check `git status` and `git diff` before every commit.
- Never commit `node_modules`. Never rewrite Exercise 1 or 2 history.
