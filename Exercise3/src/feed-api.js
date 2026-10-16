/**
 * Exercise 3 - T-02: Simulated feed API (no network, no external service)
 * @typedef {import("./view-state.js").FeedItem} FeedItem
 */

const FEED = Object.freeze([
  {
    id: "vdom",
    title: "Virtual DOM nodes are plain objects",
    summary: "A VNode is { type, props, children } with no prototype chain.",
  },
  {
    id: "hooks",
    title: "Hooks depend on call order",
    summary: "useState reads its slot by cursor index, so hooks stay at the top level.",
  },
  {
    id: "fsm",
    title: "One status instead of many booleans",
    summary: "IDLE, LOADING, SUCCESS and ERROR can never be active at the same time.",
  },
  {
    id: "xss",
    title: "<img src=x onerror=alert(1)>",
    summary: "This title is an XSS probe. It must appear as plain text.",
  },
]);

const MODES = new Set(["success", "empty", "error"]);

/**
 * Resolve with feed items after `delayMs`, or reject to simulate a failure.
 * mode: "success" (all items) | "empty" ([]) | "error" (rejects with Error).
 * @returns {Promise<FeedItem[]>}
 */
export async function fetchFeed({ mode = "success", delayMs = 800 } = {}) {
  if (!MODES.has(mode)) {
    throw new TypeError(`Unknown feed mode: ${mode}`);
  }

  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new TypeError("delayMs must be a non-negative number");
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (mode === "error") {
    // Technical detail for the console only; the UI shows a fixed message (F8).
    throw new Error("Simulated network failure (HTTP 503)");
  }

  // Fresh copies, so a caller can never change the source data.
  return mode === "empty" ? [] : FEED.map((item) => ({ ...item }));
}
