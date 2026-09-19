# 001 – Recipe app MVP

- Type: MVP
- Status: Architected – see docs/architecture.md
- Date: 2026-09-18
- Product context: docs/product.md

## Summary
Viktor keeps his recipes as Markdown files in a Git repository. He can't view them properly on his phone, and his wife can't access them at all. This MVP gives the household a private recipe app. Both of them can find recipes, view them on a phone, tablet or laptop, scale the servings and cook step by step, even with the poor kitchen Wi-Fi. Each of them adds and maintains their own recipes. Viktor's 8 existing recipes are imported once so that nothing has to be retyped. The MVP succeeds when Viktor no longer touches the Git repository and his wife actually uses the app.

## Users and roles
- **Household member** (in the MVP: Viktor and his wife). May see all recipes of the household. May create recipes. May edit and delete only recipes they own (R2).
- Viktor starts the household and invites his wife. There are no other roles and no access for anyone outside the household.

## Stories

### Household and access

#### S1 – Private household with own access
As Viktor, I want to invite my wife into our household, so that we both see our recipes and nobody else does.

Acceptance criteria:
- Given Viktor has his own access, when he invites his wife, then she can join the household with her own access and sees all household recipes, including the imported ones.
- Given someone is not a household member, when they try to open the app's recipes, then they see no recipes of the household.
- Given a household member creates a recipe, when another member opens the recipe list, then the new recipe is there (R1).

### Finding and viewing recipes

#### S2 – Browse recipes by category
As a household member, I want to see all recipes grouped by category, so that I quickly find what I want to cook.

Acceptance criteria:
- Given the household has recipes, when a member opens the app, then they see all recipes grouped by their category.
- Given a category no longer has any recipe, when the list is shown, then that category does not appear (R4).

#### S3 – Search by recipe name
As a household member, I want to search recipes by name, so that I find a recipe without scrolling.

Acceptance criteria:
- Given the recipe list, when a member types part of a recipe name into the search, then only recipes whose name matches are shown.
- Given no recipe name matches, when searching, then the member sees that nothing was found.
- Ingredients are not searched (see Out of scope).

#### S4 – View a recipe
As a household member, I want to open a recipe and see its photo, servings, ingredients and steps in a readable way on a phone or tablet, so that I can cook from it in the kitchen.

Acceptance criteria:
- Given a recipe, when a member opens it, then they see title, category, photo (if any), servings (if set), the ingredient list with amounts (where present) and the steps, including section names where steps are grouped (R7).
- Given a recipe has no photo, when opened, then it is shown without a photo and nothing looks broken.
- Given the recipe is owned by someone else, when a member opens it, then they can read it but not edit or delete it (R2).

#### S5 – Scale servings
As a household member, I want to switch a recipe to a different number of servings (e.g. from 4 to 6), so that the ingredient amounts adjust automatically.

Acceptance criteria:
- Given a recipe with servings set to 4, when a member switches to 6, then every ingredient amount in the ingredient list is recalculated for 6 servings (R5, R6).
- Given scaling is applied, when the member looks at ingredients without an amount (e.g. "Salz", "Pute"), then they are shown unchanged.
- Given scaling is applied, then amounts written inside step texts (e.g. "0,5 l Wasser" in a step) are not changed.
- Given a member scaled a recipe, then the stored recipe is not changed and other members still see the original servings.
- Given a recipe has no servings set (e.g. an imported recipe), when a member opens it, then scaling is not offered, and the recipe is otherwise shown normally.

Notes: The stakeholder's example: "will umstellen können z.B. auf 6 Personen und die Mengen sollen sich automatisch anpassen."

#### S6 – Cooking mode
As a household member cooking in the kitchen, I want to see one step at a time in large type and tap to move on, with the screen staying on, so that I can follow the recipe at the stove.

Acceptance criteria:
- Given an open recipe, when the member starts cooking mode, then exactly one step is shown, large and readable from a phone or tablet standing in the kitchen.
- Given cooking mode, when the member taps to go forward or back, then the next or previous step is shown.
- Given steps are grouped into sections (e.g. Pute: Füllung, Würzen, Braten), when a step is shown, then the name of its section is shown with it.
- Given cooking mode is open, while the member is not touching the device, then the screen does not turn off.
- Given the last step, when the member is done, then they can leave cooking mode and get back to the recipe.

### Creating and maintaining recipes

#### S7 – Create a recipe
As a household member, I want to create a recipe on my phone or laptop, so that it's available to the whole household.

