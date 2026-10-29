# PROJECT RULES — HOMEWORK 1: PRODUCTION ENTERPRISE DATA-GRID

**Course:** Web Application Development 2026 — UIT, VNU-HCM  
**Assignment:** Lab 02 — Homework 1: Production Enterprise Data-Grid  
**Target:** WCAG 2.2 AA, Lighthouse Accessibility 100, Best Practices 100  
**Engineering Methodology:** Contract-First, Atomic AI Development, Independent Verification

---

## 1. Project Identity and Scope

This project implements a reusable, accessible, production-oriented Enterprise Data-Grid.

The application must support:

- Strongly typed, reusable TypeScript generic contracts.
- Column sorting.
- Data filtering.
- Client-side pagination.
- Row selection.
- Semantic HTML tables.
- Appropriate ARIA grid semantics.
- Keyboard navigation.
- Predictable focus management.
- WCAG 2.2 AA accessibility requirements.
- Responsive layouts.
- Verifiable Lighthouse Accessibility and Best Practices scores.

All implementation decisions must prioritize correctness, accessibility, maintainability, security, and explainability.

**Do not add unrelated features that increase complexity without supporting an assignment requirement.**

### 1.1 Source of Truth

The instructor's requirements provided directly in prompts are authoritative.

The AI coding agent will not receive the original Lab 1 or Lab 2 PDF documents.

Rules:

1. Never request the original lab PDFs.
2. Never claim to have read documents that were not supplied.
3. Use the instructor requirements explicitly embedded in the user's prompts.
4. Distinguish mandatory requirements from recommended engineering improvements.
5. Do not invent grading criteria, requirements, or submission instructions.
6. Ask for clarification only when an ambiguity prevents safe implementation.
7. Preserve already approved architectural decisions unless a defect requires revision.

### 1.2 Requirement Priority

Apply the following precedence:

1. Explicit instructor requirements supplied by the user.
2. The currently approved TypeScript contracts.
3. This project-rules document.
4. The approved `TASK_DECOMPOSITION.md`.
5. Engineering best practices.

If requirements conflict, explain the conflict before changing an approved contract.

---

## 2. Mandatory Anti-Monolithic AI Workflow

Follow the four-stage engineering workflow taught in Lab 1 and Lab 2.

### Stage 1 — Functional Slicing

Break each feature into small, independently verifiable tasks.

Each task should accomplish one clear engineering objective.

Do not combine unrelated responsibilities in one implementation task.

### Stage 2 — Contract-First Specification

Before implementing a module:

- Define its responsibilities.
- Identify inputs and outputs.
- Identify dependencies.
- Specify TypeScript interfaces.
- Define expected behavior.
- Define edge cases.
- Establish acceptance criteria.
- Determine verification methods.

Never begin implementation with unclear contracts.

### Stage 3 — Atomic Generation

**Implement exactly one authorized task per prompt.**

Forbidden behaviors:

- Generating the complete application in one attempt.
- Implementing several future tasks without permission.
- Rewriting unrelated modules.
- Introducing unnecessary dependencies.
- Modifying previously approved interfaces without justification.
- Performing broad refactoring during a small feature task.

An atomic task may change multiple files only when those changes are strictly necessary for that single task.

### Stage 4 — Independent Verification

After each implementation task:

1. Review the generated code.
2. Inspect the Git diff.
3. Run available TypeScript checks.
4. Run applicable tests.
5. Verify the task's acceptance criteria.
6. Identify regressions.
7. Record any unresolved issues.
8. Propose an atomic Git commit.

Never accept generated code solely because it appears plausible.

---

## 3. Required Project Documentation

Maintain the following engineering artifacts.

### 3.1 `project-rules.md`

Defines the persistent development constraints for AI coding agents.

The AI must consult these rules before proposing code changes.

### 3.2 `TASK_DECOMPOSITION.md`

Defines the Work Breakdown Structure.

Each task must include:

- Task ID.
- Objective.
- Expected output.
- Prerequisites.
- Acceptance criteria.
- Verification method.
- Suggested Git commit message.

Do not begin a task unless its dependencies are satisfied.

### 3.3 Recommended Verification Documentation

When requested, maintain concise verification records covering:

