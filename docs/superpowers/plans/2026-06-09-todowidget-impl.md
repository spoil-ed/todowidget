# TodoWidget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Windows Electron TODO app with day/week/month calendar views, where each date cell shows inline todo previews.

**Architecture:** Vue 3 + Vuex for UI; Electron main process holds electron-store (JSON files in userData); renderer communicates via IPC. Repositories abstract all storage. Three calendar views (day/week/month) share one Vuex state, all dates in `YYYY-MM-DD` format aligned to Beijing time (UTC+8, moment.js locale zh-cn).

**Tech Stack:** Vue 3, Vuex 4, Electron 25, electron-store, Bootstrap 5, Bootstrap Icons, moment.js (zh-cn locale), Vue CLI + electron-builder.

---

## File Map

| File | Role |
|------|------|
| `package.json` | Dependencies + scripts |
| `vue.config.js` | Electron + build config |
| `babel.config.js` | Babel preset |
| `src/background.js` | Electron main: window, tray, IPC handlers, electron-store |
| `src/main.js` | Vue entry: async load data → hydrate Vuex → mount |
| `src/App.vue` | Root layout: TopBar + CalendarArea + DetailPanel |
| `src/components/layout/SideBar.vue` | Mini month calendar (navigation only) + view switcher |
| `src/components/MonthView.vue` | 6×7 grid, each cell shows date + todo previews |
| `src/components/WeekView.vue` | 7-column grid, each column = full todo list |
| `src/components/DayView.vue` | Single-date full todo list + add input |
| `src/components/TodoItem.vue` | Single todo row: checkbox + text + delete |
| `src/views/TodoModal.vue` | Modal: text input + date picker for adding todo |
| `src/repositories/todoRepository.js` | IPC calls to main process for todos CRUD |
| `src/repositories/storageRepository.js` | IPC calls to main process for config CRUD |
| `src/store/store.js` | Vuex root |
| `src/store/modules/todolist.store.js` | State: `todoLists {date→Todo[]}`, `selectedDate` |
| `src/store/modules/config.store.js` | State: `activeView`, `weekStartOnMonday` |
| `src/helpers/dateHelper.js` | Pure fns: weekRange, monthGrid, today (UTC+8) |
| `src/assets/style/globalVars.scss` | Color + spacing variables |
| `src/assets/style/main.scss` | Global styles |
| `tests/dateHelper.test.js` | Jest unit tests for dateHelper |
| `public/index.html` | HTML entry |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vue.config.js`
- Create: `babel.config.js`
- Create: `.eslintrc.js`
- Create: `public/index.html`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "todowidget",
  "version": "1.0.0",
  "private": true,
  "description": "Minimal Windows TODO app with calendar views",
  "author": "TodoWidget",
  "main": "background.js",
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint",
    "electron:build": "vue-cli-service electron:build",
    "electron:serve": "vue-cli-service electron:serve",
    "postinstall": "electron-builder install-app-deps",
    "test": "jest"
  },
  "dependencies": {
    "bootstrap": "^5.3.0",
    "bootstrap-icons": "^1.10.5",
    "core-js": "^3.20.1",
    "electron-store": "^8.1.0",
    "lodash.uniqueid": "^4.0.1",
    "moment": "^2.29.1",
    "vue": "^3.2.26",
    "vuex": "^4.0.2",
    "webpack": "4.46.0"
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "^4.5.15",
    "@vue/cli-plugin-eslint": "^4.5.15",
    "@vue/cli-service": "^4.5.15",
    "@vue/compiler-sfc": "^3.2.26",
    "babel-eslint": "^10.1.0",
    "babel-jest": "^29.0.0",
    "electron": "^25.0.1",
    "electron-devtools-installer": "^3.1.0",
    "eslint": "^6.7.2",
    "eslint-plugin-vue": "^7.20.0",
    "jest": "^29.0.0",
    "sass": "^1.69.5",
    "sass-loader": "^10",
    "vue-cli-plugin-electron-builder": "~2.0.0-rc.6"
  },
  "resolutions": {
    "vue-cli-plugin-electron-builder/electron-builder": "^23.0.3"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {
      "^.+\\.js$": "babel-jest"
    },
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

- [ ] **Step 2: Create `vue.config.js`**

```js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "com.todowidget.app",
        productName: "TodoWidget",
        win: {
          target: ["nsis"],
          icon: "build/icon.ico",
        },
      },
    },
  },
}
```

- [ ] **Step 3: Create `babel.config.js`**

```js
module.exports = {
  presets: [
    ["@vue/cli-plugin-babel/preset"],
  ],
  env: {
    test: {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]],
    },
  },
}
```

- [ ] **Step 4: Create `.eslintrc.js`**

```js
module.exports = {
  root: true,
  env: { node: true },
  extends: ["plugin:vue/vue3-essential", "eslint:recommended"],
  parserOptions: { parser: "babel-eslint" },
  rules: { "no-console": "off" },
}
```

- [ ] **Step 5: Create `public/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TodoWidget</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: node_modules created, no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json vue.config.js babel.config.js .eslintrc.js public/
git commit -m "feat: project scaffold"
```

---

## Task 2: SCSS Styles

**Files:**
- Create: `src/assets/style/globalVars.scss`
- Create: `src/assets/style/main.scss`

- [ ] **Step 1: Create `src/assets/style/globalVars.scss`**

```scss
:root {
  --primary: #4a9eff;
  --primary-light: #e8f3ff;
  --text: #24292e;
  --text-muted: #6a737d;
  --border: #e1e4e8;
  --bg: #ffffff;
  --bg-hover: #f6f8fa;
  --today-bg: #fff3cd;
  --done-color: #6a737d;
  --cell-min-height: 100px;
}
```

- [ ] **Step 2: Create `src/assets/style/main.scss`**

```scss
@import "globalVars";

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  height: 100vh;
  overflow: hidden;
}