Acceptance criteria:
- Given a member on a phone or laptop, when they create a recipe, then they can enter title, category, servings, ingredients with amounts, steps (optionally grouped into sections) and optionally add one photo (R3, R8).
- Given the category field, when the member creates a recipe, then they can pick an existing category or type a new one, which then becomes available to the whole household (R4).
- Given a recipe is saved, then the creator is its owner and all household members can see it (R1, R2).
- Given there is no connection, when the member tries to save, then the app tells them saving isn't possible right now, and what they entered is kept so they can try again (R9).

#### S8 – Edit own recipe
As the owner of a recipe, I want to change it, for example to add servings later to an imported recipe, so that my recipes stay correct and complete.

Acceptance criteria:
- Given a member owns a recipe, when they edit it, then they can change every field they can enter when creating a recipe, including servings, the photo and the category.
- Given an imported recipe without servings, when Viktor adds servings, then scaling becomes available for that recipe (S5).
- Given a recipe owned by someone else, then the member has no way to edit it (R2).
- Given there is no connection, when the owner tries to save changes, then the app tells them, and the changes are kept so they can try again (R9).

#### S9 – Delete own recipe
As the owner of a recipe, I want to delete it, so that recipes I no longer want disappear.

Acceptance criteria:
- Given a member owns a recipe, when they choose to delete it, then the app asks for confirmation first, and only after confirming is the recipe removed for the whole household.
- Given a recipe owned by someone else, then the member has no way to delete it (R2).
- Given the deleted recipe was the last one in its category, then that category disappears from the list (R4).

### Kitchen without Wi-Fi

#### S10 – Read recipes without a connection
As a household member in the kitchen with poor Wi-Fi, I want recipes I opened before to work without a connection, so that I can cook even when the connection drops.

Acceptance criteria:
- Given a member has opened a recipe on this device before, when the device has no connection, then they can still open that recipe with photo, ingredients and steps, use cooking mode and scale servings.
- Given there is no connection, when the member tries to create, edit or delete a recipe, then the app tells them this needs a connection (R9).

### Moving away from the Git repository

#### S11 – One-time import of existing recipes
As Viktor, I want my existing recipes from the Git repository to be in the app from the start, so that I don't have to retype them and can stop using the repository.

Acceptance criteria:
- Given the repository at the time of import contains 8 recipes, when the import has run, then all 8 recipes are in the household, owned by Viktor (R10).
- Given a recipe file, when imported, then its title, ingredients and steps are taken over as written, including typos and inconsistent wording. Nothing is corrected or rewritten.
- Given an ingredient line that contains an amount (e.g. "250g Hackfleisch", "Kartoffeln mehlig (900g)", "1,5 L hochwertige Rinderbrühe", "2 Eier"), when imported, then the amount is recognised as the ingredient's amount so it can be scaled later. Lines without an amount become ingredients without an amount.
- Given steps grouped under headings (Pute: Füllung / Pute würzen / Pute braten), when imported, then these become sections with their steps. Given a recipe whose steps are numbered headings each followed by text (Short Ribs: "1. Rotwein reduzieren" etc.), then each such heading with its text becomes one step.
- Given the folder a recipe lies in, when imported, then the folder name becomes its category (hauptgerichte → Hauptgerichte, beilagen → Beilagen, soßen → Soßen). The Short Ribs recipe, which lies in no folder, gets the category Hauptgerichte.
- Given imported recipes, then none has servings or a photo. Scaling becomes available once Viktor adds servings (S8).
- Given the source link in the Brauhaus Gulasch recipe, when imported, then it is dropped (there is no source field).
- The import happens once. After that the app is the only place where recipes are maintained. There is no ongoing sync with the repository.

Notes: The recipes are in `/Users/vicokuras/IdeaProjects/rezepte`: `Shortribs.md`, `hauptgerichte/` (Entenbrust, Pute, Schweinebauch, Tortellini_Panna), `beilagen/` (Kartoffelklöße, Serviettenknlöße), `soßen/` (Brauhausgulasch). Formatting varies between files (different heading levels, ingredients sometimes written as headings instead of list items).

