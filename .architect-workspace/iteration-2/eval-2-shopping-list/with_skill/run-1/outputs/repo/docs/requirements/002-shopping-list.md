# 002 – Shopping list

- Type: Feature
- Status: Groomed – ready for architecture
- Date: 2026-09-18
- Product context: docs/product.md

## Summary
Today the household copies ingredients by hand when it wants to cook from its recipes, and things get forgotten in the store. This feature adds one shared shopping list per household to the recipe book. Household members put a recipe's ingredients on it for a chosen number of servings, leaving out what they already have at home. They also add free items such as toilet paper or coffee. In the store, the list is grouped by store area and items are ticked off. Everyone in the household sees changes right away. Typical use: one person adds several recipes once a week, sometimes a single recipe in between. Usually the stakeholder shops, sometimes his wife.

## Users and roles
- Household member (see docs/product.md): every member of the household has the same rights on the shopping list. Any member can add recipes and free items, tick and untick, move items to another area, delete lines and finish shopping. This differs on purpose from recipes, which only their creator can edit.

## Stories

### S1 – One shared list per household
As a household member, I want one shopping list that the whole household shares, so that whoever shops has everything on it that anyone added.

Acceptance criteria:
- Given a household, then it has exactly one shopping list, and all household members see the same list.
- Given the wife adds a recipe or a free item at home while her husband has the list open in the store, then the new lines appear on his list without any action on his part.
- Given one member ticks off "Milch", then the other members see it as ticked.
- Given the list is empty, when a member opens it, then a short hint explains how to add items (from a recipe or as a free item).
- People outside the household never see the list.

### S2 – Add a recipe's ingredients
As a household member, I want to put a recipe's ingredients on the list for the number of servings we cook, leaving out what we already have, so that I don't copy ingredients by hand.

Acceptance criteria:
- Given a recipe is open in the recipe book, when the member chooses "add to shopping list", then a step appears showing the number of servings, preset to the recipe's base servings, and all ingredients with quantities for that number of servings, all selected.
- When the member changes the servings in this step, then the shown quantities are recalculated the same way as when changing servings in the recipe (001, S3).
- When the member deselects ingredients (e.g. salt, flour already at home) and confirms, then only the selected ingredients are added to the list, with the quantities for the chosen servings.
- When the member cancels this step, then nothing is added.
- Adding lines is merged per R1 and R2. Adding the same recipe twice adds its quantities again per R1.
- Given a recipe is later edited or deleted, then lines already on the list stay unchanged.

Notes: The app keeps no record of household supplies. "What we have at home" is decided anew each time by deselecting.

### S3 – Add free items
As a household member, I want to add things that are in no recipe, like toilet paper or coffee, so that the list covers the whole shopping trip.

Acceptance criteria:
- When a member types a text such as "Klopapier" or "2x Milch" and adds it, then it appears on the list as one line with exactly that text.
- A free item is assigned to an area automatically (S5).
- Free items are never merged with anything, not even with a recipe ingredient of the same name (R3).

### S4 – Shop with the list
As the person shopping, I want the list grouped by store area and to tick items off, so that I can work through the store without missing anything.

Acceptance criteria:
- The list is grouped by area, always in the order of R4.
- Within an area, open lines appear in the order they were added. Ticked lines move below the open lines.
- When the member taps an open line, then it is ticked and moves down. When the member taps a ticked line, then it is unticked and returns to the open lines.
- When the member deletes a line, then it disappears from the list for the whole household. No confirmation is asked.
- Lines cannot be edited. To change one, the member deletes it and adds it again.
- Given the phone has no connection in the store, then the member can still view the list and tick and untick lines. Once the connection is back, the other household members see these changes. Adding recipes or free items without connection is not required.

### S5 – Automatic area assignment with remembered corrections
As a household member, I want items sorted into store areas automatically, and my corrections remembered, so that the list is ordered for the store without work every week.

Acceptance criteria:
- When a line is added (recipe ingredient or free item), then the app assigns it automatically to one of the areas in R4, without the member having to choose.
- Given the app cannot tell which area fits, then the line goes to "Sonstiges".
- When a member moves a line to another area (e.g. "Hefe" from "Sonstiges" to "Kühlregal"), then the line moves there.
- Given such a correction was made, when an item with the same name is added later by any household member (recipe ingredient or free item), then it lands in the corrected area automatically.

