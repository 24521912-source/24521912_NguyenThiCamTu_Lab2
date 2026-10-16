/**
 * Exercise 2 - T-05: Reactive Task Manager component
 */

import { createElement } from "./mini-react.js";
import { useState } from "./reactive-engine.js";

const FILTERS = ["ALL", "ACTIVE", "COMPLETED"];

const INITIAL_TASKS = [
  { id: 1, title: "Review PR", done: false },
  { id: 2, title: "Verify AST", done: false },
];

function matchesFilter(task, filter) {
  if (filter === "ACTIVE") {
    return !task.done;
  }

  if (filter === "COMPLETED") {
    return task.done;
  }

  return true;
}

export function TaskApp() {
  // Hooks at the top level, same order every render.
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState("ALL");

  const visibleTasks = tasks.filter((task) => matchesFilter(task, filter));

  const addTask = () =>
    setTasks((previous) => {
      const id = Math.max(0, ...previous.map((task) => task.id)) + 1;
      return [...previous, { id, title: `New task ${id}`, done: false }];
    });

  const toggleTask = (id) =>
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );

  return createElement(
    "main",
    { className: "app-container" },
    createElement(
      "header",
      { className: "app-header" },
      createElement("h1", null, "Task Manager"),
      createElement(
        "button",
        { id: "add-task", type: "button", onClick: addTask },
        "Add Task"
      )
    ),
    createElement(
      "section",
      { className: "task-panel" },
      createElement("h2", null, `Tasks: ${tasks.length}`),
      createElement(
        "div",
        { className: "filters", role: "group", "aria-label": "Filter tasks" },
        FILTERS.map((name) =>
          createElement(
            "button",
            {
              id: `filter-${name}`,
              type: "button",
              "aria-pressed": String(filter === name),
              onClick: () => setFilter(name),
            },
            name
          )
        )
      ),
      visibleTasks.length === 0
        ? createElement("p", { className: "empty" }, "No tasks in this filter.")
        : createElement(
            "ul",
            { className: "task-list" },
            visibleTasks.map((task) =>
              createElement(
                "li",
                { className: task.done ? "task task--done" : "task" },
                createElement("span", { className: "task__title" }, task.title),
                createElement(
                  "button",
                  {
                    id: `toggle-${task.id}`,
                    type: "button",
                    "aria-pressed": String(task.done),
                    "aria-label": `Done: ${task.title}`,
                    onClick: () => toggleTask(task.id),
                  },
                  "Done"
                )
              )
            )
          )
    )
  );
}
