# PROJECT RULES
## Lab 02 – Exercise 1: Mini-React VNode & Mounting Engine

**Technology:** HTML5, CSS3, Vanilla JavaScript ES6+, Vite  
**Quality target:** WCAG 2.2 AA, Mobile-First, Core Web Vitals, Secure DOM  

---

## 1. General Engineering Principles

- Always read `project-rules.md` and `TASK_DECOMPOSITION.md` before modifying code.
- Follow contract-first development and atomic task decomposition.
- Each task must have clear inputs, outputs, invariants and acceptance criteria.
- Implement only one isolated task per AI request.
- Never accept AI-generated code without independent verification.
- Prefer simple, readable and maintainable solutions over unnecessary abstractions.
- Never introduce features beyond Exercise 1 without explicit approval.

## 2. Technology & Dependency Rules

- Use semantic HTML5, modern CSS3 and Vanilla JavaScript ES6+.
- Use JavaScript ES Modules with `import` and `export`.
- Use Vite as the development server and build tool.
- Do not use React, Vue, Angular, jQuery, Bootstrap or Tailwind to implement the application.
- Do not use external script CDNs or outdated Babel standalone.
- Do not open the application via `file://`; serve it through localhost.
- Use `const` by default and `let` only when reassignment is required.
- Never use `var` or implicit global variables.
- Use Prettier and ESLint to maintain consistency.
- Keep dependencies minimal and documented.

## 3. Mini-React Architecture

Only implement the three core functions:

1. `createTextElement(text)`
2. `createElement(type, props, ...children)`
3. `renderToDOM(vNode)`

### VNode Contract

- VNodes must be Plain Old JavaScript Objects (POJOs).
- Each VNode must contain `type` and `props`.
- Each VNode's `props.children` must be an array.
- Text and number children must be normalized to `TEXT_ELEMENT`.
- VNode factories must not manipulate the real DOM.
- Do not mutate input props or children arrays.
- Preserve deterministic tree structure and child ordering.

### createTextElement()

- Set `type` to `TEXT_ELEMENT`.
- Convert input to string using `String(text)`.
- Store the result in `props.nodeValue`.
- Set `props.children` to an empty array.

### createElement()

- Accept `type`, `props` and variadic `children`.
- Replace nullish props with an empty object.
- Flatten nested children using `flat(Infinity)`.
- Filter out `null`, `undefined` and `false`.
- Normalize strings and numbers into text VNodes.
- Preserve valid existing VNodes.
- Return a new VNode object.

### renderToDOM()

- Use `document.createTextNode()` for text VNodes.
- Use `document.createElement()` for native HTML VNodes.
- Recursively render all children.
- Handle safe DOM properties and attributes.
- Handle events through JavaScript event listeners.
- Do not generate inline HTML event attributes.
- Avoid unsafe DOM properties and executable input.
- Use type guards and predictable error handling.
- Mount through `replaceChildren()`.
- Verify the DOM tree contains no orphan or duplicate nodes.

## 4. Semantic HTML Rules

- Use native semantic elements wherever possible.
- Prefer `<main>`, `<header>`, `<section>`, `<h1>`, `<p>` and `<button>`.
- Avoid generic `div` elements when a semantic alternative exists.
- A single `div#app` is permitted as a mounting container.
- Provide exactly one primary `h1` for the exercise page.
- Use a logical heading hierarchy without skipping levels.
- Use native button elements for actions, not clickable spans or generic containers.
- Assign meaningful accessible names to interactive elements.
- Do not add redundant ARIA roles where native semantics already provide the same meaning.
- Use a correct document language attribute (`lang`).
- Include the HTML5 doctype, UTF-8 charset and viewport meta tag.

## 5. Accessibility – WCAG 2.2 AA

Target WCAG 2.2 Level AA for the rendered interface.

### Color & Contrast

- Normal text must have contrast of at least 4.5:1.
- Large text must have contrast of at least 3:1.
- Essential non-text UI boundaries and indicators must meet applicable 3:1 contrast requirements.
- Never communicate essential information through color alone.
- Use sufficiently distinguishable colors in every supported theme.

### Keyboard Accessibility

- All interactive functionality must be usable without a mouse.
- Native buttons must support keyboard activation.
- Keyboard navigation must have logical focus order.
- Do not remove visible focus indicators.
- Use `:focus-visible` for clearly visible keyboard focus.
- Do not create keyboard traps.
- Avoid unnecessary positive `tabindex` values.

### Additional Accessibility