### S6 – Finish shopping
As the person shopping, I want to clear what I bought in one step and keep what I didn't get, so that the list is ready for next time.

Acceptance criteria:
- When a member chooses "Einkauf abschließen" (finish shopping), then the app asks for confirmation.
- When the member confirms, then all ticked lines are removed from the list for the whole household. All open lines stay as they are.
- When the member cancels, then nothing changes.
- There is no new or separate list per shopping trip. The same list simply continues.

## Business rules
- R1 – Merging recipe ingredients: when an ingredient is added from a recipe and an open (unticked) recipe line with the same name and the same unit already exists, the quantities are added into that line. Example: 2 Zwiebeln + 1 Zwiebel = 3 Zwiebeln. Different units stay separate lines: "200 g Mehl" and "2 EL Mehl" are two lines.
- R2 – Same name means the same spelling, ignoring upper/lower case. Singular and plural forms ("Zwiebel" / "Zwiebeln") are not guaranteed to merge.
- R2a – Ticked lines are never merged into. If 2 Zwiebeln are already ticked and a new recipe adds 1 Zwiebel, a new open line "1 Zwiebel" appears.
- R2b – Ingredients without a quantity (e.g. "Salz nach Geschmack") appear as one line without a quantity. If an open line for that ingredient already exists, no second line is added.
- R3 – Free items are plain text. They are never merged with other free items or recipe ingredients.
- R4 – Areas are a fixed list, shown in this order: Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Getränke, Sonstiges. Household members cannot add, rename or reorder areas.
- R5 – Remembered area corrections apply to the whole household, and to every later item with the same name (as defined in R2), whether recipe ingredient or free item.
- R6 – All household members have equal rights on the shopping list (see Users and roles).

## Quality expectations
- Used on a phone while walking through a supermarket, often by the stakeholder, sometimes by his wife.
- Changes by one household member show up for the others without noticeable delay and without any manual refresh.
- Viewing and ticking must work in a store without reception. Changes made there reach the others once the connection is back.
- Only household members can see the list (same privacy expectation as recipes).

## Scope
### In scope
S1–S6: shared household list; adding recipes with servings and deselecting ingredients; free items; automatic areas with manual move and remembered corrections; tick and untick; delete lines; finish shopping; viewing and ticking without connection.
### Later
- Remove a whole recipe from the list again. Note: this would reduce merged quantities, e.g. 3 Zwiebeln back to 2 when recipe B is removed.
- Weekly meal plan (already Later in 001, not part of this feature).
### Out of scope
- Pantry or supplies management. The app does not remember what the household has at home.
- Showing which recipe a line came from.
- Creating, renaming or reordering areas.
- Merging free items with recipe ingredients.
- Multiple lists (e.g. one per store).
- Editing a line's text or quantity.
- Adding items without connection (not required; see S4).

## Decisions
- One shared list per household with live updates between members. Stakeholder.
- "Vorräte abhaken" means deselecting ingredients while adding a recipe, not stored pantry data. Stakeholder.
- Servings chosen when adding a recipe; quantities follow the chosen servings. Stakeholder.
- Merge only when name and unit are equal; different units stay separate lines. Stakeholder.
- Ticked lines move down; "Einkauf abschließen" removes ticked lines and keeps open ones; the list continues. Stakeholder.
- Viewing and ticking work without connection, while adding does not have to. Groomer proposal accepted by stakeholder (he left the "how" to architecture).
- Free items are plain text, never merged. Stakeholder.
- Recipe origin not shown in the list. Stakeholder.
- Grouping by fixed areas, with "Getränke" added by the stakeholder; not editable by users. Stakeholder (fixed list was a groomer proposal, accepted).
- Automatic area assignment; manual move possible; corrections remembered. Stakeholder.
- Removing a whole recipe parked for later; deleting single lines is enough for now. Stakeholder.
- Multiple lists out of scope. Groomer proposal accepted by stakeholder.
- Servings preset to the recipe's base servings; same name = same spelling ignoring case; ingredients without quantity handled per R2b; ticked lines not merged into (R2a); recipe changes don't affect the list; unknown area → Sonstiges; area order per R4; order within an area = order added; corrections apply household-wide (R5); lines not editable; delete without confirmation, finish shopping with confirmation; empty-list hint; add from the recipe view. Groomer decisions, confirmed by stakeholder in the walkthrough.

