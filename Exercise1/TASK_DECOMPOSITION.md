
# TASK DECOMPOSITION
## Exercise 1: Building Mini-React VNode & Mounting Engine

**Course:** Modern React Architecture, Virtual DOM & State Machines  
**University:** UIT - VNUHCM  
**Instructor:** Tran Vinh Khiem

---

## Project Objective

Implement a minimal React-like engine using Vanilla JavaScript.

Core functions:

1. createTextElement()
2. createElement()
3. renderToDOM()

The project must demonstrate Virtual DOM creation, recursive DOM rendering, secure text rendering, and DOM mounting.

---

# T-00: Project Setup

## Objective

Prepare the development environment and define project rules.

## Tasks

- [x] Initialize the Vite Vanilla JavaScript project.
- [x] Verify the project runs using `npm run dev`.
- [x] Create `src/mini-react.js`.
- [x] Create `tests/mini-react.test.js`.
- [x] Create `project-rules.md`.
- [x] Create `TASK_DECOMPOSITION.md`.
- [x] Verify ES Modules are supported.
- [x] Initialize the Git repository.

## Verification

Run:

```bash
npm run dev
```

Check that the application opens in the browser.

Run:

```bash
git status
```

Check that Git recognizes the repository.

## Definition of Done

- Project structure exists.
- Vite runs successfully.
- Documentation files exist.
- Git is initialized.

**Status:** DONE

---

# T-01: Virtual DOM Factory

## Objective

Create JavaScript objects representing Virtual DOM nodes.

---

## T-01.1: Implement createTextElement()

### Contract

Input:
- String or number.

Output:

```javascript
{
  type: "TEXT_ELEMENT",
  props: {
    nodeValue: String(value),
    children: []
  }
}
```

### Tasks

- [x] Implement createTextElement().
- [x] Validate input types.
- [x] Convert input values to strings.
- [x] Return a valid TEXT_ELEMENT VNode.
- [x] Reject unsupported inputs.
- [x] Write independent tests.

### Test Cases

- [x] Input `"Hello"` produces nodeValue `"Hello"`.
- [x] Input `123` produces nodeValue `"123"`.
- [x] Input `0` produces nodeValue `"0"`.
- [x] Input `null` throws TypeError.
- [x] Text node children is an empty array.

### Definition of Done

All createTextElement tests pass.

**Status:** DONE

---

## T-01.2: Implement createElement()

### Contract

```javascript
createElement(type, props, ...children)
```

Expected behavior:

- Accept null props.
- Accept multiple children.
- Flatten nested children arrays.
- Remove null, undefined, and false.
- Convert strings and numbers to TEXT_ELEMENT.
- Preserve valid VNodes.
- Reject unsupported child types.

### Tasks

- [x] Implement createElement().
- [x] Normalize null props.
- [x] Validate HTML element type.
- [x] Flatten children using flat(Infinity).
- [x] Filter empty child values.
- [x] Convert primitive children.
- [x] Preserve valid VNode children.
- [x] Return consistent VNode structures.
- [x] Write independent tests.

### Test Cases

- [x] createElement("h1", null, "Hello").
- [x] Multiple children.
- [x] Nested children arrays.
- [x] null / undefined / false filtering.
- [x] Number 0 preservation.
- [x] Existing VNode preservation.
- [x] Unsupported input rejection.
- [x] Props are not mutated.

### Definition of Done

All VNode factory tests pass.

### Required Git Milestone 1

```bash
git add src/mini-react.js tests/mini-react.test.js
git commit -m "feat(core): implement createElement factory"
```

**Status:** DONE

---

# T-02: DOM Renderer

## Objective

Convert Virtual DOM objects into real DOM nodes.

---

## T-02.1: Implement Text Rendering

### Tasks

- [x] Detect TEXT_ELEMENT VNodes.
- [x] Read props.nodeValue.
- [x] Create DOM Text nodes.
- [x] Return valid DOM Text objects.
- [x] Reject malformed text nodes.

### Required API

```javascript
document.createTextNode()
```

### Definition of Done

Text rendering tests pass.

---

## T-02.2: Implement HTML Element Rendering

### Tasks

- [x] Validate the VNode.
- [x] Create HTML elements.
- [x] Apply id attributes.
- [x] Apply role attributes.
- [x] Map className to class.
- [x] Apply supported style properties.
- [x] Register onClick handlers.
- [x] Ignore children when applying attributes.
- [x] Recursively render child VNodes.
- [x] Return the completed DOM subtree.

