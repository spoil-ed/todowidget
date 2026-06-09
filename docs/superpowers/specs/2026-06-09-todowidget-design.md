# TodoWidget Design Spec
Date: 2026-06-09

## Overview

A minimal Windows desktop TODO app built with Vue 3 + Electron, inspired by weektodo's style. Core value: a calendar where every date cell shows a live preview of its todos, enabling at-a-glance overview across day/week/month views.

## Tech Stack

- **Frontend:** Vue 3 + Vuex
- **Desktop shell:** Electron (reuse weektodo's `background.js` setup)
- **Build:** Vue CLI + electron-builder (same as weektodo)
- **Storage:** Local JSON file via `electron-config` (`userData/todos.json`)
- **Styling:** Bootstrap + Bootstrap Icons (already in weektodo)

## Architecture

```
todowidget/
├── src/
│   ├── App.vue                 # Root layout: CalendarPanel + detail pane
│   ├── main.js                 # Vue entry
│   ├── background.js           # Electron main process
│   ├── components/
│   │   ├── CalendarPanel.vue   # Calendar with inline todo previews; view switcher
│   │   ├── TodoList.vue        # Full todo list for selected date
│   │   ├── TodoItem.vue        # Single todo row: checkbox, text, delete
│   │   └── AddTodo.vue         # Input bar: press Enter to add
│   ├── store/
│   │   ├── store.js
│   │   └── modules/
│   │       ├── todos.store.js  # CRUD + date-indexed lookup
│   │       └── config.store.js # Active view (day/week/month) + selected date
│   └── helpers/
│       └── date.js             # Week range, month grid, formatting helpers
└── package.json
```

**Data flow:** User action → Vuex action → write `todos.json` → component reactivity

**Removed from weektodo:** repeating events, sentry, i18n, payment modal, splash screen, cryptocurrency icons, link list.

## Data Model

```json
{
  "todos": [
    {
      "id": "uuid-v4",
      "text": "回复邮件",
      "done": false,
      "date": "2026-06-10",
      "createdAt": 1749456000000
    }
  ]
}
```

- `date` is `YYYY-MM-DD` string — the key for all calendar lookups.
- No sub-tasks, no priorities, no tags in v1.

## Views

### Month View (default)
- 6-row × 7-col calendar grid
- Each cell: date number + up to 2 todo text previews (truncated) + overflow count if more
- Clicking a cell sets selected date → detail pane slides in at bottom (or right panel on wide screens)
- Today highlighted; dates with todos get a subtle dot indicator

### Week View
- 7 columns for Mon–Sun of the selected week
- Each column: full date label + scrollable todo list + `+` add button inline
- Taller cells, more preview lines visible

### Day View
- Single-day full list
- All todos for selected date, full text, no truncation
- Add input always visible at bottom

### View Switcher
- Three buttons `[日][周][月]` in the top bar
- Switches CalendarPanel rendering mode; selected date is preserved across switches

## Core Interactions

| Action | Trigger |
|--------|---------|
| Add todo | Type in AddTodo input → press Enter |
| Complete todo | Click checkbox → strikethrough style |
| Delete todo | Hover todo row → click `×` button |
| Navigate calendar | `<` `>` arrows on calendar header |
| Select date | Click any calendar cell |
| Switch view | Click `[日]` `[周]` `[月]` buttons |

## Persistence

- On every Vuex mutation that modifies todos, write full `todos` array to `userData/todos.json` via Electron IPC.
- On app start, load `todos.json` into Vuex store.
- No sync, no cloud, no backup in v1.

## What's Out of Scope (v1)

- Recurring tasks
- Priority levels / tags
- Dark/light theme toggle
- Search
- Notifications / reminders
- Mobile / web version
