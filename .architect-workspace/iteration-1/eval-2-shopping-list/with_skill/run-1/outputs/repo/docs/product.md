# Rezepte

## Vision
A private recipe book for one household, usable at the stove.

## Problem
Recipes live as Markdown files in a Git repo. Only the developer in the household can use them; nobody else does.

## Target users
- Household member: 2–4 people living together. Browses, cooks from and adds recipes, mostly on a phone or tablet in the kitchen.

## Core value
Find a recipe fast, cook from it comfortably and shop for it from one shared list, together as a household.

## Non-goals
- No public sharing, no social features, no ratings or comments.
- No nutrition information.
- No pantry or supplies management: the app does not track what the household has at home.

## Glossary
- Household: the group of people sharing one recipe collection.
- Recipe: title, category, base servings, ingredients (quantity, unit, name), steps, optional photo.
- Category: Hauptgerichte, Beilagen, Soßen.
- Servings: number of portions; changing it rescales ingredient quantities.
- Cooking mode: step-by-step view with large text; the screen stays on.
- Shopping list: the one list per household, shared by all members; holds lines from recipes and free items.
- Line: one entry on the shopping list, either a recipe ingredient (quantity, unit, name) or a free item (plain text); open or ticked.
- Free item: a shopping list line entered as plain text, not from a recipe.
- Area: fixed store section grouping the shopping list: Obst & Gemüse, Kühlregal, Backwaren, Tiefkühl, Getränke, Sonstiges.
- Finish shopping ("Einkauf abschließen"): removes all ticked lines from the shopping list; open lines remain.

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Recipe book MVP | MVP | Built |
| 002 | Shopping list | Feature | Designed |
