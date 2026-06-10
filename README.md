# TodoWidget

A minimal Windows desktop TODO app with day / week / month calendar views.

---

## Features

- Switch between day, week, and month views
- Month cells show inline todo previews with +N overflow badge
- Sidebar mini-calendar with independent cursor for quick date navigation
- Top bar `+` button to add a todo to any date
- Check off and delete todos
- Data persisted locally as JSON files — no network required
- Date calculations aligned to Beijing time (UTC+8)

---

## Stack

- Vue 3 + Vuex 4
- Electron 25
- electron-store (local JSON persistence)
- moment.js (zh-cn locale)
- Bootstrap Icons

---

## Development

```bash
npm install
npm run electron:serve   # start dev mode
npm test                 # run unit tests
```

> If you hit an `ENOSPC` inotify error:
> `sudo sysctl fs.inotify.max_user_watches=524288`

---

## Build

Run on **Windows**:

```bash
npm run electron:build -- --win --x64
```

Output: `dist_electron/TodoWidget Setup 1.0.0.exe` (NSIS installer)

> Cross-compiling on Linux requires Wine.

---

## Data Location

```
%APPDATA%\todowidget\todos.json
%APPDATA%\todowidget\config.json
```