- Tests performed.
- Actual results.
- Failed checks.
- Unverified conditions.
- Defects discovered.
- Corrections made.

Record actual AI-generated defects and how they were detected.

Do not fabricate defects or test evidence.

---

## 4. Technology Stack

### 4.1 Proposed Implementation Stack

Use:

- React.
- TypeScript.
- Vite.
- Semantic HTML5.
- Modern CSS.
- ES6+ JavaScript.
- Native browser APIs.
- Git.

React, TypeScript, and Vite are the selected implementation stack for this project.

Do not treat this technology choice as an additional instructor requirement unless explicitly confirmed.

### 4.2 Forbidden Technologies

Do not introduce:

- jQuery.
- Bootstrap.
- Tailwind CSS.
- Third-party DataGrid components.
- Unnecessary component frameworks.
- External script CDNs.
- Unnecessary state-management libraries.
- Deprecated browser APIs.

Development tools for testing, linting, and accessibility auditing may be introduced when they are justified and approved.

### 4.3 Dependency Policy

Before adding a dependency:

1. Explain why it is needed.
2. Identify the functionality it provides.
3. Explain whether native APIs can accomplish the same task.
4. Confirm compatibility with the existing stack.
5. Avoid unnecessary package installation.

Prefer the smallest maintainable solution.

---

## 5. TypeScript Contract Rules

The instructor provides the following baseline contracts:

```typescript
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowSelect?: (item: T) => void;
  ariaLabel: string;
}
```

### 5.1 Contract Preservation

These interfaces are the baseline API contract.

Requirements:

- Preserve their meaning and compatibility.
- Use generic type parameters appropriately.
- Use `keyof T` for type-safe column access.
- Respect optional properties.
- Avoid `any` wherever a precise type is practical.
- Do not use unsafe type assertions to bypass errors.
- Keep public types understandable and documented.

### 5.2 Contract Extensions

Additional properties may be proposed for:

- Stable row identity.
- Pagination configuration.
- Filtering configuration.
- Selection behavior.
- Additional accessibility support.

Any extensions must:

1. Be justified by an explicit requirement or demonstrated defect.
2. Preserve compatibility with the baseline API.
3. Be reviewed before implementation.
4. Have corresponding acceptance tests.

Do not silently replace the original contract.

### 5.3 Generic Reusability

The DataGrid must not depend on student-specific fields.

Do not hardcode properties such as:

- `studentId`
- `fullName`
- `department`
- `gpa`

inside reusable grid logic.

Student data may be used only in the demo application.

The same DataGrid should support another compatible record type without rewriting the grid component.

---

## 6. Component Architecture

Follow separation of concerns.

Separate:

- Application-specific demo data.
- TypeScript contracts.
- Data transformations.
- DataGrid rendering.
- Keyboard interaction logic.
- Selection state.
- Styling.
- Testing.

### 6.1 React Component Rules

- Use functional React components.
- Treat props as immutable.
- Avoid unnecessary state duplication.
- Derive displayed data from source data and current state.
- Do not mutate arrays received through props.
- Use stable keys for rendered rows.
- Prefer clear component boundaries over premature abstractions.
- Use React hooks according to the Rules of Hooks.

### 6.2 Rendering Rules

- Prefer declarative React rendering.
- Do not directly manipulate React-managed DOM content.
- Direct DOM access is permitted only when justified, such as focus management.
- Avoid unnecessary re-renders.
- Do not optimize prematurely without evidence.

### 6.3 State Consistency

Ensure sorting, filtering, pagination, and selection remain consistent when combined.

The expected data-processing sequence is:

**Source Data → Filtering → Sorting → Pagination → Visible Rows**

Selection must be associated with stable record identity rather than visual row position.

---

## 7. Semantic HTML Rules

HTML must express the actual meaning of the content.

Use semantic elements such as:

- `header`
- `main`
- `section`
- `nav`
- `footer`
- `table`
- `caption`
- `thead`
- `tbody`
- `tr`
- `th`
- `td`
- `button`
- `label`
- `input`

### 7.1 Document Structure

Requirements:

- Use a valid HTML5 document.
- Declare the appropriate document language.
- Use UTF-8 encoding.
- Include the viewport meta tag.
- Provide exactly one primary `h1` in the application document.
- Preserve logical heading hierarchy.
- Provide meaningful page landmarks.
- Provide an accessible skip link to the main content.

