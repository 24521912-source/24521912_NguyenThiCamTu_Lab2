# TASK_DECOMPOSITION.md

# Lab 02 — Homework 2: Concurrent FIFO Audio Visualizer Queue Engine

**Course:** Web Application Development 2026 — UIT, VNU-HCM  
**Technology:** React + TypeScript + Vite + Web Audio API + Canvas 2D  
**Methodology:** Contract-First Development + Atomic AI Workflow  
**Status:** PROPOSED — Pending Approval

---

## 1. Project Objective

Build a concurrent-request-safe FIFO audio processing system with real-time frequency visualization.

### Mandatory Requirements

1. Use native Web Audio API.
2. Support `AnalyserNode` with `fftSize = 256` or `512`.
3. Process simultaneous audio requests using a FIFO queue.
4. Use `AbortController` and `AbortSignal` for cancellation.
5. Properly manage and clean up audio resources.
6. Display frequency bars using Canvas 2D.
7. Use `requestAnimationFrame` to target 60 FPS.
8. Avoid React state thrashing, memory leaks and asynchronous race conditions.

### Implementation Decisions

- React functional components with TypeScript.
- Vite for project infrastructure.
- One active FIFO queue worker.
- Native `fetch()` for audio downloading.
- Native `decodeAudioData()` for decoding.
- Canvas 2D for frequency visualization.
- No third-party audio, queue or visualization libraries.
- Independent audio processing engine separated from React.

---

## 2. Development Rules

1. **ONE PROMPT = ONE ATOMIC TASK.**
2. Define contracts before implementing corresponding modules.
3. AI writes complete code directly in ChatGPT.
4. Developer manually creates and modifies files in VS Code.
5. AI never executes commands or modifies local files.
6. Every task requires independent verification.
7. Every completed task should have an atomic Git commit.
8. No task may be marked PASS without actual verification evidence.
9. Never introduce placeholder implementations.
10. Do not implement future tasks without authorization.

### Standard Task Completion Format

Every coding task must include:

- Task identification and prerequisites.
- Exact file paths.
- Complete source code.
- Manual copy-paste instructions.
- TypeScript verification.
- Build verification.
- Task-specific tests.
- Expected results.
- Potential failures.
- Git inspection and commit commands.
- Brief Vietnamese explanation.

---

# 3. Work Breakdown Structure

## Phase A — Project Foundation

### A01 — Initialize React + TypeScript + Vite Project

**Objective:** Establish a working project with the approved technology stack.

**Expected files:**
- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `.gitignore`

**Prerequisites:** P01 Working Agreement; approved WBS.

**Acceptance criteria:**
- Vite project initializes successfully.
- React and TypeScript are configured.
- Development server starts.
- TypeScript verification succeeds.
- Production build succeeds.
- Git repository is ready.

**Verification:**
- Run `npm install` if dependencies are not installed.
- Run `npx tsc -b --noEmit`.
- Run `npm run build`.
- Run `npm run dev` and inspect the browser.
- Run `git status`.

**Git commit:** `chore: initialize homework2 React TypeScript Vite`

### A02 — Define Architecture and Resource Ownership

**Objective:** Specify module responsibilities, interfaces and resource ownership before implementation.

**Expected files:**
- `docs/ARCHITECTURE.md`

**Prerequisites:** A01.

**Acceptance criteria:**
- Queue, download, decoder, playback, analyser, visualizer and UI responsibilities are defined.
- Module dependencies are documented.
- AudioContext ownership is defined.
- Animation loop ownership is defined.
- Cancellation propagation is documented.
- Resource cleanup responsibilities are explicit.
- No application behavior is implemented.

**Verification:**
- Review architecture against project rules.
- Confirm each module has one primary responsibility.
- Check for missing lifecycle and failure paths.
- Run `git diff --check`.

**Git commit:** `docs: define audio engine architecture`

### A03 — Define TypeScript Contracts

**Objective:** Establish strongly typed interfaces for queue tasks, audio services, playback states and errors.

**Expected files:**
- `src/types/audio.ts`
- `src/types/queue.ts`

**Prerequisites:** A02.

**Acceptance criteria:**
- AudioTask structure is defined.
- Task identifiers and lifecycle states are defined.
- Queue result and error types are specified.
- Cancellation and disposal contracts are documented.
- Playback state and audio service interfaces are defined.
- State and resource ownership remain consistent with A02.
- No production behavior is implemented.

