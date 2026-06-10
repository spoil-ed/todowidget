# TodoWidget — 时间线 & Backlog 功能设计

**日期：** 2026-06-10  
**状态：** 已批准

---

## 一、需求概述

在现有日历 + 待办基础上新增两个功能：

1. **时间线（Timeline）**：每天的日视图中，左侧展示可视化时间线，支持添加"几点到几点做什么"的时间段事项；右侧保留原有勾选待办列表。
2. **Backlog 页**：独立页面，跟踪无法用时间段安排的长期/项目式待办，支持状态标签和子任务。

---

## 二、数据模型

### 2.1 时间段事项（Events）

按日期键存储，独立于 todos：

```js
// events store: { "2026-06-10": [ event, ... ] }
{
  id: String,        // uniqueId()
  title: String,
  startTime: String, // "HH:MM"，如 "09:00"
  endTime: String,   // "HH:MM"，如 "10:30"
  createdAt: Number  // Date.now()
}
```

### 2.2 Backlog 事项

平铺数组，不绑定日期：

```js
// backlog store: [ backlogItem, ... ]
{
  id: String,
  title: String,
  status: 'pending' | 'in-progress' | 'done',
  subtasks: [
    { id: String, text: String, checked: Boolean }
  ],
  createdAt: Number
}
```

### 2.3 现有 Todos

格式不变：`{ "2026-06-10": [{ id, text, checked, createdAt }] }`

---

## 三、架构

### 3.1 Store 层

| 文件 | 职责 |
|------|------|
| `store/modules/todolist.store.js` | 现有，不变 |
| `store/modules/events.store.js` | 新增，时间段事项的 CRUD |
| `store/modules/backlog.store.js` | 新增，Backlog 事项的 CRUD |

### 3.2 Repository 层

| 文件 | electron-store key |
|------|-------------------|
| `repositories/todoRepository.js` | `todos`（现有） |
| `repositories/eventsRepository.js` | `events`（新增） |
| `repositories/backlogRepository.js` | `backlog`（新增） |

### 3.3 组件层

**修改：**
- `components/DayView.vue` — 改为左右分栏，左侧嵌入 `TimelinePanel`，右侧保留 todo 列表

**新增：**
- `components/TimelinePanel.vue` — 时间线渲染，事件块定位，点击空白触发添加
- `components/TimelineEvent.vue` — 单个时间段事项块（标题 + 时间 + 删除）
- `views/AddEventModal.vue` — 添加时间段事项弹窗（标题、开始时间、结束时间）
- `views/BacklogView.vue` — Backlog 主页面
- `components/BacklogItem.vue` — 单条 Backlog 事项（状态标签 + 子任务列表）
- `views/AddBacklogModal.vue` — 添加 Backlog 事项弹窗

**修改：**
- `components/layout/SideBar.vue` — 底部加"清单"入口，点击切换到 BacklogView
- `App.vue` — 管理当前视图状态（`dayView` / `backlogView`）

---

## 四、UI 细节

### 4.1 DayView 时间线

- 布局：左右分栏，时间线占 55%，待办列表占 45%
- 时间范围：自动收缩到 `最早事项开始 - 1h` 至 `最晚事项结束 + 1h`；无事项时默认 08:00–22:00
- 每小时格高度：60px（1分钟 = 1px）
- 事件块：绝对定位，`top = (startMinutes - rangeStart) * 1px`，`height = durationMinutes * 1px`
- 点击时间线空白 → 弹出 AddEventModal，自动填入点击位置对应时间
- 事件块悬停显示删除按钮

### 4.2 BacklogView

- 事项按状态分组显示：进行中 → 待做 → 已完成（已完成折叠）
- 状态标签点击循环切换：`pending → in-progress → done → pending`
- 子任务全部勾选时，弹出提示"是否标记为已完成？"
- 已完成的事项整体透明度降低，折叠在底部可展开

---

## 五、交互流程

### 添加时间段事项
1. 用户点击时间线空白区域
2. AddEventModal 弹出，开始时间自动填入点击位置时间
3. 填写标题、确认开始/结束时间，点击添加
4. 事件块出现在时间线对应位置

### 添加 Backlog 事项
1. 点击 Backlog 页右上角"+ 新增"
2. AddBacklogModal 弹出，填写标题
3. 创建后状态默认为"待做"，子任务为空
4. 在事项内点击"+ 添加子任务"追加子任务

---

## 六、不在本次范围内

- 时间段事项的编辑（只支持删除后重建）
- Backlog 事项的排序/拖拽
- 跨天事项
- 通知/提醒
