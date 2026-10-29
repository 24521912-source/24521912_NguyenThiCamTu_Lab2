# TASK_DECOMPOSITION.md

# Homework 3 — High-Concurrency Flash-Sale E-Commerce Engine

**Course:** Web Application Development 2026 — UIT, VNU-HCM  
**Assignment:** Lab 02 — Homework 3  
**Scenario:** Vietnam 11.11 Mega Sale / Midnight Flash Sale  
**Technology:** React + TypeScript + Vite + npm + Git  
**Methodology:** Functional Slicing → Contract-First → Atomic Generation → Independent Verification  
**Status:** PLANNED — No implementation has started.

---

## 1. Project Objectives

Build a client-side flash-sale simulation demonstrating accurate countdown timing, optimistic inventory locking, safe reservation lifecycle management, and correct checkout behavior under competing asynchronous requests.

### 1.1 Mandatory instructor requirements

1. Simulate a Vietnam 11.11 or Midnight Flash Sale.
2. Implement a zero-drift countdown using `Date.now()` against an absolute target timestamp.
3. Implement optimistic inventory locking.
4. Implement a finite state machine for reservations, lock expiry, and checkout.
5. Create `AI_FAILURE_AUDIT.md` documenting at least three genuine AI-induced defects.
6. Maintain at least eight real atomic Git commits using Conventional Commits.

### 1.2 Selected engineering decisions

- React functional components.
- TypeScript with strict type checking.
- Vite development environment.
- Native browser timing APIs.
- In-memory authoritative inventory engine.
- Immutable inventory snapshots for React.
- Explicit finite state machine transitions.
- Deterministic concurrency and timer tests.
- Vitest as the proposed development-only test framework.
- Semantic HTML5 and responsive CSS.
- Vietnamese user-facing interface.

These decisions are implementation choices, not additional instructor requirements.

### 1.3 Simulation boundary

The application simulates competing customers and checkout requests inside a single browser JavaScript runtime.

Inventory consistency is guaranteed only within the authoritative in-memory engine instance.

Cross-tab, cross-device, and distributed transaction guarantees are outside the selected architecture.

The application does not process real payments.

---

## 2. AI Development Rules

### 2.1 Copy-paste workflow

The AI assistant MUST:

- Generate complete source code in chat.
- Identify the exact relative path for every file.
- Provide full replacement content for modified files.
- Explain important code in Vietnamese.
- Provide manual Windows PowerShell commands.
- Describe verification procedures and expected results.
- Suggest one appropriate atomic commit per implementation task.
- Stop after the requested atomic task.

The AI assistant MUST NOT:

- Create, modify, or delete local or sandbox files.
- Execute terminal commands.
- Install dependencies.
- Create Git commits.
- Request Lab 1 or Lab 2 PDFs.
- Fabricate test results.
- Generate placeholder implementations.
- Implement unauthorized future tasks.

The developer manually copies code into VS Code, executes commands, tests the application, and commits changes.

### 2.2 Atomic task definition

**ONE PROMPT = ONE ATOMIC TASK.**

Each implementation task must produce one coherent, independently reviewable change.

Tasks may modify multiple closely related files when required for compilation, but must not introduce unrelated features.

Each task follows:

1. Confirm prerequisites.
2. Review applicable contracts.
3. Generate complete code.
4. Perform manual verification.
5. Review the Git diff.
6. Create an atomic commit after successful verification.

### 2.3 Dependency rule

A task must not begin before all listed prerequisites have been completed and verified.

If an earlier contract requires revision, update and verify that contract before continuing with dependent implementation.

---

## 3. Architecture Overview

### 3.1 Timer module

Responsible for:

- Absolute target timestamps.
- Remaining-time calculations.
- Countdown lifecycle.
- Tick notifications.
- Cancellation and cleanup.

### 3.2 Inventory module

Responsible for:

- Product stock accounting.
- Inventory versions.
- Reservation creation.
- Optimistic locking.
- Reservation expiry.
- Reservation cancellation.
- Inventory invariants.

### 3.3 Checkout module

Responsible for:

- Checkout eligibility.
- Reservation validation.
- Checkout transitions.
- Duplicate checkout prevention.
- Success and failure results.

### 3.4 Simulation module

Responsible for:

- Simulated competing requests.
- Asynchronous scheduling.
- Controlled concurrency scenarios.
- Reporting simulated request outcomes.

### 3.5 React presentation layer

Responsible for:

- Sale status and countdown.
- Product and inventory displays.
- Reservation controls.
- Checkout controls.
- Feedback and error messages.
- Responsive presentation.

React components must not directly modify authoritative inventory records.

### 3.6 Testing layer

Responsible for:

- Timer correctness.
- Inventory invariants.
- Reservation transitions.
- Version conflicts.
- Lock expiry.
- Concurrent checkout.
- Integration scenarios.

---

## 4. Proposed Project Structure

The following is the target structure. Files are created incrementally, not all during initialization.

```text
homework3-flash-sale/
├── public/
├── src/
│   ├── components/
│   │   ├── SaleCountdown.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ReservationPanel.tsx
│   │   └── CheckoutPanel.tsx
│   ├── contracts/
│   │   ├── timer.ts
│   │   ├── inventory.ts
│   │   ├── reservation.ts
│   │   └── checkout.ts
│   ├── data/
│   │   └── products.ts
│   ├── engines/
│   │   ├── timerEngine.ts
│   │   ├── inventoryEngine.ts
│   │   └── checkoutEngine.ts
│   ├── simulation/
│   │   └── concurrentRequests.ts
│   ├── hooks/
│   │   ├── useCountdown.ts
│   │   └── useInventory.ts
│   ├── tests/
│   │   ├── timerEngine.test.ts
│   │   ├── inventoryEngine.test.ts
│   │   ├── reservationStateMachine.test.ts
│   │   ├── lockExpiry.test.ts
│   │   ├── checkoutEngine.test.ts
│   │   ├── concurrentRequests.test.ts
│   │   └── integration.test.ts
│   ├── styles/
│   │   └── flashSale.css
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── AI_FAILURE_AUDIT.md
├── TASK_DECOMPOSITION.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── index.html
```

