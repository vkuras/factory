# UI measurements, phone portrait 375x812 (round 1)

Read from the rendered page with `getBoundingClientRect()` and
`getComputedStyle()`, not from the stylesheet.

## QE7 – one field above the list, no search page, no button

| Element | Position (x, y) | Size (w x h) | Font size |
|---|---|---|---|
| Add-task form | 16, 97 | 343 x 44 | 18 px |
| Search field `#search` | 16, 157 | 212 x 42 | 18 px |
| "Open only" label | 240, 157 | 119 x 44 | 18 px |
| Task list `#tasks` | 16, 225 | 343 x … | 18 px |

- The search field sits above the list (157 < 225) in the same row as the
  "Open only" checkbox. Passed.
- The only buttons on the page are "Add task" (001) and one "Delete" per row.
  There is no search button and no separate search page; the search fires on
  every `input` event. Passed.
- `<html lang="en">`, every visible text is English: "Taskboard",
  "What needs doing?", "Add task", "Find a task", "Open only", "Delete",
  "No tasks yet.", `No task matches "<text>".` Passed (QE3 of 001).

## UI states

| State | How it was produced | Result |
|---|---|---|
| Search with matches | typed `Milk` | 1 row rendered, list shown, no-match message hidden |
| Search without matches | typed `zzzqqq` | 0 rows, `No task matches "zzzqqq".` shown, the 001 "No tasks yet." state stays hidden (S5.5 passed) |
| Search cleared | emptied the field | all 500 tasks shown again, message hidden (S5.4 passed) |
| Open only on | checkbox checked | only the open task rendered (S6.1 passed) |
| Open only off again | checkbox unchecked | the done task rendered again, `class="done"`, `text-decoration-line: line-through` (S6.3 passed, 001 S3.2 still holds under a filter) |
| Search "milk" over 500 tasks containing "milk" | typed `milk` | 0 rows and `No task matches "milk".` — **F1** |
