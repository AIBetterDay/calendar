# Todos Connector

> Capture, schedule and complete actionable todos with calendar-aware reminders.

A first-party AIBetterDay connector that ships with the Better app. It is the
reference implementation for the connector architecture: full SQLite storage,
six agent skills (`list`/`get`/`create`/`update`/`bulk_update`/`delete`), an
embedded React UI, sidebar + launcher slots, undo via reverse handlers, and
calendar-aware time placement.

## Layout

```
manifest.json          # Connector metadata + storage schema + skill catalogue + slots
PROMPT.md              # Agent guidance loaded when the connector is in scope
ui/                    # React app served at /c/todo via the host iframe
  src/App.tsx
  src/main.tsx
  index.html
  vite.config.ts
skills/                # Node.js skill process forked by the host
  src/main.ts          # registerSkill(...) for each public skill
```

## Storage

All rows live in the host's central SQLite, isolated to the table prefix
`c_todo_`. The connector sees them as a bare `items` table; the host rewrites
references at SQL parse time. See `manifest.json -> storage.tables[0]`.

## Development

From the repo root:

```bash
pnpm --filter @connector/todo-skills build
pnpm --filter @connector/todo-ui build
```

Hot-reload happens automatically via the host's chokidar watcher when running
the server in dev mode.

## Migrating from the legacy in-host todos module

The legacy module previously exposed `todos_create`, `todos_list`, etc. through
the host's compile-time agent registry and stored rows in the global `todos`
table. After this migration:

- Rows live in `c_todo_items` (data is migrated by the host's bootstrap code,
  not by this connector).
- Tool names are now `todo.list`, `todo.create`, etc. The host's agent
  registry maps the legacy `todos_*` names to the new connector skills for
  conversation-history compatibility.
- `goalId` was removed: legacy goals↔todos coupling is dropped per design.