The actual structure may contain additional files generated by the official Vite template.

Exact filenames and module interfaces become authoritative only after their corresponding contracts are approved.

---

## 5. Phase A — Project Foundation and Contracts

**Goal:** Establish the project environment, development rules, and strongly typed system contracts before implementing business logic.

### H3-A01 — Initialize React + TypeScript + Vite

**Objective**

Initialize the flash-sale application using the official Vite React TypeScript template.

**Expected files**

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `eslint.config.js`
- `src/main.tsx`
- `src/App.tsx`
- Template-generated supporting files.
- `.gitignore`

**Prerequisites**

- P01 Working Agreement confirmed.
- P02 Task Decomposition approved.
- Node.js, npm, Git, and VS Code available.

**Acceptance criteria**

- Official React TypeScript Vite template initialized.
- Dependencies installed manually.
- Development server starts.
- TypeScript compilation succeeds.
- Production build succeeds.
- Git repository initialized.
- No flash-sale business logic introduced.

**Verification method**

- Check Node.js, npm, and Git versions.
- Run development server.
- Run TypeScript checking.
- Run ESLint.
- Run production build.
- Inspect project structure and Git status.

**Suggested atomic commit**

`chore: initialize React TypeScript flash sale project`

---

### H3-A02 — Define Shared TypeScript Contracts

**Objective**

Define the foundational interfaces and types used by the timer, inventory, reservation, and checkout modules.

**Expected files**

- `src/contracts/timer.ts`
- `src/contracts/inventory.ts`
- `src/contracts/reservation.ts`
- `src/contracts/checkout.ts`

**Prerequisites**

- H3-A01.

**Acceptance criteria**

- Product and inventory identifiers are explicitly typed.
- Inventory records include stock accounting and version information.
- Reservation records include identity, quantity, status, and expiration deadline.
- Checkout input, output, and error contracts are defined.
- Timer inputs and outputs use milliseconds consistently.
- Public result types explicitly distinguish success and failure.
- State ownership and mutation responsibilities are documented.
- No implementation logic is added.

**Verification method**

- Run TypeScript checking.
- Review exported interfaces and types.
- Confirm downstream modules can reference contracts without circular dependencies.
- Review the contract's handling of invalid inputs and error results.

**Suggested atomic commit**

`docs(spec): define shared TypeScript domain contracts`

---

### H3-A03 — Specify Behavioral Invariants and State Transitions

**Objective**

Finalize the behavioral contract governing inventory reservations, version checks, expiry, and checkout.

**Expected files**

- `docs/ENGINE_CONTRACTS.md`

**Prerequisites**

- H3-A02.

**Acceptance criteria**

- Inventory ownership is explicitly defined.
- Stock invariant is documented:

  `totalStock = availableStock + reservedStock + soldStock`

- Stock quantities must be nonnegative integers.
- Allowed reservation transitions are specified.
- Invalid transitions are specified.
- Inventory version checking semantics are defined.
- The atomicity boundary of simulated updates is defined.
- Expiry deadlines use absolute timestamps.
- Checkout eligibility is defined.
- Same-deadline boundary behavior is specified.
- Duplicate reservation completion and double release are forbidden.
- Concurrency model and guarantee limitations are documented.
- Error handling and bounded retry policy are specified.
- No business engine implementation is created.

**Verification method**

- Perform contract review.
- Check each required transition against expected stock changes.
- Verify terminal states cannot return to active states.
- Review version conflict, expiry, and concurrency examples.
- Confirm every inventory operation preserves the invariant.

**Suggested atomic commit**

`docs(spec): define inventory lifecycle and concurrency invariants`

---

## 6. Phase B — Anti-Drift Countdown Engine

**Goal:** Implement and independently verify an accurate timer whose remaining time derives from an absolute deadline rather than accumulated interval callbacks.

### H3-B01 — Implement Anti-Drift Timer Engine

**Objective**

Implement a reusable timer engine based on `Date.now()` and an absolute target timestamp.

**Expected files**

- `src/engines/timerEngine.ts`

**Prerequisites**

- H3-A02.
- H3-A03.

**Acceptance criteria**

- The engine uses an absolute deadline.
- Remaining milliseconds are calculated using:

  `Math.max(0, targetTime - Date.now())`

- No fixed subtraction is used to update remaining time.
- Timer supports tick notification.
- Remaining time never becomes negative.
- Timer stops when completed.
- Explicit cancellation is supported.
- Canceled timers stop emitting notifications.
- Duplicate animation loops are prevented.
- Delayed animation frames do not accumulate countdown drift.
- Browser background suspension limitations are acknowledged.

**Verification method**

- Run TypeScript checking.
- Inspect the calculation for absolute-time semantics.
- Manually verify countdown behavior using a temporary approved test harness or later tests.
- Verify cancellation behavior.
- Verify completion at zero.

**Suggested atomic commit**

`feat(timer): implement absolute deadline countdown engine`

---

### H3-B02 — Verify Timer Behavior with Automated Tests

**Objective**

Create deterministic tests proving countdown correctness and cancellation safety.

**Expected files**

- `src/tests/timerEngine.test.ts`
- `package.json`
- `package-lock.json`
- `vite.config.ts` only if configuration is required.

**Prerequisites**

- H3-B01.

**Acceptance criteria**

