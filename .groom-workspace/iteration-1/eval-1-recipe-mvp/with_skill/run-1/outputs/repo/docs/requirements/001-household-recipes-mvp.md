# 001 – Household recipes MVP

- Type: MVP
- Status: Groomed – ready for architecture
- Date: 2026-09-18
- Product context: docs/product.md

## Summary
The owner keeps about 15 recipes as Markdown files in a Git repository. The family cannot reach them without Git, and reading them on a phone in the kitchen is awkward. This MVP is an iPhone app that holds one household's shared recipe collection. The existing recipes are brought in once, and from then on the app is the only source. Members join by invitation, read every recipe, and add their own. While cooking, the recipe is shown in large text, the screen stays on, portions can be scaled, and all of this works without internet.

## Users and roles
- **Owner** (the stakeholder): everything a member can do. Also owns the imported recipes, is the only one who can remove members, and takes over the recipes of removed members.
- **Member** (wife now, children later; 2–4 people in total, one household): can read all recipes, add recipes, change and delete their own recipes, and invite new people. All members have equal rights. Children get exactly the same rights as adults.
- Every member is shown by name, so everyone can see who created a recipe.

## Stories

### Getting started

#### S1 – One-time import of existing recipes
As the owner, I want my existing Markdown recipes brought into the app once, so that I don't have to retype them and can stop using the Git repository.

Acceptance criteria:
- Given the owner's roughly 15 recipe files, when the import is done, then each readable file appears as a recipe with its title, portions, category, ingredients and preparation, and the owner is its creator.
- Given a file that cannot be read, or whose category is not one of the three categories (R1), when the import runs, then all other files are still imported, and the owner is told which files were not imported.
- Given the import is finished, then the recipes are indistinguishable from recipes created in the app. They can be viewed, scaled, edited and deleted like any other recipe.
- The import only happens once, when the household is set up. There is no ongoing sync with the Git repository and no export back to Markdown.

Notes: The stakeholder says all files share one uniform structure, containing title, portions, ingredients, preparation and category. The exact layout has to be read from the files themselves. The files contain no images.

#### S2 – Invite a person to the household
As a member, I want to invite a person via a link or code, so that my family can get to our recipes.

Acceptance criteria:
- Given a member, when they create an invitation, then they receive a link or code that they can pass on (e.g. via a messenger).
- Given a valid invitation, when the invited person uses it, then they join the household and immediately see all recipes.
- Given an invitation that has already been used, or is older than 7 days (R7), when someone tries to use it, then they are told that the invitation is no longer valid and do not join.

#### S3 – Remove a member
As the owner, I want to remove a person from the household, so that I stay in control of who can see our recipes.

Acceptance criteria:
- Given the owner, when they remove a member (after a confirmation prompt), then that person no longer has access to the household's recipes.
- Given the removed member had created recipes, then those recipes remain and the owner becomes their creator (R5).
- Given a member who is not the owner, then they have no way to remove anyone.
- The owner cannot be removed.

### Finding recipes

#### S4 – Browse the recipe list
As a member, I want to see all recipes in one list and filter it by category, so that I quickly find what I want to cook.

Acceptance criteria:
- Given the household has recipes, when a member opens the app, then they see all recipes sorted alphabetically by title, each showing at least its title.
- When a member picks a category, then only recipes of that category are listed. They can go back to seeing all recipes.
- Given the household has no recipes yet (or none in the chosen category), then the member sees a clear empty state, not a blank screen.

#### S5 – Search by title
As a member, I want to search recipes by title, so that I find a known recipe quickly.

Acceptance criteria:
- When a member types a search term, then only recipes whose title contains that term are listed, ignoring upper and lower case.
- Search and the category filter can be combined.
- Given no title matches, then the member sees that nothing was found.
- Search covers titles only, not ingredients or preparation text.

### Cooking

#### S6 – Cooking view
As a member cooking at the stove, I want to read a recipe comfortably from a phone leaning somewhere, so that I can cook from it without fiddling.

Acceptance criteria:
- When a member opens a recipe, then its title, photo (if any), creator, portions, category, ingredients and preparation are shown in large text that is easy to read from arm's length.
- While a recipe is open, the phone's screen does not turn off or lock by itself.
- When the recipe is closed, the screen goes back to its normal behaviour.

