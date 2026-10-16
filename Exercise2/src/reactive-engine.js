/**
 * Exercise 2 - Reactive State Engine
 * T-02: stateStore and resetCursor engine
 * T-03: useState dispatcher
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

/**
 * T-03: Return [state, setState] for the slot at the current cursor.
 * Must be called at the top level of a component, in the same order every render.
 */
export function useState(initialValue) {
  // I3: the setter keeps this index, not the live cursor.
  const index = cursor;

  // I2: initialise only a slot that was never written,
  // so 0, false, "" and null are kept across renders.
  if (index >= stateStore.length) {
    stateStore[index] = initialValue;
  }

  const setState = (next) => {
    // I4: functional updater receives the latest stored value.
    const value =
      typeof next === "function" ? next(stateStore[index]) : next;

    // I5: same value, no write and no re-render.
    if (Object.is(stateStore[index], value)) {
      return;
    }

    // I6: write, then re-render once.
    stateStore[index] = value;
    triggerRender();
  };

  cursor++;

  return [stateStore[index], setState];
}