#app { height: 100vh; display: flex; flex-direction: column; }

.app-topbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-shrink: 0;
  -webkit-app-region: drag;

  .app-title { font-weight: 600; font-size: 15px; flex: 1; }

  .view-switcher {
    -webkit-app-region: no-drag;
    display: flex;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;

    button {
      border: none;
      background: none;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 13px;
      &.active { background: var(--primary); color: white; }
      &:hover:not(.active) { background: var(--bg-hover); }
    }
  }

  .nav-arrows {
    -webkit-app-region: no-drag;
    display: flex;
    gap: 4px;
    button {
      border: 1px solid var(--border);
      background: none;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { background: var(--bg-hover); }
    }
  }

  .current-label { font-size: 14px; font-weight: 500; min-width: 120px; }
}

.app-body {
  flex: 1;
  overflow: hidden;
  display: flex;
}

// Month view
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(var(--cell-min-height), 1fr);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  flex: 1;
  overflow-y: auto;
}

.month-day-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-left: 1px solid var(--border);
  flex-shrink: 0;

  .day-name {
    padding: 6px 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
}

.month-cell {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 6px;
  cursor: pointer;
  overflow: hidden;

  &:hover { background: var(--bg-hover); }
  &.today { background: var(--today-bg); }
  &.selected { outline: 2px solid var(--primary); outline-offset: -2px; }
  &.other-month .cell-date { color: var(--text-muted); }

  .cell-date {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .cell-todo-preview {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    &.done { text-decoration: line-through; }
  }

  .cell-overflow {
    font-size: 11px;
    color: var(--primary);
    margin-top: 2px;
  }
}

// Week view
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  overflow: hidden;
  border-left: 1px solid var(--border);
}

.week-column {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.today .week-col-header { background: var(--today-bg); }
  &.selected .week-col-header { color: var(--primary); }

  .week-col-header {
    padding: 8px;
    text-align: center;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    cursor: pointer;

    .col-weekday { font-size: 11px; font-weight: 600; color: var(--text-muted); }
    .col-date { font-size: 18px; font-weight: 600; }

    &:hover { background: var(--bg-hover); }
  }

  .week-col-todos {
    flex: 1;
    overflow-y: auto;
    padding: 6px 4px;
  }

  .week-col-add {
    padding: 4px 6px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;

    input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 12px;
      padding: 4px;
      background: transparent;
      color: var(--text-muted);
      &::placeholder { color: #bbb; }
    }
  }
}

// Day view
.day-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;

  .day-view-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .day-todos {
    flex: 1;
    overflow-y: auto;
  }

  .day-add-input {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    align-items: center;

    input {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
      &:focus { border-color: var(--primary); }
    }

    button {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 14px;
      &:hover { opacity: 0.9; }
    }
  }
}