### 7.2 Table Semantics

The DataGrid must preserve meaningful tabular structure.

Requirements:

- Use a real table for tabular data.
- Provide an accessible table/grid name.
- Use column header cells appropriately.
- Preserve header-to-cell relationships.
- Avoid using generic `div` elements as replacements for native table structure without a justified reason.
- Avoid obsolete presentational HTML attributes.

### 7.3 Forms and Controls

- Use visible labels for search and filter inputs.
- Prefer native buttons for actions.
- Do not rely on placeholders as the only label.
- Provide accessible names for interactive controls.
- Use `aria-describedby` when supplementary instructions are necessary.

---

## 8. DataGrid Functional Requirements

### 8.1 Sorting

Sorting must:

- Apply only to sortable columns.
- Support ascending and descending order.
- Handle numeric values correctly.
- Handle string values consistently.
- Support locale-aware comparison when appropriate.
- Preserve the original data array.
- Reflect the current sort state accurately.
- Remain consistent with filtering and pagination.

### 8.2 Filtering

Filtering must:

- Support user-entered search terms.
- Be case-insensitive where appropriate.
- Handle Vietnamese Unicode text correctly.
- Preserve the original data.
- Produce an understandable empty-result state.
- Work correctly with sorting and pagination.

The exact filtering scope must follow the approved implementation contract.

### 8.3 Pagination

Pagination must:

- Display the correct visible data slice.
- Calculate the total page count correctly.
- Provide accessible navigation controls.
- Prevent navigation outside valid page boundaries.
- Handle partially filled final pages.
- Handle empty datasets.
- Remain valid when filtering changes the total number of records.

### 8.4 Row Selection

Row selection must:

- Use stable row identity.
- Support selection and deselection.
- Reflect the correct selected state visually and semantically.
- Remain associated with the correct record after sorting.
- Follow a defined policy across filtering and pagination.
- Preserve the existing `onRowSelect` callback contract.
- Avoid accidental duplicate events.

### 8.5 Empty and Boundary States

Handle:

- Empty input data.
- No matching search results.
- One-record datasets.
- Missing optional values.
- Final partial pages.
- Changing data.
- Removed selected records.
- No available focusable data cells.

Do not assume datasets are always populated.

---

## 9. Accessibility — WCAG 2.2 AA

Accessibility is a mandatory engineering requirement.

Do not treat accessibility as optional visual polish.

### 9.1 ARIA Grid

Implement a coherent interactive grid model using appropriate:

- `role="grid"`
- Row semantics.
- Column header semantics.
- Gridcell semantics.
- Accessible grid naming.
- `aria-sort`.
- `aria-selected`.

Use ARIA only where required.

Native semantic HTML must be preserved wherever possible.

ARIA attributes must accurately represent application state.

Do not add misleading or redundant attributes.

### 9.2 Keyboard Interaction Contract

The instructor requires the following keyboard behavior:

| Key | Required behavior |
|---|---|
| ArrowUp | Move focus upward |
| ArrowDown | Move focus downward |
| ArrowLeft | Move focus left |
| ArrowRight | Move focus right |
| Enter | Select or activate the focused row |
| Space | Toggle the focused row's selection state |
| Tab | Enter or leave the grid according to the focus model |
| Shift+Tab | Navigate backward without keyboard traps |

Implement the specified Enter and Space behavior consistently with the approved selection contract.

### 9.3 Focus Management

Requirements:

- Use a documented focus-navigation strategy.
- Prefer roving tabindex where appropriate.
- Maintain predictable focus.
- Provide a visible focus indicator.
- Do not trap keyboard users.
- Preserve sensible focus behavior after sorting, filtering, pagination, and re-rendering.
- Do not focus detached or hidden elements.
- Preserve native keyboard behavior inside editable controls.

### 9.4 Screen-Reader Support

Ensure that assistive technologies can identify:

- Grid purpose.
- Column headers.
- Relevant row and cell structure.
- Sorting state.
- Selected state.
- Search results and empty states.
- Pagination controls.
- Relevant dynamic status changes.

Avoid excessive or duplicated announcements.