- Provide meaningful labels for controls.
- Use real labels for any input elements.
- Images, if included, must have appropriate alternative text.
- Decorative images should use empty alt text.
- Use a skip link if a meaningful navigation section needs to be bypassed.
- Respect text resizing up to 200% without losing essential functionality.
- Aim for interactive targets of at least 24 × 24 CSS pixels, subject to WCAG exceptions.
- Prefer comfortably sized buttons, approximately 44 × 44 CSS pixels where practical.
- Avoid flashing effects.
- Respect `prefers-reduced-motion` if animations are introduced.

### Accessibility Verification

- Test navigation using Tab and Shift+Tab.
- Test button activation using Enter and Space.
- Verify visible focus indicators.
- Inspect the Accessibility Tree in Chrome DevTools.
- Run an automated accessibility audit when tooling is available.
- Manually verify results because automated audits alone cannot prove complete WCAG compliance.

## 6. Responsive Design

- Follow a mobile-first design approach.
- The minimum baseline viewport is 375 CSS pixels.
- Test at 375px, 768px and desktop widths.
- Prevent unintended horizontal scrolling.
- Do not use fixed widths that overflow small screens.
- Prefer fluid sizing using `%`, `rem`, `min()`, `max()` and `clamp()`.
- Use Flexbox for one-dimensional layouts.
- Use CSS Grid only when two-dimensional layout is necessary.
- Maintain readable font sizes and line heights.
- Ensure buttons remain reachable and usable on touchscreens.
- Test at 200% browser text zoom.

## 7. CSS Architecture

- Use a separate CSS stylesheet.
- Apply a consistent `box-sizing: border-box` reset.
- Define reusable colors, spacing and typography values using CSS custom properties in `:root`.
- Avoid unnecessary inline styles.
- Avoid overqualified selectors and excessive specificity.
- Prefer system fonts for a lightweight implementation.
- Use responsive layouts without adding a CSS framework.
- Keep decoration secondary to the Mini-React functionality.
- Prefer native CSS behavior over JavaScript for presentation.

## 8. Performance & Core Web Vitals

Target Google's good Core Web Vitals thresholds:

- LCP (Largest Contentful Paint): ≤ 2.5 seconds.
- INP (Interaction to Next Paint): ≤ 200 milliseconds.
- CLS (Cumulative Layout Shift): ≤ 0.1.

### Performance Practices

- Avoid unnecessary DOM reads and writes.
- Do not interleave layout reads and writes in loops.
- Avoid expensive synchronous operations on the main thread.
- Avoid needless DOM nodes and deep wrapper hierarchies.
- Keep JavaScript and CSS bundles small.
- Do not add unnecessary third-party scripts.
- If images are used, declare intrinsic dimensions and optimize their format.
- Avoid unnecessary animation and layout-shifting effects.
- Ensure event listeners are registered only as intended.
- Prefer structural correctness over premature optimization.

### Performance Verification

- Audit with Chrome DevTools Performance panel.
- Run Lighthouse performance checks on mobile.
- Record LCP, CLS and available interaction measurements.
- Compare results under consistent test conditions.
- Treat LCP < 2.0s and CLS close to zero as stretch goals.
- Do not claim performance compliance without measurement.
- If an actual INP field measurement is unavailable, report that limitation rather than inventing one.

## 9. Security – XSS Prevention

- Never render untrusted strings using raw `innerHTML`.
- Use `document.createTextNode()` for text content.
- Do not convert user-controlled strings into executable HTML.
- Do not permit string-based inline event handlers.
- Validate supported VNode types and property values.
- Restrict unsafe attribute and property assignments.
- Do not treat filtering script tags as sufficient XSS protection.
- Avoid `eval()` and dynamically constructed executable code.
- Do not allow unsafe URL schemes in URL-bearing attributes.

### Mandatory XSS Test Cases

Test the following input strings:

`<script>alert(1)</script>`

`<img onerror=alert(1)> Safe Text`

Expected behavior:

- Strings appear as literal text.
- No alert dialog is executed.
- No injected image or script nodes are created.
- The surrounding DOM tree remains valid.

## 10. Event Handling

- Do not use inline HTML event attributes.
- Register handlers using DOM event APIs.
- Validate event handler values before registration.
- Support the exercise's `onClick` demonstration.
- Prefer native interactive controls.
- Do not use deprecated `keypress` or `event.keyCode`.
- Use `keydown`, `event.key` or `event.code` if keyboard listeners are needed.
- Do not implement the complete root event delegation hub from Exercise 2 unless explicitly requested.
- Verify that clicking the demonstration button logs `Ping` exactly once.

