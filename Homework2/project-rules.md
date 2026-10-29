# PROJECT RULES — HOMEWORK 2
## Concurrent FIFO Audio Visualizer Queue Engine

**Course:** Web Application Development 2026 — UIT, VNU-HCM  
**Assignment:** Lab 02 — Homework 2  
**Architecture:** React + TypeScript + Vite + Web Audio API  
**Methodology:** Contract-First Development, Atomic AI Generation, Independent Verification

---

# 1. PROJECT OBJECTIVE

Build a concurrent-request-safe FIFO audio processing engine with real-time audio frequency visualization.

The project must support:

- Web Audio API playback and audio analysis.
- `AnalyserNode` with FFT size 256 or 512.
- FIFO queue for audio download and decoding tasks.
- Safe asynchronous concurrency management.
- `AbortController` cancellation.
- Explicit audio resource cleanup.
- Canvas or SVG visualization.
- `requestAnimationFrame` animation loop.
- 60 FPS performance target.
- Prevention of state thrashing and memory leaks.

This project is based on Homework 2 of Lab 02.

Lab 1 provides foundational HTML, CSS, JavaScript, security, accessibility, Git, and AI engineering constraints.

Do not confuse Lab 1 Homework 2 (Drum Kit Engine) with Lab 2 Homework 2 (Concurrent FIFO Audio Visualizer Queue Engine).

---

# 2. CRITICAL AI OPERATING MODE

## 2.1 Copy-Paste Code Generation Only

The AI is a code author, not a local file-editing agent.

**The user manually creates and edits all files on their Windows computer.**

The AI MUST:

1. Generate complete source code directly in the conversation.
2. State the exact relative file path before every code block.
3. Provide the full content of every new or modified file.
4. Ensure each file can be copied without filling in missing implementation details.
5. Explain how the user should create and save the file in VS Code.
6. Provide exact terminal commands for manual execution.
7. Provide expected output and verification instructions.
8. Explain important code sections in Vietnamese.
9. Stop after the current authorized task.

The AI MUST NOT:

- Create files in its own sandbox.
- Modify files on the user's computer.
- Access the user's local filesystem.
- Execute terminal commands on behalf of the user.
- Install dependencies.
- Initialize or modify Git repositories.
- Create downloadable project archives.
- Claim that it has run tests or builds.
- Claim that a commit has been created.
- Request uploaded Lab 1 or Lab 2 PDF documents.
- Invent missing implementation results.

When code is necessary, provide actual code, not merely implementation descriptions.

## 2.2 Files and Code Output

For each source file, follow this output structure:

**File:** `exact/relative/path.ext`

Then provide one complete code block containing its full contents.

For existing files, output the complete revised file unless the user explicitly requests a minimal patch.

Never use:

- `// TODO: implement`
- `// existing code here`
- `// rest remains unchanged`
- `...` as a placeholder for omitted code
- Pseudocode in place of executable implementation

The final answer must be independently usable for manual copy-paste.

## 2.3 No PDF Access

The AI receives the necessary instructor requirements as text in the prompts.

Never request or attempt to read the original Lab 1 or Lab 2 documents.

Do not claim to have consulted them directly.

---

# 3. ATOMIC AI WORKFLOW

Follow the mandatory four-stage engineering workflow.

## Stage 1 — Functional Slicing

Break the homework into small, independent tasks.

Each task must have:

- A unique task ID.
- One objective.
- Required inputs.
- Expected outputs.
- Dependencies.
- Acceptance criteria.
- Verification instructions.
- Suggested Git commit.

## Stage 2 — Contract-First Specification

Before implementation, define the contract for the current function, class, or component.

Clarify:

- Input types.
- Return types.
- State ownership.
- Error handling.
- Lifecycle.
- Cancellation semantics.
- Resource ownership.
- Observable side effects.

## Stage 3 — Atomic Generation

**ONE PROMPT = ONE ATOMIC TASK.**

