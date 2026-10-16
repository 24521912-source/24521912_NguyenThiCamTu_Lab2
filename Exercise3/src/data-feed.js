/**
 * Exercise 3 - T-03 / T-04 / T-05: Multi-state DataFeed component
 */

import { createElement } from "./mini-react.js";
import { useState } from "./reactive-engine.js";
import { STATUS, INITIAL_STATE } from "./view-state.js";
import { fetchFeed } from "./feed-api.js";
import { loadFeed } from "./feed-loader.js";

// Same count as the real feed, so the swap to data barely shifts the layout.
const SKELETON_ROWS = 4;

const MODES = [
  { value: "success", label: "Success" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Network error" },
];

// One button (#feed-action) in every state, so renderApp can keep focus on it.
const ACTION_LABEL = {
  [STATUS.IDLE]: "Load feed",
  [STATUS.LOADING]: "Loading…",
  [STATUS.SUCCESS]: "Reload feed",
  [STATUS.ERROR]: "Retry Connection",
};

function statusText(state) {
  switch (state.status) {
    case STATUS.LOADING:
      return "Loading feed…";
    case STATUS.SUCCESS:
      return state.data.length === 0
        ? "Feed loaded. There are no articles yet."
        : `Feed loaded: ${state.data.length} articles.`;
    case STATUS.ERROR:
      return "Feed could not be loaded.";
    default:
      return "Feed not loaded yet. Select Load feed to start.";
  }
}

// T-03: decorative placeholder, hidden from assistive technology.
function Skeleton() {
  return createElement(
    "ul",
    { className: "feed-list skeleton", "aria-hidden": "true" },
    Array.from({ length: SKELETON_ROWS }, () =>
      createElement(
        "li",
        { className: "card" },
        createElement("span", { className: "skeleton__line skeleton__line--title" }),
        createElement("span", { className: "skeleton__line" }),
        createElement("span", { className: "skeleton__line skeleton__line--short" })
      )
    )
  );
}

// T-04: real data, text only through text nodes.
function FeedList({ items }) {
  if (items.length === 0) {
    return createElement("p", { className: "empty" }, "No articles to show yet.");
  }

  return createElement(
    "ul",
    { className: "feed-list" },
    items.map((item) =>
      createElement(
        "li",
        { "data-id": item.id },
        createElement(
          "article",
          { className: "card" },
          createElement("h3", { className: "card__title" }, item.title),
          createElement("p", { className: "card__summary" }, item.summary)
        )
      )
    )
  );
}

// T-05: human-readable error; the Retry Connection button follows it.
function ErrorMessage({ message }) {
  return createElement(
    "div",
    { className: "error", role: "alert" },
    createElement("h3", { className: "error__title" }, "Connection problem"),
    createElement("p", null, message)
  );
}

function FeedBody(state) {
  switch (state.status) {
    case STATUS.LOADING:
      return Skeleton();
    case STATUS.SUCCESS:
      return FeedList({ items: state.data });
    case STATUS.ERROR:
      return ErrorMessage({ message: state.error });
    default:
      return null;
  }
}

export function DataFeed() {
  // Hooks at the top level, same order every render.
  const [state, setState] = useState(INITIAL_STATE);
  const [mode, setMode] = useState("success");

  const isLoading = state.status === STATUS.LOADING;
  const load = () => loadFeed(state, setState, () => fetchFeed({ mode }));

  return createElement(
    "main",
    { className: "app-container", "data-status": state.status },
    createElement(
      "header",
      { className: "app-header" },
      createElement("h1", null, "Learning Feed"),
      createElement(
        "p",
        { className: "lead" },
        "Async data with one state machine: IDLE, LOADING, SUCCESS or ERROR."
      )
    ),
    createElement(
      "section",
      { className: "panel", "aria-labelledby": "mode-title" },
      createElement("h2", { id: "mode-title" }, "Simulated server response"),
      createElement(
        "div",
        { className: "filters", role: "group", "aria-labelledby": "mode-title" },
        MODES.map(({ value, label }) =>
          createElement(
            "button",
            {
              id: `mode-${value}`,
              type: "button",
              "aria-pressed": String(mode === value),
              onClick: () => setMode(value),
            },
            label
          )
        )
      )
    ),
    createElement(
      "section",
      { className: "panel", "aria-labelledby": "feed-title" },
      createElement("h2", { id: "feed-title" }, "Feed"),
      createElement("p", { className: "status", role: "status" }, statusText(state)),
      createElement(
        "div",
        { className: "feed-body", "aria-busy": String(isLoading) },
        FeedBody(state)
      ),
      createElement(
        "button",
        {
          id: "feed-action",
          type: "button",
          className: "primary",
          // aria-disabled keeps the button focusable; loadFeed ignores it while LOADING.
          "aria-disabled": String(isLoading),
          onClick: load,
        },
        ACTION_LABEL[state.status]
      )
    )
  );
}
