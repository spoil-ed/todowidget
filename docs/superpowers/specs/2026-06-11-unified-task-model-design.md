# Unified Task Model — Design Spec

Date: 2026-06-11  
Version target: v2.0.0

## Overview

Merge all three task stores (todos, events, backlogs) into a single unified `tasks` store. Replace three separate views (BacklogView, DeadlineView, AddBacklogModal/AddEventModal/TodoModal) with one TaskListView and one AddTaskModal. Sidebar reduces from 3 tabs to 2.

## 1. Data Model

Single flat array stored at `localStorage['tasks']`.

```js
{
  id,        // string, e.g. 'task_001'
  text,      // string
  kind,      // 'event' | 'ddl' | 'day' | 'free'
  checked,   // boolean

  // event / ddl / day:
  date,      // 'YYYY-MM-DD' (null for free)

  // event only:
  startTime, // 'HH:mm'
  endTime,   // 'HH:mm'

  // ddl only:
  ddl,       // 'YYYY-MM-DD HH:mm' or 'YYYY-MM-DD'

  // free only (optional):
  subtasks,  // [{ id, text, checked }]
}
```

| kind | Meaning | Required fields |
|------|---------|----------------|
| `event` | Timed meeting/schedule | date, startTime, endTime |
| `ddl` | Task with deadline | date, ddl |
| `day` | Task for a specific day | date |
| `free` | No-date backlog task | — |

## 2. Migration

On app startup, `tasks.store.js` runs a one-time migration:

- Read `localStorage['todos']` → convert each entry to `kind: 'ddl'` (if has `ddl` field) or `kind: 'day'`; preserve date from key
- Read `localStorage['events']` → convert each to `kind: 'event'`; map `title` → `text`
- Read `localStorage['backlog']` → convert each to `kind: 'free'`; map `status === 'done'` → `checked: true`
- Write merged array to `localStorage['tasks']`
- Delete old keys

## 3. Store (tasks.store.js)

Replaces `todolist.store.js`, `events.store.js`, `backlog.store.js`.

Key getters:
- `tasksForDate(date)` — event + day + ddl tasks for a date
- `overdueTasks` — unchecked ddl tasks past deadline
- `freeTasks` — all free tasks

Actions: `addTask`, `toggleTask`, `deleteTask`, `updateTask`

## 4. Navigation

Sidebar: 2 tabs — **日历** / **待办**

Below mini calendar: selected date task summary (event + day + ddl tasks for that date, simple list). Clicking jumps to calendar day view.

## 5. Views

### WidgetView (unchanged)
Desktop widget reads `tasksForDate(today)` — no changes needed to WidgetView itself.

### Calendar page (existing, data source updated)
- TimelinePanel: reads `event` tasks for time blocks, `ddl` tasks for deadline markers
- DayView: day task list reads `day` tasks for selected date
- Week/Month views: unchanged layout, data from tasks store

### TaskListView (new, replaces BacklogView + DeadlineView)

Sections in order:
1. **逾期** — unchecked ddl tasks past deadline (red)
2. **今日** — all tasks where `date === today` (event + day + ddl)
3. **近期** — future tasks grouped by date
4. **自由任务** — free tasks; completed items collapsed

## 6. AddTaskModal (new, replaces 3 modals)

Fields:
- Text input (required)
- Date picker (optional; clearing = free task)
- Kind toggle — **日程 / 截止 / 任务** (hidden when no date)
  - 日程 → shows startTime / endTime fields
  - 截止 → shows optional ddl time field
  - 任务 → no extra fields (default)
- Kind inferred: no date → `free`; date + toggle selection → respective kind

## 7. Files

### Deleted
```
src/views/BacklogView.vue
src/views/DeadlineView.vue
src/views/AddBacklogModal.vue
src/views/AddEventModal.vue
src/store/modules/backlog.store.js
src/store/modules/events.store.js
src/store/modules/todolist.store.js
src/repositories/backlogRepository.js
src/repositories/eventsRepository.js
src/repositories/todoRepository.js
src/components/BacklogItem.vue
```

### Added
```
src/store/modules/tasks.store.js
src/repositories/tasksRepository.js
src/views/TaskListView.vue
src/views/AddTaskModal.vue
```

### Modified
```
src/App.vue                        — simplify routing, swap modal
src/components/layout/SideBar.vue  — 2 tabs + date summary section
src/components/DayView.vue         — read from tasks store
src/components/TimelinePanel.vue   — event/ddl from tasks store
src/store/store.js                 — register tasks module, remove old modules
```
