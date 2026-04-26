# Todos

Capture what needs to happen, place it on your calendar, and let Better help you keep the list moving.

[中文](./README.zh-CN.md)

## Why It Helps

Todos is built for the moment when a thought becomes an action. Add a task in plain language, give it a date or reminder, and review everything from a focused list or calendar view.

## What You Can Do

- Capture tasks with title, notes, priority, tags, subtasks, due dates, repeat rules, and reminders.
- Plan by time with calendar-aware day, week, and month views.
- Ask Better to find overdue work, reschedule a group, complete errands, or clean up a list.
- Keep status, priority, reminders, and context visible in the same workspace.

## Example Requests

- “Remind me to renew the passport next Friday morning.”
- “Show overdue todos and move the low priority ones to next week.”
- “Mark everything tagged errands as completed.”

## Interface Preview

Product screenshots and short demos will live in `assets/store/`. They are intentionally not checked in yet; the store page will be updated again after real product images are added.

## Chat Cards

When this connector returns structured results in Better chat, render them as product cards from `ui/src/cards/` instead of exposing raw JSON or long plain text. Card assets and styles should stay with the UI code.

## Privacy

Todos stores task data inside Better on your device. It does not contact external services and only uses its own connector storage.

## Maintainer Docs

Technical notes, build steps, and release guidance live in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md). Store media and chat-card conventions live in [docs/STORE_ASSETS.md](./docs/STORE_ASSETS.md).