#### S7 – Scale portions
As a member, I want to change the number of portions while cooking, so that the ingredient amounts fit how many people I cook for.

Acceptance criteria:
- Given a recipe for 4 portions, when the member sets it to 2, then every ingredient amount given as a number is halved. For example, "3 Eier" becomes "1,5 Eier" and "200 g Mehl" becomes "100 g Mehl" (R6).
- Given ingredients without a numeric amount, such as "1 Prise Salz" or "etwas Pfeffer", then they stay unchanged.
- Given amounts written as fractions, such as "1/2", then they are scaled like other numbers.
- The saved recipe does not change. When the recipe is opened again, it shows its saved number of portions.
- The target portions are whole numbers of 1 or more.

#### S8 – Read recipes without internet
As a member in a kitchen with poor Wi-Fi, I want to read recipes without a connection, so that cooking never depends on reception.

Acceptance criteria:
- Given the member has used the app with a connection before, when they have no connection, then they can browse, search, open, and scale all recipes, and see their photos.
- When the connection comes back, then recipes that other members added, changed or deleted in the meantime show up, without the member having to do anything special.

### Managing recipes

#### S9 – Add a recipe
As a member, I want to add a new recipe, so that the family collection grows.

Acceptance criteria:
- When a member enters title, portions, category, at least one ingredient and preparation text (R2), and saves, then the recipe appears for all members, with the member as creator.
- Given a required field is missing or portions is not a whole number of 1 or more, when saving, then the member sees which field needs fixing and nothing is saved.
- Given there is no connection, when saving, then the member sees a clear message that saving needs internet. Their input stays on screen so they can try again later (R9).
- A title that another recipe already uses is allowed.

#### S10 – Edit own recipe
As a creator, I want to change my recipe, so that I can fix and improve it.

Acceptance criteria:
- Given a member is the creator, then they can change every part of the recipe (title, portions, category, ingredients, preparation, photo). The same rules as in S9 apply.
- Given a member is not the creator, then they cannot change the recipe, and no edit option is offered to them.
- Given there is no connection, then saving behaves as in S9.

#### S11 – Add or change the photo
As a creator, I want to add one photo to my recipe, taken with the camera or picked from my photos, so that the recipe is easy to recognise.

Acceptance criteria:
- When the creator adds a photo, then they can either take it with the iPhone camera or choose an existing one from their photos.
- A recipe has at most one photo. Adding a new one replaces the old one. The creator can also remove the photo.
- Only the creator can add, replace or remove the photo.
- Recipes without a photo are fully usable.

#### S12 – Delete own recipe
As a creator, I want to delete my recipe, so that the collection stays tidy.

Acceptance criteria:
- Given a member is the creator, when they delete the recipe, then they are first asked to confirm.
- When they confirm, then the recipe is permanently gone for all members. There is no trash and no undo.
- When they cancel, nothing changes.
- Given a member is not the creator, then they cannot delete the recipe.
- Given there is no connection, then deleting is not possible and the member is told that it needs internet.

## Business rules
- **R1 – Categories**: every recipe has exactly one category, and it is required. The list is fixed: Hauptgerichte, Beilagen, Soßen. Members cannot add, rename or remove categories in this version.
- **R2 – Required recipe content**: title, portions (a whole number of 1 or more), category, at least one ingredient, and preparation text. The photo is optional.
- **R3 – Visibility and ownership**: all members see all recipes. Only a recipe's creator can change it, change its photo, or delete it.
- **R4 – Imported recipes**: imported recipes belong to the owner.
- **R5 – Removed members**: when the owner removes a member, that member loses access, and all recipes they created stay and pass to the owner as creator.
- **R6 – Scaling**: new amount = saved amount × target portions ÷ saved portions. Only numeric amounts are scaled, including fractions like "1/2". Results are shown as they are, not rounded to a "sensible" kitchen amount: at most two decimal places, no trailing zeros, with a German decimal comma (e.g. "1,5", "0,33"). Units are not converted (no g to kg). Ingredients without a number stay unchanged. Scaling is temporary and never changes the saved recipe.
- **R7 – Invitations**: any member can create an invitation. Each invitation works once and expires after 7 days.
- **R8 – Removing members**: only the owner can remove members. The owner cannot be removed.
- **R9 – Connection**: reading (list, search, cooking view, scaling, photos) works without a connection. Adding, changing and deleting recipes, and household management (inviting, joining, removing), need a connection.
- **R10 – Titles**: titles don't have to be unique.
- **R11 – List order**: recipes are listed alphabetically by title.

