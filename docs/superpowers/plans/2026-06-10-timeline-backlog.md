# Timeline & Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 DayView 中加入可视化时间线（左侧）并保留待办列表（右侧），同时新增独立的 Backlog 页面用于跟踪项目式待办。

**Architecture:** 新增三个独立模块：`timeHelper`（纯函数）、`events`（按日期存储时间段事项）、`backlog`（平铺存储项目式待办）。每个模块有自己的 repository → IPC handler → store 层级，与现有 todos 完全并列，不修改现有数据结构。

**Tech Stack:** Vue 3, Vuex 4, Electron IPC, electron-store v7, moment.js, Bootstrap Icons

---

## 文件清单

| 操作 | 文件 |
|------|------|
| 新建 | `src/helpers/timeHelper.js` |
| 新建 | `tests/timeHelper.test.js` |
| 修改 | `src/background.js`（添加 events/backlog IPC handlers） |
| 新建 | `src/repositories/eventsRepository.js` |
| 新建 | `src/repositories/backlogRepository.js` |
| 新建 | `src/store/modules/events.store.js` |
| 新建 | `src/store/modules/backlog.store.js` |
| 修改 | `src/store/store.js`（注册新模块） |
| 新建 | `src/components/TimelineEvent.vue` |
| 新建 | `src/views/AddEventModal.vue` |
| 新建 | `src/components/TimelinePanel.vue` |
| 修改 | `src/components/DayView.vue`（左右分栏） |
| 新建 | `src/components/BacklogItem.vue` |
| 新建 | `src/views/AddBacklogModal.vue` |
| 新建 | `src/views/BacklogView.vue` |
| 修改 | `src/components/layout/SideBar.vue`（加 Backlog 入口） |
| 修改 | `src/App.vue`（支持 backlog 页面切换） |

---

### Task 1: timeHelper 工具函数

**Files:**
- Create: `src/helpers/timeHelper.js`
- Create: `tests/timeHelper.test.js`

- [ ] **Step 1: 写失败测试**

```js
// tests/timeHelper.test.js
const { timeToMinutes, minutesToTime, calcTimelineRange } = require('../src/helpers/timeHelper')

test('timeToMinutes converts HH:MM to minutes', () => {
  expect(timeToMinutes('00:00')).toBe(0)
  expect(timeToMinutes('08:00')).toBe(480)
  expect(timeToMinutes('09:30')).toBe(570)
  expect(timeToMinutes('23:59')).toBe(1439)
})

test('minutesToTime converts minutes to HH:MM', () => {
  expect(minutesToTime(0)).toBe('00:00')
  expect(minutesToTime(480)).toBe('08:00')
  expect(minutesToTime(570)).toBe('09:30')
})

test('calcTimelineRange returns default range when no events', () => {
  const { start, end } = calcTimelineRange([])
  expect(start).toBe(480)  // 08:00
  expect(end).toBe(1320)   // 22:00
})

test('calcTimelineRange pads 60min around events', () => {
  const events = [
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '14:00', endTime: '15:30' },
  ]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(540)  // 10:00 - 60min = 09:00
  expect(end).toBe(990)    // 15:30 + 60min = 16:30
})

test('calcTimelineRange clamps start to 0 and end to 1440', () => {
  const events = [{ startTime: '00:30', endTime: '23:45' }]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(0)
  expect(end).toBe(1440)
})
```

- [ ] **Step 2: 运行确认失败**

