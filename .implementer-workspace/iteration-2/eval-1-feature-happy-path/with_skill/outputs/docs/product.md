# Taskboard

## Vision
Taskboard is the shared to-do list of a small team that works in one room. It exists so that the things everyone keeps shouting across the room are written down in one place that anybody can look at.

## Problem
A team of four to eight people currently tracks shared work on a whiteboard and in chat messages. Items get lost when the whiteboard is wiped and when chat scrolls away, and nobody knows what is already done. Existing task tools are built for projects with roles, sprints and permissions, which is more than this team wants to maintain.

## Target users
- **Team member**: works in the shared room, adds items as they come up and ticks them off when finished. Uses Taskboard on a phone while standing, and on a laptop while sitting. Has no account and no role: everybody may do everything.

## Core value
Writing something down and ticking it off must take seconds and must never fail. Everything else is secondary.

## Non-goals
- Not a project management tool: no projects, sprints, estimates or reports.
- Not a multi-tenant product: one team, one list, one installation.
- No user accounts, roles or permissions.

## Glossary
- **Task**: one item on the shared list, with a title and a done state.
- **Open task**: a task that is not done.
- **The list**: all tasks of the team, open and done.

## Requirements index
| # | Title | Type | Status |
|---|---|---|---|
| 001 | Task list | MVP | Validated |
| 002 | Due dates and overdue tasks | Feature | Implemented – ready for validation |