**Verification:**
- Run `npx tsc -b --noEmit`.
- Run `npm run build`.
- Inspect exported types and import paths.
- Run `git diff --check`.

**Git commit:** `feat(types): define audio queue contracts`

---

## Phase B — FIFO Queue Engine

### B01 — Implement FIFO Scheduling

**Objective:** Implement a queue that accepts simultaneous requests but processes them sequentially.

**Expected files:**
- `src/queue/AudioTaskQueue.ts`

**Prerequisites:** A03.

**Acceptance criteria:**
- `enqueue()` preserves submission order.
- Only one worker is active.
- Repeated enqueue calls do not start overlapping workers.
- Successful tasks settle exactly once.
- An empty queue returns to idle.
- Processing logic remains independent of React.
- Downloading and decoding are injected or delegated according to the approved contract.

**Verification:**
- Type-check and build.
- Use a deterministic manual test harness or mocks.
- Enqueue multiple controlled tasks.
- Confirm FIFO order and maximum active worker count of one.

**Git commit:** `feat(queue): implement FIFO scheduling`

### B02 — Implement Audio Fetching

**Objective:** Fetch audio data using native browser APIs.

**Expected files:**
- `src/audio/fetchAudio.ts`

**Prerequisites:** A03, B01.

**Acceptance criteria:**
- Accepts a validated audio URL and AbortSignal.
- Uses native `fetch()`.
- Rejects unsuccessful HTTP responses.
- Returns audio data as ArrayBuffer.
- Propagates cancellation appropriately.
- Reports network and CORS failures.
- Does not leak request-related resources.

**Verification:**
- Type-check and build.
- Test valid requests and failed HTTP responses.
- Test invalid URLs.
- Test cancellation during fetching.
- Inspect Chrome DevTools Network panel.

**Git commit:** `feat(audio): implement abortable audio fetching`

### B03 — Implement Audio Decoding

**Objective:** Decode downloaded ArrayBuffers into AudioBuffers.

**Expected files:**
- `src/audio/decodeAudio.ts`

**Prerequisites:** A03, B02.

**Acceptance criteria:**
- Uses Web Audio API `decodeAudioData()`.
- Returns a valid AudioBuffer on success.
- Propagates decoding failures.
- Does not claim native AbortSignal support for decoding.
- Defines how canceled or stale decoding results are discarded.
- Does not create unnecessary AudioContexts.

**Verification:**
- Type-check and build.
- Test with valid and corrupted audio data.
- Inspect decoding errors.
- Review cancellation-during-decoding behavior.

**Git commit:** `feat(audio): implement audio buffer decoding`

### B04 — Integrate Queue Processing Pipeline

**Objective:** Connect FIFO scheduling with fetching and decoding.

**Expected files:**
- `src/queue/AudioTaskQueue.ts`

**Prerequisites:** B01, B02, B03.

**Acceptance criteria:**
- Tasks flow through fetch and decode in FIFO order.
- Exactly one task is actively processed at a time.
- A successful task resolves with AudioBuffer.
- A failed task rejects without blocking later tasks.
- Worker state is reliably restored.
- Unexpected errors do not permanently stop the queue.

**Verification:**
- Type-check and build.
- Enqueue valid and invalid audio requests.
- Confirm valid tasks after failures still execute.
- Confirm all submitted promises settle.

**Git commit:** `feat(queue): integrate audio fetch and decode`

---

## Phase C — Cancellation and Concurrency Safety

### C01 — Implement Queue Cancellation

**Objective:** Support cancellation of pending and active audio requests.

**Expected files:**
- `src/queue/AudioTaskQueue.ts`

**Prerequisites:** B04.

**Acceptance criteria:**
- Pending tasks can be canceled before downloading.
- Active fetch requests receive an AbortSignal.
- Cancellation rejects the relevant task.
- Canceled tasks never resolve successfully afterward.
- Cancellation does not block the next valid task.
- Repeated cancellation is safe.
- No unhandled promise rejections are introduced.

**Verification:**
- Type-check and build.
- Cancel queued tasks.
- Cancel an active fetch.
- Test cancellation during decoding.
- Confirm every canceled task settles appropriately.
- Confirm FIFO processing continues.

**Git commit:** `feat(queue): implement safe task cancellation`

### C02 — Implement Queue Disposal and Race-Condition Guards

