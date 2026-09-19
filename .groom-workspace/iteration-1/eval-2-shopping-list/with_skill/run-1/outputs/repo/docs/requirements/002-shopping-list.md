# 002 – Shopping list

- Type: Feature
- Status: Groomed – ready for architecture
- Date: 2026-09-18
- Product context: docs/product.md (builds on 001 – Recipe book MVP)

## Summary
Today the household can find and cook recipes in the app, but getting from "we'll cook this" to "we have everything at home" happens outside it. This feature adds one shared shopping list per household. A member puts a recipe's ingredients on the list in a few taps (for the chosen servings, leaving out what is already at home) and adds their own items like toilet paper. In the store, every member sees the same list grouped by store department, even without internet, and ticks items off. Changes show up for everyone else within seconds.

## Users and roles
- Household member (2–4 people, as defined in docs/product.md): may do everything on the shopping list. That covers adding recipes and own entries, checking and unchecking, deleting entries, changing own entries' quantities, removing recipes, clearing checked entries and changing an entry's department. There are no other roles and no restrictions between members.

## Stories

### Adding to the list

### S1 – Put a recipe's ingredients on the shopping list
As a household member, I want to put a recipe's ingredients on the shopping list for the servings I chose, leaving out what we already have, so that I don't have to copy them by hand.

Acceptance criteria:
- Given a recipe is open with servings set to 6 (base 4), when I choose "Add to shopping list", then I see all of the recipe's ingredients with the quantities for 6 servings, the same values the recipe view shows, and all are preselected.
- Given the selection view, when I deselect "Salz" and "Öl" and confirm, then all other ingredients are added to the list (R2, R3) and Salz and Öl are not.
- Given the selection view, when I deselect every ingredient and confirm, then nothing is added and the recipe does not count as "on the list".
- Given the selection view, when I cancel, then nothing changes on the list.
- Given an ingredient without a quantity ("Salz nach Geschmack"), when it is added, then it appears on the list without a quantity.
- Given "Lasagne" is already on the list, when a member adds "Lasagne" again, then the quantities of its selected ingredients are added to the list (R2, R5) and the list shows the recipe as "Lasagne (2×)".
- Given the device has no internet connection and the recipe is available on the device (as for cooking mode in 001), when I add it, then it works the same way (R11).

Notes: Stakeholder example: Lasagne scaled to 6 servings; salt and oil are at home and are deselected. There is no pantry inventory. Leaving things out only happens in this selection step.

### S2 – Add an own entry
As a household member, I want to add items that don't come from a recipe, optionally with a quantity, so that the list covers the whole shopping trip.

Acceptance criteria:
- Given the list, when I add "Klopapier" with no quantity, then an entry "Klopapier" appears, marked as own entry.
- Given the list, when I add "Klopapier" with quantity "2 Pakete", then the entry shows "2 Pakete Klopapier".
- Given an open entry "300 g Mehl" from "Lasagne", when I add the own entry "Mehl" with "200 g", then there is one open entry "500 g Mehl" with origins "Lasagne, own entry" (R2, R4).
- Given I try to add an own entry with an empty name, then it is not added.

### Using the list

### S3 – See the shopping list grouped by department
As a household member, I want to see the list grouped by store department with each entry's origin, so that I can shop in one pass through the store and know why something is on the list.

Acceptance criteria:
- Given open entries in several departments, when I open the list, then open entries are grouped under their departments in the fixed order of R8. Departments without open entries are not shown. Within a department, entries appear in the order they were first added (R10).
- Given an entry that came from several recipes, then it shows its origins, e.g. "500 g Mehl – Lasagne, Pfannkuchen", "… – Lasagne (2×)", or "own entry" (R4).
- Given checked entries exist, then they appear crossed out in one "Done" section below all departments.
- Given the list is empty, then a short hint explains how to add a recipe or an own entry.
- Given recipes are on the list, then I can see which recipes are currently on it (with "(2×)" where applicable).

### S4 – Check off and uncheck entries
As a household member in the store, I want to tick off what is in the cart, so that I see what is still missing.