Do not generate the entire application in one response.

Do not implement future tasks in advance.

Do not combine unrelated features to reduce the number of prompts.

A task may require more than one file only if each file is necessary for that single responsibility.

## Stage 4 — Independent Verification

For every completed task, provide:

1. TypeScript verification commands.
2. Build commands.
3. Relevant manual or automated test instructions.
4. Expected results.
5. Possible failure symptoms.
6. Git inspection commands.
7. An atomic commit message.

The AI must not claim a test has passed before the user reports the actual result.

---

# 4. SOURCE OF TRUTH

Apply the following priority:

1. Instructor requirements explicitly provided by the user.
2. Approved task-specific contracts.
3. These project rules.
4. Approved `TASK_DECOMPOSITION.md`.
5. Engineering recommendations.

Separate:

- MANDATORY: Explicit instructor requirements.
- DESIGN DECISION: Approved implementation choices.
- OPTIONAL: Additional improvements.

Never invent grading requirements.

---

# 5. TECHNOLOGY STACK

## 5.1 Approved Stack

Use:

- React functional components.
- TypeScript.
- Vite.
- Semantic HTML5.
- Modern CSS3.
- Vanilla JavaScript ES6+ APIs.
- Web Audio API.
- Canvas 2D API by default.
- Native `fetch`.
- `AbortController` and `AbortSignal`.
- `requestAnimationFrame`.
- Git.

Canvas 2D is the selected implementation approach for the visualizer. SVG is an acceptable instructor-supported alternative but should not be implemented simultaneously without justification.

## 5.2 Forbidden Dependencies

Do not introduce:

- jQuery.
- Bootstrap.
- Tailwind CSS.
- Third-party audio player engines.
- Third-party queue libraries.
- Third-party visualizer libraries.
- Heavy UI frameworks.
- Unnecessary external script CDNs.

React and Vite are approved project infrastructure, not substitutes for understanding native browser APIs.

Testing tools may be recommended separately when necessary.

---

# 6. MANDATORY ARCHITECTURE

Separate the system into:

1. TypeScript contracts.
2. FIFO queue controller.
3. Audio download and decoding logic.
4. Web Audio playback lifecycle.
5. FFT analysis.
6. Canvas visualization.
7. React interface and controls.
8. Testing and verification.

Do not place the entire queue, audio engine, and animation loop inside one React component.

The processing engine must work independently of React rendering.

### 6.1 Single Responsibility

Every module should have one clear responsibility.

Examples:

- Queue controller schedules asynchronous tasks.
- Audio service owns Web Audio resources.
- Visualizer reads frequency data and renders frames.
- React manages user interaction and high-level UI state.

### 6.2 Resource Ownership

Every allocated resource must have a clearly defined owner responsible for its cleanup.

Do not allow multiple components to independently own the same AudioContext or animation loop without an explicit contract.

---

# 7. AUDIO TASK QUEUE CONTRACT

The instructor provides the following architectural baseline:

```typescript
export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;

  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    const controller = new AbortController();

    return new Promise((resolve, reject) => {
      this.queue.push({
        trackUrl,
        controller,
        resolve,
        reject
      });

      this.processNext();
    });
  }
}
```

This is a partial instructor example, not a complete implementation.

The remaining `AudioTask` contract and queue processing logic must be defined during the appropriate atomic tasks.

## 7.1 FIFO Ordering

Tasks must follow first-in, first-out processing order.

A later task must not overtake an earlier task in the approved queue execution model.

## 7.2 Concurrency Safety

Although multiple tasks can be requested concurrently, the core queue will use a single active FIFO worker unless an explicitly approved contract changes the model.

The queue must prevent accidental overlapping processing caused by repeated calls to `processNext()`.

## 7.3 Task Settlement

Every enqueued promise must eventually:

- Resolve with an AudioBuffer; or
- Reject with an appropriate error.

No cancellation, fetch failure, or decoding failure may leave an enqueued promise permanently pending.