### Required APIs

```javascript
document.createElement()
element.setAttribute()
element.addEventListener()
element.appendChild()
```

### Test Cases

- [x] Render h1 elements.
- [x] Render nested elements.
- [x] Verify id attributes.
- [x] Verify className attributes.
- [x] Verify role attributes.
- [x] Verify style properties.
- [x] Verify button click handlers.
- [x] Verify nested children order.
- [x] Reject malformed VNodes.

### Definition of Done

All DOM renderer tests pass.

### Required Git Milestone 2

```bash
git add src/mini-react.js tests/mini-react.test.js
git commit -m "feat(core): implement renderToDOM"
```

**Status:** DONE

---

# T-03: Demo Application

## Objective

Demonstrate the Mini-React engine in the browser.

## Required VNode Tree

```text
main#root-view[role="main"]
|
+-- header.hero
|   |
|   +-- h1
|   |   |
|   |   +-- "Mini React Engine"
|   |
|   +-- p
|   |   |
|   |   +-- "<img onerror=alert(1)> Safe Text"
|   |
|   +-- p
|       |
|       +-- "<script>alert(1)</script>"
|
+-- button (onClick logs "Ping")
    |
    +-- "Click"
```

## Tasks

- [x] Prepare index.html with #app.
- [x] Import createElement and renderToDOM.
- [x] Create the main VNode.
- [x] Create the header VNode.
- [x] Create h1 and p children.
- [x] Add XSS test strings.
- [x] Create button with onClick handler.
- [x] Mount VNode into #app.
- [x] Use replaceChildren().
- [x] Add console.assert().

## Required Mounting

```javascript
const root = document.getElementById("app");

root.replaceChildren(renderToDOM(vApp));

console.assert(
  root.querySelector("button") !== null,
  "Mount Failed"
);
```

## Definition of Done

- Demo loads successfully.
- DOM tree matches the VNode.
- Button displays correctly.
- Clicking button logs "Ping".
- Mount assertion passes.

**Status:** DONE

---

# T-04: Security and Browser Audit

## Objective

Verify safe rendering and inspect the actual DOM.

---

## T-04.1: XSS Security Tests

### Required Inputs

```javascript
"<script>alert(1)</script>"
"<img onerror=alert(1)> Safe Text"
```

### Tasks

- [x] Render script payload as text.
- [x] Render image payload as text.
- [x] Confirm no injected script executes.
- [x] Confirm no injected image is created.
- [x] Confirm text content is preserved.
- [x] Confirm no raw innerHTML is used.

### Definition of Done

Both XSS payloads display as plain text without execution.

---

## T-04.2: Chrome DevTools Audit

### Elements Panel

- [x] Inspect #app.
- [x] Verify main#root-view.
- [x] Verify header.hero.
- [x] Verify h1 text.
- [x] Verify p text.
- [x] Verify button element.
- [x] Verify semantic HTML structure.
- [x] Confirm no orphan DOM nodes.

### Console Panel

- [x] Confirm no unexpected JavaScript errors.
- [x] Confirm mount assertion passes.
- [x] Click button and confirm "Ping".
- [x] Confirm no XSS execution.
- [x] Confirm all tests pass.

### Definition of Done

Chrome DevTools inspection confirms correct behavior.

**Status:** DONE

---

# T-05: Final Verification and Submission

## Objective

Review the entire project before submission.

## Final Checklist

- [x] All three core functions are implemented.
- [x] Factory tests pass.
- [x] DOM renderer tests pass.
- [x] Browser demo works.
- [x] Semantic HTML is used.
- [x] XSS tests pass.
- [x] Chrome DevTools audit is completed.
- [x] No unexpected Console errors.
- [x] project-rules.md is complete.
- [x] TASK_DECOMPOSITION.md is updated.
- [x] Commit 1 exists with the exact required message.
- [x] Commit 2 exists with the exact required message.
- [x] Both milestones are separate commits.
- [x] No out-of-scope features are included.

## Final Git Verification

Run:

```bash
git log --oneline
```

Verify the commit history contains:

```text
feat(core): implement renderToDOM
feat(core): implement createElement factory
```

The commit hashes may differ.

## Final Status

**Project:** VERIFIED

**Submission Ready:** YES

Only change the final status after all required tests and audits have passed.