## Business rules
- **R1 Visibility**: every recipe is visible to all household members and to nobody else.
- **R2 Ownership**: only the owner (the creator; Viktor for imported recipes) can edit or delete a recipe. Other members can only read it.
- **R3 Recipe content**: title, exactly one category, servings, ingredients (each with an optional amount), steps (optionally grouped into named sections), at most one photo (optional). Servings may be empty (imported recipes). No source field.
- **R4 Categories**: any household member can create a new category while creating or editing a recipe. New categories are available to everyone. A category exists only as long as at least one recipe uses it.
- **R5 Scaling**: scaled amount = stored amount × (chosen servings ÷ recipe servings). Only amounts in the ingredient list are scaled. Ingredients without an amount and amounts inside step text stay unchanged. Scaling is only offered if the recipe has servings. It affects only the current member's view, never the stored recipe.
- **R6 Rounding**: scaled amounts are shown with at most one decimal place (e.g. "1,5 Eier").
- **R7 Sections**: steps can be grouped into named sections. The section name is shown with its steps in the recipe view and in cooking mode.
- **R8 Photo**: at most one photo per recipe. It's optional and can be added on a phone or laptop.
- **R9 Connection**: reading recipes opened before on a device works without a connection (S10). Creating, editing and deleting need a connection. If an action fails because there is no connection, the user is told, and their input is not lost.
- **R10 Import**: one-time only, content as written, owner Viktor, folder name becomes category, Short Ribs goes to Hauptgerichte, source link dropped (S11).

## Quality expectations
- Usable on a phone, a tablet and a laptop. Viewing and cooking are mainly done on a phone or tablet standing in the kitchen. Creating and editing are done on a phone or laptop.
- Readable at a glance from a device standing on the kitchen counter, especially in cooking mode (large type).
- The screen doesn't turn off while cooking mode is open.
- Recipes opened before work without a connection, because the kitchen Wi-Fi is poor.
- Privacy: recipes are visible only to household members. There is no public sharing.
- User interface language: German.
- It has to be easy enough that Viktor's wife actually uses it (success criterion).
- At least 10 people can use the app at the same time without it becoming noticeably slower.

## Scope
### In scope
S1–S11: household with own access for Viktor and his wife, category list, name search, recipe view, portion scaling, cooking mode, create/edit/delete own recipes with photo, offline reading of recipes opened before, one-time import of the 8 existing recipes.
### Later
- Weekly meal plan ("Wochenplan").
- Shopping list.
- Children as additional household members.
### Out of scope
- Nutrition information, ratings, comments.
- Advertising.
- Public sharing or any visibility outside the household.
- A source field for recipes.
- Searching by ingredient.
- Creating or editing recipes without a connection.
- Further cooking tools beyond readable step-by-step view and scaling (the stakeholder said "Sonst reicht lesen").
- Ongoing sync with the Git repository.

## Decisions
- Household only: Viktor and his wife now, no one outside. Reason: the stakeholder only wants to share within the household. (Stakeholder)
- Everyone sees everything, only the creator may change. (Stakeholder)
- Cooking mode shows one step at a time, large, tap to go on, screen stays on. (Stakeholder)
- Portion scaling is in the MVP. (Stakeholder)
- Recipe fields: title, category, ingredients, steps, servings, photo in the first version. No source field. (Stakeholder)
- Users may create new categories. Reason: otherwise e.g. desserts would have no place. (Groomer proposal, accepted)
- List grouped by category plus search by recipe name, no ingredient search. (Groomer proposal, accepted)
- Offline: recipes opened before must work. Creating without Wi-Fi isn't needed. (Stakeholder)
- The 8 existing recipes are imported once, not retyped. The stakeholder first said 15, then confirmed that the repository's 8 are all there is. (Stakeholder)
- Imported recipes come without servings. Viktor adds them later, and scaling is unavailable until then. (Stakeholder chose this over entering servings at import time)
- Import takes content as written, owner Viktor, folder becomes category, Short Ribs goes to Hauptgerichte, sections are preserved, amounts in ingredient lines are recognised. (Groomer decision, confirmed in walkthrough)
- The Gulasch YouTube source link is dropped on import. (Groomer decision, confirmed: "YouTube link kann weg")
- Each member has their own access, and Viktor invites his wife. (Groomer decision, confirmed in walkthrough)
- Scaling rounds to at most one decimal place, doesn't scale step text or ingredients without an amount, and affects only one's own view. (Groomer decision, confirmed in walkthrough)
- Delete asks for confirmation. Empty categories disappear. At most one photo. German UI. Input is kept when saving fails for lack of a connection. (Groomer decisions, confirmed in walkthrough)

## Stakeholder technical constraints
- "Soll in Kotlin gebaut werden." Stated in the first message as the language for building the app. No further detail was given.
- "Frontend, Backend und Datenbank sollen zusammen dockerisiert auf meinem Raspberry Pi 5 mit 4 GB RAM laufen, und das Ganze muss mindestens 10 gleichzeitige User abkönnen." Stated as where the product runs: the whole product on his own Raspberry Pi 5 (4 GB RAM), in Docker.