- Development-only test framework configured.
- Tests cover initial remaining time.
- Tests cover delayed callbacks.
- Tests cover reaching zero.
- Tests verify remaining time never becomes negative.
- Tests verify cancellation.
- Tests verify that canceled timers do not emit additional ticks.
- Tests simulate background-tab-like callback delays.
- Tests verify the documented behavior of wall-clock changes.
- Tests use controlled clocks or scheduling where possible.
- No unrelated production functionality is introduced.

**Verification method**

- Run automated timer tests.
- Run TypeScript checking.
- Run lint and build.
- Inspect test assertions and failure cases.
- Record actual results only after running tests.

**Suggested atomic commit**

`test(timer): verify anti drift timing and cancellation`

---

## 7. Phase C — Inventory Engine and Reservation State Machine

**Goal:** Build authoritative inventory accounting and enforce legal reservation transitions.

### H3-C01 — Implement Deterministic Product Data

**Objective**

Create the fictional Vietnam 11.11 flash-sale product dataset.

**Expected files**

- `src/data/products.ts`

**Prerequisites**

- H3-A02.
- H3-A03.

**Acceptance criteria**

- Every product has a stable ID.
- Products include Vietnamese display names.
- Original and discounted prices are defined.
- Stock quantities are valid integers.
- Initial stock accounting satisfies the approved invariant.
- Initial version values are defined.
- Data is deterministic.
- No real payment information is included.

**Verification method**

- Run TypeScript checking.
- Inspect initial inventory quantities.
- Verify identifiers are unique.
- Verify all stock values are nonnegative.
- Verify price data is consistent.

**Suggested atomic commit**

`feat(data): add deterministic flash sale products`

---

### H3-C02 — Implement Reservation State Machine

**Objective**

Implement the approved reservation finite state machine without introducing concurrency orchestration.

**Expected files**

- `src/engines/reservationStateMachine.ts`

**Prerequisites**

- H3-A03.

**Acceptance criteria**

- Only approved reservation states exist.
- Initial reservation creation is explicitly defined.
- Allowed transitions are validated.
- Invalid transitions return explicit errors.
- Terminal states cannot return to active states.
- Double completion is rejected.
- Expiry after completion is rejected.
- Cancellation after completion is rejected.
- Transition logic can be tested independently.
- No inventory mutation occurs outside the approved state owner.

**Verification method**

- Run TypeScript checking.
- Review transition table against `docs/ENGINE_CONTRACTS.md`.
- Check invalid transition behavior.
- Verify terminal state protection.

**Suggested atomic commit**

`feat(reservation): implement reservation state machine`

---

### H3-C03 — Test Reservation State Machine

**Objective**

Verify the correctness of all reservation state transitions.

**Expected files**

- `src/tests/reservationStateMachine.test.ts`

**Prerequisites**

- H3-C02.
- H3-B02.

**Acceptance criteria**

- Tests cover permitted transitions.
- Tests cover invalid transitions.
- Tests cover terminal state behavior.
- Tests cover duplicate transitions.
- Tests cover cancellation restrictions.
- Tests cover expiry restrictions.
- Tests are deterministic.
- Test coverage matches the approved transition contract.

**Verification method**

- Run reservation state machine tests.
- Review successful and rejected transition assertions.
- Run TypeScript checking and lint.

**Suggested atomic commit**

`test(reservation): verify legal and invalid state transitions`

---

### H3-C04 — Implement Inventory Engine Foundation

**Objective**

Create the authoritative inventory state owner with snapshot reading and invariant enforcement.

**Expected files**

- `src/engines/inventoryEngine.ts`

**Prerequisites**

- H3-A03.
- H3-C01.
- H3-C02.

**Acceptance criteria**

- Inventory state is owned by one engine instance.
- Product records are indexed by stable IDs.
- Engine can return immutable inventory snapshots.
- Stock invariant is maintained.
- Invalid quantities are rejected.
- Unknown product IDs are rejected.
- Inventory version is maintained.
- State cannot be mutated directly by React components.
- Changes can be observed through an explicitly defined subscription mechanism.
- Unsubscribe behavior is defined.
- Reservation concurrency implementation is deferred to H3-D01.

**Verification method**

- Run TypeScript checking.
- Validate initial inventory records.
- Check snapshots cannot mutate internal engine state.
- Verify subscribe/unsubscribe behavior.
- Inspect inventory invariant checks.

**Suggested atomic commit**

`feat(inventory): establish authoritative inventory state`

---

## 8. Phase D — Optimistic Locking and Reservation Expiry

**Goal:** Implement safe inventory reservations using explicit version checks and absolute lock deadlines.

### H3-D01 — Implement Optimistic Inventory Reservation

**Objective**

Implement atomic, version-checked inventory reservation within the authoritative engine.

**Expected files**

- `src/engines/inventoryEngine.ts`

**Prerequisites**

- H3-C04.

**Acceptance criteria**

- Reservation requests include product ID, quantity, and expected inventory version.
- Current inventory version is compared with expected version.
- Version conflicts produce explicit failures.
- Insufficient stock produces explicit failures.
- Successful reservations reduce available stock.
- Successful reservations increase reserved stock.
- Stock invariant remains valid.
- Successful state changes advance inventory version according to contract.
- Version comparison and stock update happen within one logical atomic transition.
- Reservation IDs are stable and unique.
- Reservation expiration timestamps are recorded.
- No overselling is possible within the approved engine instance.

**Verification method**

- Run TypeScript checking.
- Verify successful reservation accounting.
- Verify insufficient stock rejection.
- Verify stale-version rejection.
- Inspect atomic transition boundaries.
- Verify invariant after each operation.

**Suggested atomic commit**

`feat(inventory): implement optimistic stock reservation`

---

### H3-D02 — Implement Reservation Cancellation

**Objective**

Allow active reservations to be canceled safely and release their stock exactly once.

