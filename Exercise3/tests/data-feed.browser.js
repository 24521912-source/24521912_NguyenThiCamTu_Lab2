import { setupEventDelegation } from "../src/events.js";
import { renderApp } from "../src/reactive-engine.js";
import { DataFeed } from "../src/data-feed.js";
import { LOAD_ERROR_MESSAGE } from "../src/feed-loader.js";

export async function runDataFeedTests() {
  let passed = 0;

  function check(condition, message) {
    if (!condition) {
      throw new Error(`FAIL: ${message}`);
    }

    passed++;
    console.log(`PASS: ${message}`);
  }

  async function waitFor(predicate, message, timeoutMs = 5000) {
    const startedAt = Date.now();

    while (!predicate()) {
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`FAIL (timeout): ${message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  const root = document.createElement("section");
  document.body.append(root);
  setupEventDelegation(root);
  renderApp(DataFeed, root);

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => root.querySelectorAll(selector);
  const status = () => $("main").dataset.status;
  const action = () => $("#feed-action");

  // Exactly one view per state (no skeleton + error, no list + skeleton).
  function checkOnlyView(expected) {
    const views = {
      skeleton: $$(".skeleton").length,
      list: $$(".feed-list:not(.skeleton)").length + $$(".empty").length,
      error: $$("[role='alert']").length,
    };
    const shown = Object.keys(views).filter((key) => views[key] > 0);

    check(
      shown.join() === (expected ?? ""),
      `${status()}: only view shown is "${expected ?? "none"}" (got "${shown.join()}")`
    );
  }

  function clickAction() {
    action().focus();
    action().click();
  }

  // 1. IDLE
  check(status() === "IDLE", "Initial state is IDLE");
  check(action().textContent === "Load feed", "IDLE button reads Load feed");
  checkOnlyView(null);
  check($$("h1").length === 1, "Exactly one h1");

  // 2. IDLE -> LOADING
  clickAction();
  check(status() === "LOADING", "Load feed -> LOADING");
  checkOnlyView("skeleton");
  check($(".skeleton").getAttribute("aria-hidden") === "true", "Skeleton is aria-hidden");
  check($$(".skeleton .card").length === 4, "Skeleton has 4 placeholder cards");
  check($(".feed-body").getAttribute("aria-busy") === "true", "Feed region aria-busy=true");
  check(action().getAttribute("aria-disabled") === "true", "Action is aria-disabled while loading");
  check(document.activeElement === action(), "Focus kept on #feed-action after re-render");

  // Clicking again while loading changes nothing.
  const skeletonBefore = $(".skeleton");
  action().click();
  check($(".skeleton") === skeletonBefore, "Click during LOADING does not re-render");

  // 3. LOADING -> SUCCESS
  await waitFor(() => status() === "SUCCESS", "reach SUCCESS");
  checkOnlyView("list");
  check($$("article.card").length === 4, "SUCCESS renders 4 articles");
  check($(".feed-body").getAttribute("aria-busy") === "false", "aria-busy=false after load");
  check(action().textContent === "Reload feed", "SUCCESS button reads Reload feed");

  // XSS probe is plain text.
  const xssTitle = $("[data-id='xss'] h3");
  check(xssTitle.textContent === "<img src=x onerror=alert(1)>", "XSS title rendered as text");
  check($$("img").length === 0, "No <img> element created from data");

  // 4. Network error -> ERROR with Retry Connection
  $("#mode-error").click();
  check($("#mode-error").getAttribute("aria-pressed") === "true", "Network error mode selected");
  clickAction();
  check(status() === "LOADING", "Reload -> LOADING");
  await waitFor(() => status() === "ERROR", "reach ERROR");
  checkOnlyView("error");
  check($("[role='alert'] p").textContent === LOAD_ERROR_MESSAGE, "ERROR shows the friendly message");
  check(!root.textContent.includes("503"), "No technical error detail in the UI");
  check(action().textContent === "Retry Connection", "ERROR button reads Retry Connection");
  check(document.activeElement === action(), "Focus still on the action button in ERROR");

  // 5. Retry that fails again stays in ERROR
  clickAction();
  check(status() === "LOADING", "Retry Connection -> LOADING");
  checkOnlyView("skeleton");
  await waitFor(() => status() === "ERROR", "back to ERROR");
  check($$("[role='alert']").length === 1, "Still exactly one error message");

  // 6. Retry that succeeds
  $("#mode-success").click();
  clickAction();
  await waitFor(() => status() === "SUCCESS", "Retry -> SUCCESS");
  checkOnlyView("list");

  // 7. Empty list is still SUCCESS
  $("#mode-empty").click();
  clickAction();
  await waitFor(() => status() === "SUCCESS" && $(".empty"), "empty SUCCESS");
  check($$("article").length === 0, "Empty feed renders no articles");
  check($(".empty").textContent === "No articles to show yet.", "Empty message shown");

  root.remove();
  console.log(`DataFeed tests: ${passed} passed, 0 failed`);

  return passed;
}
