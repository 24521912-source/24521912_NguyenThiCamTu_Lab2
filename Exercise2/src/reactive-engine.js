/**
 * Exercise 2 - Reactive State Engine
 * T-02: stateStore and resetCursor engine
 */

// One slot per useState call, in call order (module-private).
const stateStore = [];

// Index of the next slot a useState call will read.
let cursor = 0;

// Re-render callback registered by the app.
let triggerRender = () => {};

/**
 * T-02: Move the cursor back to slot 0 before every render pass.
 */
export function resetCursor() {
  cursor = 0;
}

/**
 * T-02: Register the function that re-renders the app.
 */
export function setRenderer(rerenderFn) {
  if (typeof rerenderFn !== "function") {
    throw new TypeError("Renderer must be a function");
  }

  triggerRender = rerenderFn;
}
