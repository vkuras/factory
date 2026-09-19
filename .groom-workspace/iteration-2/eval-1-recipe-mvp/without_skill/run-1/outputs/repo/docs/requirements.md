# Family Recipe App: Requirements (MVP)

Status: Groomed, ready for architecture
Date: 2026-09-18
Stakeholder: Vico (product owner, household admin, Kotlin developer)

This document says **what** the product does. **How** it is built is up to the architect. Section 9 lists the decisions that are deliberately handed off.

---

## 1. Problem and goal

The stakeholder keeps about 15 family recipes as Markdown files in a Git repository. That setup:

- is awkward to share with the rest of the household (spouse on iPhone, kids later), and
- is awkward to use while cooking: the screen turns off, the text is too small, you have to scroll with dirty hands, and Wi-Fi in the kitchen is poor.

**Goal:** a private recipe app for one household. It must be easy to read while cooking, work offline for recipes already opened, and cost nothing to run. After the one-time import, the Git repository is retired.

## 2. Users and roles

One household with up to 4 people: the stakeholder, his wife, and later two kids.

| Role | Who | Can do |
|---|---|---|
| **Admin** | The stakeholder (exactly one) | Everything a member can do. Can also edit and delete **any** recipe and invite household members. |
| **Member** | Everyone else in the household | View all recipes. Create recipes. Edit and delete **only recipes they created**. |

Rules:
- Every person has their own login.
- New people join **only by invitation from the admin**. There is no open self-registration.
- Every household member can see every recipe. There are **no private recipes**.
- There is **no public access**: no share links and no access for anyone outside the household.

## 3. Platforms

| Context | Device | Priority |
|---|---|---|
| Cooking (viewing recipes) | Android phone/tablet (stakeholder), iPhone (spouse) | Must |
| Creating and editing recipes | Web browser on a laptop | Should ("would be nice") |
| Creating and editing recipes | Phone/tablet | Must at least on one of these surfaces; see note |

Note: members must be able to create and edit recipes from at least one surface they own. The browser is the preferred surface for this. If the architecture offers editing only in the browser, that is acceptable. If it offers editing only on mobile, that is also acceptable, but the stakeholder must be told.

The app is **German only**.

## 4. Recipe content

A recipe consists of:

| Field | Required | Notes |
|---|---|---|
| Title | Yes | Used for search |
| Category | Yes | Exactly one of: **Hauptgerichte**, **Beilagen**, **Soßen**. The set is fixed; users cannot add or rename categories in the MVP. |
| Servings (Portionen) | Yes | A number |
| Ingredients | Yes | Ordered list. Each entry has a quantity, a unit, and an ingredient name. Quantity and unit may be empty (e.g. "Salz nach Geschmack"; see assumption A2). |
| Steps | Yes | Ordered list of preparation steps |
| Note | No | Free text shown below the steps |
| Photo | No | At most **one** photo per recipe |
| Creator | System-set | Determines who may edit and delete |

## 5. Functional requirements (MVP)

### 5.1 Access and household
- **FR-1** Users sign in with a personal account. Signed-out users cannot see any recipe content.
- **FR-2** The admin can invite a new household member. The invited person can then create their own login and join the household.
- **FR-3** A user stays signed in on their device, so they do not have to log in each time they cook.

### 5.2 Browsing and search
- **FR-4** Users can see the list of all household recipes.
- **FR-5** Users can filter the list by category (Hauptgerichte / Beilagen / Soßen).
- **FR-6** Users can search recipes **by title**. Searching ingredients or full text is not required.

### 5.3 Viewing (cooking use)
- **FR-7** Opening a recipe shows all its fields (section 4).
- **FR-8** **The screen stays on** while a recipe is open for cooking, and it does not dim or lock on its own.
- **FR-9** **Large, readable text**: ingredients and steps can be read from a normal kitchen-counter distance without zooming.
- **FR-10** **Minimal precise interaction**: a user with dirty or wet hands can follow a recipe from start to finish without fine scrolling or small tap targets. How this is achieved (e.g. large controls, a step-by-step layout) is a design decision.

### 5.4 Offline
- **FR-11** A recipe that was opened on a device while online can be **viewed** on that device later with no network connection. This covers all text content. The photo should also be available offline where feasible (see A3).
- **FR-12** Creating, editing and deleting may require a network connection. If there is no connection, the app says clearly that the action is not possible right now. It must not silently lose input.
- **FR-13** Offline viewing is required on the phone/tablet surfaces. It is not required in the web browser.

### 5.5 Creating, editing, deleting
- **FR-14** Any member can create a recipe. The creator is recorded automatically.
- **FR-15** The creator can edit and delete their own recipes. The admin can edit and delete any recipe. Nobody else can edit or delete a recipe.
- **FR-16** A user can add, replace or remove the recipe's single photo.
- **FR-17** Changes made by one household member become visible to the others without manual export or import steps. Showing them the next time the recipe or list is loaded online is enough. Real-time push is not required.

### 5.6 One-time import
- **FR-18** The ~15 existing Markdown recipes are imported **once** into the new system.
- **FR-19** The import is a **developer tool the stakeholder runs once**. It is **not** an in-app feature.
- **FR-20** Imported recipes are owned by the admin (stakeholder).
- **FR-21** The existing files follow this structure: title, servings, ingredient list (quantity + unit + name), steps, optional note at the end. The stakeholder did not supply a sample file. The tool must handle small deviations or report them clearly so they can be fixed by hand. Silently producing wrong recipes is not acceptable.
- **FR-22** Category is probably not part of the Markdown files (see A4). If it is missing, the import must still result in every recipe having one of the three categories, for example by assigning it during import or requiring it on first edit.