**Expected files**

- `src/engines/inventoryEngine.ts`

**Prerequisites**

- H3-D01.

**Acceptance criteria**

- Only eligible active reservations can be canceled.
- Cancellation changes reservation status correctly.
- Reserved stock decreases by the canceled quantity.
- Available stock increases by the same quantity.
- Total stock remains unchanged.
- Completed reservations cannot be canceled.
- Repeated cancellation cannot release stock twice.
- Version changes are consistent with the approved contract.
- Invalid cancellation returns an explicit result.

**Verification method**

- Run TypeScript checking.
- Test one successful cancellation.
- Test duplicate cancellation.
- Test cancellation of unknown reservation.
- Test invariant before and after cancellation.

**Suggested atomic commit**

`feat(inventory): implement idempotent reservation release`

---

### H3-D03 — Implement Reservation Lock Expiry

**Objective**

Enforce reservation expiration using absolute deadlines.

**Expected files**

- `src/engines/inventoryEngine.ts`

**Prerequisites**

- H3-D02.
- H3-B01.

**Acceptance criteria**

- Every reservation contains an absolute expiration timestamp.
- Expiration validity is determined using current time.
- Expired active reservations transition to the approved expired state.
- Reserved stock is released exactly once.
- Repeated expiry checks cannot double-release stock.
- Completed reservations cannot expire retroactively.
- Expiry scheduler callbacks cannot corrupt newer state.
- Expiry timers can be canceled and cleaned up.
- Delayed callbacks cannot extend reservation validity.
- Checkout eligibility does not rely solely on UI timer updates.
- Exact-deadline semantics match the approved contract.

**Verification method**

- Run TypeScript checking.
- Simulate expiration with controlled time.
- Verify stock release.
- Verify duplicate expiry protection.
- Verify no release after successful checkout.
- Verify scheduler cleanup.

**Suggested atomic commit**

`feat(inventory): enforce reservation lock expiration`

---

### H3-D04 — Test Inventory Locking and Expiry

**Objective**

Verify optimistic locking, stock accounting, cancellation, and lock expiry.

**Expected files**

- `src/tests/inventoryEngine.test.ts`
- `src/tests/lockExpiry.test.ts`

**Prerequisites**

- H3-D03.
- H3-C03.

**Acceptance criteria**

- Tests cover valid reservation.
- Tests cover insufficient stock.
- Tests cover expected-version mismatch.
- Tests cover invalid quantities.
- Tests cover unknown products and reservations.
- Tests cover exact stock conservation.
- Tests cover cancellation.
- Tests cover double cancellation.
- Tests cover expiration.
- Tests cover double expiration.
- Tests cover expiration after completion when a valid completed fixture is available; otherwise this check is finalized in Phase E.
- Tests cover deadline boundaries.
- All tests use deterministic inputs.

**Verification method**

- Run inventory and expiry tests.
- Run TypeScript checking.
- Run lint and build.
- Review assertions for zero negative inventory and exact-once release.

**Suggested atomic commit**

`test(inventory): verify version locking and lock expiry`

---

## 9. Phase E — Checkout and Concurrency Safety

**Goal:** Implement checkout transitions and ensure competing asynchronous requests cannot violate inventory consistency.

### H3-E01 — Implement Checkout Transitions

**Objective**

Implement checkout operations for active, valid inventory reservations.

**Expected files**

- `src/engines/checkoutEngine.ts`
- `src/engines/inventoryEngine.ts` if required by the approved ownership contract.

**Prerequisites**

- H3-D03.
- H3-C02.

**Acceptance criteria**

- Checkout validates reservation identity.
- Checkout validates reservation status.
- Checkout checks actual expiry deadline at transition time.
- Expired reservations cannot be committed.
- Canceled reservations cannot be committed.
- Valid checkout changes reservation status to committed.
- Reserved quantity decreases after checkout.
- Sold quantity increases by the same amount.
- Available stock remains consistent.
- Total stock is conserved.
- Duplicate checkout attempts cannot create multiple purchases.
- Checkout has explicit success and failure results.
- Business state remains owned by the approved authoritative engine.

**Verification method**

- Run TypeScript checking.
- Verify checkout with a valid reservation.
- Verify expired reservation rejection.
- Verify canceled reservation rejection.
- Verify duplicate checkout rejection.
- Check stock accounting after every case.

**Suggested atomic commit**

`feat(checkout): implement validated checkout transitions`

---

### H3-E02 — Prevent Concurrent Request Race Conditions

**Objective**

Implement safe coordination of competing reservation and checkout operations.

**Expected files**

- `src/simulation/concurrentRequests.ts`
- `src/engines/inventoryEngine.ts` only if required for atomic operation guarantees.

**Prerequisites**

- H3-D01.
- H3-E01.

**Acceptance criteria**

- Multiple requests can be initiated close together.
- Requests use Promise and async/await correctly.
- Simulated asynchronous delay is supported.
- Authoritative inventory updates remain atomic.
- Requests do not mutate stale React snapshots.
- Inventory version conflicts are handled explicitly.
- Any retry strategy is bounded and follows the contract.
- Duplicate checkout requests cannot both succeed.
- Async failures are handled without unhandled rejections.
- The simulation exposes enough results for concurrency verification.
- No claim of distributed consistency is made.

**Verification method**

- Run TypeScript checking.
- Trigger competing reservations against limited stock.
- Verify successful reservations cannot exceed stock.
- Trigger competing checkout attempts.
- Verify only one completion per reservation.
- Inspect all asynchronous error paths.

**Suggested atomic commit**

`feat(concurrency): coordinate competing purchase requests`

---

### H3-E03 — Test Concurrent Reservations and Checkout

**Objective**

Create deterministic tests proving stock safety under competing asynchronous operations.

