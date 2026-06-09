# TodoWidget Design Spec
Date: 2026-06-09

## Overview

A minimal Windows desktop TODO app built with Vue 3 + Electron, modeled after weektodo's architecture. Core value: a calendar where every date cell shows a live preview of its todos, enabling at-a-glance overview across day/week/month views.

## Tech Stack

- **Frontend:** Vue 3 + Vuex (same as weektodo)
- **Desktop shell:** Electron (reuse weektodo's `background.js` pattern)
- **Build:** Vue CLI + electron-builder (same as weektodo)
- **Storage:** `electron-store` (replaces weektodo's localStorage + IndexedDB; stores data as JSON files in `userData/`)
- **Styling:** Bootstrap + Bootstrap Icons + SCSS (same as weektodo)
- **Date handling:** moment.js (same as weektodo)

## Architecture

Follows weektodo's layered pattern: Vue components → Vuex store → repositories → storage.

```
todowidget/
├── src/
│   ├── App.vue                        # Root layout: sidebar + main panel
│   ├── main.js                        # Vue + Vuex entry
│   ├── background.js                  # Electron main process (IPC handlers)
│   ├── components/
│   │   ├── layout/
│   │   │   └── sideBar.vue            # Left panel: calendar + view switcher
│   │   ├── toDoList.vue               # Right panel: todo list for selected date/week/month
│   │   ├── toDoItem.vue               # Single todo row: checkbox, text, delete
│   │   └── listHeader.vue             # Header: date label + add button
│   ├── views/
│   │   └── toDoModal/
│   │       └── toDoModal.vue          # Add/edit todo modal (text input + date picker)
│   ├── repositories/
│   │   ├── storageRepository.js       # Wraps electron-store: get/set/remove (config)
│   │   └── todoRepository.js          # Wraps electron-store: CRUD for todos keyed by date
│   ├── store/
│   │   ├── store.js                   # Vuex root
│   │   └── modules/
│   │       ├── todolist.store.js      # Todo state: todoLists{date→[]} + selectedDate
│   │       └── config.store.js        # Config state: activeView (day/week/month), etc.
│   ├── helpers/
│   │   └── dateHelper.js              # Week range, month grid, YYYY-MM-DD formatting
│   └── assets/
│       └── style/
│           ├── globalVars.scss        # Colors, spacing variables
│           └── main.scss              # Global styles
├── vue.config.js
└── package.json
```

**Data flow:**
```
User action
  → Vue component emits
    → Vuex mutation (updates state)
      → Vuex action calls repository
        → repository writes to electron-store (JSON file in userData/)
```

On app start: `background.js` → IPC loads `todos.json` + `config.json` → Vuex hydrated.

## Storage Layer

weektodo uses `storageRepository` (localStorage) for config and `dbRepository` (IndexedDB) for todos. We replace both with `electron-store`, keeping the same repository interface:

```js
// storageRepository.js — config (reads/writes config.json)
export default {
  get(key) { return store.get(key) },
  set(key, val) { store.set(key, val) },
}

// todoRepository.js — todos keyed by date (reads/writes todos.json)
export default {
  get(date) { return store.get(date) ?? [] },         // returns [] for "2026-06-10"
  set(date, todos) { store.set(date, todos) },
  remove(date) { store.delete(date) },
  getAll() { return store.store },                    // full {date→todos[]} map
}
```

Vuex actions call these repositories — components never touch storage directly.

## Data Model

```js
// Single todo object (stored inside date-keyed arrays)
{
  id: "uuid-v4",
  text: "回复邮件",
  checked: false,
  createdAt: 1749456000000
}

// todos.json on disk (electron-store)
{
  "2026-06-09": [ { id, text, checked, createdAt }, ... ],
  "2026-06-10": [ ... ],
}

// config.json on disk
{
  activeView: "month",          // "day" | "week" | "month"
  selectedDate: "2026-06-09",   // currently focused date
  weekStartOnMonday: true
}
```

## Views

### Month View (default)
- 6-row × 7-col calendar grid
- Each cell: date number + up to 2 todo text previews (ellipsis if long) + "+N" overflow badge
- Today highlighted with accent color; dates with todos get a dot indicator
- Click any cell → sets `selectedDate` → detail panel updates below (or right side)

### Week View
- 7 columns (Mon–Sun of selected week)
- Each column: date label + scrollable todo list + inline `+` add button at bottom
- Taller cells than month view; shows more preview lines

### Day View
- Full todo list for `selectedDate`
- All todos shown with full text, no truncation
- Add input always visible at bottom

### View Switcher
- `[日][周][月]` buttons in top bar
- Switches calendar rendering; `selectedDate` preserved across switches

## Core Interactions

| Action | Trigger |
|--------|---------|
| Add todo | Click `+` or press Enter in add input → `toDoModal` or inline |
| Complete todo | Click checkbox → `checked: true` → strikethrough style |
| Delete todo | Hover row → click `×` |
| Navigate calendar | `<` `>` arrows on calendar header |
| Select date | Click any calendar cell |
| Switch view | Click `[日]` `[周]` `[月]` |

## Removed from weektodo

- Repeating events (store modules, repositories, modal)
- Multi-language / i18n
- Notifications
- Payment / donate modals
- Splash screen
- Active todo tracking
- Export/import tool
- Migrations system
- Sentry error tracking
- Custom todo lists (just date-keyed lists)

## Out of Scope (v1)

- Dark/light theme toggle
- Search / filter
- Priority levels / tags
- Reminders / system notifications
- Sub-tasks
- Cloud sync