### 9.5 WCAG Contrast and Visual Accessibility

Target WCAG 2.2 AA.

Requirements include:

- Normal text contrast of at least 4.5:1 under applicable criteria.
- Appropriate contrast for large text and non-text UI components.
- Visible keyboard focus indicators.
- No reliance on color alone to convey selection or status.
- Readable content at increased zoom.
- Appropriate target sizes or spacing where required.
- Reduced-motion support for any nonessential animation.

### 9.6 Accessibility Verification

Use a combination of:

- Browser Accessibility Tree inspection.
- Keyboard-only interaction testing.
- Automated accessibility checks.
- Screen-reader testing where available.
- WCAG checklist review.

**Automated accessibility scores alone do not prove full WCAG 2.2 AA compliance.**

---

## 10. Responsive Design and CSS

### 10.1 Mobile-First

Design and verify at a 375px viewport before expanding to larger screens.

Also test representative tablet and desktop widths.

### 10.2 Layout

Prefer:

- Flexbox for one-dimensional layouts.
- CSS Grid for two-dimensional layouts.
- Relative units.
- Flexible widths.
- Appropriate wrapping.
- Reusable spacing tokens.

Avoid unnecessary fixed widths.

A wide data table may use a bounded horizontal scrolling region on small screens, provided keyboard and accessibility requirements remain satisfied.

### 10.3 CSS Design Tokens

Define shared values using CSS custom properties in `:root`.

Include tokens for:

- Colors.
- Text.
- Surfaces.
- Borders.
- Focus indicators.
- Spacing.
- Typography.
- Radius.

Do not scatter arbitrary hardcoded colors throughout component styles.

### 10.4 Styling Restrictions

- Avoid unnecessary inline styles.
- Avoid excessive CSS specificity.
- Avoid unnecessary `!important`.
- Keep CSS modular and readable.
- Avoid layout shifts caused by dynamic content.
- Ensure important controls remain usable on mobile.

---

## 11. JavaScript and React Coding Standards

Use modern ECMAScript conventions.

### 11.1 Variables

- Prefer `const`.
- Use `let` only for reassigned variables.
- Never use `var`.
- Avoid implicit globals.

### 11.2 Event Handling

- Use React event handlers.
- Use modern keyboard events.
- Inspect `event.key`.
- Do not use `keypress` or `keyCode`.
- Avoid unnecessary document-level listeners.
- Prevent default behavior only when necessary.

### 11.3 Data Manipulation

- Avoid mutation of props.
- Prefer pure transformation functions.
- Use explicit, meaningful variable names.
- Handle null and undefined values intentionally.
- Avoid unnecessary side effects.

### 11.4 Code Readability

- Keep functions focused.
- Avoid deeply nested conditionals where simpler alternatives exist.
- Avoid duplicated logic.
- Use meaningful TypeScript types.
- Explain complex algorithms using concise Vietnamese comments.

Do not write comments that merely repeat obvious code.

---

## 12. Security Rules

### 12.1 XSS Prevention

Never inject untrusted user data through unsafe HTML APIs.

Forbidden:

- Unsanitized `innerHTML`.
- Untrusted `dangerouslySetInnerHTML`.
- Inline HTML event-handler attributes.
- Executing user-provided text as code.

Render text using safe React text rendering.

### 12.2 Data Safety

- Validate assumptions about incoming data.
- Do not expose secrets in frontend code.
- Avoid unnecessary personal data in demo datasets.
- Use fictional sample records.
- Do not introduce external network dependencies without approval.

### 12.3 Dependency Safety

- Avoid unnecessary packages.
- Do not introduce libraries solely to implement features already supported by the approved stack.
- Inspect package changes before committing.

---

## 13. Performance Requirements

Optimize only after ensuring correctness.

Priorities:

1. Correct data transformations.
2. Efficient React rendering.
3. Stable row identity.
4. Avoid unnecessary DOM updates.
5. Prevent avoidable layout shifts.
6. Maintain responsive interaction.

Do not introduce virtual scrolling or advanced memoization unless a demonstrated requirement or performance problem justifies it.

Virtual scrolling is discussed in Lab 2 but is not automatically a mandatory Homework 1 feature.

### 13.1 Lighthouse Targets