## 7.4 Error Isolation

One failed task must not permanently block later valid tasks.

Use a reliable `try` / `catch` / `finally` lifecycle.

Do not silently swallow errors.

---

# 8. CANCELLATION CONTRACT

Use `AbortController` and `AbortSignal`.

The design must distinguish:

- Cancellation before processing begins.
- Cancellation during fetch.
- Cancellation during decoding.
- Cancellation after successful completion.
- Cancellation during playback.

## 8.1 Cancellation Semantics

- A queued task canceled before activation must not start downloading.
- An active fetch must receive the corresponding AbortSignal.
- A canceled task must not resolve successfully afterward.
- Cancellation must not leave the queue blocked.
- The next valid task should continue processing according to FIFO order.

## 8.2 Non-Abortable Operations

Do not assume that `decodeAudioData()` is natively abortable by AbortSignal.

If cancellation occurs during decoding, the application must safely discard the result when decoding completes or handle cancellation according to the approved contract.

Never claim that AbortController can directly interrupt an operation that does not support AbortSignal.

## 8.3 Cancellation and Cleanup

Canceling an operation must not cause:

- Unhandled promise rejections.
- Dangling tasks.
- Leaked event listeners.
- Duplicate promise settlement.
- Accidental execution of canceled work.

---

# 9. WEB AUDIO API REQUIREMENTS

Use native Web Audio API.

Relevant browser primitives include:

- `AudioContext`.
- `AudioBuffer`.
- `AudioBufferSourceNode`.
- `AnalyserNode`.
- `GainNode` when necessary.
- `decodeAudioData()`.
- `createBufferSource()`.
- `createAnalyser()`.

## 9.1 AudioContext Lifecycle

- Create the AudioContext only when necessary.
- Respect browser autoplay restrictions.
- Resume a suspended AudioContext after an appropriate user interaction.
- Avoid creating a new AudioContext on each React render.
- Close the AudioContext during final disposal.

## 9.2 Playback Lifecycle

- Create a new AudioBufferSourceNode for each playback.
- Do not attempt to restart a previously started source node.
- Stop active playback when required.
- Disconnect nodes when they are no longer needed.
- Handle natural playback completion.
- Avoid duplicated or orphaned connections.

## 9.3 Audio Graph

The graph should follow an approved, explainable design such as:

AudioBufferSourceNode → AnalyserNode → AudioContext.destination

Optional GainNode usage must be justified.

Avoid duplicate audio paths that produce unintended amplification.

---

# 10. FFT AND FREQUENCY ANALYSIS

Use `AnalyserNode`.

## 10.1 Required FFT Settings

Support the instructor's FFT sizes:

- 256
- 512

Remember:

`frequencyBinCount = fftSize / 2`

Therefore:

- FFT 256 produces 128 frequency bins.
- FFT 512 produces 256 frequency bins.

Do not confuse `fftSize` with `frequencyBinCount`.

## 10.2 Frequency Data

Use a reusable TypedArray buffer suitable for the selected analyser method.

Prefer `getByteFrequencyData()` for a simple frequency-bar visualizer.

Do not allocate a new large array on every animation frame unnecessarily.

## 10.3 FFT Configuration

Ensure that:

- Changing FFT size updates the analysis buffer.
- Array dimensions remain valid.
- Visualization scales appropriately.
- No stale buffer causes out-of-range access.
- The chosen size is reflected accurately in the UI.

---

# 11. VISUALIZER PERFORMANCE

The instructor requires a visualizer targeting 60 FPS using Canvas or SVG and `requestAnimationFrame`.

## 11.1 Rendering Loop

- Use one controlled requestAnimationFrame loop per active visualizer.
- Store and cancel the animation frame identifier.
- Stop scheduling frames when visualization is inactive or disposed.
- Avoid creating multiple loops accidentally.

## 11.2 Avoid State Thrashing

Do not update React state with FFT data every animation frame.

