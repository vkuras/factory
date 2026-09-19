# 002 – Shared shopping list

- Type: Feature
- Status: Groomed, ready for technical design

## Summary
The household has one shared shopping list. Members put a recipe's ingredients on it in one go, leaving out what they already have at home. They can also add items without a recipe. While shopping, they tick items off, even without internet, and every member's phone shows changes right away.

## Problem
Today, members copy ingredients from a recipe to paper or a messenger by hand. Quantities from several recipes are added up in their heads. Two people shopping or planning at the same time don't see each other's changes.

## Users
- Household member (see product.md). Plans at home on a phone or tablet and shops with a phone, often with a weak or no signal in the store.

## Scope

### Must
- **S1 One shared list per household.** All members see and edit the same list. Changes by one member appear on the other members' devices within seconds, without a manual refresh.
- **S2 Add a recipe to the list.** From a recipe, a member adds its ingredients to the list, using the **servings currently set** on the recipe, so quantities are scaled.
- **S3 Leave out what's at home.** When adding a recipe, the member first sees its ingredients and can deselect any they already have. All are selected by default. Only the selected ones are added. There is no pantry or stock tracking.
- **S4 Merge same ingredients.** If an ingredient is already on the list with the **same unit**, the quantities are summed, e.g. 200 g flour + 300 g flour gives 500 g flour. With a different unit they stay separate entries, e.g. "1 Becher Sahne" and "200 g Sahne". Units are not converted, so g and kg also stay separate.
- **S5 Show the source.** Each entry shows which recipe(s) it came from, e.g. "Mehl 500 g · Pfannkuchen, Pizza". Manual entries have no source.
- **S6 Manual entries.** A member can add free items that aren't in a recipe (e.g. "Klopapier"). Quantity and unit are optional.
- **S7 Edit and delete.** Any member can change the name, quantity or unit of any entry, and delete any entry.
- **S8 Tick off while shopping.** Any member can tick an entry off and untick it again. Ticked entries move to the bottom of the list, visually marked as done.
- **S9 Works offline.** Ticking off works without internet. So do adding, editing and deleting, as far as feasible. Changes sync automatically once the device is back online, and nothing a member did offline is silently lost.
- **S10 Clear the list.** Any member can run "Liste leeren". It removes **only the ticked entries**. Unticked entries stay.

### Should (desired, not a blocker; may ship in a later increment)
- **S11 Sort by store section.** Unticked entries are grouped by section in this fixed walking order:
  Obst & Gemüse, Brot & Backwaren, Kühlregal, Fleisch & Fisch, Trockenwaren, Gewürze, Getränke, Drogerie, Tiefkühl, Sonstiges.
- **S12 Remembered section assignment.** A member assigns an item to a section once (e.g. "Milch → Kühlregal"). The household remembers this, and the next time an item with that name is added, it goes to that section automatically, for every member. Items that were never assigned go to "Sonstiges". The assignment can be changed at any time.

## Acceptance examples
- A recipe for 4 servings, set to 2 servings, with 400 g Mehl: adding it puts 200 g Mehl on the list.
- 200 g Mehl is on the list from "Pfannkuchen". A member adds "Pizza" with 300 g Mehl, and the list shows one entry, "Mehl 500 g · Pfannkuchen, Pizza".
- Member A ticks off "Milch" in the store with no signal. Once A is back online, member B at home sees "Milch" as ticked.
- A member deselects "Salz" and "Öl" when adding a recipe, so neither appears on the list.
- The list has 3 ticked and 5 unticked entries. After "Liste leeren", only the 5 unticked ones remain.
- (S12) "Milch" was once assigned to Kühlregal. Next week, anyone adds "Milch" and it appears under Kühlregal.

## Assumptions (confirm or correct during design if they cause trouble)
- "Same ingredient" means the same name, ignoring upper/lower case and surrounding spaces. Singular and plural ("Zwiebel"/"Zwiebeln") count as different ingredients.
- An ingredient without a quantity (e.g. "Salz nach Geschmack") becomes an entry without a quantity. When merged with the same name and no unit, it stays a single entry.
- Adding the same recipe twice sums the quantities again.
- If two members change the same entry at the same moment, the later change wins. That is acceptable.
- Editing a recipe afterwards does not change entries that are already on the list.

## Non-goals
- No pantry or stock management and no "always at home" list.
- No multiple lists (e.g. one per store).
- No unit conversion.
- No custom sections or custom section order (possible later).
- No sharing outside the household.

## Constraints and notes for the architect
- **Sync**: the key requirement is that all members' devices stay in sync immediately (S1) and work offline (S9). The stakeholder suggested **Firebase** for this, but only as an idea, not a hard requirement. The existing app does **not** run on Firebase today. Choose the sync approach that fits the existing architecture best, and write down the reasoning.
- The existing permission rule "only the creator edits a recipe" (001 S1) does not apply to the shopping list. Everyone in the household edits the list.
- Mainly used on phones. Ticking off must be fast with one hand.

## Later
- "Always at home" list that is automatically skipped when adding recipes.
- Custom sections and a custom section order.
- Add a whole weekly meal plan to the list (see 001 Later).