**Expected files**

- `src/tests/concurrentRequests.test.ts`
- `src/tests/checkoutEngine.test.ts`

**Prerequisites**

- H3-E02.
- H3-D04.

**Acceptance criteria**

- Tests cover simultaneous reservation attempts.
- Tests cover limited-stock competition.
- Tests cover identical expected versions.
- Tests verify no overselling.
- Tests verify inventory conservation.
- Tests cover concurrent checkout attempts.
- Tests verify no duplicate successful checkout.
- Tests cover checkout racing with expiration.
- Tests cover checkout racing with cancellation.
- Tests cover retry-limit behavior when applicable.
- Tests verify explicit error results.
- Scheduling is controlled sufficiently to make tests repeatable.

**Verification method**

- Run concurrency and checkout tests.
- Repeat automated tests to check consistency.
- Run full test suite.
- Run TypeScript checking.
- Run production build.
- Inspect race-condition assertions.

**Suggested atomic commit**

`test(concurrency): verify race safety and checkout idempotence`

---

## 10. Phase F — React User Interface

**Goal:** Present the flash-sale simulation through an accessible, understandable React interface without moving business logic into UI components.

### H3-F01 — Implement Flash-Sale Page Structure

**Objective**

Create the semantic React layout for the Vietnam 11.11 flash-sale experience.

**Expected files**

- `src/App.tsx`
- `src/components/ProductCard.tsx`
- `src/components/ProductList.tsx`

**Prerequisites**

- H3-A01.
- H3-C01.

**Acceptance criteria**

- Page has exactly one primary `h1`.
- Uses semantic HTML elements.
- Displays Vietnam 11.11 branding.
- Displays deterministic product data.
- Shows product names and identifiers as appropriate.
- Shows original and sale prices.
- Prices use Vietnamese currency formatting.
- Shows available stock.
- Uses stable React keys.
- Does not directly mutate authoritative inventory.
- Interactive operations may remain unconnected until their authorized tasks.

**Verification method**

- Run development server.
- Inspect page structure.
- Verify product rendering.
- Verify price formatting.
- Run TypeScript checking.
- Run lint and build.

**Suggested atomic commit**

`feat(ui): create semantic flash sale product layout`

---

### H3-F02 — Connect Countdown to React

**Objective**

Display the sale countdown through a reusable React hook and UI component.

**Expected files**

- `src/hooks/useCountdown.ts`
- `src/components/SaleCountdown.tsx`
- `src/App.tsx`

**Prerequisites**

- H3-B02.
- H3-F01.

**Acceptance criteria**

- UI uses the approved timer engine.
- Countdown derives from an absolute target timestamp.
- Countdown clearly displays remaining time.
- Display updates do not require React state changes every animation frame.
- Sale status distinguishes pending, active, and ended states.
- Timer effects clean up correctly.
- Duplicate timers are not created after React rerenders.
- Timer reaches zero without negative values.
- Screen readers are not spammed by continuously changing countdown text.

**Verification method**

- Run development server.
- Observe countdown.
- Verify pending, active, and ended states.
- Verify cleanup during component unmount.
- Run TypeScript checking and lint.
- Confirm timer tests remain passing.

**Suggested atomic commit**

`feat(ui): display anti drift flash sale countdown`

---

### H3-F03 — Connect Inventory Reservation Actions

**Objective**

Connect product reservation controls to the authoritative inventory engine.

**Expected files**

- `src/hooks/useInventory.ts`
- `src/components/ProductCard.tsx`
- `src/components/ReservationPanel.tsx`
- `src/App.tsx`

**Prerequisites**

- H3-D04.
- H3-F01.

**Acceptance criteria**

- UI reads inventory snapshots from the authoritative engine.
- Reservation actions call approved inventory methods.
- React state does not become a second inventory authority.
- Successful reservations update displayed stock.
- Reservation status is visible.
- Version conflicts produce understandable messages.
- Sold-out products cannot be reserved.
- Invalid quantities are rejected.
- Subscription lifecycle is cleaned up.
- Controls are keyboard accessible.
- Reservation eligibility follows the approved sale-window contract.

**Verification method**

- Run development server.
- Create a reservation manually.
- Verify stock and reservation display.
- Trigger insufficient stock.
- Verify user-facing error feedback.
- Inspect subscription cleanup.
- Run TypeScript checking, lint, and build.

**Suggested atomic commit**

`feat(ui): connect optimistic inventory reservations`

---

### H3-F04 — Connect Checkout and Reservation Feedback

**Objective**

Implement checkout interaction and display reservation lifecycle feedback.

**Expected files**

- `src/components/CheckoutPanel.tsx`
- `src/components/ReservationPanel.tsx`
- `src/App.tsx`

**Prerequisites**

- H3-E03.
- H3-F03.

**Acceptance criteria**

- UI displays active reservation information.
- Checkout action calls approved checkout logic.
- Successful checkout displays confirmation.
- Failed checkout displays a clear explanation.
- Expired reservations cannot be checked out.
- Canceled reservations cannot be checked out.
- Repeated submit actions cannot create duplicate purchases.
- Pending asynchronous operations receive appropriate feedback.
- Checkout controls have suitable disabled states.
- Reservation cancellation is available when permitted.
- No real payment information is collected.
- Status messages are accessible.

**Verification method**

- Perform successful checkout.
- Repeat checkout.
- Attempt checkout after expiry.
- Cancel a reservation.
- Verify displayed inventory accounting.
- Test keyboard interaction.
- Run TypeScript checking, lint, and build.

**Suggested atomic commit**

`feat(ui): integrate reservation checkout controls`

---

## 11. Phase G — Responsive Design and End-to-End Verification

**Goal:** Polish presentation and verify the complete integrated user journey.