High-frequency audio samples should be read and rendered directly through the rendering engine.

React state should be reserved for meaningful UI changes, such as:

- Playing.
- Paused.
- Loading.
- Canceled.
- Error.
- Selected FFT size.
- Queue status.

## 11.3 Canvas Requirements

- Render frequency bars clearly.
- Handle resizing.
- Account for devicePixelRatio where appropriate.
- Clear and redraw efficiently.
- Avoid unnecessarily expensive style/layout recalculation.
- Release the animation loop during cleanup.

## 11.4 Performance Verification

A 60 FPS target must be evaluated through actual browser profiling.

Do not claim stable 60 FPS solely because requestAnimationFrame is used.

---

# 12. AUDIO RESOURCE AND MEMORY SAFETY

Memory safety is a primary assignment requirement.

All resources must have explicit lifecycle handling.

## 12.1 Required Cleanup

Handle:

- Active AudioBufferSourceNodes.
- AudioNode connections.
- AudioContext disposal.
- requestAnimationFrame cancellation.
- AbortController cancellation.
- Queue settlement.
- Event listener cleanup.
- React component unmounting.

## 12.2 Idempotent Cleanup

Cleanup functions should be safe when called multiple times.

Stopping an already stopped node must not crash the application.

## 12.3 Leak Prevention

Do not:

- Create an AudioContext on every render.
- Start multiple uncontrolled animation loops.
- Retain unbounded resolved task references.
- Register listeners repeatedly without removal.
- Keep canceled tasks in the queue indefinitely.
- Store large AudioBuffers unnecessarily after their useful lifecycle.

---

# 13. SEMANTIC HTML AND ACCESSIBILITY

Apply the core Lab 1 engineering rules.

## 13.1 Semantic Structure

Use:

- `header`
- `main`
- `section`
- `button`
- `label`
- `select`
- `input`
- `output`
- Appropriate headings and status regions.

Use exactly one primary h1.

Provide a skip link if the page structure requires it.

Avoid unnecessary div-soup.

## 13.2 Keyboard Accessibility

Audio controls must work through native keyboard interaction.

Use:

- `keydown`
- `event.key`
- `event.repeat` when applicable.

Do not use:

- `keypress`
- `keyCode`
- Inline HTML event handlers.

Never interfere unnecessarily with native button behavior.

## 13.3 Accessible Status

Provide understandable status information for:

- Queue processing.
- Audio loading.
- Playback.
- Completion.
- Cancellation.
- Errors.

Do not rely only on animated frequency bars to communicate audio state.

## 13.4 Contrast and Focus

Target WCAG 2.2 AA.

Ensure:

- Sufficient color contrast.
- Visible focus indicators.
- Readable text.
- Accessible form labels.
- Clear error messages.
- Keyboard-operable controls.

---

# 14. CSS AND RESPONSIVE DESIGN

Use modern CSS.

## 14.1 Reset

Use a global box-sizing reset:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

## 14.2 Design Tokens

Use CSS custom properties in `:root` for:

- Backgrounds.
- Text colors.
- Accent colors.
- Borders.
- Spacing.
- Radius.
- Focus styles.

## 14.3 Responsive Design

Start from a 375px mobile viewport.

Use Flexbox and CSS Grid appropriately.

Avoid page-level horizontal overflow.

Ensure the visualizer and audio controls remain usable on narrow screens.

## 14.4 Animation Preferences

Respect `prefers-reduced-motion` where applicable.

Do not use unnecessary decorative animations.

---

# 15. SECURITY RULES

## 15.1 XSS

Never render untrusted strings using unsafe innerHTML.

Use safe React text rendering.

## 15.2 Track URLs

- Treat track URLs as untrusted inputs.
- Validate allowed URL formats.
- Do not assume remote URLs allow CORS.
- Handle network errors transparently.
- Do not embed secrets in frontend code.

Use approved demo audio resources only.