```bash
npm test -- --testPathPattern=timeHelper
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 timeHelper.js**

```js
// src/helpers/timeHelper.js
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcTimelineRange(events) {
  if (!events.length) return { start: 480, end: 1320 }
  const starts = events.map(e => timeToMinutes(e.startTime))
  const ends = events.map(e => timeToMinutes(e.endTime))
  const start = Math.max(0, Math.min(...starts) - 60)
  const end = Math.min(1440, Math.max(...ends) + 60)
  return { start, end }
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npm test -- --testPathPattern=timeHelper
```

Expected: PASS（5 tests）

- [ ] **Step 5: 提交**

```bash
git add src/helpers/timeHelper.js tests/timeHelper.test.js
git commit -m "feat: add timeHelper utilities for timeline calculations"
```

---

### Task 2: background.js — 添加 events 和 backlog IPC handlers

**Files:**
- Modify: `src/background.js`

- [ ] **Step 1: 在 background.js 的 Store 初始化区块后添加两个新 store 实例**

在 `const todoStore = new Store({ name: 'todos' })` 下方添加：

```js
const eventsStore = new Store({ name: 'events' })
const backlogStore = new Store({ name: 'backlog' })
```

- [ ] **Step 2: 在 `// IPC: config` 块之后追加 events 和 backlog 的 IPC handlers**

```js
// IPC: events
ipcMain.handle('events:getAll', () => eventsStore.store)
ipcMain.handle('events:get', (_, date) => eventsStore.get(date, []))
ipcMain.handle('events:set', (_, date, events) => { eventsStore.set(date, events) })
ipcMain.handle('events:remove', (_, date) => { eventsStore.delete(date) })

// IPC: backlog
ipcMain.handle('backlog:getAll', () => backlogStore.get('items', []))
ipcMain.handle('backlog:set', (_, items) => { backlogStore.set('items', items) })
```

- [ ] **Step 3: 提交**

```bash
git add src/background.js
git commit -m "feat: add IPC handlers for events and backlog stores"
```

---

### Task 3: 新建 eventsRepository 和 backlogRepository

**Files:**
- Create: `src/repositories/eventsRepository.js`
- Create: `src/repositories/backlogRepository.js`

- [ ] **Step 1: 创建 eventsRepository.js**

```js
// src/repositories/eventsRepository.js
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  get(date) { return getIpc().invoke('events:get', date) },
  getAll() { return getIpc().invoke('events:getAll') },
  set(date, events) { return getIpc().invoke('events:set', date, events) },
  remove(date) { return getIpc().invoke('events:remove', date) },
}
```

- [ ] **Step 2: 创建 backlogRepository.js**

```js
// src/repositories/backlogRepository.js
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  getAll() { return getIpc().invoke('backlog:getAll') },
  set(items) { return getIpc().invoke('backlog:set', items) },
}
```

- [ ] **Step 3: 提交**

```bash
git add src/repositories/eventsRepository.js src/repositories/backlogRepository.js
git commit -m "feat: add eventsRepository and backlogRepository"
```

---

### Task 4: events.store.js

**Files:**
- Create: `src/store/modules/events.store.js`

- [ ] **Step 1: 创建 events.store.js**

```js
// src/store/modules/events.store.js
import eventsRepository from '../../repositories/eventsRepository'
import uniqueId from 'lodash.uniqueid'

const state = {
  // { "2026-06-10": [ { id, title, startTime, endTime, createdAt } ] }
  eventLists: {},
}

const getters = {
  eventsForDate: s => date => s.eventLists[date] || [],
}

const mutations = {
  initEvents(state, allEvents) {
    state.eventLists = allEvents || {}
  },
  setDateEvents(state, { date, events }) {
    state.eventLists = { ...state.eventLists, [date]: events }
  },
}

const actions = {
  async loadAllEvents({ commit }) {
    const all = await eventsRepository.getAll()
    commit('initEvents', all)
  },
  addEvent({ commit, getters }, { date, title, startTime, endTime }) {
    const events = [...getters.eventsForDate(date)]
    events.push({ id: uniqueId('ev_'), title, startTime, endTime, createdAt: Date.now() })
    commit('setDateEvents', { date, events })
    eventsRepository.set(date, events)
  },
  deleteEvent({ commit, getters }, { date, id }) {
    const events = getters.eventsForDate(date).filter(e => e.id !== id)
    commit('setDateEvents', { date, events })
    eventsRepository.set(date, events)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
```

- [ ] **Step 2: 提交**

```bash
git add src/store/modules/events.store.js
git commit -m "feat: add events Vuex store module"
```

---

### Task 5: backlog.store.js

**Files:**
- Create: `src/store/modules/backlog.store.js`

- [ ] **Step 1: 创建 backlog.store.js**

```js
// src/store/modules/backlog.store.js
import backlogRepository from '../../repositories/backlogRepository'
import uniqueId from 'lodash.uniqueid'

const STATUS_CYCLE = { 'pending': 'in-progress', 'in-progress': 'done', 'done': 'pending' }

const state = {
  // [ { id, title, status, subtasks: [{ id, text, checked }], createdAt } ]
  backlogItems: [],
}

const getters = {
  backlogItems: s => s.backlogItems,
  backlogByStatus: s => status => s.backlogItems.filter(i => i.status === status),
}

const mutations = {
  initBacklog(state, items) {
    state.backlogItems = items || []
  },
  setBacklog(state, items) {
    state.backlogItems = items
  },
}

const actions = {
  async loadBacklog({ commit }) {
    const items = await backlogRepository.getAll()
    commit('initBacklog', items)
  },
  addBacklogItem({ commit, state }, { title }) {
    const items = [...state.backlogItems, {
      id: uniqueId('bl_'),
      title,
      status: 'pending',
      subtasks: [],
      createdAt: Date.now(),
    }]
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  cycleBacklogStatus({ commit, state }, { id }) {
    const items = state.backlogItems.map(item =>
      item.id === id ? { ...item, status: STATUS_CYCLE[item.status] } : item
    )
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  setBacklogStatus({ commit, state }, { id, status }) {
    const items = state.backlogItems.map(item =>
      item.id === id ? { ...item, status } : item
    )
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  deleteBacklogItem({ commit, state }, { id }) {
    const items = state.backlogItems.filter(i => i.id !== id)
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  addSubtask({ commit, state }, { itemId, text }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return {
        ...item,
        subtasks: [...item.subtasks, { id: uniqueId('st_'), text, checked: false }],
      }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  toggleSubtask({ commit, state }, { itemId, subtaskId }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return {
        ...item,
        subtasks: item.subtasks.map(st =>
          st.id === subtaskId ? { ...st, checked: !st.checked } : st
        ),
      }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  deleteSubtask({ commit, state }, { itemId, subtaskId }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return { ...item, subtasks: item.subtasks.filter(st => st.id !== subtaskId) }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
```

- [ ] **Step 2: 提交**

```bash
git add src/store/modules/backlog.store.js
git commit -m "feat: add backlog Vuex store module"
```

---

### Task 6: 注册新模块到 store.js，并在 main.js 加载初始数据

**Files:**
- Modify: `src/store/store.js`
- Modify: `src/main.js`

- [ ] **Step 1: 更新 store.js**

完整替换 `src/store/store.js`：

```js
import { createStore } from 'vuex'
import todoLists from './modules/todolist.store'
import config from './modules/config.store'
import events from './modules/events.store'
import backlog from './modules/backlog.store'

export const store = createStore({
  modules: { config, todoLists, events, backlog },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
})
```

- [ ] **Step 2: 查看 main.js 当前内容**

```bash
cat src/main.js
```

- [ ] **Step 3: 在 main.js 中 app.mount 之前触发数据加载**

在 `store.dispatch('loadTodos')` 调用附近（或 `app.mount('#app')` 之前）添加：

```js
store.dispatch('loadAllEvents')
store.dispatch('loadBacklog')
```

- [ ] **Step 4: 提交**

```bash
git add src/store/store.js src/main.js
git commit -m "feat: register events and backlog store modules, load on startup"
```

---

### Task 7: TimelineEvent 组件

**Files:**
- Create: `src/components/TimelineEvent.vue`

- [ ] **Step 1: 创建 TimelineEvent.vue**

```vue
<template>
  <div
    class="timeline-event"
    :style="{ top: topPx + 'px', height: heightPx + 'px' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <span class="tl-event-title">{{ event.title }}</span>
    <span class="tl-event-time">{{ event.startTime }}–{{ event.endTime }}</span>
    <button v-if="hovered" class="tl-event-delete" @click.stop="$emit('delete', event.id)">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TimelineEvent',
  props: {
    event: { type: Object, required: true },
    topPx: { type: Number, required: true },
    heightPx: { type: Number, required: true },
  },
  emits: ['delete'],
  data() { return { hovered: false } },
}
</script>

<style scoped>
.timeline-event {
  position: absolute;
  left: 48px;
  right: 8px;
  background: var(--accent, #4a90d9);
  color: #fff;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: default;
  min-height: 20px;
}
.tl-event-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-event-time { font-size: 11px; opacity: 0.85; }
.tl-event-delete {
  position: absolute;
  top: 2px;
  right: 4px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/TimelineEvent.vue
git commit -m "feat: add TimelineEvent component"
```

---

### Task 8: AddEventModal

**Files:**
- Create: `src/views/AddEventModal.vue`

- [ ] **Step 1: 创建 AddEventModal.vue**

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>添加日程</h3>
      <input
        ref="titleInput"
        v-model="title"
        placeholder="日程内容"
        @keydown.enter="confirm"
      />
      <div class="time-row">
        <label>开始</label>
        <input type="time" v-model="startTime" />
        <label>结束</label>
        <input type="time" v-model="endTime" />
      </div>
      <p v-if="error" class="modal-error">{{ error }}</p>
      <div class="modal-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">添加</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddEventModal',
  props: {
    date: { type: String, required: true },
    initialTime: { type: String, default: '09:00' },
  },
  emits: ['close'],
  data() {
    return {
      title: '',
      startTime: this.initialTime,
      endTime: this.addOneHour(this.initialTime),
      error: '',
    }
  },
  mounted() { this.$refs.titleInput.focus() },
  methods: {
    addOneHour(time) {
      const [h, m] = time.split(':').map(Number)
      const newH = Math.min(h + 1, 23)
      return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    },
    confirm() {
      const title = this.title.trim()
      if (!title) { this.error = '请填写日程内容'; return }
      if (this.startTime >= this.endTime) { this.error = '结束时间必须晚于开始时间'; return }
      this.$store.dispatch('addEvent', {
        date: this.date,
        title,
        startTime: this.startTime,
        endTime: this.endTime,
      })
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
.time-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.time-row label { font-size: 13px; color: var(--text-muted); }
.time-row input { flex: 1; }
.modal-error { color: #e74c3c; font-size: 12px; margin: 4px 0 0; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/AddEventModal.vue
git commit -m "feat: add AddEventModal component"
```

---

### Task 9: TimelinePanel 组件

**Files:**
- Create: `src/components/TimelinePanel.vue`

- [ ] **Step 1: 创建 TimelinePanel.vue**

```vue
<template>
  <div class="timeline-panel">
    <div class="timeline-header">
      <span>日程</span>
      <button class="tl-add-btn" @click="openModal('08:00')" title="添加日程">
        <i class="bi bi-plus"></i>
      </button>
    </div>
    <div
      class="timeline-scroll"
      :style="{ height: totalHeight + 'px' }"
      @click="handleTimelineClick"
      ref="scrollArea"
    >
      <!-- Hour markers -->
      <div
        v-for="hour in hourMarkers"
        :key="hour.label"
        class="tl-hour-marker"
        :style="{ top: hour.top + 'px' }"
      >
        <span class="tl-hour-label">{{ hour.label }}</span>
        <div class="tl-hour-line"></div>
      </div>
      <!-- Event blocks -->
      <timeline-event
        v-for="event in events"
        :key="event.id"
        :event="event"
        :top-px="eventTop(event)"
        :height-px="eventHeight(event)"
        @delete="deleteEvent(event.id)"
      />
    </div>
    <add-event-modal
      v-if="showModal"
      :date="date"
      :initial-time="modalInitialTime"
      @close="showModal = false"
    />
  </div>
</template>

<script>
import { timeToMinutes, minutesToTime, calcTimelineRange } from '../helpers/timeHelper'
import TimelineEvent from './TimelineEvent.vue'
import AddEventModal from '../views/AddEventModal.vue'

export default {
  name: 'TimelinePanel',
  components: { TimelineEvent, AddEventModal },
  props: {
    date: { type: String, required: true },
  },
  data() {
    return { showModal: false, modalInitialTime: '09:00' }
  },
  computed: {
    events() { return this.$store.getters.eventsForDate(this.date) },
    range() { return calcTimelineRange(this.events) },
    totalHeight() { return this.range.end - this.range.start },
    hourMarkers() {
      const markers = []
      const startHour = Math.floor(this.range.start / 60)
      const endHour = Math.ceil(this.range.end / 60)
      for (let h = startHour; h <= endHour; h++) {
        const minutes = h * 60
        if (minutes < this.range.start || minutes > this.range.end) continue
        markers.push({
          label: minutesToTime(minutes),
          top: minutes - this.range.start,
        })
      }
      return markers
    },
  },
  methods: {
    eventTop(event) { return timeToMinutes(event.startTime) - this.range.start },
    eventHeight(event) {
      return Math.max(20, timeToMinutes(event.endTime) - timeToMinutes(event.startTime))
    },
    handleTimelineClick(e) {
      if (e.target.closest('.timeline-event')) return
      const offsetY = e.offsetY
      const clickedMinutes = this.range.start + offsetY
      const snapped = Math.round(clickedMinutes / 15) * 15
      this.modalInitialTime = minutesToTime(Math.min(snapped, 1380))
      this.showModal = true
    },
    deleteEvent(id) {
      this.$store.dispatch('deleteEvent', { date: this.date, id })
    },
    openModal(time) {
      this.modalInitialTime = time
      this.showModal = true
    },
  },
}
</script>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--border);
  padding: 0 0 8px;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.tl-add-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  padding: 0 4px;
}
.timeline-scroll {
  position: relative;
  overflow-y: auto;
  flex: 1;
  cursor: crosshair;
}
.tl-hour-marker {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.tl-hour-label {
  width: 44px;
  text-align: right;
  font-size: 11px;
  color: var(--text-muted);
  padding-right: 6px;
  flex-shrink: 0;
}
.tl-hour-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/TimelinePanel.vue
git commit -m "feat: add TimelinePanel component with click-to-add and event rendering"
```

---

### Task 10: 重构 DayView — 左右分栏

**Files:**
- Modify: `src/components/DayView.vue`

- [ ] **Step 1: 完整替换 DayView.vue**

```vue
<template>
  <div class="day-view">
    <div class="day-view-header">{{ headerLabel }}</div>
    <div class="day-body">
      <!-- Left: timeline -->
      <div class="day-timeline-col">
        <timeline-panel :date="selectedDate" />
      </div>
      <!-- Right: todo list -->
      <div class="day-todos-col">
        <div class="day-todos">
          <todo-item
            v-for="todo in todos"
            :key="todo.id"
            :todo="todo"
            @toggle="toggleTodo(todo.id)"
            @delete="deleteTodo(todo.id)"
          />
          <div v-if="todos.length === 0" class="empty-hint">今天还没有待办事项</div>
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
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import TodoItem from './TodoItem.vue'
import TimelinePanel from './TimelinePanel.vue'

export default {
  name: 'DayView',
  components: { TodoItem, TimelinePanel },
  data() { return { newText: '' } },
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
    toggleTodo(id) { this.$store.dispatch('toggleTodo', { date: this.selectedDate, id }) },
    deleteTodo(id) { this.$store.dispatch('deleteTodo', { date: this.selectedDate, id }) },
  },
}
</script>

<style scoped>
.day-view { display: flex; flex-direction: column; height: 100%; }
.day-view-header {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.day-body { display: flex; flex: 1; overflow: hidden; }
.day-timeline-col { width: 55%; overflow: hidden; display: flex; flex-direction: column; }
.day-todos-col {
  width: 45%;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  overflow: hidden;
}
.day-todos { flex: 1; overflow-y: auto; }
.empty-hint { color: var(--text-muted); font-size: 13px; padding: 8px 0; }
.day-add-input { display: flex; gap: 8px; margin-top: 8px; flex-shrink: 0; }
.day-add-input input { flex: 1; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/DayView.vue
git commit -m "feat: refactor DayView to left/right split with timeline and todos"
```

---

### Task 11: BacklogItem 组件

**Files:**
- Create: `src/components/BacklogItem.vue`

- [ ] **Step 1: 创建 BacklogItem.vue**

```vue
<template>
  <div class="backlog-item" :class="item.status">
    <div class="bl-item-header">
      <button class="bl-status-badge" :class="item.status" @click="cycleStatus">
        {{ statusLabel }}
      </button>
      <span class="bl-item-title">{{ item.title }}</span>
      <button class="bl-delete-btn" @click="$emit('delete', item.id)" title="删除">
        <i class="bi bi-x"></i>
      </button>
    </div>
    <div class="bl-subtasks">
      <div v-for="st in item.subtasks" :key="st.id" class="bl-subtask">
        <input
          type="checkbox"
          :checked="st.checked"
          @change="toggleSubtask(st.id)"
        />
        <span :class="{ done: st.checked }">{{ st.text }}</span>
        <button class="bl-st-delete" @click="deleteSubtask(st.id)">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="bl-add-subtask">
        <input
          v-if="addingSubtask"
          ref="stInput"
          v-model="newSubtask"
          placeholder="子任务内容"
          @keydown.enter="confirmSubtask"
          @keydown.esc="addingSubtask = false"
          @blur="confirmSubtask"
        />
        <button v-else class="bl-add-st-btn" @click="startAddSubtask">
          <i class="bi bi-plus"></i> 添加子任务
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const STATUS_LABELS = { 'pending': '待做', 'in-progress': '进行中', 'done': '已完成' }

export default {
  name: 'BacklogItem',
  props: { item: { type: Object, required: true } },
  emits: ['delete'],
  data() { return { addingSubtask: false, newSubtask: '' } },
  computed: {
    statusLabel() { return STATUS_LABELS[this.item.status] },
  },
  methods: {
    cycleStatus() {
      this.$store.dispatch('cycleBacklogStatus', { id: this.item.id })
      const allChecked = this.item.subtasks.length > 0 && this.item.subtasks.every(s => s.checked)
      if (allChecked && this.item.status === 'in-progress') {
        if (confirm('所有子任务已完成，标记为已完成？')) {
          this.$store.dispatch('setBacklogStatus', { id: this.item.id, status: 'done' })
        }
      }
    },
    toggleSubtask(subtaskId) {
      this.$store.dispatch('toggleSubtask', { itemId: this.item.id, subtaskId })
      const updated = this.$store.getters.backlogItems.find(i => i.id === this.item.id)
      if (updated && updated.subtasks.length > 0 && updated.subtasks.every(s => s.checked)) {
        if (confirm('所有子任务已完成，标记为已完成？')) {
          this.$store.dispatch('setBacklogStatus', { id: this.item.id, status: 'done' })
        }
      }
    },
    deleteSubtask(subtaskId) {
      this.$store.dispatch('deleteSubtask', { itemId: this.item.id, subtaskId })
    },
    startAddSubtask() {
      this.addingSubtask = true
      this.$nextTick(() => this.$refs.stInput && this.$refs.stInput.focus())
    },
    confirmSubtask() {
      const text = this.newSubtask.trim()
      if (text) this.$store.dispatch('addSubtask', { itemId: this.item.id, text })
      this.newSubtask = ''
      this.addingSubtask = false
    },
  },
}
</script>

<style scoped>
.backlog-item {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
  transition: opacity 0.2s;
}
.backlog-item.done { opacity: 0.5; }
.bl-item-header { display: flex; align-items: center; gap: 8px; }
.bl-status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.bl-status-badge.pending { background: #e8e8e8; color: #555; }
.bl-status-badge.in-progress { background: #fff3cd; color: #856404; }
.bl-status-badge.done { background: #d1e7dd; color: #0f5132; }
.bl-item-title { flex: 1; font-size: 14px; font-weight: 500; }
.bl-delete-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; padding: 0; }
.bl-subtasks { margin-top: 8px; padding-left: 4px; }
.bl-subtask { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 13px; }
.bl-subtask span.done { text-decoration: line-through; color: var(--text-muted); }
.bl-st-delete { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 13px; padding: 0; margin-left: auto; }
.bl-add-st-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 12px; padding: 4px 0; }
.bl-add-subtask input { font-size: 13px; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px; width: 100%; margin-top: 4px; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/BacklogItem.vue
git commit -m "feat: add BacklogItem component with subtasks and status cycling"
```

---

### Task 12: AddBacklogModal

**Files:**
- Create: `src/views/AddBacklogModal.vue`

- [ ] **Step 1: 创建 AddBacklogModal.vue**

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>新建清单项</h3>
      <input
        ref="titleInput"
        v-model="title"
        placeholder="项目名称"
        @keydown.enter="confirm"
      />
      <div class="modal-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">添加</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddBacklogModal',
  emits: ['close'],
  data() { return { title: '' } },
  mounted() { this.$refs.titleInput.focus() },
  methods: {
    confirm() {
      const title = this.title.trim()
      if (!title) return
      this.$store.dispatch('addBacklogItem', { title })
      this.$emit('close')
    },
  },
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/AddBacklogModal.vue
git commit -m "feat: add AddBacklogModal component"
```

---

### Task 13: BacklogView 页面

**Files:**
- Create: `src/views/BacklogView.vue`

- [ ] **Step 1: 创建 BacklogView.vue**

```vue
<template>
  <div class="backlog-view">
    <div class="backlog-header">
      <h2>待办清单</h2>
      <button class="primary" @click="showModal = true">+ 新增</button>
    </div>

    <!-- 进行中 -->
    <section v-if="inProgress.length">
      <div class="bl-section-title">进行中</div>
      <backlog-item
        v-for="item in inProgress"
        :key="item.id"
        :item="item"
        @delete="deleteItem"
      />
    </section>

    <!-- 待做 -->
    <section v-if="pending.length">
      <div class="bl-section-title">待做</div>
      <backlog-item
        v-for="item in pending"
        :key="item.id"
        :item="item"
        @delete="deleteItem"
      />
    </section>

    <!-- 已完成（折叠） -->
    <section v-if="done.length">
      <div class="bl-section-title clickable" @click="showDone = !showDone">
        已完成 ({{ done.length }})
        <i :class="showDone ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
      </div>
      <template v-if="showDone">
        <backlog-item
          v-for="item in done"
          :key="item.id"
          :item="item"
          @delete="deleteItem"
        />
      </template>
    </section>

    <div v-if="!inProgress.length && !pending.length && !done.length" class="bl-empty">
      还没有清单项，点击右上角新增
    </div>

    <add-backlog-modal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script>
import BacklogItem from '../components/BacklogItem.vue'
import AddBacklogModal from './AddBacklogModal.vue'

export default {
  name: 'BacklogView',
  components: { BacklogItem, AddBacklogModal },
  data() { return { showModal: false, showDone: false } },
  computed: {
    inProgress() { return this.$store.getters.backlogByStatus('in-progress') },
    pending() { return this.$store.getters.backlogByStatus('pending') },
    done() { return this.$store.getters.backlogByStatus('done') },
  },
  methods: {
    deleteItem(id) { this.$store.dispatch('deleteBacklogItem', { id }) },
  },
}
</script>

<style scoped>
.backlog-view { padding: 20px 24px; overflow-y: auto; height: 100%; }
.backlog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.backlog-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
.bl-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0 8px;
}
.bl-section-title.clickable { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px; }
.bl-empty { color: var(--text-muted); font-size: 14px; text-align: center; margin-top: 60px; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/BacklogView.vue
git commit -m "feat: add BacklogView page with status grouping and collapsible done section"
```

---

### Task 14: SideBar 加入口 + App.vue 支持 backlog 页

**Files:**
- Modify: `src/components/layout/SideBar.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 在 SideBar.vue template 末尾的 `</div>` 前添加 Backlog 按钮**

在 `</div>` 最外层关闭标签前追加：

```html
    <div class="sidebar-bottom">
      <button
        class="sidebar-backlog-btn"
        :class="{ active: currentPage === 'backlog' }"
        @click="$store.commit('setPage', 'backlog')"
      >
        <i class="bi bi-list-check"></i>
        <span>待办清单</span>
      </button>
    </div>
```

在 SideBar.vue `<script>` 的 `computed` 中添加：

```js
currentPage() { return this.$store.getters.currentPage },
```

在 SideBar.vue `<style>` 末尾添加：

```css
.sidebar-bottom { margin-top: auto; padding: 8px; border-top: 1px solid var(--border); }
.sidebar-backlog-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.sidebar-backlog-btn.active { background: var(--accent-light, #e8f0fe); color: var(--accent, #4a90d9); }
.sidebar-backlog-btn i { font-size: 16px; }
```

- [ ] **Step 2: 更新 config.store.js — 添加 currentPage state**

在 `src/store/modules/config.store.js` 中，找到 state 对象，添加 `currentPage: 'calendar'`，并添加对应的 getter 和 mutation：

```js
// 在 state 中添加：
currentPage: 'calendar',   // 'calendar' | 'backlog'

// 在 getters 中添加：
currentPage: s => s.currentPage,

// 在 mutations 中添加：
setPage(state, page) { state.currentPage = page },
```

- [ ] **Step 3: 更新 App.vue — 支持 backlog 页切换**

将 App.vue 中 `<!-- Main body -->` 内的 `main-content` div 替换为：

```html
    <div class="app-body">
      <side-bar />
      <div class="main-content">
        <template v-if="currentPage === 'calendar'">
          <day-view v-if="activeView === 'day'" />
          <week-view v-else-if="activeView === 'week'" />
          <month-view v-else />
        </template>
        <backlog-view v-else-if="currentPage === 'backlog'" />
      </div>
    </div>
```

在 App.vue `<script>` 中：

1. 导入 BacklogView：`import BacklogView from './views/BacklogView.vue'`
2. 在 `components` 中添加 `BacklogView`
3. 在 `computed` 中添加：`currentPage() { return this.$store.getters.currentPage }`

- [ ] **Step 4: 提交**

```bash
git add src/components/layout/SideBar.vue src/App.vue src/store/modules/config.store.js
git commit -m "feat: add backlog navigation to sidebar and App.vue page switching"
```

---

### Task 15: 整体冒烟测试

- [ ] **Step 1: 运行全部测试**

```bash
npm test
```

Expected: 所有测试通过（包括 timeHelper 的 5 个测试）

- [ ] **Step 2: 打包 Windows zip 验证构建不报错**

```bash
npm run electron:build -- --win dir
ls dist_electron/win-unpacked/TodoWidget.exe
```

Expected: 构建成功，win-unpacked 目录存在

- [ ] **Step 3: 推送**

```bash
git push
```
