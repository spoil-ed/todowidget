# TodoWidget

一个极简的 Windows 桌面 TODO 应用，支持日 / 周 / 月三种日历视图。

A minimal Windows desktop TODO app with day / week / month calendar views.

---

## 功能 Features

- 日历视图切换：日、周、月 / Switch between day, week, month views
- 月视图每格显示 todo 预览，超出 +N 提示 / Month cells show inline todo previews with overflow badge
- 左侧迷你月历快速跳转日期 / Sidebar mini-calendar for quick date navigation
- 顶栏 + 按钮可跨日期添加 todo / Top bar + button to add todo to any date
- 勾选完成、删除 / Check off and delete todos
- 数据本地持久化（JSON 文件） / Data stored locally as JSON files
- 北京时间对齐（UTC+8） / Beijing time (UTC+8) aligned

---

## 技术栈 Stack

- Vue 3 + Vuex 4
- Electron 25
- electron-store（本地 JSON 持久化）
- moment.js（zh-cn 中文日期）
- Bootstrap Icons

---

## 开发 Development

```bash
npm install
npm run electron:serve   # 启动开发模式 / Start dev mode
npm test                 # 运行单元测试 / Run unit tests
```

> 如遇 ENOSPC inotify 错误，执行：
> `sudo sysctl fs.inotify.max_user_watches=524288`

---

## 构建 Build

在 **Windows** 上执行 / Run on **Windows**:

```bash
npm run electron:build -- --win --x64
```

输出：`dist_electron/TodoWidget Setup 1.0.0.exe`（NSIS 安装包）

Output: `dist_electron/TodoWidget Setup 1.0.0.exe` (NSIS installer)

> Linux 跨平台构建需要 Wine。
> Cross-compiling on Linux requires Wine.

---

## 数据位置 Data Location

```
%APPDATA%\todowidget\todos.json
%APPDATA%\todowidget\config.json
```