## 6. Non-functional requirements and constraints

- **NFR-1 Zero running cost.** No budget for server hosting or any other paid service. The stakeholder does **not** have a home server, NAS or Raspberry Pi. Free tiers are acceptable in principle. The architect chooses and must state any free-tier limits or lock-in risks.
- **NFR-2 Kotlin.** The stakeholder is a Kotlin developer and wants the product built in Kotlin wherever reasonably possible. This is a stakeholder preference and a strong constraint, not a mere suggestion. Any part that cannot reasonably be Kotlin must be justified.
- **NFR-3 Scale.** 1 household, ≤ 4 users, tens to low hundreds of recipes, at most one photo each. No multi-household or multi-tenant support is needed.
- **NFR-4 Privacy.** Recipe data and photos are visible only to signed-in household members.
- **NFR-5 Time to value.** There is no deadline, but sooner is better. Prefer the simplest solution that meets the Must requirements.
- **NFR-6 No extra backup.** The stakeholder does not require an export or backup feature. Protection against data loss beyond what the chosen platform provides is not in scope.

## 7. Nice to have (not required for MVP)

These may be included only if they are almost free given the chosen design. Otherwise they are deferred:

- Access **from outside the home** (e.g. checking a recipe at the supermarket). Nice to have. Note: this is likely to come for free with most hosted setups.
- Step-by-step cooking view
- Scaling servings (recalculating ingredient quantities)
- Checking off ingredients while cooking
- Timers in steps

## 8. Out of scope for MVP (planned later)

- **Weekly meal plan (Wochenplan)**: planned for a later version.
- **Shopping list (Einkaufsliste)**: planned "eventually".
- Private recipes, public sharing, share links
- Full-text or ingredient search
- More than one photo per recipe
- User-defined categories, or more than one category per recipe
- Offline creating or editing
- In-app Markdown import, export, backup
- Languages other than German

**Forward-compatibility requirement:** the design must not make the weekly plan or the shopping list hard to add later. A meal plan will reference recipes (and probably servings). A shopping list will likely be built from the ingredients (quantity + unit + name) of planned recipes. This is why ingredients are stored as structured entries rather than free text.

## 9. Left to architecture (deliberate handoffs)

These are explicitly **not** decided here. The architect decides them and presents the options and trade-offs to the stakeholder for approval.

1. **Backend and hosting approach** under NFR-1 (zero cost, no home server). This includes where data and photos live and the implications of any free-tier limits or lock-in. The stakeholder explicitly delegated this decision.
2. **Client technology**: how Android, iPhone and browser are covered within the Kotlin preference (NFR-2).
3. **Authentication and invitation mechanism** (FR-1 to FR-3).
4. **Offline caching strategy**, including whether and how photos are cached (FR-11, A3).
5. **The cooking-view interaction design** that satisfies FR-8 to FR-10.
6. **Import tool design** and how categories get assigned to imported recipes (FR-18 to FR-22).
7. **Which editing surface(s)** are offered (section 3 note).
8. **The data model**, subject to section 4 and the forward-compatibility requirement in section 8.

## 10. Assumptions (not confirmed by the stakeholder)

The architect should treat these as defaults. The stakeholder may correct them.

- **A1** There is exactly one admin, and admin rights cannot be transferred in the MVP.
- **A2** Ingredient quantity and unit may each be empty, for entries such as "Salz nach Geschmack".
- **A3** Offline availability of the photo is desirable but not required. Offline availability of the text is required.
- **A4** The existing Markdown files do not contain a category.
- **A5** The admin can remove a household member. That member's recipes remain, and the admin can still edit them. (Removing members was not discussed.)
- **A6** Kids get ordinary member accounts. No special child role or restrictions are needed.
- **A7** Deleting a recipe is permanent. No trash or undo is required.
- **A8** When two people edit the same recipe at nearly the same time, the last save wins. Given the ownership rules, only the creator and the admin can collide, which is rare.

## 11. Acceptance scenarios (MVP)

1. The stakeholder runs the import tool. All ~15 recipes appear in the app with title, servings, ingredients, steps, note and a category. Any files that could not be imported cleanly are reported.
2. The stakeholder invites his wife. She signs up on her iPhone and sees all recipes.
3. The wife creates a recipe with a photo in category "Beilagen". The stakeholder sees it on his Android phone the next time he loads the list.
4. The stakeholder can edit the wife's recipe (admin). A kid member cannot edit or delete it.
5. A user opens a recipe while online, switches the phone to airplane mode, and reopens the recipe: the full text is readable.
6. While a recipe is open on the phone, the screen does not turn off for 30+ minutes without touch input.
7. The recipe text is readable from about arm's length on a phone propped up on the counter, and a user can go from the first step to the last without fine scrolling.
8. Filtering by "Soßen" shows only sauces. Searching for part of a title finds the recipe.
9. An attempt to edit while offline shows a clear message, and no entered text is lost silently.
10. A signed-out person, or anyone with a link, cannot see any recipe.