// TodoItem
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 4px;
  position: relative;

  &:hover { background: var(--bg-hover); }
  &:hover .todo-delete { opacity: 1; }

  input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; cursor: pointer; accent-color: var(--primary); }

  .todo-text {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }

  &.done .todo-text { text-decoration: line-through; color: var(--done-color); }

  .todo-delete {
    opacity: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0 2px;
    font-size: 14px;
    transition: opacity 0.15s;
    flex-shrink: 0;

    &:hover { color: #e53e3e; }
  }
}

// Month detail panel
.month-detail-panel {
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg);

  .detail-header {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .detail-add-input {
    display: flex;
    gap: 8px;
    margin-top: 8px;

    input {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      outline: none;
      &:focus { border-color: var(--primary); }
    }
  }
}

// Modal
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  border-radius: 10px;
  padding: 24px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);

  h3 { margin: 0 0 16px; font-size: 16px; }

  input, select {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    margin-bottom: 12px;
    outline: none;
    &:focus { border-color: var(--primary); }
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;

    button {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--border);
      cursor: pointer;
      font-size: 14px;
      &.primary { background: var(--primary); color: white; border-color: var(--primary); }
      &:hover { opacity: 0.9; }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/
git commit -m "feat: add SCSS styles"
```

---

## Task 3: Date Helper

**Files:**
- Create: `src/helpers/dateHelper.js`
- Create: `tests/dateHelper.test.js`

- [ ] **Step 1: Write failing tests first — `tests/dateHelper.test.js`**

```js
const { today, weekRange, monthGrid, formatDate, parseDate } = require('../src/helpers/dateHelper')

describe('today()', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDate()', () => {
  it('formats moment to YYYY-MM-DD', () => {
    const moment = require('moment')
    expect(formatDate(moment('2026-06-09'))).toBe('2026-06-09')
  })
})

describe('parseDate()', () => {
  it('parses YYYY-MM-DD string to moment', () => {
    const m = parseDate('2026-06-09')
    expect(m.format('YYYY-MM-DD')).toBe('2026-06-09')
  })
})

describe('weekRange()', () => {
  it('returns 7 dates starting Monday for given date', () => {
    const dates = weekRange('2026-06-09') // Tuesday
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-06-08') // Monday
    expect(dates[6]).toBe('2026-06-14') // Sunday
  })

  it('returns Mon-Sun for a Monday input', () => {
    const dates = weekRange('2026-06-08')
    expect(dates[0]).toBe('2026-06-08')
    expect(dates[6]).toBe('2026-06-14')
  })
})