Acceptance criteria:
- Given an open entry, when I tap it, then it is crossed out and moves to the "Done" section.
- Given a checked entry, when I tap it, then it is open again and returns to its department and position (R10). If an open entry with the same name and unit exists in the meantime, the two become one open entry (R2).
- Given another member checks an entry while I have the list open and we are both online, then I see the change within a few seconds without reloading (R11).

### S5 – Clear checked entries
As a household member, I want to remove all checked entries at once after shopping, so that the list is fresh for next time.

Acceptance criteria:
- Given checked entries exist, when I choose "Clear done", then all checked entries are removed from the list for everyone. Open entries are untouched.
- Given all entries that came from a recipe have been removed this way, then the recipe no longer appears among the recipes on the list.
- Given there are no checked entries, then "Clear done" is not offered or does nothing.

### Changing the list

### S6 – Remove a recipe from the list
As a household member, I want to take a recipe off the list again ("Lasagne doch nicht"), so that its ingredients don't get bought.

Acceptance criteria:
- Given "Lasagne" is on the list once, when I remove it, then its contribution is taken out of all **open** entries (R6). Entries that came only from Lasagne disappear, and merged entries shrink (e.g. "500 g Mehl – Lasagne, Pfannkuchen" becomes "200 g Mehl – Pfannkuchen").
- Given "Hackfleisch" from Lasagne is already checked, when Lasagne is removed, then the checked Hackfleisch entry stays unchanged in "Done".
- Given "Lasagne (2×)", when I remove Lasagne, then one instance is removed and the list shows "Lasagne" once.
- Given Lasagne was added with Salz deselected, when Lasagne is removed, then nothing related to Salz changes.
- Given an entry combines Lasagne and an own entry, when Lasagne is removed, then the own entry's part remains.

### S7 – Delete an entry or change an own entry
As a household member, I want to delete single entries and correct my own entries, so that the list matches what we actually need.

Acceptance criteria:
- Given any entry (from a recipe or own, open or checked), when I delete it, then it disappears from the list for everyone.
- Given an entry that consists only of own entries, when I change its quantity or remove the quantity, then the new quantity is shown.
- Given an entry that includes a recipe contribution, then its quantity cannot be changed. To get more, a member adds an own entry, which merges (R2).
- Given a deleted entry came from a recipe, when that recipe is removed later, then nothing further happens for that entry.

### S8 – Move an entry to a different department
As a household member, I want to move an entry to the right department once and have the app remember it, so that the list gets sorted correctly over time.

Acceptance criteria:
- Given an entry "Zucchini" in "Sonstiges" (unknown name), when I move it to "Obst & Gemüse", then it appears there, and all other entries named "Zucchini" on the list move too.
- Given "Zucchini" was assigned before by any member, when "Zucchini" is added later from a recipe or as an own entry, then it lands in "Obst & Gemüse" directly (R9).
- Given a name that no one has assigned yet, when it is added, then it appears in "Sonstiges".

### Sharing and offline

### S9 – One shared list that works without internet
As a household member, I want the whole household to use the same list, also in a store without reception, so that we never shop from an outdated list.

Acceptance criteria:
- Given two members are online, when one adds, checks, deletes, clears, moves or removes something, then the other sees it within a few seconds without reloading.
- Given I have no internet connection, when I open the list, then I see the list as of my last connection plus my own changes since then, and I can use every list action (S1–S8).
- Given I checked 5 entries offline while another member added a recipe online, when my connection returns, then both changes are on everyone's list and nothing is lost (R11).

Notes: Stakeholder example: Ben is in a basement supermarket without reception and checks items off, while Anna adds a recipe at home.