### H3-G01 — Implement Responsive Flash-Sale Styling

**Objective**

Create a modern, accessible, mobile-friendly visual design.

**Expected files**

- `src/styles/flashSale.css`
- `src/App.tsx` only if minor structural styling hooks are necessary.
- Existing global CSS files if needed for cleanup.

**Prerequisites**

- H3-F04.

**Acceptance criteria**

- Layout works from 375px mobile viewport width.
- No unintended page-level horizontal scrolling.
- Uses CSS custom properties.
- Uses Flexbox and Grid appropriately.
- Clear distinction between pending, active, and ended sale states.
- Clear distinction between available, reserved, and sold-out inventory.
- Success and error states are understandable without relying only on color.
- Visible keyboard focus styles.
- Appropriate WCAG 2.2 AA contrast targets.
- Reduced-motion preferences are respected.
- Unnecessary dependencies are not introduced.

**Verification method**

- Inspect at 375px, tablet, and desktop widths.
- Test keyboard navigation.
- Inspect focus indicators.
- Verify error and success readability.
- Check reduced-motion behavior.
- Run lint and build.

**Suggested atomic commit**

`style(ui): implement responsive accessible flash sale design`

---

### H3-G02 — Implement Full Integration Tests

**Objective**

Verify the timer, inventory, reservation, checkout, and concurrency modules operate correctly together.

**Expected files**

- `src/tests/integration.test.ts`

**Prerequisites**

- H3-E03.
- H3-F04.

**Acceptance criteria**

- Sale starts at the approved opening timestamp.
- Sale ends at the approved closing timestamp.
- Early and late reservations are rejected according to the sale contract.
- Reservation stock is deducted correctly.
- Reservation expires at the correct deadline.
- Expired reservation checkout fails.
- Valid reservation checkout succeeds.
- Canceled reservation stock is restored.
- Completed checkout stock remains sold.
- Competing requests do not oversell inventory.
- Duplicate checkout does not duplicate sales.
- Inventory invariants remain true throughout the workflow.
- Integration scenarios are deterministic.
- Every expected failure has an explicit assertion.

**Verification method**

- Run integration tests.
- Run full automated test suite.
- Run TypeScript checking.
- Run ESLint.
- Run production build.
- Review actual test failures before committing.

**Suggested atomic commit**

`test(integration): verify complete flash sale lifecycle`

---

## 12. Phase H — AI Failure Audit and Delivery

**Goal:** Complete the mandatory AI defect audit, verify the implementation, and prepare a defensible submission.

### H3-H01 — Document Genuine AI-Induced Defects

**Objective**

Create the mandatory AI failure audit using genuine defects discovered during development.

**Expected files**

- `AI_FAILURE_AUDIT.md`

**Prerequisites**

- Relevant implementation and verification tasks completed.
- At least three actual AI-induced defects identified and supported by evidence.

**Acceptance criteria**

- Contains at least three genuine AI-induced defects.
- Every defect has a unique ID.
- Original incorrect code or behavior is documented.
- Root cause is explained.
- Detection process is described.
- Evidence from tests or DevTools is recorded.
- Corrected implementation is documented.
- Verification results are recorded.
- No fabricated defects.
- No intentionally introduced failures solely to satisfy the audit.
- No unverified claim that a fix passed testing.

**Verification method**

- Compare each defect with actual development history.
- Review original and corrected code.
- Verify evidence exists.
- Confirm corrected behavior through relevant tests.
- Confirm a minimum of three complete audit entries.

**Suggested atomic commit**

`docs(audit): document verified AI induced defects`

**Important dependency condition**

This task remains blocked until three genuine defects have been found.

Defect evidence should be collected continuously during earlier phases rather than invented at the end.

If fewer than three genuine defects are found, the audit is incomplete and must be reported honestly.

---

### H3-H02 — Prepare README and Verification Instructions

**Objective**

Document the completed application's architecture, operation, limitations, and testing process.

**Expected files**

- `README.md`

**Prerequisites**

- H3-G02.
- H3-G01.

**Acceptance criteria**

- Project objective is documented.
- Technology stack is documented.
- Installation instructions are included.
- Development commands are included.
- Build and testing instructions are included.
- Main feature explanations are provided.
- Inventory invariants are explained.
- Optimistic locking behavior is explained.
- Reservation state machine is documented.
- Timer anti-drift principle is explained.
- Browser-only simulation limitations are clearly stated.
- Known limitations are documented.
- No fake performance or testing results are claimed.

**Verification method**

- Follow the documented steps manually.
- Check commands against project scripts.
- Verify filenames and directory references.
- Review technical explanations for accuracy.

**Suggested atomic commit**

`docs: document flash sale architecture and verification`

---

### H3-H03 — Final Project Verification and Submission Review

**Objective**

Perform complete technical and submission verification without adding new features.

**Expected files**

- No new application code required.
- Existing files only if legitimate final corrections are necessary.
- Final submission evidence collected manually.

**Prerequisites**

- H3-G01.
- H3-G02.
- H3-H01.
- H3-H02.
- All previous required tasks verified.

**Acceptance criteria**

- TypeScript checking passes.
- ESLint passes.
- Production build passes.
- Automated tests pass.
- No known overselling defect remains.
- No known double-checkout defect remains.
- No known double-release defect remains.
- Countdown follows the absolute deadline contract.
- Timer cleanup is verified.
- Reservation expiration is verified.
- Checkout transitions are verified.
- Responsive layout is manually reviewed.
- Keyboard access is manually reviewed.
- AI failure audit contains three genuine defects.
- Git history contains at least eight real atomic Conventional Commits.
- Working tree is clean before submission.
- README matches actual implementation.
- Developer can explain core implementation during oral defense.

**Verification method**

Run the following commands manually from the project root:

```powershell
# Kiểm tra kiểu dữ liệu TypeScript
npx tsc --noEmit -p tsconfig.app.json

# Kiểm tra chất lượng code
npm run lint

# Chạy toàn bộ bài kiểm thử
npm run test -- --run

# Build phiên bản production
npm run build

# Kiểm tra lịch sử commit
git log --oneline

# Kiểm tra các thay đổi chưa commit
git status

# Kiểm tra nội dung thay đổi còn lại
git diff
```

Commands assume the approved npm scripts and development dependencies have been configured during earlier tasks.

Actual verification results must be reported by the developer.

**Suggested atomic commit**

No automatic commit.

If genuine final corrections are required, commit each coherent fix separately using an appropriate Conventional Commit message.

Do not create empty or cosmetic commits solely to increase commit count.

---

## 13. Dependency Map

### Phase A

```text
H3-A01
  |
  v
H3-A02
  |
  v
H3-A03
```

### Phase B

```text
H3-A03
  |
  v
H3-B01
  |
  v
H3-B02
```

### Phase C

```text
H3-A03
  |
  +----> H3-C01
  |        |
  |        v
  |      H3-C04 <---- H3-C02
  |                    |
  +----> H3-C02 ------+
             |
             v
           H3-C03
```

### Phase D

```text
H3-C04
  |
  v
H3-D01
  |
  v
H3-D02
  |
  v
H3-D03
  |
  v
H3-D04
```

H3-D03 also depends on H3-B01.

H3-D04 also depends on H3-C03.

### Phase E

```text
H3-D03
  |
  v
H3-E01
  |
  v
H3-E02
  |
  v
H3-E03
```

H3-E03 also depends on H3-D04.

### Phase F

```text
H3-F01
  |
  +----> H3-F02
  |
  v
H3-F03
  |
  v
H3-F04
```

H3-F01 requires H3-A01 and H3-C01.

H3-F02 also requires H3-B02.

H3-F03 also requires H3-D04.

H3-F04 also requires H3-E03.

### Phases G and H

```text
H3-F04
  |
  +----> H3-G01
  |
  +----> H3-G02
           |
           v
         H3-H02

H3-G01 ----> H3-H02

Three genuine AI defects
           |
           v
         H3-H01

H3-G01 + H3-G02 + H3-H01 + H3-H02
                    |
                    v
                  H3-H03
```

The dependency graph defines prerequisites, not a mandatory strictly sequential execution order for independent tasks.

---

## 14. Recommended Execution Order

| Order | Task ID | Milestone | Phase |
|---|---|---|---|
| 1 | H3-A01 | Project initialization | A |
| 2 | H3-A02 | TypeScript contracts | A |
| 3 | H3-A03 | Behavioral invariants | A |
| 4 | H3-B01 | Anti-drift timer | B |
| 5 | H3-B02 | Timer tests | B |
| 6 | H3-C01 | Product data | C |
| 7 | H3-C02 | Reservation state machine | C |
| 8 | H3-C03 | State machine tests | C |
| 9 | H3-C04 | Inventory foundation | C |
| 10 | H3-D01 | Optimistic reservation | D |
| 11 | H3-D02 | Cancellation | D |
| 12 | H3-D03 | Lock expiry | D |
| 13 | H3-D04 | Inventory and expiry tests | D |
| 14 | H3-E01 | Checkout transitions | E |
| 15 | H3-E02 | Concurrency coordination | E |
| 16 | H3-E03 | Concurrent request tests | E |
| 17 | H3-F01 | Semantic React UI | F |
| 18 | H3-F02 | Countdown integration | F |
| 19 | H3-F03 | Reservation UI | F |
| 20 | H3-F04 | Checkout UI | F |
| 21 | H3-G01 | Responsive styling | G |
| 22 | H3-G02 | Integration tests | G |
| 23 | H3-H01 | AI failure audit | H |
| 24 | H3-H02 | README | H |
| 25 | H3-H03 | Final verification | H |

**Total: 25 atomic tasks across 8 phases.**

This is the recommended implementation order, subject to the prerequisites defined for each task.

---

## 15. Git Commit Strategy

The project must contain at least eight genuine atomic Conventional Commits.

The proposed decomposition provides more than eight independent implementation and documentation milestones.

### Commit rules

1. Every commit represents a real, reviewable change.
2. Commit messages follow Conventional Commits.
3. Do not combine unrelated features.
4. Do not create empty commits.
5. Test meaningful changes before committing.
6. The developer creates commits manually.
7. Commits should preserve a compilable project whenever reasonably possible.
8. Final verification must confirm the actual number of valid commits.

### Recommended commit workflow

```powershell
# Xem tình trạng các file
git status

# Kiểm tra thay đổi trước khi commit
git diff

# Thêm đúng file thuộc task hiện tại
git add <relative-file-path>

# Kiểm tra thay đổi đã được stage
git diff --cached

# Commit với thông điệp của task
git commit -m "type(scope): describe atomic change"

# Xem lịch sử commit
git log --oneline
```

Replace placeholders with the actual task-specific paths and approved commit message.

The command examples are instructions only and are not executed by the AI.

---

## 16. AI Failure Audit Collection Strategy

The `AI_FAILURE_AUDIT.md` requirement is mandatory, but defects must be genuine.

During every implementation phase, the developer should record any actual AI-generated defect discovered through testing, code review, or browser debugging.

Suggested evidence to preserve:

- Task ID where the defect occurred.
- Original AI response or code.
- Error message or observed incorrect behavior.
- Reproduction steps.
- Test failure or DevTools screenshot.
- Explanation of the root cause.
- Corrected code.
- Passing verification evidence after the fix.
- Related Git commit, when available.