describe('monthGrid()', () => {
  it('returns 6 weeks × 7 days for 2026-06', () => {
    const grid = monthGrid('2026-06-01')
    expect(grid).toHaveLength(6)
    grid.forEach(week => expect(week).toHaveLength(7))
  })

  it('each cell has date, isCurrentMonth, isToday fields', () => {
    const grid = monthGrid('2026-06-01')
    const cell = grid[0][0]
    expect(cell).toHaveProperty('date')
    expect(cell).toHaveProperty('isCurrentMonth')
    expect(cell).toHaveProperty('isToday')
    expect(cell.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('first cell of June 2026 grid is Monday 2026-06-01', () => {
    const grid = monthGrid('2026-06-01')
    expect(grid[0][0].date).toBe('2026-06-01')
  })
})
```

- [ ] **Step 2: Run tests — expect all FAIL**

```bash
npm test
```

Expected: `Cannot find module '../src/helpers/dateHelper'`

- [ ] **Step 3: Implement `src/helpers/dateHelper.js`**

```js
const moment = require('moment')
require('moment/locale/zh-cn')
moment.locale('zh-cn')

// Always interpret "today" as the local system clock (Beijing UTC+8 on target machine).
// moment.js uses the system timezone by default.

function today() {
  return moment().format('YYYY-MM-DD')
}

function formatDate(m) {
  return m.format('YYYY-MM-DD')
}

function parseDate(dateStr) {
  return moment(dateStr, 'YYYY-MM-DD')
}

// Returns array of 7 date strings [Mon, Tue, ... Sun] for the week containing dateStr.
function weekRange(dateStr) {
  const m = moment(dateStr, 'YYYY-MM-DD')
  // isoWeekday: 1=Mon, 7=Sun
  const monday = m.clone().isoWeekday(1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    dates.push(monday.clone().add(i, 'days').format('YYYY-MM-DD'))
  }
  return dates
}

// Returns a 6×7 grid of cell objects for the month containing dateStr.
// Grid always starts on Monday.
function monthGrid(dateStr) {
  const m = moment(dateStr, 'YYYY-MM-DD')
  const todayStr = today()
  const year = m.year()
  const month = m.month() // 0-based

  // Start of grid: Monday of the week containing the 1st of the month
  const firstOfMonth = moment({ year, month, day: 1 })
  const gridStart = firstOfMonth.clone().isoWeekday(1)

  const grid = []
  let cursor = gridStart.clone()
  for (let week = 0; week < 6; week++) {
    const row = []
    for (let day = 0; day < 7; day++) {
      row.push({
        date: cursor.format('YYYY-MM-DD'),
        isCurrentMonth: cursor.month() === month,
        isToday: cursor.format('YYYY-MM-DD') === todayStr,
      })
      cursor.add(1, 'day')
    }
    grid.push(row)
  }
  return grid
}

module.exports = { today, formatDate, parseDate, weekRange, monthGrid }
```

- [ ] **Step 4: Run tests — expect all PASS**

```bash
npm test
```

Expected: `5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/helpers/dateHelper.js tests/dateHelper.test.js
git commit -m "feat: date helper with tests (Beijing-timezone aware)"
```

---

## Task 4: Storage Repositories

**Files:**
- Create: `src/repositories/storageRepository.js`
- Create: `src/repositories/todoRepository.js`

These repositories use IPC to communicate with the main process where electron-store runs.

- [ ] **Step 1: Create `src/repositories/storageRepository.js`**

```js
// Config storage — IPC calls to main process (electron-store writes config.json)
function getIpc() {
  return require('electron').ipcRenderer
}

export default {
  get(key, defaultVal = null) {
    return getIpc().invoke('config:get', key, defaultVal)
  },
  set(key, val) {
    return getIpc().invoke('config:set', key, val)
  },
  getAll() {
    return getIpc().invoke('config:getAll')
  },
}
```

- [ ] **Step 2: Create `src/repositories/todoRepository.js`**

```js
// Todo storage — IPC calls to main process (electron-store writes todos.json)
function getIpc() {
  return require('electron').ipcRenderer
}

export default {
  // Returns array of todos for a specific date string (YYYY-MM-DD)
  get(date) {
    return getIpc().invoke('todos:get', date)
  },
  // Returns full map: { "2026-06-09": [...], ... }
  getAll() {
    return getIpc().invoke('todos:getAll')
  },
  // Overwrites the full array for that date
  set(date, todos) {
    return getIpc().invoke('todos:set', date, todos)
  },
  remove(date) {
    return getIpc().invoke('todos:remove', date)
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/
git commit -m "feat: storage repositories (IPC wrappers)"
```

---

## Task 5: Vuex Store

**Files:**
- Create: `src/store/modules/config.store.js`
- Create: `src/store/modules/todolist.store.js`
- Create: `src/store/store.js`

- [ ] **Step 1: Create `src/store/modules/config.store.js`**

```js
import storageRepository from '../../repositories/storageRepository'

const state = {
  activeView: 'month',       // 'day' | 'week' | 'month'
  selectedDate: '',          // YYYY-MM-DD, set on app init
  weekStartOnMonday: true,
}

const getters = {
  activeView: s => s.activeView,
  selectedDate: s => s.selectedDate,
}

const mutations = {
  setActiveView(state, view) {
    state.activeView = view
    storageRepository.set('activeView', view)
  },
  setSelectedDate(state, date) {
    state.selectedDate = date
    storageRepository.set('selectedDate', date)
  },
  initConfig(state, cfg) {
    if (cfg.activeView) state.activeView = cfg.activeView
    if (cfg.selectedDate) state.selectedDate = cfg.selectedDate
  },
}

export default { namespaced: false, state, getters, mutations }
```

- [ ] **Step 2: Create `src/store/modules/todolist.store.js`**

```js
import todoRepository from '../../repositories/todoRepository'
import uniqueId from 'lodash.uniqueid'

const state = {
  // { "2026-06-09": [ { id, text, checked, createdAt }, ... ] }
  todoLists: {},
}

const getters = {
  todoLists: s => s.todoLists,
  todosForDate: s => date => s.todoLists[date] || [],
}

const mutations = {
  initTodos(state, allTodos) {
    state.todoLists = allTodos || {}
  },
  setDateTodos(state, { date, todos }) {
    state.todoLists = { ...state.todoLists, [date]: todos }
  },
}

const actions = {
  addTodo({ commit, state }, { date, text }) {
    const todos = [...(state.todoLists[date] || [])]
    todos.push({ id: uniqueId('todo_'), text, checked: false, createdAt: Date.now() })
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  toggleTodo({ commit, state }, { date, id }) {
    const todos = (state.todoLists[date] || []).map(t =>
      t.id === id ? { ...t, checked: !t.checked } : t
    )
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  deleteTodo({ commit, state }, { date, id }) {
    const todos = (state.todoLists[date] || []).filter(t => t.id !== id)
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
```

- [ ] **Step 3: Create `src/store/store.js`**

```js
import { createStore } from 'vuex'
import todoLists from './modules/todolist.store'
import config from './modules/config.store'

export const store = createStore({
  modules: { config, todoLists },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
})
```

- [ ] **Step 4: Commit**

```bash
git add src/store/
git commit -m "feat: Vuex store (config + todolist modules)"
```

---

## Task 6: Electron Main Process

**Files:**
- Create: `src/background.js`

- [ ] **Step 1: Create `src/background.js`**

```js
'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const Store = require('electron-store')
const todoStore = new Store({ name: 'todos' })
const configStore = new Store({ name: 'config' })

const isDevelopment = process.env.NODE_ENV !== 'production'
const gotTheLock = app.requestSingleInstanceLock()

let mainWindow = null

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, stream: true } },
])

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
    },
  })

  mainWindow.removeMenu()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    mainWindow.loadURL('app://./index.html')
  }
}