**Objective:** Ensure queue shutdown is safe during asynchronous operations.

**Expected files:**
- `src/queue/AudioTaskQueue.ts`

**Prerequisites:** C01.

**Acceptance criteria:**
- Queue disposal cancels outstanding work.
- No new work is accepted after disposal.
- No task remains permanently pending.
- Late asynchronous results are ignored.
- Repeated disposal is safe.
- Task references and event listeners are released.
- Disposal does not create duplicate promise settlement.

**Verification:**
- Type-check and build.
- Dispose during active fetching.
- Dispose during decoding.
- Dispose with multiple pending tasks.
- Attempt enqueue after disposal.
- Check for unhandled rejections.

**Git commit:** `fix(queue): guard asynchronous races and disposal`

---

## Phase D — Web Audio Engine

### D01 — Implement AudioContext Lifecycle

**Objective:** Manage the creation, resume and final disposal of one owned AudioContext.

**Expected files:**
- `src/audio/AudioEngine.ts`

**Prerequisites:** A03, C02.

**Acceptance criteria:**
- AudioContext is created only when required.
- The engine reuses its owned context.
- Suspended context is resumed after permitted user interaction.
- No AudioContext is created on React rerender.
- Context ownership is explicit.
- Final disposal closes the context safely.
- Repeated disposal is safe.

**Verification:**
- Type-check and build.
- Test initial context creation.
- Test resume behavior.
- Confirm context reuse.
- Confirm final disposal.

**Git commit:** `feat(audio): manage AudioContext lifecycle`

### D02 — Implement AudioBuffer Playback

**Objective:** Play and stop decoded audio buffers using AudioBufferSourceNode.

**Expected files:**
- `src/audio/AudioEngine.ts`

**Prerequisites:** D01.

**Acceptance criteria:**
- Each playback uses a new AudioBufferSourceNode.
- Playback starts from a valid AudioBuffer.
- Stop interrupts the active source.
- Natural playback completion is handled.
- Old source nodes are never restarted.
- Repeated start/stop operations remain safe.
- Playback state transitions are consistent.

**Verification:**
- Type-check and build.
- Test repeated play and stop.
- Test natural playback completion.
- Test starting a new buffer after stopping.
- Check for invalid source-node operations.

**Git commit:** `feat(audio): implement buffer playback`

### D03 — Implement Audio Resource Cleanup

**Objective:** Prevent leaked AudioNodes and orphaned playback resources.

**Expected files:**
- `src/audio/AudioEngine.ts`

**Prerequisites:** D02.

**Acceptance criteria:**
- Active source nodes are stopped when necessary.
- AudioNode connections are disconnected.
- Ended-event handlers are released.
- Repeated cleanup does not throw errors.
- Obsolete playback callbacks cannot modify newer playback state.
- Final disposal releases engine-owned resources.

**Verification:**
- Type-check and build.
- Test cleanup during playback.
- Test cleanup after natural completion.
- Test repeated cleanup.
- Inspect DevTools for errors and retained resources.

**Git commit:** `fix(audio): clean up playback resources`

### D04 — Configure AnalyserNode and FFT

**Objective:** Connect real-time frequency analysis to playback.

**Expected files:**
- `src/audio/AudioEngine.ts`

**Prerequisites:** D03.

**Acceptance criteria:**
- AnalyserNode is correctly connected to the audio graph.
- FFT sizes 256 and 512 are supported.
- FFT 256 produces 128 frequency bins.
- FFT 512 produces 256 frequency bins.
- Changing FFT size updates the frequency buffer contract.
- The audio graph does not duplicate the output signal.
- Frequency data can be read without unnecessary per-frame allocations.

**Verification:**
- Type-check and build.
- Inspect FFT configuration.
- Verify `frequencyBinCount`.
- Play audio and inspect frequency data.
- Switch between FFT modes.

**Git commit:** `feat(audio): configure FFT analyser`

---

## Phase E — Canvas Frequency Visualizer

### E01 — Implement Canvas Frequency Bars

**Objective:** Render audio-frequency data as bars on a Canvas 2D surface.

**Expected files:**
- `src/visualizer/CanvasVisualizer.ts`

**Prerequisites:** D04.

**Acceptance criteria:**
- Draws frequency bars using Canvas 2D.
- Supports both FFT configurations.
- Clears and redraws frames correctly.
- Reuses frequency buffers where appropriate.
- Does not require raw FFT data in React state.
- Separates rendering from scheduling.