## Business rules
- R1 – One list per household: each household has exactly one shopping list. All household members see the same list and may perform every action on it.
- R2 – Merging: a new quantity is merged into an existing entry only if the name and unit are exactly the same and the existing entry is open. Examples: 300 g Mehl + 200 g Mehl = 500 g Mehl. "2 EL Mehl" and "200 g Mehl" stay two entries, and so do "Mehl" and "Weizenmehl". Units are never converted. Entries without quantity merge with entries of the same name that also have no quantity. Recipe ingredients and own entries follow the same rule.
- R3 – Quantities: ingredients are added with the quantities for the servings chosen in the recipe, exactly as the recipe view shows them for those servings (see 001 S3).
- R4 – Origin: every entry shows where it came from: the recipe names (with "(n×)" if added n times) and/or "own entry".
- R5 – Same recipe multiple times: adding a recipe that is already on the list adds its quantities again and increases its count ("Lasagne (2×)").
- R6 – Removing a recipe: removing a recipe takes one instance of it off the list. Its contribution is subtracted only from open entries. Checked entries are never changed by this. An open entry left with no origin disappears.
- R7 – Snapshot: the list keeps what was added. Later changes to or deletion of the recipe don't change the list. The recipe can still be removed from the list by its name.
- R8 – Departments (fixed, in this order, not configurable): Obst & Gemüse, Fleisch & Wurst, Kühlregal, Backwaren, Nudeln/Mehl/Konserven, Getränke, Drogerie, Tiefkühl, Sonstiges.
- R9 – Department memory: the household's department assignment is remembered per ingredient name. It is shared by all members and applies to recipe ingredients and own entries alike. Names never assigned go to "Sonstiges". Changing the department of an entry changes it for that name from then on and moves existing entries with that name. There is no built-in knowledge of groceries.
- R10 – Order: departments in the order of R8. Within a department, entries in the order they were first added (an entry that grows by merging keeps its position). The "Done" section is at the bottom, in the order entries were checked.
- R11 – Shared and offline: changes by one member reach all others within a few seconds when online. All list actions work without internet. When the connection returns, changes from all members are combined and none is lost. If one member deleted an entry, it stays deleted.

## Quality expectations
- Used on a phone while walking through a store, often with poor or no reception. Offline use is essential ("sonst nutzlos").
- Changes by another member appear within a few seconds when online, without manual refresh.
- Only members of the household can see the household's shopping list, like its recipes.
- Department names and texts in the same language as the rest of the app. Department names are exactly as listed in R8.

## Scope
### In scope
S1–S9: add a recipe with deselection and servings, own entries, a list grouped by department with origins, check/uncheck with a "Done" section, clear done, remove a recipe, delete entries and edit own entries, remembered department assignment, and a shared live list with offline use.
### Later
- Nothing new. The weekly meal plan remains "Later" from 001.
### Out of scope
- Pantry or inventory management (stakeholder: only deselect when adding).
- Unit conversion (e.g. EL to g).
- Multiple lists or personal lists.
- A configurable department order or custom departments.
- Built-in knowledge that assigns common groceries to departments.
- Changing quantities of entries that come from recipes.
- Alphabetical sorting.

## Decisions
- One shared household list, live for all members, usable offline. (stakeholder)
- Quantities follow the chosen servings. The same name and unit merge into one entry, with no unit conversion. (stakeholder, merge rule proposed by groomer and accepted)
- Items at home are handled only by deselecting them when adding. No inventory. (stakeholder, proposal accepted)
- Checked entries stay crossed out in a "Done" section at the bottom until "Clear done". (groomer proposal, accepted)
- The same recipe added twice adds its quantities and shows "(2×)". (groomer proposal, accepted)
- New quantities never merge into checked entries, and removing a recipe leaves checked entries unchanged. (groomer proposal, accepted)
- Any entry can be deleted. Only own entries can have their quantity changed. (groomer proposal, accepted)
- Own entries merge with recipe entries by the same rule. Ingredients without a quantity are added without one. The list is a snapshot of the recipe at add time. Every member may do everything. (groomer proposals, accepted)
- Department sorting is in scope now, with the fixed list and order from R8. (stakeholder. The order of the added departments was proposed by the groomer and accepted.)
- Departments are remembered per name for the household, and unknown names go to "Sonstiges". (groomer proposal, accepted)
- "Immediately" means within a few seconds when online. Adding a recipe offline works if the recipe is available on the device. If all ingredients are deselected, nothing is added. A recipe disappears from "recipes on the list" once all its entries are cleared. An empty list shows a hint. (groomer, confirmed in walkthrough)
- Details decided by the groomer as consequences of the above, without separate confirmation: an entry mixing recipe and own contributions cannot have its quantity edited (follows from "only own entries"). Unchecking merges with an equal open entry (follows from R2). "Done" is ordered by check time. A delete wins over a concurrent offline change to the same entry.

