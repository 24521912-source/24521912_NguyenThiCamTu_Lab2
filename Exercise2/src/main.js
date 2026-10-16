import "./style.css";
import { setupEventDelegation } from "./events.js";
import { renderApp } from "./reactive-engine.js";
import { TaskApp } from "./task-app.js";

const root = document.getElementById("app");

// Root listeners are attached once; every re-render reuses them.
setupEventDelegation(root);
renderApp(TaskApp, root);

console.assert(root.querySelector("#add-task") !== null, "Mount Failed");