**Verification:**
- Type-check and build.
- Test drawing with controlled frequency data.
- Verify bar counts and bounds.
- Confirm both FFT modes render safely.

**Git commit:** `feat(visualizer): render frequency bars`

### E02 — Implement requestAnimationFrame Lifecycle

**Objective:** Control the visualizer animation loop safely.

**Expected files:**
- `src/visualizer/CanvasVisualizer.ts`

**Prerequisites:** E01.

**Acceptance criteria:**
- Uses `requestAnimationFrame`.
- Starts one animation loop per visualizer instance.
- Repeated start calls do not create duplicate loops.
- Stop cancels the scheduled animation frame.
- Disposal prevents future rendering.
- No React state update occurs for every animation frame.

**Verification:**
- Type-check and build.
- Test start/stop cycles.
- Count scheduled animation loops.
- Test repeated start.
- Confirm no frames continue after disposal.

**Git commit:** `feat(visualizer): manage animation lifecycle`

### E03 — Implement Responsive Canvas Sizing

**Objective:** Ensure correct rendering across viewport sizes and display densities.

**Expected files:**
- `src/visualizer/CanvasVisualizer.ts`

**Prerequisites:** E02.

**Acceptance criteria:**
- Canvas respects CSS display size.
- Handles viewport and container resizing.
- Accounts for devicePixelRatio appropriately.
- Avoids distorted rendering.
- Releases resize observers or listeners on disposal.
- Works at 375px viewport width.

**Verification:**
- Type-check and build.
- Resize browser window.
- Test mobile viewport.
- Check high-DPI rendering.
- Verify resize cleanup.

**Git commit:** `feat(visualizer): support responsive canvas sizing`

---

## Phase F — React Integration and Interface

### F01 — Integrate Queue, Audio Engine and Visualizer

**Objective:** Connect independent engine modules to the React application.

**Expected files:**
- `src/hooks/useAudioController.ts`
- `src/App.tsx`

**Prerequisites:** C02, D04, E03.

**Acceptance criteria:**
- React can enqueue audio requests.
- Decoded AudioBuffers reach the playback engine.
- Visualizer reads from the analyser.
- Engine instances are not recreated on each render.
- React component unmount triggers resource cleanup.
- Asynchronous completions cannot update unmounted components.
- High-frequency FFT data bypasses React state.

**Verification:**
- Type-check and build.
- Load and play an approved demo audio source.
- Test unmount during active processing.
- Confirm no duplicate AudioContext or animation loops.

**Git commit:** `feat(react): integrate audio processing pipeline`

### F02 — Implement Audio Control Interface

**Objective:** Provide accessible controls for loading, playing, stopping and canceling audio.

**Expected files:**
- `src/App.tsx`

**Prerequisites:** F01.

**Acceptance criteria:**
- Users can submit supported track URLs.
- Users can request multiple audio tasks.
- Play and stop controls work.
- Pending and active requests can be canceled.
- Queue and playback statuses are visible.
- Errors are displayed clearly.
- UI actions follow the engine lifecycle.

**Verification:**
- Type-check and build.
- Test repeated queue submissions.
- Test load, play, stop and cancel.
- Test invalid URLs.
- Confirm UI status matches actual engine behavior.

**Git commit:** `feat(ui): implement audio controls`

### F03 — Implement FFT Selection and Status Display

**Objective:** Allow users to switch FFT sizes and inspect meaningful system states.

**Expected files:**
- `src/App.tsx`

**Prerequisites:** F02.

**Acceptance criteria:**
- FFT 256 and 512 are selectable.
- The selected value matches analyser configuration.
- Frequency bin count is displayed accurately.
- Loading, playback, cancellation, completion and error states are understandable.
- State changes do not trigger per-frame React rerenders.

**Verification:**
- Type-check and build.
- Switch FFT during playback.
- Confirm correct bin counts.
- Inspect React rendering behavior.

**Git commit:** `feat(ui): add FFT selection and status`

### F04 — Implement Accessible Semantic Interface

**Objective:** Ensure the interface supports semantic HTML and keyboard interaction.

**Expected files:**
- `src/App.tsx`
- `src/index.css`

**Prerequisites:** F03.

