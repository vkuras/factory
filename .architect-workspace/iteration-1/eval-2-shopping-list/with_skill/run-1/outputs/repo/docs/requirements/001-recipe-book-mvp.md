# 001 – Recipe book MVP

- Type: MVP
- Status: Built

## Summary
A household can keep its recipes in one place, scale servings and cook step by step.

## Stories (abridged)
- S1 Household members see all recipes of the household; only the creator edits a recipe.
- S2 Browse by category and search by recipe name.
- S3 Change servings; ingredient quantities are recalculated.
- S4 Cooking mode with large text, step by step; opened recipes stay usable without internet.
- S5 One-time import of the existing Markdown recipes.
- S6 Optional photo per recipe.

## Later
- Weekly meal plan.

## Quality expectations (abridged)
- At least 10 people can use the app at the same time without it becoming noticeably slower.
- User interface language: German.

## Stakeholder technical constraints
- "Soll in Kotlin gebaut werden."
- "Frontend, Backend und Datenbank sollen zusammen dockerisiert auf meinem Raspberry Pi 5 mit 4 GB RAM laufen, und das Ganze muss mindestens 10 gleichzeitige User abkönnen."
