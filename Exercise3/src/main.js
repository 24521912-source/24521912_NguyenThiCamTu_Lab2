import "./style.css";
import { setupEventDelegation } from "./events.js";
import { renderApp } from "./reactive-engine.js";
import { DataFeed } from "./data-feed.js";

const root = document.getElementById("app");

// Root listeners are attached once; every re-render reuses them.
setupEventDelegation(root);
renderApp(DataFeed, root);

console.assert(root.querySelector("#feed-action") !== null, "Mount Failed");