The instructor requires:

- Lighthouse Accessibility: **100/100**.
- Lighthouse Best Practices: **100/100**.

These are verification targets, not assumed outcomes.

Actual scores must be measured in a real browser audit.

Never fabricate scores.

Record which checks were executed and which remain unverified.

---

## 14. Testing and Quality Gates

Every task must pass relevant verification before being marked complete.

### 14.1 Functional Verification

Test:

- Sorting.
- Filtering.
- Pagination.
- Row selection.
- Feature interactions.
- Empty states.
- Boundary conditions.
- Input immutability.

### 14.2 TypeScript Verification

Run available TypeScript checks.

Do not ignore compiler errors.

Do not use unsafe casts merely to suppress type errors.

### 14.3 Browser Verification

When possible, inspect:

- Rendered DOM structure.
- Browser console.
- Accessibility Tree.
- Keyboard interactions.
- Responsive behavior.
- Focus indicators.

### 14.4 Regression Verification

After adding a feature, verify that previously implemented features still behave correctly.

### 14.5 Verification Statuses

Use only these statuses:

- `PASS`: Executed and passed.
- `FAIL`: Executed and failed.
- `NOT VERIFIED`: Not executed or insufficient evidence.
- `NOT APPLICABLE`: Not relevant to this task.

Never label a task as fully verified without supporting evidence.

---

## 15. Git and Atomic Commit Rules

Git history must demonstrate genuine engineering decomposition.

### 15.1 Atomic Commits

Each commit should represent one logical task.

Examples:

```text
docs(spec): define datagrid contracts
chore: initialize vite react typescript
feat(html): implement semantic page structure
feat(css): add design tokens and reset
feat(grid): render generic table
feat(grid): implement column sorting
feat(grid): implement data filtering
feat(grid): implement pagination
feat(grid): implement row selection
feat(a11y): implement grid keyboard navigation
fix(a11y): improve focus management
test(grid): verify sorting behavior
test(a11y): audit keyboard interactions
```

These commit messages are examples, not an instructor-mandated exact sequence.

### 15.2 Commit Verification

Before proposing a commit:

1. Inspect `git status`.
2. Inspect `git diff`.
3. Run relevant checks.
4. Confirm changes match the authorized task.
5. Confirm no unrelated files are included.
6. Use a descriptive commit message.

Do not combine multiple unrelated features into one large commit.

### 15.3 Git Integrity

- Do not rewrite existing Git history without explicit permission.
- Do not force-push without authorization.
- Do not include secrets.
- Do not commit temporary or generated files unnecessarily.
- Never fabricate a Git history to simulate an atomic development workflow.

---

## 16. AI Failure Audit and Development Evidence

Record meaningful AI-generated defects discovered during development when verification documentation is requested.

For each defect, document:

1. Defect description.
2. Incorrect behavior.
3. Root cause.
4. Diagnostic method.
5. Correction.
6. Verification result.

Potential defect categories include:

- Incorrect sorting.
- Mutated input data.
- Invalid page state.
- Unstable row identity.
- Misleading ARIA attributes.
- Lost keyboard focus.
- Keyboard traps.
- XSS vulnerabilities.
- Regressions after code changes.

Do not invent errors merely to populate an audit.

---

## 17. Oral Defense Preparation

The developer must understand and be able to explain every major implementation decision.

The AI should support explanations of:

- Semantic HTML and DOM structure.
- CSS Box Model.
- Responsive layout.
- TypeScript generics.
- `keyof T`.
- React props and state.
- Derived data.
- Sorting algorithms.
- Filtering.
- Pagination calculations.
- Stable row identity.
- ARIA grid semantics.
- Roving tabindex.
- Keyboard events.
- Focus management.
- XSS prevention.
- Git diff inspection.

### 17.1 Code Explanation Requirements

For important code, explain in Vietnamese:

1. What it does.
2. How it works.
3. Why it is necessary.
4. Which requirement it satisfies.
5. How to verify it.
6. How it can be modified during a live defense.

Prefer understandable code over unnecessary complexity.

---

## 18. Instructions for Every AI Coding Task

Before doing any work, read:

1. `project-rules.md`.
2. The currently approved task from `TASK_DECOMPOSITION.md`.
3. The relevant existing source code.

