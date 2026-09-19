# Household Recipe App (working name)

## Vision
A private recipe app for one household that replaces a Git repository of Markdown files. Everyone in the household can look up recipes easily and cook from them.

## Problem
The stakeholder (Viktor) keeps his recipes as Markdown files in a Git repository. On a phone they cannot be viewed properly, so he has to open the repository on his laptop. His wife cannot access them at all because they sit in a Git repository. The kitchen Wi-Fi is poor.

## Target users
- **Household member** (today: Viktor and his wife; later possibly their children). Each member has their own access and can view all of the household's recipes. They add and maintain their own recipes on a phone or laptop.
- **Context of use**: while cooking, a phone or tablet stands in the kitchen, where the Wi-Fi is poor. Recipes are created and edited on a phone or laptop.

## Core value
- Every recipe is readable on a phone or tablet in the kitchen, including without a connection, and is easy to follow one step at a time.
- The whole household can use it, not only the person who wrote the recipes.

Success criterion (stakeholder's words): "Wenn ich das Git Repo nicht mehr anfass und meine Frau die App wirklich benutzt." Viktor no longer touches the Git repository, and his wife actually uses the app.

## Non-goals
- No nutrition information, ratings or comments.
- No advertising.
- No public sharing. Recipes are visible only inside the household.

## Glossary
- **Household**: the private group of people who share recipes. Only household members can see its recipes.
- **Household member**: a person with their own access to the household.
- **Recipe**: title, one category, servings, ingredient list, steps (optionally grouped into sections) and optionally one photo.
- **Owner**: the household member who created a recipe (for imported recipes, Viktor). Only the owner can edit or delete it.
- **Category**: a label that groups recipes (e.g. Hauptgerichte, Beilagen, Soßen). Each recipe has exactly one.
- **Servings**: the number of people a recipe is written for. It is the basis for portion scaling.
- **Portion scaling**: temporarily viewing a recipe for a different number of servings, with ingredient amounts recalculated.
- **Cooking mode**: a view that shows one step at a time in large type while the screen stays on.

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Recipe app MVP | MVP | Architected ([architecture](architecture.md)) |
