# Evidence for the validation of 002

Round 2, captured with a headless Chromium against the running compose stack.

| File | What it shows |
|---|---|
| `list-phone.png` | The list at 390x844 with all four due states and one done task. Evidence for QE5 (title and marking 20 px), QE6 (the word in every state) and for **F4**: the done task "Already finished" is the top row, above every open task. |
| `add-form-phone.png` | The add form at 390x844: title field and date field on one line, one button (QE7). |
| `empty-phone.png` | The empty state, "No tasks yet." (001 S2.2). |
| `list-desktop.png` | The list at 1280x800. |

Measurements taken from the rendered page, not the stylesheet (`getComputedStyle`):

- Phone 390x844: `.title` 20 px in every row, `.due` 20 px in every row, delete button 44 px high, checkbox 24 px.
- Due markings rendered: "Overdue 2026-09-18" (red, bold), "Due today 2026-09-19", "Due 2026-09-20", and nothing at all for an undated task (`display: none`).
- Desktop 1280x800: `.due` 14 px.
- Error state: "A title is required." Empty state: "No tasks yet."

Round 1 kept no screenshots; only this round's are here.