Potential defect categories include timer drift, time unit mistakes, stale state, version conflicts, overselling, duplicate checkout, double stock release, incorrect expiry checks, and timer cleanup errors.

These are possible categories, not fabricated audit findings.

A test exposing an actual AI-generated defect may qualify.

An intentionally planted defect does not qualify.

---

## 17. Verification Policy

Every task has four verification levels where applicable.

### Level 1 — Static verification

- TypeScript compilation.
- ESLint.
- Dependency and import consistency.

### Level 2 — Unit verification

- Deterministic behavior tests.
- Boundary cases.
- Invalid input tests.
- State transition tests.

### Level 3 — Integration verification

- Cross-module behavior.
- Countdown and sale eligibility.
- Reservation and checkout.
- Version conflicts.
- Competing asynchronous operations.
- Stock invariants.

### Level 4 — Manual browser verification

- Product and timer rendering.
- Reservation interaction.
- Checkout feedback.
- Keyboard accessibility.
- Responsive layout.
- Browser console and lifecycle cleanup.

A task is not marked completed until its relevant acceptance criteria have been verified.

Never label an untested criterion as PASS.

---

## 18. Oral Defense Preparation

The developer should be able to explain and modify the following without relying on AI-generated narration:

| Topic | Expected understanding |
|---|---|
| `Date.now()` | Wall-clock timestamps in milliseconds |
| Absolute deadline | Why delayed callbacks do not accumulate drift |
| `requestAnimationFrame()` | Frame scheduling and browser suspension |
| `setInterval()` | Why fixed decrement countdowns drift |
| TypeScript contracts | Input, output, state, and error typing |
| Inventory invariant | Conservation of available, reserved, and sold stock |
| Optimistic locking | Expected version comparison and conflicts |
| Atomic transition | Why stock checking and updating must stay together |
| State machine | Valid and invalid transitions |
| Lock expiry | Absolute expiration and exact-once release |
| Promise / async-await | Asynchronous execution and failure handling |
| Event loop | Competing operations in the browser runtime |
| Race conditions | Stale reads and competing writes |
| Idempotence | Prevention of duplicate completion and release |
| React hooks | State, effects, subscriptions, and cleanup |
| Git | Atomic changes and Conventional Commit history |

For every important function, the developer should understand what it does, how it works, why it is designed that way, how failures are handled, how it is tested, and how to modify it during live defense.

---

## 19. Final Definition of Done

### Project foundation

- [ ] React + TypeScript + Vite initialized.
- [ ] TypeScript contracts approved.
- [ ] Behavioral invariants documented.
- [ ] Project type checking passes.
- [ ] Production build passes.

### Countdown

- [ ] Uses an absolute target timestamp.
- [ ] Computes remaining time from `Date.now()`.
- [ ] No accumulated callback drift.
- [ ] Remaining time never negative.
- [ ] Timer reaches zero.
- [ ] Cancellation and cleanup work.
- [ ] Deterministic timer tests pass.

### Inventory

- [ ] Strongly typed inventory records.
- [ ] Inventory versions implemented.
- [ ] Optimistic version validation implemented.
- [ ] Successful reservation updates stock correctly.
- [ ] Insufficient stock rejected.
- [ ] Version conflicts rejected or handled through approved bounded retry.
- [ ] Overselling prevented within simulation boundary.
- [ ] Inventory invariant always maintained.

### Reservation and checkout

- [ ] Explicit reservation state machine.
- [ ] Invalid transitions rejected.
- [ ] Absolute lock deadlines.
- [ ] Expiry enforced during checkout.
- [ ] Cancellation releases stock exactly once.
- [ ] Expiry releases stock exactly once.
- [ ] Successful checkout moves reserved stock to sold stock.
- [ ] Duplicate checkout prevented.
- [ ] Checkout race conditions tested.

### User interface

- [ ] Vietnam 11.11 flash-sale theme.
- [ ] Semantic HTML.
- [ ] Exactly one primary `h1`.
- [ ] Product cards and stock display.
- [ ] Countdown integrated.
- [ ] Reservation actions integrated.
- [ ] Checkout actions integrated.
- [ ] Clear errors and status messages.
- [ ] Keyboard-accessible controls.
- [ ] Responsive at 375px.
- [ ] Reduced-motion preferences respected.

### Testing and delivery

- [ ] Timer tests pass.
- [ ] Reservation state machine tests pass.
- [ ] Inventory tests pass.
- [ ] Lock expiry tests pass.
- [ ] Checkout tests pass.
- [ ] Concurrent request tests pass.
- [ ] Integration tests pass.
- [ ] ESLint passes.
- [ ] Production build passes.
- [ ] At least eight genuine atomic Conventional Commits.
- [ ] `AI_FAILURE_AUDIT.md` contains at least three genuine AI-induced defects.
- [ ] README explains installation, architecture, testing, and limitations.
- [ ] Git working tree clean.
- [ ] Developer ready for oral defense.

---

## 20. Current Progress

| Phase | Description | Status |
|---|---|---|
| A | Project foundation and contracts | NOT STARTED |
| B | Anti-drift timer | NOT STARTED |
| C | Inventory and reservation state machine | NOT STARTED |
| D | Optimistic locking and expiry | NOT STARTED |
| E | Checkout and concurrency | NOT STARTED |
| F | React user interface | NOT STARTED |
| G | Responsive design and integration tests | NOT STARTED |
| H | Audit and delivery | NOT STARTED |

**P01:** Working Agreement — CONFIRMED.

**P02:** Task decomposition content — DRAFTED FOR REVIEW.

**Next implementation task:** H3-A01 — Initialize React + TypeScript + Vite.

Implementation must not begin until a separate task prompt authorizes it.

---

**Project principle: Generate with AI. Verify with engineering.**

**Final operating rule: ONE PROMPT = ONE ATOMIC TASK.**