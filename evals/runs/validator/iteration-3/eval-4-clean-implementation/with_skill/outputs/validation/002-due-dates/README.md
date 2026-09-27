Evidence for the validation of 002.

- `list-phone.png` – the list in headless Chromium at 390x844 with mobile
  emulation, showing all four due states (overdue, due today, upcoming, no day)
  and a done task at the bottom.
- `list-phone.json` – the measurements read from the rendered page
  (`getComputedStyle`, `getBoundingClientRect`): font sizes for QE5, the form
  control geometry for QE7, and the row texts for QE6.
- `ui-bad-date.png` – the add form after a malformed day was submitted through
  the UI: "A due date must be a real date." (S5.4).