## Left to architecture
- **Access and invitation**: the product need is that each household member has their own access, Viktor can invite his wife, and nobody outside sees recipes (S1, R1). How identity, invitation and access control work is open.
- **Offline reading**: the product need is that recipes opened before on a device, including photo, cooking mode and scaling, work without a connection (S10). How this is achieved is open.
- **Platforms and devices**: the product need is usability on a phone, a tablet and a laptop (Quality expectations). Which clients and form factors, within the Kotlin constraint, is open.
- **Keeping the screen on** in cooking mode (S6): how is open.
- **Import mechanics** (S11): how the one-time import is run and how amounts are recognised in the inconsistent Markdown files is open. The expected result is described in S11.
- **Photo handling** (R8): how photos are captured, stored and sized is open.
- **Data sharing between members**: how a recipe saved by one member reaches the other is open (S7).

## Glossary
See docs/product.md. No additional terms.

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Ich will eine App für meine Rezepte bauen" | Summary, S2–S9 |
| L2 | "Markdown Files in nem Git Repo, das nervt" / "am Handy nix vernünftig anschauen" / "muss immer erst das Repo aufmachen am Laptop" | Summary, S4, S11, Quality expectations |
| L3 | "Man soll die mit der Familie teilen können" | S1, R1 |
| L4 | "beim Kochen gut benutzen" | S5, S6, S10 |
| L5 | "Soll in Kotlin gebaut werden" | Stakeholder technical constraints |
| L6 | "Irgendwann wär auch ein Wochenplan cool" | Later |
| L7 | "Nur mein Haushalt, ich und meine Frau" | Users and roles, S1, R1 |
| L8 | "später vielleicht die Kids" | Later |
| L9 | "Alle sollen alles sehen, aber nur der der's angelegt hat soll's ändern können" | R1, R2, S4, S8, S9 |
| L10 | "Handy oder Tablet steht bei mir in der Küche" | Quality expectations, S6 |
| L11 | "WiFi da ist mies" | S10, R9 |
| L12 | "Wenn ich das Git Repo nicht mehr anfass und meine Frau die App wirklich benutzt" | Summary, product.md success criterion |
| L13 | Wife "kommt gar nicht ran" | S1 |
| L14 | "Groß und lesbar halt" | S6, Quality expectations |
| L15 | "Immer ein Schritt groß, dann tippen für den nächsten" | S6 |
| L16 | "der screen darf nicht dauernd ausgehen während ich koche" | S6, Quality expectations |
| L17 | "Sonst reicht lesen" | Out of scope (further cooking tools) |
| L18 | "am handy oder laptop machen kann, ist mir eig egal welches gerät" | S7, Quality expectations |
| L19 | "Titel, kategorie, zutaten, schritte, portionsangabe brauch ich. Foto wär nice to have. Quelle brauch ich nicht." / "Foto gleich in der ersten Version" / new categories allowed | R3, R4, R8, S7; source field Out of scope |
| L20 | "sollen schon drin sein, einmalig importiert. Neu eintippen will ich nicht." (corrected from 15 to 8) | S11, R10 |
| L21 | "Rezepte die ich schon offen hatte müssen auch ohne wlan gehen" | S10, R9 |
| L22 | "Neu anlegen ohne wlan brauch ich nicht unbedingt" | R9, Out of scope |
| L23 | "will umstellen können z.B. auf 6 Personen und die Mengen sollen sich automatisch anpassen" | S5, R5, R6 |
| L24 | "Nachtragen wenn ich Zeit hab ist mir lieber" | S5, S8, S11 |
| L25 | Category list plus name search, no ingredient search ("Passt so") | S2, S3; ingredient search Out of scope |
| L26 | "Nährwerte, Bewertungen, Kommentare will ich nicht" | Out of scope, product.md non-goals |
| L27 | "Einkaufsliste später vielleicht mal, aber nicht jetzt" | Later |
| L28 | "Werbung sowieso nicht, öffentlich teilen auch nicht" | Out of scope, product.md non-goals |
| L29 | "YouTube link kann weg" | S11, R10 |
| L30 | "Frontend, Backend und Datenbank sollen zusammen dockerisiert auf meinem Raspberry Pi 5 mit 4 GB RAM laufen" | Stakeholder technical constraints |
| L31 | "muss mindestens 10 gleichzeitige User abkönnen" | Quality expectations, Stakeholder technical constraints |