## Stakeholder technical constraints
- "Sync am besten über Firebase" ("Sync preferably via Firebase"): stated in the first message as the preferred way to sync the list between household members.

## Left to architecture
- How the list is synchronized between devices and kept usable offline, and how concurrent offline changes are combined. Product need: S9 and R11 (live within seconds, fully usable offline, nothing lost). Consider the stakeholder constraint above.
- How the per-name department memory is stored and shared. Product need: R9.
- How recipe availability on the device (from 001 S4) is reused so recipes can be added offline. Product need: S1.
- How the list tracks each entry's origins so that removing a recipe subtracts correctly. Product need: R4, R6.

## Glossary
- Shopping list: the one shared list of things to buy per household.
- Entry: one line on the shopping list: name, optional quantity (amount and unit), department, origins, open or checked.
- Own entry: an entry (or part of one) added by hand, not from a recipe.
- Origin: the recipe(s), with count, and/or "own entry" that an entry came from.
- Open / checked: an entry is open until someone ticks it off. Checked entries appear crossed out under "Done".
- Done: the section at the bottom of the list with all checked entries.
- Department: the store area an entry belongs to (R8).
- Clear done: the action that removes all checked entries.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Ich brauch ne Einkaufsliste" | S3, R1 |
| L2 | "aus Rezepten die Zutaten auf ne Liste packen" | S1 |
| L3 | "Vielleicht kann man auch Vorräte abhaken, weiß nicht" | clarified as deselect-when-adding: S1; inventory: Out of scope |
| L4 | "Sync am besten über Firebase" | Stakeholder technical constraints |
| L5 | "Ne gemeinsame Liste für den Haushalt, alle sehen sofort was sich ändert" | R1, R11, S9 |
| L6 | "Offline im Laden muss auch klappen, sonst nutzlos" | S9, R11, Quality expectations |
| L7 | "Mengen für die gewählten Portionen" / "zwei Rezepte Mehl … zusammenfassen zu einem Eintrag" | R3, R2 |
| L8 | "Kein Vorratsmanagement, nur beim Hinzufügen wegklicken" | S1; Out of scope (inventory) |
| L9 | "eigene Einträge wie Klopapier müssen auch gehen" | S2 |
| L10 | "nur zusammenfassen wenn Name und Einheit exakt gleich sind, umrechnen soll die App nicht" | R2; Out of scope (unit conversion) |
| L11 | "wär gut wenn man sieht aus welchen Rezepten der Eintrag kommt" | R4, S3 |
| L12 | "durchgestrichen unten bis man aufräumt" | S4, S5 |
| L13 | "Rezept komplett wieder rausnehmen muss gehen, dann verschwinden die Zutaten bzw die Mengen werden weniger" | S6, R6 |
| L14 | Offline changes combined, nothing lost: "Ja passt so" | S9, R11 |
| L15 | "eigene Einträge sollen optional ne Menge haben können" | S2 |
| L16 | "a) reicht am Anfang, nach Reihenfolge des Hinzufügens" | R10; Out of scope (alphabetical) |
| L17 | Same recipe twice adds up, "(2×)": "a) passt" | R5, S1, S6 |
| L18 | No merge into checked entries; removing a recipe leaves checked entries: "beides passt so" | R2, R6, S6 |
| L19 | Delete any entry, edit quantity only for own entries: "a) passt" | S7; Out of scope (editing recipe quantities) |
| L20 | Own entries merge; ingredients without quantity; snapshot: "Erste drei passen so" | R2, S1, R7 |
| L21 | "Ja, jeder im Haushalt darf alles" | R1, Users and roles |
| L22 | "Abteilungen sortieren brauch ich schon … will ich wirklich haben" | S3, S8, R8 |
| L23 | Additional departments Fleisch & Wurst, Nudeln/Mehl/Konserven, Getränke, Drogerie, fixed order "ok" | R8; Out of scope (configurable order) |
| L24 | Department remembered per name, unknown → Sonstiges: "a) passt" | R9, S8; Out of scope (built-in grocery knowledge) |
| L25 | "Gesammelt unten in Erledigt" | S3, S4, R10 |
