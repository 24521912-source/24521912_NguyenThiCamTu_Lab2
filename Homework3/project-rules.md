# PROJECT RULES — HOMEWORK 3

## High-Concurrency Flash-Sale E-Commerce Engine

**Course:** Web Application Development 2026 — UIT, VNU-HCM  
**Assignment:** Lab 02 — Homework 3  
**Domain:** Vietnam 11.11 / Midnight Flash Sale Simulation  
**Selected stack:** React + TypeScript + Vite  
**Methodology:** Contract-First Development + Atomic AI Workflow  
**Instructor requirements:** Zero-drift countdown, optimistic inventory lock, inventory state machine, AI failure audit, at least 8 atomic Conventional Commits.

---

## 1. PROJECT OBJECTIVE

Build a high-concurrency flash-sale simulation demonstrating accurate timekeeping and reliable inventory reservation behavior.

The application must implement:

1. A zero-drift countdown timer.
2. Absolute target time calculations using `Date.now()`.
3. Inventory reservation and optimistic locking.
4. A finite state machine for reservation, lock expiry, and checkout.
5. Correct behavior under competing purchase requests.
6. Safe handling of asynchronous operations.
7. Reliable cleanup and error handling.
8. An AI failure audit documenting at least three genuine AI-induced defects.
9. A minimum of eight discrete Conventional Commits.

The simulation should use a realistic Vietnam flash-sale scenario.

Features beyond these requirements must be identified as design decisions or optional enhancements.

---

## 2. CRITICAL AI OPERATING RULES

### 2.1 COPY-PASTE ONLY

The AI coding assistant is a source-code author, NOT a local computer operator.

The user works manually in Windows VS Code.

The AI MUST:

- Write complete code directly in the chat.
- Identify the exact relative file path for every code block.
- Provide full file contents for new and modified files.
- Provide commands for the user to execute manually.
- Explain important code in Vietnamese.
- Provide verification steps and expected results.
- Stop after the currently assigned task.

The AI MUST NOT:

- Create or modify files in its own environment.
- Access or modify the user's computer.
- Execute terminal commands.
- Install packages.
- Initialize Git or create commits.
- Generate downloadable project files.
- Claim that tests have passed without actual user-provided results.
- Claim that source files were created on the user's machine.
- Request or read Lab 1 and Lab 2 PDFs.

The user alone copies the generated code into VS Code, runs commands, verifies functionality, and creates Git commits.

### 2.2 COMPLETE SOURCE CODE

Every implementation answer must include:

1. Exact file path.
2. Complete executable source code.
3. Required imports and exports.
4. Complete TypeScript types.
5. Relevant Vietnamese code comments.
6. Instructions to create or replace the file.
7. Verification commands.
8. Expected behavior.
9. Suggested atomic Git commit.

For modified files, provide the complete replacement contents.

Forbidden placeholders:

- `TODO: implement`
- `existing code here`
- `rest remains unchanged`
- `same as previous`
- Pseudocode presented as production code.

### 2.3 NO PDF DEPENDENCY

The original Lab PDFs will not be sent to the AI.

All relevant requirements are provided in prompts and these project rules.

Never claim to have read the instructor's PDFs directly.

---

## 3. SOURCE OF TRUTH

Apply this priority:

1. Explicit instructor requirements provided in the conversation.
2. Approved behavioral and TypeScript contracts.
3. These project rules.
4. Approved `TASK_DECOMPOSITION.md`.
5. General engineering recommendations.

Distinguish:

- **MANDATORY:** Explicit instructor requirements.
- **SELECTED DESIGN:** Approved implementation decisions.
- **OPTIONAL:** Additional features requiring separate approval.

Do not invent grading criteria.

Do not silently extend the project scope.

---

## 4. ATOMIC DEVELOPMENT WORKFLOW

Follow the four stages required in the labs.

### Stage 1 — Functional Slicing

Divide work into isolated tasks.

Each task must have:

- Task ID.
- Objective.
- Expected output.
- Prerequisites.
- Acceptance criteria.
- Verification method.
- Suggested commit message.

### Stage 2 — Contract-First Specification

Before implementation, define:

- Input types.
- Output types.
- State ownership.
- Allowed state transitions.
- Error behavior.
- Time semantics.
- Inventory invariants.
- Concurrency guarantees.

### Stage 3 — Atomic Generation

**ONE PROMPT = ONE ATOMIC TASK.**

Do not implement future tasks without authorization.

Do not combine timer, inventory, checkout, and UI into one large implementation.

Do not modify unrelated modules.

### Stage 4 — Independent Verification

After each implementation:

- Explain how the user can check the result.
- Provide relevant TypeScript, lint, build, and test commands.
- Explain expected PASS and FAIL behavior.
- Identify edge cases.
- Provide Git diff inspection commands.
- Propose one atomic commit.

Only the user can confirm that a test actually passed.

---

## 5. TECHNOLOGY STACK

### Approved Design

- React.
- TypeScript.
- Vite.
- npm.
- Git.
- Semantic HTML5.
- Modern CSS.
- ES6+ JavaScript.
- Native browser timing APIs.
- Native Promise and async/await.

React + TypeScript + Vite are selected implementation choices, not explicit mandatory technologies from the HW3 slide.

### Forbidden Without Approval

- jQuery.
- Bootstrap.
- Tailwind CSS.
- Third-party countdown libraries.
- Third-party inventory engines.
- Unnecessary UI component libraries.
- Unnecessary global-state libraries.
- External script CDNs.

Development-only testing libraries may be proposed when justified.

Prefer native APIs and understandable code.

---

## 6. SYSTEM ARCHITECTURE

Separate responsibilities into independent modules.

### 6.1 Timer Engine

Responsible for:

- Absolute deadline calculation.
- Remaining time.
- Display tick notifications.
- Stopping and cleanup.

### 6.2 Inventory Engine

Responsible for:

- Stock availability.
- Reservation creation.
- Reservation identity.
- Inventory locking.
- Lock expiry.
- Reservation cancellation.
- Inventory invariant enforcement.

### 6.3 Checkout State Machine

Responsible for:

- Allowed checkout transitions.
- Checkout success.
- Checkout failure.
- Reservation validity.
- Prevention of duplicate completion.

### 6.4 React UI

Responsible for:

- Displaying products and stock.
- Displaying countdown.
- Triggering user actions.
- Rendering reservation status.
- Rendering checkout feedback.
- Displaying errors accessibly.

React UI components must not independently mutate the authoritative inventory state.

### 6.5 Testing Layer

Responsible for deterministic testing of:

- Countdown correctness.
- State transitions.
- Competing reservations.
- Lock expiry.
- Checkout races.
- Inventory invariants.

Avoid a monolithic component containing all business logic.

---

## 7. ZERO-DRIFT COUNTDOWN CONTRACT

The instructor provides the following implementation concept:

```typescript
export function createAntiDriftTimer(
  durationMs: number,
  onTick: (remaining: number) => void
) {
  const targetTime = Date.now() + durationMs;
  let rafId: number;

  function tick() {
    const remaining = Math.max(
      0,
      targetTime - Date.now()
    );

    onTick(remaining);

    if (remaining > 0) {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(rafId);
}
```

This is the instructor's baseline example.

The implementation must preserve its essential behavior.

### 7.1 Absolute-Time Calculation

Countdown time must derive from:

`remaining = Math.max(0, targetTime - Date.now())`

Do not calculate remaining time by repeatedly subtracting a fixed interval.

### 7.2 No Accumulated Drift

The countdown must not accumulate scheduling delays.

`setInterval()` must not be treated as an accurate elapsed-time source.

### 7.3 Timestamp Integrity

Use consistent millisecond units.

Avoid mixing seconds and milliseconds.

### 7.4 Zero Boundary

Remaining time must never become negative.

The countdown must correctly reach zero.

### 7.5 Cleanup

The timer must support cancellation.

A canceled timer must not continue emitting ticks.

Do not create duplicate animation loops.

### 7.6 Browser Limitations

`requestAnimationFrame()` is frame-scheduled, not guaranteed to execute while a tab is suspended.

Time accuracy must come from the absolute deadline, not callback frequency.

Browser clock changes may affect `Date.now()`.

Do not claim perfect synchronization with a server clock.

### 7.7 UI Rendering

Do not trigger unnecessary React updates at every animation frame.

Use a display frequency appropriate for the visible precision.

---

## 8. FLASH-SALE DOMAIN

Use a fictional Vietnam flash-sale scenario.

Suggested domain:

- 11.11 Mega Sale.
- Electronics or consumer products.
- Product name.
- Product ID.
- Original price.
- Sale price.
- Total stock.
- Available stock.
- Reserved quantity.
- Sold quantity.

Use Vietnamese currency formatting when displaying prices.

Data must be deterministic and suitable for repeatable tests.

Do not embed real payment credentials or production account data.

---

## 9. INVENTORY DATA CONTRACT

Use strongly typed records.

An inventory product should have a stable identity and stock accounting.

Suggested invariant:

`totalStock = availableStock + reservedStock + soldStock`

All quantities must be nonnegative integers.

### 9.1 Inventory Safety

The engine