## 11. Testing & Quality Assurance

### Functional Testing

- Verify `createTextElement()` converts text and numbers correctly.
- Verify `createElement()` handles null props.
- Verify nested child arrays are flattened.
- Verify nullish and false children are removed.
- Verify valid VNodes are preserved.
- Verify `renderToDOM()` creates the correct native DOM elements.
- Verify attributes, styles, text and event handlers.
- Verify nested VNodes render recursively in the correct order.
- Verify repeated mounting with `replaceChildren()` does not accumulate duplicate nodes.

### Browser Testing

- Inspect actual DOM nodes in Chrome DevTools Elements.
- Inspect the Accessibility Tree.
- Check Console for runtime errors.
- Execute all mandatory XSS test cases.
- Verify semantic HTML and the expected button.
- Test the page at mobile and desktop sizes.
- Check that no unintended network or resource-loading errors occur.

### Code Quality

- Run ESLint and Prettier.
- Remove unused variables and dead code.
- Avoid repeated code and unnecessary abstraction.
- Maintain clear naming and consistent formatting.
- Do not suppress warnings without an explanation.
- Use `console.assert()` and/or isolated tests to verify invariants.
- Do not report a test as passed unless it was actually executed.

## 12. AI-Assisted Development Workflow

Follow four mandatory stages:

1. **Functional Slicing:** Break the exercise into isolated tasks.
2. **Contract Definition:** Specify expected input, output and invariants.
3. **Atomic Generation:** Generate code for only one task at a time.
4. **Independent Verification:** Inspect the code and test it before integration.

Additional rules:

- Never use one-shot prompting to generate the full project.
- Never accept unrelated architectural refactoring.
- Always inspect `git diff` after AI changes.
- Update `TASK_DECOMPOSITION.md` after each verified task.
- Preserve previously working functionality.
- Explain what changed and how it was verified.
- Keep the code understandable enough for live modification without AI.

## 13. Git & Documentation

Mandatory files:

- `project-rules.md`
- `TASK_DECOMPOSITION.md`

Required Exercise 1 Git milestones:

**Commit 1**

`feat(core): implement createElement factory`

**Commit 2**

`feat(core): implement renderToDOM`

Rules:

- Maintain the correct commit order.
- Do not combine these milestones into one commit.
- Verify functionality before each commit.
- Inspect `git status` and `git diff`.
- Do not commit `node_modules`, credentials or unnecessary generated files.
- Ensure the Git history reflects actual development progress.
- Additional documentation or styling commits may be made separately, provided the required milestones remain intact.

## 14. Required Exercise Demo

The final demonstration must create a semantic application tree containing:

- Root `<main id="root-view">`.
- A `<header class="hero">`.
- An `<h1>` displaying `Mini React Engine`.
- A paragraph containing the XSS test string.
- A `<button>` with an `onClick` function logging `Ping`.

Mount the VNode tree into `#app` using `replaceChildren()`.

Validate successful mounting with an assertion equivalent to:

`console.assert(root.querySelector('button') !== null, 'Mount Failed')`

## 15. Final Acceptance Gates

### Gate A – Architecture
- All three Mini-React functions work.
- VNode contracts are satisfied.
- Recursive mounting produces the expected DOM.

### Gate B – Functional
- The correct semantic elements are displayed.
- The button logs `Ping`.
- No duplicate or orphan nodes appear.

### Gate C – Security
- Mandatory XSS strings remain inert.
- No raw untrusted HTML injection occurs.

### Gate D – Accessibility
- Relevant WCAG 2.2 AA criteria are reviewed.
- Keyboard navigation and activation work.
- Text and controls have appropriate contrast.
- Focus indicators remain visible.

### Gate E – Responsive & Performance
- The 375px mobile layout works without horizontal overflow.
- No obvious layout-shift or unnecessary heavy-resource problems exist.
- Performance audits and any measured results are documented.

### Gate F – Engineering Process
- Both Markdown documentation files exist.
- Required atomic Git commits exist.
- Code formatting and linting checks pass.
- DevTools verification has been completed.
- The developer can explain and modify the implementation.

## 16. Scope Priority

When requirements conflict, use the following priority:

1. Explicit Lab 2 Exercise 1 requirements.
2. Security and browser correctness.
3. Applicable accessibility requirements and Lab 1 engineering standards.
4. Responsive design and performance best practices.
5. Optional visual enhancements.

Never sacrifice Exercise 1 correctness to achieve cosmetic or performance goals. Do not expand the implementation to Exercise 2 or Exercise 3 without authorization.s