**Acceptance criteria:**
- Exactly one primary h1.
- Semantic header, main and section structure.
- Form inputs have accessible labels.
- Native buttons support keyboard activation.
- Keyboard shortcuts, if present, use modern KeyboardEvent APIs.
- Status and error messages are accessible.
- Visible focus indicators are implemented.
- Color contrast targets WCAG 2.2 AA.

**Verification:**
- Type-check and build.
- Navigate using Tab, Enter and Space.
- Check labels and focus states.
- Inspect browser accessibility tree.
- Test screen-reader-friendly status messages.

**Git commit:** `feat(a11y): improve semantic audio interface`

### F05 — Implement Responsive Styling

**Objective:** Deliver a usable interface on desktop and mobile.

**Expected files:**
- `src/index.css`

**Prerequisites:** F04.

**Acceptance criteria:**
- Uses CSS custom properties.
- Applies a global box-sizing reset.
- Supports 375px mobile viewport.
- Avoids horizontal page overflow.
- Uses Flexbox and CSS Grid appropriately.
- Controls remain usable on narrow screens.
- Respects reduced-motion preferences where applicable.
- Does not introduce prohibited CSS frameworks.

**Verification:**
- Type-check and build.
- Test viewport widths of 375px, 768px and 1440px.
- Inspect overflow and control spacing.
- Test keyboard focus visibility.

**Git commit:** `style: implement responsive audio interface`

---

## Phase G — Automated Verification

### G01 — Establish Test Infrastructure

**Objective:** Configure lightweight testing for TypeScript modules.