// IPC: todos
ipcMain.handle('todos:getAll', () => todoStore.store)
ipcMain.handle('todos:get', (_, date) => todoStore.get(date, []))
ipcMain.handle('todos:set', (_, date, todos) => { todoStore.set(date, todos) })
ipcMain.handle('todos:remove', (_, date) => { todoStore.delete(date) })

// IPC: config
ipcMain.handle('config:getAll', () => configStore.store)
ipcMain.handle('config:get', (_, key, def) => configStore.get(key, def !== undefined ? def : null))
ipcMain.handle('config:set', (_, key, val) => { configStore.set(key, val) })

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      try { await installExtension(VUEJS_DEVTOOLS) } catch (e) { /* ignore */ }
    }
    createWindow()
  })

  if (isDevelopment) {
    if (process.platform === 'win32') {
      process.on('message', data => { if (data === 'graceful-exit') app.quit() })
    } else {
      process.on('SIGTERM', () => app.quit())
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/background.js
git commit -m "feat: Electron main process with electron-store IPC handlers"
```

---

## Task 7: Vue Entry Point

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Create `src/main.js`**

```js
import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store/store'
import todoRepository from './repositories/todoRepository'
import storageRepository from './repositories/storageRepository'
import moment from 'moment'
import 'moment/locale/zh-cn'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/style/globalVars.scss'
import './assets/style/main.scss'

// Always use Chinese locale and Beijing-compatible formatting.
// The system clock on a Beijing Windows machine is already UTC+8;
// moment.js reads from the system, so no manual offset is needed.
moment.locale('zh-cn')

async function init() {
  const [allTodos, allConfig] = await Promise.all([
    todoRepository.getAll(),
    storageRepository.getAll(),
  ])

  store.commit('initTodos', allTodos)
  store.commit('initConfig', {
    activeView: allConfig.activeView || 'month',
    selectedDate: allConfig.selectedDate || moment().format('YYYY-MM-DD'),
  })

  if (!store.getters.selectedDate) {
    store.commit('setSelectedDate', moment().format('YYYY-MM-DD'))
  }

  createApp(App).use(store).mount('#app')
}

init()
```

- [ ] **Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: Vue entry — async init, moment zh-cn locale"
```

---

## Task 8: TodoItem Component

**Files:**
- Create: `src/components/TodoItem.vue`

- [ ] **Step 1: Create `src/components/TodoItem.vue`**

```vue
<template>
  <div class="todo-item" :class="{ done: todo.checked }">
    <input
      type="checkbox"
      :checked="todo.checked"
      @change="$emit('toggle', todo.id)"
    />
    <span class="todo-text">{{ todo.text }}</span>
    <button class="todo-delete" @click="$emit('delete', todo.id)" title="删除">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TodoItem',
  props: {
    todo: { type: Object, required: true },
  },
  emits: ['toggle', 'delete'],
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TodoItem.vue
git commit -m "feat: TodoItem component"
```

---

## Task 9: DayView Component

**Files:**
- Create: `src/components/DayView.vue`

- [ ] **Step 1: Create `src/components/DayView.vue`**

```vue
<template>
  <div class="day-view">
    <div class="day-view-header">{{ headerLabel }}</div>
    <div class="day-todos">
      <todo-item
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo(todo.id)"
        @delete="deleteTodo(todo.id)"
      />
      <div v-if="todos.length === 0" style="color: var(--text-muted); font-size: 13px;">
        今天还没有待办事项
      </div>
    </div>
    <div class="day-add-input">
      <input
        ref="addInput"
        v-model="newText"
        placeholder="添加待办事项，按 Enter 确认"
        @keydown.enter="addTodo"
      />
      <button @click="addTodo">添加</button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import TodoItem from './TodoItem.vue'

export default {
  name: 'DayView',
  components: { TodoItem },
  data() {
    return { newText: '' }
  },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    todos() { return this.$store.getters.todosForDate(this.selectedDate) },
    headerLabel() {
      return moment(this.selectedDate, 'YYYY-MM-DD').format('YYYY年M月D日 dddd')
    },
  },
  methods: {
    addTodo() {
      const text = this.newText.trim()
      if (!text) return
      this.$store.dispatch('addTodo', { date: this.selectedDate, text })
      this.newText = ''
    },
    toggleTodo(id) {
      this.$store.dispatch('toggleTodo', { date: this.selectedDate, id })
    },
    deleteTodo(id) {
      this.$store.dispatch('deleteTodo', { date: this.selectedDate, id })
    },
  },
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DayView.vue
git commit -m "feat: DayView component"
```

---

## Task 10: WeekView Component

**Files:**
- Create: `src/components/WeekView.vue`

- [ ] **Step 1: Create `src/components/WeekView.vue`**

```vue
<template>
  <div class="week-grid">
    <div
      v-for="date in weekDates"
      :key="date"
      class="week-column"
      :class="{
        today: date === todayStr,
        selected: date === selectedDate,
      }"
    >
      <div class="week-col-header" @click="selectDate(date)">
        <div class="col-weekday">{{ weekdayLabel(date) }}</div>
        <div class="col-date">{{ dayLabel(date) }}</div>
      </div>
      <div class="week-col-todos">
        <todo-item
          v-for="todo in todosFor(date)"
          :key="todo.id"
          :todo="todo"
          @toggle="toggleTodo(date, todo.id)"
          @delete="deleteTodo(date, todo.id)"
        />
      </div>
      <div class="week-col-add">
        <input
          :placeholder="date === selectedDate ? '添加待办...' : '+'"
          @focus="selectDate(date)"
          v-model="addTexts[date]"
          @keydown.enter="addTodo(date)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { weekRange, today } from '../helpers/dateHelper'
import TodoItem from './TodoItem.vue'

export default {
  name: 'WeekView',
  components: { TodoItem },
  data() {
    return { addTexts: {} }
  },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    todayStr() { return today() },
    weekDates() { return weekRange(this.selectedDate) },
  },
  methods: {
    todosFor(date) { return this.$store.getters.todosForDate(date) },
    weekdayLabel(date) { return moment(date, 'YYYY-MM-DD').format('ddd') },
    dayLabel(date) { return moment(date, 'YYYY-MM-DD').format('D') },
    selectDate(date) { this.$store.commit('setSelectedDate', date) },
    addTodo(date) {
      const text = (this.addTexts[date] || '').trim()
      if (!text) return
      this.$store.dispatch('addTodo', { date, text })
      this.addTexts[date] = ''
    },
    toggleTodo(date, id) { this.$store.dispatch('toggleTodo', { date, id }) },
    deleteTodo(date, id) { this.$store.dispatch('deleteTodo', { date, id }) },
  },
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WeekView.vue
git commit -m "feat: WeekView component (7-column grid)"
```

---

## Task 11: MonthView Component

**Files:**
- Create: `src/components/MonthView.vue`

- [ ] **Step 1: Create `src/components/MonthView.vue`**

```vue
<template>
  <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
    <!-- Weekday headers -->
    <div class="month-day-header">
      <div class="day-name" v-for="name in weekdayNames" :key="name">{{ name }}</div>
    </div>

    <!-- Calendar grid -->
    <div class="month-grid">
      <div
        v-for="cell in flatGrid"
        :key="cell.date"
        class="month-cell"
        :class="{
          today: cell.isToday,
          selected: cell.date === selectedDate,
          'other-month': !cell.isCurrentMonth,
        }"
        @click="selectDate(cell.date)"
      >
        <div class="cell-date">{{ cell.dayNum }}</div>
        <div
          v-for="todo in previewTodos(cell.date)"
          :key="todo.id"
          class="cell-todo-preview"
          :class="{ done: todo.checked }"
        >{{ todo.text }}</div>
        <div v-if="overflowCount(cell.date) > 0" class="cell-overflow">
          +{{ overflowCount(cell.date) }} 项
        </div>
      </div>
    </div>

    <!-- Detail panel for selected date -->
    <div class="month-detail-panel" v-if="selectedDate">
      <div class="detail-header">
        {{ detailHeader }} ({{ allTodos.length }} 项)
      </div>
      <todo-item
        v-for="todo in allTodos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo(todo.id)"
        @delete="deleteTodo(todo.id)"
      />
      <div class="detail-add-input">
        <input
          v-model="newText"
          placeholder="添加待办事项，按 Enter 确认"
          @keydown.enter="addTodo"
        />
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { monthGrid, today } from '../helpers/dateHelper'
import TodoItem from './TodoItem.vue'

const PREVIEW_MAX = 2

export default {
  name: 'MonthView',
  components: { TodoItem },
  data() { return { newText: '' } },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    grid() {
      return monthGrid(this.selectedDate || today())
    },
    flatGrid() {
      return this.grid.flat().map(cell => ({
        ...cell,
        dayNum: moment(cell.date, 'YYYY-MM-DD').date(),
      }))
    },
    weekdayNames() {
      return ['一', '二', '三', '四', '五', '六', '日']
    },
    allTodos() {
      return this.$store.getters.todosForDate(this.selectedDate)
    },
    detailHeader() {
      return moment(this.selectedDate, 'YYYY-MM-DD').format('M月D日 dddd')
    },
  },
  methods: {
    todosFor(date) { return this.$store.getters.todosForDate(date) },
    previewTodos(date) { return this.todosFor(date).slice(0, PREVIEW_MAX) },
    overflowCount(date) {
      const total = this.todosFor(date).length
      return total > PREVIEW_MAX ? total - PREVIEW_MAX : 0
    },
    selectDate(date) { this.$store.commit('setSelectedDate', date) },
    addTodo() {
      const text = this.newText.trim()
      if (!text) return
      this.$store.dispatch('addTodo', { date: this.selectedDate, text })
      this.newText = ''
    },
    toggleTodo(id) { this.$store.dispatch('toggleTodo', { date: this.selectedDate, id }) },
    deleteTodo(id) { this.$store.dispatch('deleteTodo', { date: this.selectedDate, id }) },
  },
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MonthView.vue
git commit -m "feat: MonthView with inline todo previews and detail panel"
```

---

## Task 12: App.vue (Root Layout)

**Files:**
- Create: `src/App.vue`

- [ ] **Step 1: Create `src/App.vue`**

```vue
<template>
  <div id="app">
    <!-- Top bar -->
    <div class="app-topbar">
      <span class="app-title">TodoWidget</span>

      <div class="nav-arrows">
        <button @click="navigateBack" title="上一个">
          <i class="bi bi-chevron-left"></i>
        </button>
        <button @click="navigateForward" title="下一个">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <span class="current-label">{{ currentLabel }}</span>

      <div class="view-switcher">
        <button
          :class="{ active: activeView === 'day' }"
          @click="setView('day')"
        >日</button>
        <button
          :class="{ active: activeView === 'week' }"
          @click="setView('week')"
        >周</button>
        <button
          :class="{ active: activeView === 'month' }"
          @click="setView('month')"
        >月</button>
      </div>
    </div>

    <!-- Main body -->
    <div class="app-body">
      <day-view v-if="activeView === 'day'" />
      <week-view v-else-if="activeView === 'week'" />
      <month-view v-else />
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import DayView from './components/DayView.vue'
import WeekView from './components/WeekView.vue'
import MonthView from './components/MonthView.vue'
import { weekRange } from './helpers/dateHelper'

export default {
  name: 'App',
  components: { DayView, WeekView, MonthView },
  computed: {
    activeView() { return this.$store.getters.activeView },
    selectedDate() { return this.$store.getters.selectedDate },
    currentLabel() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      if (this.activeView === 'day') return m.format('YYYY年M月D日')
      if (this.activeView === 'week') {
        const dates = weekRange(this.selectedDate)
        const start = moment(dates[0], 'YYYY-MM-DD').format('M月D日')
        const end = moment(dates[6], 'YYYY-MM-DD').format('M月D日')
        return `${start} – ${end}`
      }
      return m.format('YYYY年M月')
    },
  },
  methods: {
    setView(view) { this.$store.commit('setActiveView', view) },
    navigateBack() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      const unit = this.activeView === 'day' ? 'day' : this.activeView === 'week' ? 'week' : 'month'
      this.$store.commit('setSelectedDate', m.subtract(1, unit).format('YYYY-MM-DD'))
    },
    navigateForward() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      const unit = this.activeView === 'day' ? 'day' : this.activeView === 'week' ? 'week' : 'month'
      this.$store.commit('setSelectedDate', m.add(1, unit).format('YYYY-MM-DD'))
    },
  },
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat: App.vue root layout with view switcher and navigation"
```

---

## Task 13: Dev Server Smoke Test

- [ ] **Step 1: Start Electron dev server**

```bash
npm run electron:serve
```

Expected: Electron window opens showing MonthView (default). No console errors.

- [ ] **Step 2: Verify core interactions**
  - Click a date cell → cell gets `selected` highlight, detail panel shows at bottom
  - Type in detail panel input, press Enter → todo appears in cell preview and detail panel
  - Check a todo → strikethrough applied
  - Delete a todo → todo disappears
  - Switch to 周 view → 7-column grid, current week, todos visible
  - Switch to 日 view → single day list, add + check + delete works
  - Use `<` `>` arrows → date/week/month navigates correctly
  - Close and reopen app → all todos and selected view persist (verify JSON files exist in `%APPDATA%\todowidget\`)

- [ ] **Step 3: Fix any issues found in smoke test before proceeding**

---

## Task 14: Windows Build

**Files:**
- Create: `build/icon.ico` (placeholder — replace with real icon before release)

- [ ] **Step 1: Add a placeholder icon**

```bash
# Download a simple placeholder .ico (16x16 white square)
# OR copy any existing .ico file into build/icon.ico
# electron-builder will fail without an icon file
mkdir -p build
curl -L "https://raw.githubusercontent.com/electron/electron/main/shell/browser/resources/win/electron.ico" \
  -o build/icon.ico 2>/dev/null || echo "Download icon manually to build/icon.ico"
```

If curl is unavailable, copy any `.ico` file to `build/icon.ico`.

- [ ] **Step 2: Build Windows installer**

```bash
npm run electron:build
```

Expected: `dist_electron/TodoWidget Setup 1.0.0.exe` created. Takes 2-5 minutes.

- [ ] **Step 3: Test the installer**
  - Run `dist_electron/TodoWidget Setup 1.0.0.exe`
  - Verify app launches, todos persist after close+reopen
  - Check `%APPDATA%\todowidget\todos.json` and `config.json` exist

- [ ] **Step 4: Commit**

```bash
git add build/
git commit -m "feat: add build icon for Windows NSIS installer"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Day/Week/Month view switching — Task 12 (App.vue view switcher)
- ✅ Calendar cells show todo previews — Task 11 (MonthView cell-todo-preview)
- ✅ Week columns show full todos — Task 10 (WeekView week-col-todos)
- ✅ Add todo (Enter key) — Tasks 9, 10, 11
- ✅ Complete todo (checkbox + strikethrough) — Tasks 8, 9, 10, 11
- ✅ Delete todo (hover × button) — Tasks 8, 9, 10, 11
- ✅ Calendar navigation `<` `>` — Task 12 (navigateBack/navigateForward)
- ✅ Local JSON file persistence — Tasks 4, 5, 6 (electron-store IPC)
- ✅ Beijing time (UTC+8) alignment — Task 7 (moment zh-cn, system clock)
- ✅ Today highlighted — Tasks 10, 11 (.today CSS class)
- ✅ Selected date highlighted — Tasks 10, 11 (.selected CSS class)
- ✅ Overflow badge (+N) in month cells — Task 11 (overflowCount)
- ✅ weektodo repository layer pattern — Tasks 4, 5 (storageRepository, todoRepository)
- ✅ Windows NSIS installer — Task 14

**No placeholders found.**

**Type consistency:** `date` is consistently `YYYY-MM-DD` string throughout. `todo.id` is `lodash.uniqueid` string. `todo.checked` (not `done`) used consistently in store and components.