## Stakeholder technical constraints
- "Sync am besten über Firebase" – stated in the first message as the preferred way to keep the shared list in sync between household members' devices.

## Left to architecture
- How items are assigned to areas automatically (S5). Product need: sensible grouping without manual choice, "Sonstiges" as fallback, and remembered household corrections that take priority.
- How changes reach other members live and how offline ticking is reconciled (S1, S4). Product need: live shared list; viewing and ticking without reception; nothing ticked offline is lost. Consider the stakeholder's Firebase preference and fit it with the existing recipe book, which already keeps opened recipes usable without internet (001, S4).
- Whether adding items without connection is supported. Not required by the product.

## Glossary
- Shopping list: the one list per household holding lines to buy.
- Line: one entry on the shopping list, either a recipe ingredient (quantity, unit, name) or a free item (plain text). A line is open or ticked.
- Free item: a line entered as plain text, not from a recipe.
- Area: one of the fixed store sections in R4 used to group the list.
- Finish shopping ("Einkauf abschließen"): removes all ticked lines; open lines remain.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Ich brauch ne Einkaufsliste" | S1–S6 |
| L2 | "aus Rezepten die Zutaten auf ne Liste packen" | S2, R1 |
| L3 | "Vielleicht kann man auch Vorräte abhaken, weiß nicht" | S2 (deselect when adding); pantry management Out of scope |
| L4 | "Sync am besten über Firebase" | Stakeholder technical constraints; product need in S1, S4 |
| L5 | "einmal die Woche mehrere Rezepte reinpacke, manchmal spontan eins zwischendurch" | Summary, S6 (list continues) |
| L5b | "Einkaufen geht meist ich, manchmal meine Frau" | Users and roles, R6, Quality expectations |
| L6 | "Eine Liste fürs ganze Haus" | S1 |
| L7 | "Wenn sie zuhause was hinzufügt, während ich im Laden bin, soll das bei mir auftauchen. Wenn ich Milch abhake, soll sie das auch sehen" | S1 |
| L8 | "kein Vorratsmanagement, nur beim Hinzufügen wegklicken" | S2; Out of scope (pantry) |
| L9 | "Klopapier, Kaffee, sowas will ich auch draufpacken können" | S3 |
| L10 | "Zwiebeln zusammenrechnen, also 3 Zwiebeln. Bei unterschiedlichen Einheiten ... zwei separate Zeilen" | R1, R2, R2a, R2b |
| L11 | "Beim Hinzufügen von nem Rezept kann ich halt Portionen einstellen, und die Liste nimmt dann die Menge für die gewählte Anzahl" | S2 |
| L12 | "Abgehakte Sachen wandern nach unten" | S4 |
| L13 | "Mit 'Einkauf abschließen' verschwinden die abgehakten Sachen, was nicht abgehakt ist bleibt einfach stehen" | S6 |
| L14 | "[Empfang im Laden] Das soll der Architekt entscheiden" → accepted proposal "ja passt" | S4, Quality expectations, Left to architecture |
| L15 | "Ganzes Rezept entfernen wäre schon praktisch, einzelne Zeilen löschen reicht aber notfalls auch" → "für später parken" | Later; S4 (delete lines) |
| L16 | "Im Laden muss ich nicht sehen, von welchem Rezept was ist" | Out of scope |
| L17 | "Einfacher Text reicht, muss nicht mit der Milch vom Rezept zusammengerechnet werden" | S3, R3 |
| L18 | "sortiert nach Bereich wie Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Sonstiges" | S4, R4 |
| L19 | "Die App soll das automatisch zuordnen, keine Ahnung wie genau" | S5, Left to architecture |
| L20 | "wenn's falsch einsortiert ist, sollte man es zur Not händisch verschieben können" | S5 |
| L21 | "feste Liste passt, nicht selber bearbeiten müssen. Aber Getränke fehlt mir noch" | R4; Out of scope (editing areas) |
| L22 | "Merken wär gut, sonst nervt's ja jede Woche" | S5, R5 |