Then:

### Before Implementation

- Identify the task ID.
- Summarize its objective.
- Confirm prerequisites.
- Identify exact files to modify.
- Identify acceptance criteria.
- Describe the intended approach briefly.

### During Implementation

- Implement only the authorized task.
- Make minimal necessary changes.
- Follow approved contracts.
- Preserve existing functionality.
- Avoid unauthorized dependencies.
- Use concise Vietnamese comments for important code sections.

### After Implementation

- Run available checks.
- Inspect relevant code changes.
- Report pass/fail/unverified results.
- Identify limitations.
- Explain the implementation in Vietnamese.
- Suggest one atomic Git commit message.
- Stop.

**Never automatically proceed to the next task.**

---

## 19. Output and Communication Rules

The AI coding agent must:

- Respond in Vietnamese unless instructed otherwise.
- Keep technical terms, API names, code identifiers, and commit messages in their conventional English forms.
- Explain important engineering reasoning clearly.
- Avoid unsupported claims.
- Distinguish proposed work from completed work.
- Distinguish tests that passed from tests that were not executed.
- Provide complete requested Markdown or code directly in the chat.
- Do not generate downloadable files unless explicitly requested.

When authorized to edit the local project, edit only the files necessary for the current task.

For planning-only prompts:

- Do not create files.
- Do not modify files.
- Do not generate implementation code unless specifically requested.
- Stop after producing the requested planning output.

---

## 20. Definition of Done

Homework 1 is ready for submission only when the following conditions are satisfied:

- [ ] Required TypeScript generic contracts are implemented.
- [ ] DataGrid renders arbitrary compatible record types.
- [ ] Sorting works correctly.
- [ ] Filtering works correctly.
- [ ] Pagination works correctly.
- [ ] Row selection works correctly.
- [ ] Semantic table structure is valid.
- [ ] ARIA grid semantics are correct.
- [ ] Arrow-key navigation works.
- [ ] Enter selection behavior works.
- [ ] Space selection toggling works.
- [ ] Focus management behaves predictably.
- [ ] No keyboard traps exist.
- [ ] Screen-reader accessibility has been evaluated.
- [ ] Applicable WCAG 2.2 AA criteria have been verified.
- [ ] Mobile layout is usable at 375px.
- [ ] No known XSS vulnerabilities remain.
- [ ] TypeScript checks pass.
- [ ] Production build succeeds.
- [ ] Relevant automated tests pass.
- [ ] Lighthouse Accessibility reaches the required target.
- [ ] Lighthouse Best Practices reaches the required target.
- [ ] Git commits reflect atomic tasks.
- [ ] `TASK_DECOMPOSITION.md` reflects actual development progress.
- [ ] Unresolved issues and verification limitations are documented.
- [ ] The developer can explain and modify the implementation independently.

If any criterion is unverified, report it transparently rather than claiming the project is complete.

---

## 21. Final Non-Negotiable Rules

1. **ONE PROMPT = ONE ATOMIC TASK.**
2. **CONTRACT FIRST, IMPLEMENTATION SECOND.**
3. **NEVER GENERATE THE ENTIRE HOMEWORK AT ONCE.**
4. **NEVER CHANGE UNRELATED FILES WITHOUT AUTHORIZATION.**
5. **PRESERVE THE INSTRUCTOR'S TYPESCRIPT CONTRACTS.**
6. **ACCESSIBILITY IS A CORE REQUIREMENT.**
7. **NO UNSAFE HTML INJECTION.**
8. **NO DEPRECATED KEYBOARD APIs.**
9. **NO UNAUTHORIZED FRAMEWORKS OR DEPENDENCIES.**
10. **VERIFY BEFORE COMMITTING.**
11. **NEVER FABRICATE TEST RESULTS OR LIGHTHOUSE SCORES.**
12. **MAINTAIN A GENUINE ATOMIC GIT HISTORY.**
13. **EXPLAIN IMPORTANT CODE IN VIETNAMESE.**
14. **DO NOT REQUEST THE ORIGINAL LAB PDFs.**
15. **STOP AFTER THE CURRENT AUTHORIZED TASK.**

**Core engineering principle:**

> AI generates code. The developer is responsible for verifying that the code is correct.