**Expected files:**
- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/test/setup.ts`

**Prerequisites:** F05.

**Acceptance criteria:**
- Test runner is configured.
- Tests can execute independently of browser UI where practical.
- Browser APIs can be mocked when needed.
- Existing development and build commands remain functional.
- No unnecessary testing dependencies are introduced.

**Verification:**
- Install approved development dependencies.
- Run the configured test command.
- Run TypeScript verification.
- Run the production build.

**Git commit:** `test: configure test infrastructure`

### G02 — Test FIFO Queue and Cancellation

**Objective:** Verify queue ordering, concurrency, cancellation and failure recovery.

**Expected files:**
- `src/queue/AudioTaskQueue.test.ts`

**Prerequisites:** G01, C02.

**Acceptance criteria:**
- FIFO execution order is tested.
- Multiple simultaneous enqueue calls are tested.
- Single active worker is verified.
- Fetch failures do not block subsequent tasks.
- Decode failures do not block subsequent tasks.
- Queued and active cancellation are tested.
- Cancellation during decoding is tested.
- Disposal settles outstanding tasks.
- No promise remains permanently pending.

**Verification:**
- Run the queue test file.
- Check all assertions.
- Inspect rejected-promise handling.
- Run TypeScript verification and build.

**Git commit:** `test(queue): verify FIFO and cancellation`

### G03 — Test Audio Engine Lifecycle

**Objective:** Verify Web Audio resource handling and playback behavior.

**Expected files:**
- `src/audio/AudioEngine.test.ts`

**Prerequisites:** G01, D04.

**Acceptance criteria:**
- AudioContext creation and reuse are tested.
- Context resume behavior is tested.
- Playback start and stop are tested.
- Natural completion is tested.
- AudioNode disconnection is tested.
- FFT 256/512 configuration is tested.
- Disposal is tested.
- Repeated cleanup is tested.
- Stale playback callbacks are safely handled.

**Verification:**
- Run audio engine tests with Web Audio mocks.
- Inspect lifecycle assertions.
- Run TypeScript verification and build.

**Git commit:** `test(audio): verify playback lifecycle`

### G04 — Test Visualizer and React Integration

**Objective:** Verify rendering lifecycle and end-to-end component interactions.

**Expected files:**
- `src/visualizer/CanvasVisualizer.test.ts`
- `src/App.test.tsx`
- `package.json`
- `package-lock.json`
- `src/test/setup.ts`

**Prerequisites:** G01, G02, G03, F05.

**Acceptance criteria:**
- Canvas drawing behavior is tested.
- FFT buffer changes are tested.
- Animation start/stop behavior is tested.
- Duplicate loops are prevented.
- Canvas resizing is tested.
- UI actions call the appropriate engine methods.
- Component unmount triggers cleanup.
- Stale asynchronous results do not update unmounted UI.
- Failed audio requests do not prevent later valid requests.

**Verification:**
- Run visualizer and React integration tests.
- Run the full test suite.
- Run TypeScript verification and build.

**Git commit:** `test(integration): verify visualizer and React lifecycle`

---

## Phase H — Quality Audit and Submission

### H01 — Audit Memory and Resource Safety

**Objective:** Detect and resolve resource leaks and lifecycle problems.

**Expected files:**
- `docs/MEMORY_AUDIT.md`
- Relevant source files only if a verified defect requires a fix.

**Prerequisites:** G04.

**Acceptance criteria:**
- Repeated playback is inspected.
- Repeated cancellation is inspected.
- Queue disposal is inspected.
- React unmount during playback is inspected.
- AudioContext and AudioNode lifecycles are reviewed.
- Animation frame cancellation is verified.
- Event listener cleanup is verified.
- No known unresolved memory leak remains.
- Findings are documented using actual evidence.

**Verification:**
- Use Chrome DevTools Memory and Performance panels.
- Repeat load, play, stop and cancel operations.
- Compare resource retention across repeated cycles.
- Run automated tests and build after any fixes.

**Git commit:** `test(memory): audit audio resource cleanup`

### H02 — Audit Visualizer Performance

**Objective:** Evaluate the 60 FPS target and absence of React state thrashing.

**Expected files:**
- `docs/PERFORMANCE_AUDIT.md`
- Relevant visualizer or UI source files only if measured issues require fixes.

**Prerequisites:** H01.

**Acceptance criteria:**
- FPS is measured using browser profiling.
- Both FFT configurations are profiled.
- Duplicate animation loops are ruled out.
- React rendering frequency is inspected.
- Avoidable per-frame allocations are reviewed.
- Performance bottlenecks are documented.
- Results are reported without inventing measurements.

**Verification:**
- Record Chrome DevTools Performance traces.
- Test FFT 256 and FFT 512.
- Inspect React Profiler where available.
- Document observed FPS and bottlenecks.
- Rerun tests and build after any fixes.

**Git commit:** `perf: audit frequency visualizer performance`

### H03 — Document Three Genuine AI Failure Cases

**Objective:** Produce the required AI failure audit with three real defects.

**Expected files:**
- `docs/AI_FAILURE_AUDIT.md`

**Prerequisites:** G04 and available genuine defect evidence.

**Acceptance criteria:**
- Exactly three genuine AI-generated defects are documented.
- Each defect includes ID and description.
- Incorrect code or behavior is recorded.
- Root cause is explained.
- Reproduction steps are provided.
- Test or DevTools evidence is included.
- Corrective implementation is described.
- Verification result is recorded.
- No defect or verification result is fabricated.

**Verification:**
- Compare audit entries with actual Git history, tests and captured evidence.
- Reproduce each defect where practical.
- Confirm corresponding fixes exist and have been tested.
- If fewer than three genuine defects have been observed, mark the requirement incomplete rather than inventing cases.

**Git commit:** `docs: document three AI failure cases`

### H04 — Prepare Oral Defense Documentation

**Objective:** Prepare concise explanations and demonstrations of the implementation.

**Expected files:**
- `docs/ORAL_DEFENSE.md`

**Prerequisites:** H02, H03.

**Acceptance criteria:**
- FIFO and single-worker concurrency are explained.
- Promise, async/await and event loop behavior are explained.
- AbortController cancellation is explained.
- Non-abortable decoding behavior is explained.
- AudioContext and playback lifecycle are explained.
- FFT 256/512 and frequency bins are explained.
- Canvas and requestAnimationFrame are explained.
- Race conditions and cleanup strategies are explained.
- React lifecycle and state-thrashing avoidance are explained.
- Common live modification questions are included.

**Verification:**
- Practice explaining each subsystem without reading code.
- Demonstrate FIFO requests.
- Demonstrate cancellation.
- Demonstrate FFT switching.
- Demonstrate resource cleanup.

**Git commit:** `docs: prepare homework2 oral defense`

### H05 — Final Verification and Submission Readiness

**Objective:** Validate the complete homework before submission.

**Expected files:**
- `docs/FINAL_VERIFICATION.md`
- `README.md`

**Prerequisites:** H01, H02, H03, H04.

**Acceptance criteria:**
- All mandatory instructor requirements are reviewed.
- Full test suite passes.
- TypeScript verification passes.
- Production build succeeds.
- FIFO and concurrency behavior are verified.
- Cancellation and cleanup are verified.
- FFT 256/512 behavior is verified.
- Canvas visualization operates correctly.
- Accessibility and responsive behavior are checked.
- Performance measurements are documented.
- Three genuine AI defects are documented.
- Git history demonstrates atomic development.
- README includes setup, usage, test and build instructions.
- No known blocking issue remains.

**Verification:**
- Run `npx tsc -b --noEmit`.
- Run the configured full test command.
- Run `npm run build`.
- Run `npm run dev`.
- Perform final browser acceptance testing.
- Run `git status`.
- Run `git log --oneline`.
- Verify that all acceptance evidence has been recorded.

**Git commit:** `docs: finalize homework2 verification and README`

---

# 4. Dependency Overview

```text
P01 Working Agreement
        |