## Quality expectations
- Runs on iPhone. Both current users have iPhones.
- Built for the kitchen: large, legible text, readable from a phone leaning against something, and the screen stays on while a recipe is open.
- Reading must not depend on the kitchen's poor Wi-Fi (R9).
- Only household members can see the household's recipes and photos.
- The user interface is in German.
- Usable by non-technical family members, children included, without explanation from the owner.

## Scope
### In scope
S1–S12: one-time import, invitations, removing members, list with category filter, title search, cooking view, portion scaling, offline reading, and adding, editing and deleting recipes with an optional photo.

### Later
- Weekly meal plan ("Wochenplan").
- Android app for the children, "falls überhaupt" (if at all).
- Adding custom categories (e.g. "Desserts").

### Out of scope
- Checking off ingredients or steps.
- A step-by-step view (one step per screen).
- Searching by ingredient.
- A trash or undo for deleted recipes.
- Adding, editing or deleting recipes without a connection.
- A browser version.
- Continued editing in Markdown, sync with the Git repository, or export to Markdown.
- Multiple households, public sharing, or sharing outside the household.
- Different permission levels among members, apart from the owner's right to remove members.

## Decisions
- One household, and all members have equal rights. Only the owner can remove members. (Stakeholder)
- Everyone reads and creates, and only the creator edits or deletes. (Groomer proposal, accepted by the stakeholder)
- Existing recipes are imported once, and afterwards the app is the only source. (Groomer proposal, accepted by the stakeholder)
- Cooking view: screen stays on, large text, portion scaling. Checking off and the step-by-step view are not needed. (Groomer proposal, accepted by the stakeholder)
- Scaled amounts are shown as they are, without rounding to kitchen-friendly amounts ("1,5 Eier"). This is simple and easy to follow. (Groomer proposal, accepted by the stakeholder)
- Offline covers reading only, because editing offline would lead to confusing conflicts. (Groomer proposal, accepted by the stakeholder)
- Fixed categories with exactly one required category per recipe. The stakeholder already uses these three. (Stakeholder, required-ness proposed by the groomer and accepted)
- Search by title only. (Stakeholder)
- Photo in the first version: one per recipe, from the camera or from photos, and only the creator can change it. It is little effort and adds a lot of value. (Groomer proposal, accepted by the stakeholder)
- Any member may invite. (Groomer proposal, accepted by the stakeholder)
- Deleting needs a confirmation prompt, with no trash. (Groomer proposal, accepted by the stakeholder)
- A removed member's recipes stay and pass to the owner, so that nothing is lost. (Stakeholder chose the groomer's recommendation)
- Required fields, scaling to at most 2 decimals, a clear message and kept input when saving without a connection, reporting unreadable import files, single-use invitations valid for 7 days, and showing the creator on the recipe. (Groomer decisions, stated in the walkthrough and accepted by the stakeholder)
- German user interface, a category mismatch on import is treated as an unreadable file, and members are shown by name. (Groomer assumptions, confirmed by the stakeholder)
- Case-insensitive search on the title substring, and no unit conversion when scaling. (Groomer decisions, minor, consistent with "Suche nach Titel reicht" and "ehrlich 1,5 anzeigen")

## Stakeholder technical constraints
- "Soll in Kotlin gebaut werden." This was stated in the first message. Note: the target device is iPhone (both current users), and Android may come later ("falls überhaupt").

## Left to architecture
- **Kotlin on iPhone**: the product need is an iPhone app now (S1–S12), with a possible Android app later. How Kotlin is used to deliver that is open.
- **Offline reading and updates**: the product need is that all recipes and photos are readable without a connection (S8, R9), and that others' changes appear once the connection is back. How this is achieved is open.
- **Import mechanism**: the product need is a one-time transfer of about 15 uniformly structured Markdown files from the owner's Git repository, with a report of unreadable files (S1). How the owner provides the files and how they are parsed is open.
- **Identity and joining**: the product need is that people join via a single-use invitation link or code, are shown by name, and that only household members see the recipes (S2, S3). How members are identified and signed in is open.
- **Keeping the screen on** during the cooking view (S6): the mechanism is open.
- **Photo handling**: this covers size, quality and storage of the photos (S11). The product need is that photos are visible to all members, offline too.

