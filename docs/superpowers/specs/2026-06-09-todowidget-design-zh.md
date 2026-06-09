# TodoWidget 设计文档
日期：2026-06-09

## 概述

一款极简的 Windows 桌面待办事项应用，基于 Vue 3 + Electron 构建，架构仿照 weektodo。核心价值：日历的每个日期格子内直接显示待办预览，在日/周/月三种视图下均可一眼总览所有安排。

## 技术栈

- **前端框架：** Vue 3 + Vuex（与 weektodo 相同）
- **桌面壳：** Electron（复用 weektodo 的 `background.js` 模式）
- **构建工具：** Vue CLI + electron-builder（与 weektodo 相同）
- **本地存储：** `electron-store`（替代 weektodo 的 localStorage + IndexedDB，数据以 JSON 文件存储在 `userData/` 目录）
- **样式：** Bootstrap + Bootstrap Icons + SCSS（与 weektodo 相同）
- **日期处理：** moment.js（与 weektodo 相同）

## 架构

遵循 weektodo 的分层模式：Vue 组件 → Vuex 状态层 → 仓库层（repositories）→ 存储层。

```
todowidget/
├── src/
│   ├── App.vue                        # 根组件：左侧边栏 + 右侧主面板
│   ├── main.js                        # Vue + Vuex 入口
│   ├── background.js                  # Electron 主进程（IPC 处理器）
│   ├── components/
│   │   ├── layout/
│   │   │   └── sideBar.vue            # 左侧面板：日历 + 视图切换按钮
│   │   ├── toDoList.vue               # 右侧面板：当前日期/周/月的待办列表
│   │   ├── toDoItem.vue               # 单条待办：勾选框、文字、删除按钮
│   │   └── listHeader.vue             # 列表头部：日期标签 + 添加按钮
│   ├── views/
│   │   └── toDoModal/
│   │       └── toDoModal.vue          # 添加/编辑待办弹窗（文字输入 + 日期选择）
│   ├── repositories/
│   │   ├── storageRepository.js       # 封装 electron-store：配置项读写
│   │   └── todoRepository.js          # 封装 electron-store：按日期键 CRUD 待办
│   ├── store/
│   │   ├── store.js                   # Vuex 根模块
│   │   └── modules/
│   │       ├── todolist.store.js      # 待办状态：todoLists{日期→[]} + selectedDate
│   │       └── config.store.js        # 配置状态：activeView（日/周/月）等
│   ├── helpers/
│   │   └── dateHelper.js              # 周范围、月格子、YYYY-MM-DD 格式化工具
│   └── assets/
│       └── style/
│           ├── globalVars.scss        # 颜色、间距变量
│           └── main.scss              # 全局样式
├── vue.config.js
└── package.json
```

**数据流：**
```
用户操作
  → Vue 组件触发事件
    → Vuex mutation（更新内存状态）
      → Vuex action 调用 repository
        → repository 写入 electron-store（userData/ 下的 JSON 文件）
```

应用启动时：`background.js` → IPC 加载 `todos.json` + `config.json` → 注入 Vuex。

## 存储层

weektodo 使用 `storageRepository`（localStorage）存配置、`dbRepository`（IndexedDB）存待办。本项目统一替换为 `electron-store`，保持相同的 repository 接口：

```js
// storageRepository.js —— 配置项（读写 config.json）
export default {
  get(key) { return store.get(key) },
  set(key, val) { store.set(key, val) },
}

// todoRepository.js —— 待办项，按日期键存储（读写 todos.json）
export default {
  get(date) { return store.get(date) ?? [] },       // 返回 "2026-06-10" 对应的数组
  set(date, todos) { store.set(date, todos) },
  remove(date) { store.delete(date) },
  getAll() { return store.store },                  // 完整的 {日期→待办[]} 映射
}
```

Vuex action 调用 repository，组件层不直接操作存储。

## 数据模型

```js
// 单条待办对象（存储在以日期为键的数组中）
{
  id: "uuid-v4",
  text: "回复邮件",
  checked: false,
  createdAt: 1749456000000
}

// 磁盘上的 todos.json（electron-store 写入）
{
  "2026-06-09": [ { id, text, checked, createdAt }, ... ],
  "2026-06-10": [ ... ],
}

// 磁盘上的 config.json
{
  activeView: "month",          // "day" | "week" | "month"
  selectedDate: "2026-06-09",   // 当前聚焦的日期
  weekStartOnMonday: true
}
```

## 视图说明

### 月视图（默认）
- 6行 × 7列日历格子
- 每格：日期数字 + 最多 2 条待办文字预览（超长截断）+ 超出数量徽标（如 "+3"）
- 今天高亮显示；有待办的日期显示小圆点
- 点击任意格子 → 设置 `selectedDate` → 下方（或右侧）详情面板更新

### 周视图
- 7列（所选周的周一到周日）
- 每列：日期标签 + 可滚动的待办列表 + 底部内联 `+` 添加按钮
- 格子比月视图更高，可显示更多预览行

### 日视图
- 显示 `selectedDate` 当天的完整待办列表
- 所有待办全文展示，不截断
- 底部常驻添加输入框

### 视图切换
- 顶栏 `[日][周][月]` 三个按钮
- 切换后 `selectedDate` 保持不变

## 核心交互

| 操作 | 触发方式 |
|------|---------|
| 添加待办 | 点击 `+` 或在输入框按回车 → 弹出 toDoModal 或内联添加 |
| 完成待办 | 点击勾选框 → `checked: true` → 文字加删除线样式 |
| 删除待办 | 鼠标悬停该行 → 点击 `×` 按钮 |
| 日历翻页 | 点击日历头部的 `<` `>` 箭头 |
| 选择日期 | 点击任意日历格子 |
| 切换视图 | 点击 `[日]` `[周]` `[月]` |

## 从 weektodo 中删除的部分

- 重复事件（相关 store 模块、repository、弹窗）
- 多语言 / i18n
- 系统通知
- 支付 / 捐赠弹窗
- 启动引导界面（Splash Screen）
- 当前激活待办跟踪
- 导入/导出工具
- 数据迁移系统
- Sentry 错误上报
- 自定义待办列表（仅保留按日期组织的列表）

## v1 不做的功能

- 深色/浅色主题切换
- 搜索 / 筛选
- 优先级 / 标签
- 提醒 / 系统通知
- 子任务
- 云同步