P02 Task Decomposition
        |
A01 Project Initialization
        |
A02 Architecture
        |
A03 TypeScript Contracts
        |
B01 FIFO Scheduling
        |
B02 Audio Fetching
        |
B03 Audio Decoding
        |
B04 Queue Integration
        |
C01 Cancellation
        |
C02 Concurrency Safety and Disposal
        |
D01 AudioContext
        |
D02 Playback
        |
D03 Resource Cleanup
        |
D04 AnalyserNode and FFT
        |
E01 Canvas Rendering
        |
E02 Animation Lifecycle
        |
E03 Responsive Canvas
        |
F01 React Integration
        |
F02 Audio Controls
        |
F03 FFT Selection
        |
F04 Accessibility
        |
F05 Responsive Styling
        |
G01 Test Infrastructure
        |
G02 Queue Tests
        |
G03 Audio Tests
        |
G04 Integration Tests
        |
H01 Memory Audit
        |
H02 Performance Audit
        |
H03 AI Failure Audit
        |
H04 Oral Defense
        |
H05 Final Verification
```

The diagram represents the recommended execution order. Explicit prerequisites in individual tasks define the actual dependency requirements.

---

# 5. Global Verification Commands

Run commands manually from the project root using Windows PowerShell.

### TypeScript verification

```powershell
npx tsc -b --noEmit
```

### Production build

```powershell
npm run build
```

### Development server

```powershell
npm run dev
```

### Automated tests (after G01)

```powershell
npm run test
```

### Git inspection

```powershell
git status
git diff --check
git log --oneline
```

**Note:** Test commands must match the actual scripts configured in `package.json`. Nothing is considered verified until the developer executes the corresponding command.

---

# 6. Definition of Done

- [ ] Typed AudioTask contracts implemented.
- [ ] FIFO execution verified.
- [ ] Single active queue worker verified.
- [ ] Audio fetch and decoding work.
- [ ] AbortController cancellation verified.
- [ ] Canceled tasks cannot later resolve successfully.
- [ ] Queue failures do not block later tasks.
- [ ] Queue disposal settles outstanding work.
- [ ] AudioContext lifecycle verified.
- [ ] AudioBufferSourceNode cleanup verified.
- [ ] AnalyserNode connected correctly.
- [ ] FFT 256 produces 128 bins.
- [ ] FFT 512 produces 256 bins.
- [ ] Canvas visualization works.
- [ ] requestAnimationFrame lifecycle verified.
- [ ] No duplicate animation loops.
- [ ] No per-frame React FFT state updates.
- [ ] Keyboard accessibility verified.
- [ ] Responsive UI verified.
- [ ] Automated tests pass.
- [ ] Memory audit completed.
- [ ] 60 FPS target evaluated with actual profiling.
- [ ] Three genuine AI failures documented.
- [ ] Oral defense prepared.
- [ ] Production build succeeds.
- [ ] Git history reviewed.
- [ ] Final verification completed.

**Important:** Each checkbox may be marked complete only after the corresponding implementation and verification evidence exists.

---

# 7. Task Execution Policy

For every future task:

1. Reference the approved task ID.
2. Review its prerequisites.
3. Define or confirm its contract.
4. Implement only the authorized responsibility.
5. Provide complete code for every modified file.
6. Developer copies the code into VS Code.
7. Developer independently runs verification.
8. Developer reports results.
9. Commit only after successful verification.
10. Proceed to another task only when explicitly requested.

**Current status:** WBS proposed, awaiting developer review and approval.

**Next planned implementation task:** A01 — Initialize React + TypeScript + Vite Project.