## Glossary
All terms are defined in docs/product.md (Household, Owner, Member, Recipe, Creator, Category, Cooking view, Scaling, Invitation).

## Open questions
None.

## Appendix: Stakeholder input trace
| # | Stakeholder said | Went to |
|---|---|---|
| L1 | "Ich will eine App für meine Rezepte bauen" | Summary, product.md Vision, S1–S12 |
| L2 | "Ich hab die grad als Markdown Files in nem Git Repo" | S1, product.md Problem |
| L3 | "das nervt" / "am meisten nervt: dass die familie ohne git nicht rankommt, und lesen aufm handy in der küche" | product.md Problem and Core value, Summary |
| L4 | "Man soll die mit der Familie teilen können" (option b: all read and create, only the creator edits) | S2, S9, S10, S12, R3 |
| L5 | "beim Kochen gut benutzen" | S6, S7, S8 |
| L6 | "Soll in Kotlin gebaut werden" | Stakeholder technical constraints |
| L7 | "Irgendwann wär auch ein Wochenplan cool" | Later |
| L8 | "2-4 leute (ich, meine frau, später die kids), alle ein haushalt" | Users and roles, product.md Target users |
| L9 | "sollen automatisch übernommen werden beim start, einmalig reicht" | S1 |
| L10 | "struktur ist einheitlich" | S1 Notes |
| L11 | "a, b, c passt genau" (screen stays on, large text, scale portions) | S6, S7 |
| L12 | "d und e brauch ich nicht" (checking off, step-by-step) | Out of scope |
| L13 | "offline lesen muss gehen, wifi in der küche ist mies" | S8, R9, Quality expectations |
| L14 | "einladen per link oder code reicht, dann sieht sie alles" | S2 |
| L15 | "wir haben beide iPhones" | Quality expectations, Stakeholder technical constraints note |
| L16 | "titel, portionen, zutaten, zubereitung, kategorie. bild optional" | R2, S9, S11, product.md Glossary (Recipe) |
| L17 | "App ist danach die einzige quelle, will nicht mehr in markdown schreiben" | S1, Out of scope |
| L18 | "ehrlich 1,5 anzeigen ... prise salz bleibt unverändert ... nur für den moment" | S7, R6 |
| L19 | "keine freien kategorien, ich hab schon feste: hauptgerichte, beilagen, soßen" | R1 |
| L20 | "suche nach zutat brauch ich nicht, suche nach titel reicht" | S5, Out of scope |
| L21 | "bearbeiten nur mit netz reicht" | R9, S9, S10, S12 |
| L22 | "erstmal reicht iphone, android für die kids kommt später falls überhaupt" | Quality expectations, Later |
| L23 | "bilder liegen aktuell keine im repo" | S1 Notes |
| L24 | "neue fotos direkt mit der handykamera aufnehmen wäre cool" | S11 |
| L25 | "genau eine pflicht-kategorie, liste bleibt erstmal fest" | R1, Later (custom categories) |
| L26 | "foto gleich in der ersten version, kamera oder aus fotos wählen, nur ersteller darf's ändern" | S11, R3 |
| L27 | "jeder darf einladen, alle gleiche rechte. entfernen darf nur ich. kids später gleiche rechte" | S2, S3, R7, R8, Users and roles |
| L28 | "sicherheitsabfrage reicht, kein papierkorb" | S12, Out of scope |
| L29 | Walkthrough 1 (goal, users, non-goals): "passt" | product.md Non-goals, Out of scope |
| L30 | Walkthrough 2 (main flows): "passt" | S1–S12 |
| L31 | Walkthrough 3 (rules and groomer decisions): "passt so weit" | R2, R6, R7, R10, S1, S2, S9, Decisions |
| L32 | "a) - bleibt alles da und geht auf mich über" (recipes of a removed member) | S3, R5 |
| L33 | Walkthrough 4 (scope): "passt" | Scope |
| L34 | Walkthrough 5 (Kotlin verbatim, assumptions): "passt, schreib's auf" | Decisions, Quality expectations, S1 |