## 15.3 Browser Permissions

Do not bypass browser autoplay restrictions.

Do not introduce browser permission workarounds that weaken security.

## 15.4 Dependency Hygiene

Do not install unnecessary packages.

Do not introduce external audio infrastructure without justification.

---

# 16. TESTING REQUIREMENTS

Every core subsystem needs appropriate tests.

## 16.1 Queue Tests

Verify:

- FIFO order.
- Multiple concurrent enqueue calls.
- Single active worker.
- Successful resolution.
- Failed download recovery.
- Failed decode recovery.
- Queued task cancellation.
- Active task cancellation.
- Queue continuation after errors.
- Disposal of pending work.

## 16.2 Audio Tests

Verify:

- AudioContext creation.
- AudioContext resume.
- Buffer decoding.
- Playback start.
- Playback stop.
- Natural playback completion.
- Node disconnection.
- Resource disposal.

## 16.3 Visualizer Tests

Verify:

- FFT 256.
- FFT 512.
- Correct frequency bin count.
- Buffer resizing.
- Animation loop start.
- Animation loop stop.
- No duplicate animation loops.
- Canvas resizing.

## 16.4 Integration Tests

Verify:

- Queue → decoded buffer → playback → analyser → visualizer.
- Repeated play/stop.
- Cancellation followed by new playback.
- React component unmount during playback.
- Failed audio request followed by valid audio request.

## 16.5 Browser Tests

Use manual Chrome DevTools testing for:

- Console errors.
- Network cancellation.
- Performance profiling.
- FPS behavior.
- Memory growth.
- Detached nodes and event listeners.

If tests cannot be executed by the AI, provide commands and instructions for the user.

---

# 17. ATOMIC GIT COMMITS

Every task should have one logical commit after user verification.

Do not fabricate commits.

Suggested commit examples:

```text
docs(spec): define homework2 architecture and contracts
chore: initialize audio visualizer project
feat(queue): define typed audio tasks
feat(queue): implement FIFO scheduling
feat(queue): implement audio fetching
feat(queue): implement buffer decoding
feat(queue): implement cancellation
feat(audio): implement AudioContext lifecycle
feat(audio): implement buffer playback
feat(audio): implement resource cleanup
feat(audio): configure FFT analyser
feat(visualizer): implement Canvas frequency bars
feat(visualizer): manage animation lifecycle
feat(ui): implement accessible audio controls
test(queue): verify cancellation and FIFO behavior
test(audio): verify lifecycle cleanup
perf: verify visualizer performance
```

These are recommended commit names, not an instructor-provided exact list.

Each commit must contain only the actual changes belonging to its task.

---

# 18. AI FAILURE MODE AUDIT

Lab 2 requires an AI failure audit documenting three detected defects.

Record real defects only.

For every defect include:

1. Defect ID.
2. AI-generated incorrect code or behavior.
3. Root cause.
4. Reproduction steps.
5. DevTools or test evidence.
6. Corrective implementation.
7. Verification result.

Relevant defect categories may include:

- Race conditions.
- Unsettled queue promises.
- Failure to cancel active fetch.
- Stale decoding results.
- Multiple animation loops.
- Leaked AudioContext or AudioNodes.
- Missing cleanup after errors.
- Unhandled promise rejections.

Do not deliberately introduce defects simply to populate the report.

---

# 19. ORAL DEFENSE REQUIREMENTS

The developer must understand the implementation.

The AI should explain:

- FIFO data structure.
- Promise and async/await.
- Event loop.
- Race conditions.
- AbortController and AbortSignal.
- fetch lifecycle.
- AudioBuffer decoding.
- AudioContext.
- AudioBufferSourceNode.
- AnalyserNode.
- FFT and frequency bins.
- Canvas rendering.
- requestAnimationFrame.
- React lifecycle.
- useEffect cleanup.
- Memory leaks.
- Atomic Git commits.

For important functions, explain in Vietnamese:

1. What the code does.
2. How it works.
3. Why it is implemented that way.
4. What happens when it fails.
5. How to test it.
6. How to modify it during a live defense.

---

# 20. OUTPUT FORMAT FOR EVERY CODING TASK

Every implementation response must follow this structure:

## A. Task Identification

- Task ID.
- Objective.
- Dependencies.

## B. Files to Create or Modify

List exact relative file paths.

## C. Complete Source Code

Provide the full code for each file.

Do not omit code or use placeholder comments.

## D. Manual Instructions

Explain precisely where the user should create files and paste code in VS Code.

## E. Verification Commands

Provide exact commands for Windows PowerShell or the project's approved tooling.

Do not pretend these commands have been executed.

## F. Expected Results

Describe how the user can determine whether implementation succeeded.

## G. Git Commit

Provide commands for manually reviewing and committing the task after verification.

## H. Explanation

Explain the important implementation decisions and potential oral-defense questions in Vietnamese.

After completing this format, stop.

---

# 21. DEFINITION OF DONE

The homework is ready for submission only when:

- [ ] Typed FIFO AudioTask contract is implemented.
- [ ] AudioTaskQueue processes tasks in FIFO order.
- [ ] Concurrent enqueue calls do not cause overlapping queue workers.
- [ ] Audio downloads use the approved fetch workflow.
- [ ] Audio decoding uses Web Audio API.
- [ ] AbortController cancellation is handled correctly.
- [ ] Canceled tasks do not settle successfully afterward.
- [ ] Failed tasks do not block the queue.
- [ ] AudioBufferSourceNode lifecycle is correct.
- [ ] Active audio nodes are cleaned up.
- [ ] AudioContext lifecycle is managed.
- [ ] AnalyserNode is connected correctly.
- [ ] FFT size 256 is supported.
- [ ] FFT size 512 is supported.
- [ ] Frequency bin counts are correct.
- [ ] Canvas or SVG visualizer works.
- [ ] requestAnimationFrame loop is correctly controlled.
- [ ] No duplicate animation loop exists.
- [ ] React state is not updated with raw FFT data every frame.
- [ ] Audio controls are keyboard-accessible.
- [ ] Responsive layout is usable.
- [ ] Queue cancellation tests pass.
- [ ] Resource cleanup tests pass.
- [ ] Browser performance has been measured.
- [ ] No known memory leaks remain.
- [ ] AI failure audit contains three genuine, documented defects.
- [ ] Git history demonstrates atomic development.
- [ ] Production build succeeds.
- [ ] The developer can explain and modify the implementation.

Mark criteria as PASS only after the user provides actual verification evidence.

---

# 22. FINAL NON-NEGOTIABLE RULES

1. ONE PROMPT = ONE TASK.
2. CONTRACT FIRST.
3. WRITE FULL CODE DIRECTLY IN CHAT.
4. NEVER ACCESS OR MODIFY USER FILES.
5. NEVER EXECUTE LOCAL COMMANDS.
6. NEVER REQUEST LAB PDFs.
7. NEVER USE PLACEHOLDER CODE.
8. NEVER IMPLEMENT UNASSIGNED TASKS.
9. PRESERVE APPROVED CONTRACTS.
10. MAINTAIN FIFO ORDER AND CANCELLATION SAFETY.
11. CLEAN UP WEB AUDIO RESOURCES.
12. PREVENT RACE CONDITIONS AND MEMORY LEAKS.
13. DO NOT UPDATE REACT STATE EVERY ANIMATION FRAME.
14. PROVIDE MANUAL VERIFICATION INSTRUCTIONS.
15. NEVER FABRICATE TEST RESULTS.
16. USE ATOMIC GIT COMMITS.
17. EXPLAIN IMPORTANT CODE IN VIETNAMESE.
18. STOP AFTER THE AUTHORIZED TASK.

**Engineering principle:**

AI generates code. The developer verifies correctness and owns the final implementation.