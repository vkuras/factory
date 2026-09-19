# Household Recipes

## Vision
A shared recipe collection for one household. Every member can read it on their phone, and it is comfortable to use at the stove. It replaces the owner's current Markdown-in-Git recipe collection completely.

## Problem
The owner keeps about 15 recipes as Markdown files in a Git repository. This causes two problems:
- The family cannot get at the recipes without Git. This is the main pain.
- Reading a recipe on a phone in the kitchen is awkward.

Today the owner is the only one with real access, and cooking from the recipes on a phone is uncomfortable.

## Target users
- **Owner**: the stakeholder. Sets up the household, brings in the existing recipes, and is the only one who can remove members. Otherwise has the same rights as every member.
- **Members**: the owner's wife now, and the children later. That makes 2–4 people, all in one household, all with equal rights. They read all recipes, add their own, and edit or delete only their own.
- **Context of use**: on an iPhone in the kitchen while cooking. The phone often leans somewhere, and Wi-Fi in the kitchen is poor.

## Core value
1. Everyone in the household can reach all recipes easily, without any technical knowledge.
2. Cooking from a recipe on the phone is comfortable. The text is large, the screen stays on, portions can be scaled, and it works without internet.

## Non-goals
- No sharing beyond one household: no public recipes, no multiple households, no social features.
- Not a meal planner, at least not yet. A weekly plan is parked for later.
- Not a step-by-step cooking assistant: no checking off ingredients or steps, no one-step-per-screen mode.
- No continued editing in Markdown. After the one-time import, the app is the only source of recipes.

## Glossary
- **Household**: the single group of people who share one recipe collection.
- **Owner**: the household member who set up the household (the stakeholder). The only one who can remove members.
- **Member**: any person in the household, including the owner.
- **Recipe**: title, number of portions, exactly one category, a list of ingredients, preparation text, and optionally one photo.
- **Creator**: the member a recipe belongs to. Only the creator can change or delete it. Imported recipes belong to the owner.
- **Category**: one of a fixed list: Hauptgerichte (main dishes), Beilagen (side dishes), Soßen (sauces).
- **Cooking view**: how a recipe is shown while cooking. The text is large, the screen stays on, and portions can be scaled.
- **Scaling**: temporarily converting ingredient amounts to a different number of portions, without changing the saved recipe.
- **Invitation**: a single-use link or code with which a new person joins the household.

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Household recipes MVP | MVP | Groomed |
