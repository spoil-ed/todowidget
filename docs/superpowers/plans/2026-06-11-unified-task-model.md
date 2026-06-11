# Unified Task Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge todos/events/backlogs into a single unified `tasks` store, replace BacklogView + DeadlineView + three modals with TaskListView + AddTaskModal, and simplify sidebar to 2 tabs.

**Architecture:** All tasks stored as flat array in electron-store (`tasks.json`). On first load, a migration converts existing `todos`/`events`/`backlog` stores to the unified format. The `kind` field (`event`|`ddl`|`day`|`free`) drives all display logic. Existing `config` store and all calendar helpers are untouched.

**Tech Stack:** Vue 3 (Options API), Vuex 4, Electron, electron-store, moment.js, lodash.uniqueid

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/background.js` |
| Create | `src/repositories/tasksRepository.js` |
| Create | `src/store/modules/tasks.store.js` |
| Modify | `src/store/store.js` |
| Modify | `src/main.js` |
| Create | `src/views/AddTaskModal.vue` |
| Create | `src/views/TaskListView.vue` |
| Modify | `src/components/layout/SideBar.vue` |
| Modify | `src/components/TimelineEvent.vue` |
| Modify | `src/components/TimelinePanel.vue` |
| Modify | `src/components/QuickAdd.vue` |
| Modify | `src/components/DayView.vue` |
| Modify | `src/components/WeekView.vue` |
| Modify | `src/components/MonthView.vue` |
| Modify | `src/views/WidgetView.vue` |
| Modify | `src/App.vue` |
| Delete | `src/views/BacklogView.vue`, `src/views/DeadlineView.vue`, `src/views/AddBacklogModal.vue`, `src/views/AddEventModal.vue`, `src/views/TodoModal.vue` |
| Delete | `src/store/modules/todolist.store.js`, `src/store/modules/events.store.js`, `src/store/modules/backlog.store.js` |
| Delete | `src/repositories/todoRepository.js`, `src/repositories/eventsRepository.js`, `src/repositories/backlogRepository.js` |
| Delete | `src/components/BacklogItem.vue` |

---

## Task 1: Add tasks IPC to background.js

**Files:**
- Modify: `src/background.js`

- [ ] **Add tasksStore and IPC handlers after the existing store declarations (line ~11)**

  ```js
  // Add after: const backlogStore = new Store({ name: 'backlog' })
  const tasksStore = new Store({ name: 'tasks' })
  ```

- [ ] **Add IPC handlers after the existing backlog handlers (near line ~132)**

  ```js
  // ── IPC: tasks ──
  ipcMain.handle('tasks:getAll', () => tasksStore.get('items', []))
  ipcMain.handle('tasks:set', (_, items) => { tasksStore.set('items', items) })
  ```

- [ ] **Commit**

  ```bash
  git add src/background.js
  git commit -m "feat: add tasks IPC handlers to background"
  ```

---

## Task 2: Create tasksRepository.js

**Files:**
- Create: `src/repositories/tasksRepository.js`

- [ ] **Create the file**

  ```js
  let _ipc = null
  function getIpc() {
    if (!_ipc) _ipc = window.require('electron').ipcRenderer
    return _ipc
  }

  export default {
    getAll() { return getIpc().invoke('tasks:getAll') },
    set(tasks) { return getIpc().invoke('tasks:set', tasks) },
  }
  ```

- [ ] **Commit**

  ```bash
  git add src/repositories/tasksRepository.js
  git commit -m "feat: add tasksRepository"
  ```

---

## Task 3: Create tasks.store.js

**Files:**
- Create: `src/store/modules/tasks.store.js`

- [ ] **Create the file with migration logic, getters, and actions**

  ```js
  import tasksRepository from '../../repositories/tasksRepository'
  import uniqueId from 'lodash.uniqueid'
  import moment from 'moment'

  function migrateTasks(oldTodos, oldEvents, oldBacklog) {
    const tasks = []
    if (oldTodos) {
      for (const [date, items] of Object.entries(oldTodos)) {
        for (const t of (items || [])) {
          tasks.push({
            id: t.id, text: t.text,
            kind: t.ddl ? 'ddl' : 'day',
            checked: !!t.checked, date,
            ...(t.ddl ? { ddl: t.ddl } : {}),
          })
        }
      }
    }
    if (oldEvents) {
      for (const [date, items] of Object.entries(oldEvents)) {
        for (const e of (items || [])) {
          tasks.push({
            id: e.id, text: e.title, kind: 'event',
            checked: false, date,
            startTime: e.startTime, endTime: e.endTime,
          })
        }
      }
    }
    if (Array.isArray(oldBacklog)) {
      for (const b of oldBacklog) {
        tasks.push({
          id: b.id, text: b.text, kind: 'free',
          checked: b.status === 'done',
          subtasks: b.subtasks || [],
        })
      }
    }
    return tasks
  }

  const state = { tasks: [] }

  const getters = {
    tasks: s => s.tasks,
    tasksForDate: s => date => s.tasks.filter(t => t.date === date),
    overdueTasks: s => {
      const now = moment()
      return s.tasks.filter(t => {
        if (t.kind !== 'ddl' || t.checked) return false
        const d = t.ddl.includes(' ')
          ? moment(t.ddl, 'YYYY-MM-DD HH:mm')
          : moment(t.ddl, 'YYYY-MM-DD').endOf('day')
        return d.isBefore(now)
      })
    },
    freeTasks: s => s.tasks.filter(t => t.kind === 'free'),
  }

  const mutations = {
    setTasks(state, tasks) { state.tasks = tasks },
  }

  const actions = {
    async loadTasks({ commit }) {
      const ipc = window.require('electron').ipcRenderer
      const migrated = await ipc.invoke('config:get', 'tasks_migrated', false)
      let tasks = await tasksRepository.getAll()
      if (!migrated) {
        const [oldTodos, oldEvents, oldBacklog] = await Promise.all([
          ipc.invoke('todos:getAll'),
          ipc.invoke('events:getAll'),
          ipc.invoke('backlog:getAll'),
        ])
        tasks = migrateTasks(oldTodos, oldEvents, oldBacklog)
        await tasksRepository.set(tasks)
        await ipc.invoke('config:set', 'tasks_migrated', true)
      }
      commit('setTasks', tasks)
    },
    addTask({ commit, state }, task) {
      const newTask = { id: uniqueId('task_'), checked: false, ...task }
      const tasks = [...state.tasks, newTask]
      commit('setTasks', tasks)
      tasksRepository.set(tasks)
    },
    toggleTask({ commit, state }, { id }) {
      const tasks = state.tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t)
      commit('setTasks', tasks)
      tasksRepository.set(tasks)
    },
    deleteTask({ commit, state }, { id }) {
      const tasks = state.tasks.filter(t => t.id !== id)
      commit('setTasks', tasks)
      tasksRepository.set(tasks)
    },
  }

  export default { namespaced: false, state, getters, mutations, actions }
  ```

- [ ] **Commit**

  ```bash
  git add src/store/modules/tasks.store.js
  git commit -m "feat: add unified tasks store with migration"
  ```

---

## Task 4: Update store.js

**Files:**
- Modify: `src/store/store.js`

- [ ] **Replace the entire file**

  ```js
  import { createStore } from 'vuex'
  import tasks from './modules/tasks.store'
  import config from './modules/config.store'

  export const store = createStore({
    modules: { config, tasks },
    state: {},
    getters: {},
    mutations: {},
    actions: {},
  })
  ```

- [ ] **Commit**

  ```bash
  git add src/store/store.js
  git commit -m "refactor: register tasks module, remove old modules"
  ```

---

## Task 5: Update main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Replace the entire file**

  ```js
  import { createApp } from 'vue'
  import App from './App.vue'
  import { store } from './store/store'
  import storageRepository from './repositories/storageRepository'
  import moment from 'moment'
  import 'moment/locale/zh-cn'

  import 'bootstrap'
  import 'bootstrap/dist/css/bootstrap.min.css'
  import 'bootstrap-icons/font/bootstrap-icons.css'
  import './assets/style/globalVars.scss'
  import './assets/style/main.scss'

  moment.locale('zh-cn')

  async function init() {
    const allConfig = await storageRepository.getAll()

    store.commit('initConfig', {
      activeView: allConfig.activeView || 'month',
      selectedDate: allConfig.selectedDate || moment().format('YYYY-MM-DD'),
    })

    if (!store.getters.selectedDate) {
      store.commit('setSelectedDate', moment().format('YYYY-MM-DD'))
    }

    await store.dispatch('loadTasks')

    createApp(App).use(store).mount('#app')
  }

  init()
  ```

- [ ] **Commit**

  ```bash
  git add src/main.js
  git commit -m "refactor: simplify init to single loadTasks dispatch"
  ```

---

## Task 6: Create AddTaskModal.vue

**Files:**
- Create: `src/views/AddTaskModal.vue`

- [ ] **Create the file**

  ```vue
  <template>
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <h3>添加任务</h3>

        <input
          ref="textInput"
          v-model="text"
          placeholder="任务内容..."
          @keydown.enter="confirm"
        />

        <div class="tm-row">
          <input type="date" v-model="date" />
          <template v-if="date">
            <button class="tm-icon-btn" :class="{ active: kind === 'event' }" @click="kind = 'event'" title="日程">
              <i class="bi bi-calendar-event"></i>
            </button>
            <button class="tm-icon-btn" :class="{ active: kind === 'ddl' }" @click="kind = 'ddl'" title="截止">
              <i class="bi bi-clock"></i>
            </button>
            <button class="tm-icon-btn" :class="{ active: kind === 'day' }" @click="kind = 'day'" title="任务">
              <i class="bi bi-check2-square"></i>
            </button>
          </template>
        </div>

        <div v-if="date && kind === 'event'" class="tm-extra">
          <input type="time" v-model="startTime" />
          <span class="tm-dash">—</span>
          <input type="time" v-model="endTime" />
        </div>

        <div v-if="date && kind === 'ddl'" class="tm-extra">
          <label>截止时间</label>
          <input type="time" v-model="ddlTime" placeholder="不填则全天" />
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
    name: 'AddTaskModal',
    props: {
      initialDate: { type: String, default: '' },
      initialTime: { type: String, default: '' },
    },
    emits: ['close'],
    data() {
      const date = this.initialDate || this.$store.getters.selectedDate
      return {
        text: '',
        date,
        kind: date ? 'day' : 'free',
        startTime: this.initialTime || '09:00',
        endTime: this.initialTime ? this.addHour(this.initialTime) : '10:00',
        ddlTime: '',
        error: '',
      }
    },
    watch: {
      date(val) {
        if (!val) this.kind = 'free'
        else if (this.kind === 'free') this.kind = 'day'
      },
    },
    mounted() { this.$refs.textInput.focus() },
    methods: {
      addHour(time) {
        const [h, m] = time.split(':').map(Number)
        return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      },
      confirm() {
        const text = this.text.trim()
        if (!text) { this.error = '请填写内容'; return }
        if (this.date && this.kind === 'event') {
          if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
          this.$store.dispatch('addTask', {
            text, kind: 'event', date: this.date,
            startTime: this.startTime, endTime: this.endTime,
          })
        } else if (this.date && this.kind === 'ddl') {
          const ddl = this.ddlTime ? `${this.date} ${this.ddlTime}` : this.date
          this.$store.dispatch('addTask', { text, kind: 'ddl', date: this.date, ddl })
        } else if (this.date) {
          this.$store.dispatch('addTask', { text, kind: 'day', date: this.date })
        } else {
          this.$store.dispatch('addTask', { text, kind: 'free', subtasks: [] })
        }
        this.$emit('close')
      },
    },
  }
  </script>

  <style scoped>
  .tm-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }
  .tm-row input[type="date"] { flex: 1; margin-bottom: 0; }
  .tm-icon-btn {
    border: 1px solid var(--border);
    background: none;
    padding: 5px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-muted);
    font-size: 13px;
    transition: background 0.1s, color 0.1s;
    &:hover { background: var(--bg-hover); color: var(--text); }
    &.active { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
  }
  .tm-extra {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    label { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
    input { flex: 1; }
  }
  .tm-dash { color: var(--text-muted); font-size: 12px; }
  .modal-error { color: var(--danger); font-size: 12px; margin: 0 0 8px; }
  </style>
  ```

- [ ] **Commit**

  ```bash
  git add src/views/AddTaskModal.vue
  git commit -m "feat: add unified AddTaskModal"
  ```

---

## Task 7: Create TaskListView.vue

**Files:**
- Create: `src/views/TaskListView.vue`

- [ ] **Create the file**

  ```vue
  <template>
    <div class="task-list-view">
      <div class="tlv-header">
        <div class="tlv-filter">
          <button :class="['tlv-btn', { active: filter === 'pending' }]" @click="filter = 'pending'">待完成</button>
          <button :class="['tlv-btn', { active: filter === 'all' }]" @click="filter = 'all'">全部</button>
        </div>
      </div>
      <div class="tlv-body">
        <div v-if="overdue.length" class="tlv-group">
          <div class="tlv-group-hd overdue">逾期 <span class="tlv-count">{{ overdue.length }}</span></div>
          <div v-for="t in overdue" :key="t.id" :class="['tlv-item', { done: t.checked }]">
            <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
            <div class="tlv-item-body">
              <span class="tlv-text">{{ t.text }}</span>
              <span class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
            </div>
            <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
          </div>
        </div>

        <div v-if="todayItems.length" class="tlv-group">
          <div class="tlv-group-hd today">今日 <span class="tlv-count">{{ todayItems.length }}</span></div>
          <div v-for="t in todayItems" :key="t.id" :class="['tlv-item', { done: t.checked }]">
            <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
            <div class="tlv-item-body">
              <span class="tlv-text">{{ t.text }}</span>
              <span v-if="t.kind === 'event'" class="tlv-meta"><i class="bi bi-calendar-event"></i> {{ t.startTime }}–{{ t.endTime }}</span>
              <span v-else-if="t.kind === 'ddl'" class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
            </div>
            <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
          </div>
        </div>

        <template v-for="group in upcomingGroups" :key="group.date">
          <div class="tlv-group">
            <div class="tlv-group-hd">{{ formatDate(group.date) }}</div>
            <div v-for="t in group.tasks" :key="t.id" :class="['tlv-item', { done: t.checked }]">
              <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
              <div class="tlv-item-body">
                <span class="tlv-text">{{ t.text }}</span>
                <span v-if="t.kind === 'event'" class="tlv-meta"><i class="bi bi-calendar-event"></i> {{ t.startTime }}–{{ t.endTime }}</span>
                <span v-else-if="t.kind === 'ddl'" class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
              </div>
              <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
            </div>
          </div>
        </template>

        <div v-if="freeItems.length" class="tlv-group">
          <div class="tlv-group-hd">自由任务</div>
          <div v-for="t in freeItems" :key="t.id" :class="['tlv-item', { done: t.checked }]">
            <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
            <div class="tlv-item-body">
              <span class="tlv-text">{{ t.text }}</span>
            </div>
            <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
          </div>
        </div>

        <div v-if="isEmpty" class="tlv-empty">暂无任务</div>
      </div>
    </div>
  </template>

  <script>
  import moment from 'moment'

  export default {
    name: 'TaskListView',
    data() { return { filter: 'pending' } },
    computed: {
      allTasks() {
        const all = this.$store.getters.tasks
        return this.filter === 'pending' ? all.filter(t => !t.checked) : all
      },
      today() { return moment().format('YYYY-MM-DD') },
      overdueIds() {
        return new Set(this.$store.getters.overdueTasks.map(t => t.id))
      },
      overdue() {
        return this.$store.getters.overdueTasks.filter(t =>
          this.filter === 'all' || !t.checked
        )
      },
      todayItems() {
        return this.allTasks.filter(t =>
          t.date === this.today && !this.overdueIds.has(t.id)
        )
      },
      upcomingGroups() {
        const future = this.allTasks.filter(t =>
          t.date && t.date > this.today && !this.overdueIds.has(t.id)
        )
        const byDate = {}
        for (const t of future) {
          if (!byDate[t.date]) byDate[t.date] = []
          byDate[t.date].push(t)
        }
        return Object.keys(byDate).sort().map(date => ({ date, tasks: byDate[date] }))
      },
      freeItems() {
        return this.allTasks.filter(t => t.kind === 'free')
      },
      isEmpty() {
        return !this.overdue.length && !this.todayItems.length &&
               !this.upcomingGroups.length && !this.freeItems.length
      },
    },
    methods: {
      toggle(t) { this.$store.dispatch('toggleTask', { id: t.id }) },
      del(t) { this.$store.dispatch('deleteTask', { id: t.id }) },
      formatDate(date) { return moment(date, 'YYYY-MM-DD').format('M月D日 ddd') },
      formatDdl(ddl) {
        if (!ddl) return ''
        return ddl.includes(' ')
          ? moment(ddl, 'YYYY-MM-DD HH:mm').format('M月D日 HH:mm')
          : moment(ddl, 'YYYY-MM-DD').format('M月D日')
      },
    },
  }
  </script>

  <style scoped>
  .task-list-view { display: flex; flex-direction: column; height: 100%; }
  .tlv-header {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .tlv-filter { display: flex; gap: 4px; }
  .tlv-btn {
    border: 1px solid var(--border); background: none;
    border-radius: var(--radius-sm); padding: 4px 10px;
    font-size: 12px; cursor: pointer; color: var(--text-muted);
    transition: all 0.1s;
    &:hover { background: var(--bg-hover); color: var(--text); }
    &.active { background: var(--primary); color: white; border-color: var(--primary); }
  }
  .tlv-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
  .tlv-empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0; }
  .tlv-group { margin-bottom: 20px; }
  .tlv-group-hd {
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    color: var(--text-muted); margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
    &.overdue { color: var(--danger); }
    &.today { color: #e6a817; }
  }
  .tlv-count {
    font-size: 11px; background: var(--bg-subtle); color: var(--text-muted);
    border-radius: 10px; padding: 0 7px; border: 1px solid var(--border);
    font-weight: 400;
  }
  .tlv-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: var(--radius);
    border: 1px solid var(--border); background: var(--bg);
    margin-bottom: 6px; transition: background 0.1s;
    &:hover { background: var(--bg-hover); }
    &:hover .tlv-del { opacity: 1; }
    &.done { opacity: 0.55; }
  }
  .tlv-check { cursor: pointer; accent-color: var(--primary); flex-shrink: 0; }
  .tlv-item-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .tlv-text {
    font-size: 13px; color: var(--text);
    .done & { text-decoration: line-through; }
  }
  .tlv-meta { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
  .tlv-del {
    border: none; background: none; cursor: pointer;
    color: var(--text-muted); font-size: 13px; padding: 3px 5px;
    border-radius: var(--radius-sm); opacity: 0;
    transition: opacity 0.1s, color 0.1s;
    &:hover { color: var(--danger); }
  }
  </style>
  ```

- [ ] **Commit**

  ```bash
  git add src/views/TaskListView.vue
  git commit -m "feat: add TaskListView with overdue/today/upcoming/free sections"
  ```

---

## Task 8: Update SideBar.vue

**Files:**
- Modify: `src/components/layout/SideBar.vue`

- [ ] **Replace the entire file**

  ```vue
  <template>
    <div class="sidebar">
      <div class="sidebar-page-tabs">
        <button
          class="sidebar-tab"
          :class="{ active: currentPage === 'calendar' }"
          @click="$store.commit('setPage', 'calendar')"
        >
          <i class="bi bi-calendar3"></i>
          <span>日历</span>
        </button>
        <button
          class="sidebar-tab"
          :class="{ active: currentPage !== 'calendar' }"
          @click="$store.commit('setPage', 'tasks')"
        >
          <i class="bi bi-list-check"></i>
          <span>待办</span>
        </button>
      </div>
      <div class="sidebar-nav">
        <button @click="prevMonth"><i class="bi bi-chevron-left"></i></button>
        <span class="sidebar-month-label">{{ monthLabel }}</span>
        <button @click="nextMonth"><i class="bi bi-chevron-right"></i></button>
      </div>
      <div class="mini-grid">
        <div class="mini-weekday" v-for="d in weekdayNames" :key="d">{{ d }}</div>
        <div
          v-for="cell in flatGrid"
          :key="cell.date"
          class="mini-cell"
          :class="{
            today: cell.isToday,
            selected: cell.date === selectedDate,
            'other-month': !cell.isCurrentMonth,
          }"
          @click="selectDate(cell.date)"
        >{{ cell.dayNum }}</div>
      </div>
      <div v-if="dateTasks.length" class="sidebar-day-summary">
        <div class="sds-label">{{ summaryLabel }}</div>
        <div
          v-for="t in dateTasks"
          :key="t.id"
          class="sds-item"
          @click="goToDay"
        >
          <span v-if="t.kind === 'event'" class="sds-time">{{ t.startTime }}</span>
          <span v-else-if="t.kind === 'ddl'" class="sds-time">⏰</span>
          <span class="sds-text">{{ t.text }}</span>
        </div>
      </div>
    </div>
  </template>

  <script>
  import moment from 'moment'
  import { monthGrid, today } from '../../helpers/dateHelper'

  export default {
    name: 'SideBar',
    data() {
      return { cursorDate: this.$store.getters.selectedDate || today() }
    },
    watch: {
      selectedDate(val) {
        if (val && val.slice(0, 7) !== this.cursorDate.slice(0, 7)) {
          this.cursorDate = val
        }
      },
    },
    computed: {
      selectedDate() { return this.$store.getters.selectedDate },
      currentPage() { return this.$store.getters.currentPage },
      monthLabel() { return moment(this.cursorDate, 'YYYY-MM-DD').format('YYYY年M月') },
      weekdayNames() { return ['一', '二', '三', '四', '五', '六', '日'] },
      flatGrid() {
        return monthGrid(this.cursorDate).flat().map(cell => ({
          ...cell,
          dayNum: moment(cell.date, 'YYYY-MM-DD').date(),
        }))
      },
      dateTasks() {
        return this.$store.getters.tasksForDate(this.selectedDate)
          .filter(t => t.kind !== 'free')
          .slice(0, 5)
      },
      summaryLabel() {
        return moment(this.selectedDate, 'YYYY-MM-DD').format('M月D日')
      },
    },
    methods: {
      prevMonth() {
        this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').subtract(1, 'month').format('YYYY-MM-DD')
      },
      nextMonth() {
        this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').add(1, 'month').format('YYYY-MM-DD')
      },
      selectDate(date) {
        this.$store.commit('setSelectedDate', date)
        this.$store.commit('setPage', 'calendar')
      },
      goToDay() {
        this.$store.commit('setActiveView', 'day')
        this.$store.commit('setPage', 'calendar')
      },
    },
  }
  </script>

  <style scoped>
  .sidebar { display: flex; flex-direction: column; }
  .sidebar-page-tabs {
    display: flex; padding: 8px 8px 0; gap: 4px;
    border-bottom: 1px solid var(--border); margin-bottom: 4px;
  }
  .sidebar-tab {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 5px; padding: 6px 4px; border: none;
    border-bottom: 2px solid transparent; background: none;
    cursor: pointer; color: var(--text-muted); font-size: 12px;
    border-radius: 4px 4px 0 0; transition: color 0.15s;
  }
  .sidebar-tab:hover { color: var(--accent, #4a90d9); }
  .sidebar-tab.active { color: var(--accent, #4a90d9); border-bottom-color: var(--accent, #4a90d9); font-weight: 600; }
  .sidebar-tab i { font-size: 14px; }
  .sidebar-day-summary {
    padding: 8px 10px; border-top: 1px solid var(--border); margin-top: 4px;
  }
  .sds-label {
    font-size: 10px; font-weight: 700; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
  }
  .sds-item {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 4px; border-radius: var(--radius-sm); cursor: pointer;
    &:hover { background: var(--bg-hover); }
  }
  .sds-time { font-size: 10px; color: var(--text-muted); width: 32px; flex-shrink: 0; }
  .sds-text { font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  </style>
  ```

- [ ] **Commit**

  ```bash
  git add src/components/layout/SideBar.vue
  git commit -m "feat: simplify sidebar to 2 tabs, add date summary section"
  ```

---

## Task 9: Update TimelineEvent.vue

**Files:**
- Modify: `src/components/TimelineEvent.vue`

- [ ] **Change `event.title` to `event.text` on line 8**

  Old:
  ```html
  <span class="tl-event-title">{{ event.title }}</span>
  ```

  New:
  ```html
  <span class="tl-event-title">{{ event.text }}</span>
  ```

- [ ] **Commit**

  ```bash
  git add src/components/TimelineEvent.vue
  git commit -m "fix: use event.text instead of event.title in TimelineEvent"
  ```

---

## Task 10: Update TimelinePanel.vue

**Files:**
- Modify: `src/components/TimelinePanel.vue`

- [ ] **Replace the `<script>` section**

  ```vue
  <script>
  import { timeToMinutes, minutesToTime, calcTimelineRange } from '../helpers/timeHelper'
  import TimelineEvent from './TimelineEvent.vue'
  import AddTaskModal from '../views/AddTaskModal.vue'

  export default {
    name: 'TimelinePanel',
    components: { TimelineEvent, AddTaskModal },
    props: {
      date: { type: String, required: true },
    },
    data() {
      return { showModal: false, modalInitialTime: '09:00' }
    },
    computed: {
      events() {
        return this.$store.getters.tasksForDate(this.date)
          .filter(t => t.kind === 'event')
      },
      ddlMarkers() {
        return this.$store.getters.tasksForDate(this.date)
          .filter(t => t.kind === 'ddl' && t.ddl && t.ddl.includes(' '))
          .map(t => ({ ...t, ddlTime: t.ddl.split(' ')[1] }))
      },
      range() {
        const ddlMins = this.ddlMarkers.map(t => timeToMinutes(t.ddlTime))
        return calcTimelineRange(this.events, ddlMins)
      },
      totalHeight() { return this.range.end - this.range.start },
      hourMarkers() {
        const markers = []
        const startHour = Math.floor(this.range.start / 60)
        const endHour = Math.ceil(this.range.end / 60)
        for (let h = startHour; h <= endHour; h++) {
          const minutes = h * 60
          if (minutes < this.range.start || minutes > this.range.end) continue
          markers.push({ label: minutesToTime(minutes), top: minutes - this.range.start })
        }
        return markers
      },
    },
    methods: {
      ddlMarkerTop(t) { return timeToMinutes(t.ddlTime) - this.range.start },
      eventTop(event) { return timeToMinutes(event.startTime) - this.range.start },
      eventHeight(event) {
        return Math.max(20, timeToMinutes(event.endTime) - timeToMinutes(event.startTime))
      },
      handleTimelineClick(e) {
        if (e.target.closest('.timeline-event')) return
        const snapped = Math.round((this.range.start + e.offsetY) / 15) * 15
        this.modalInitialTime = minutesToTime(Math.min(snapped, 1380))
        this.showModal = true
      },
      deleteEvent(id) { this.$store.dispatch('deleteTask', { id }) },
      openModal(time) { this.modalInitialTime = time; this.showModal = true },
    },
  }
  </script>
  ```

- [ ] **Update the modal in the template: replace `<add-event-modal>` with `<add-task-modal>`**

  Old:
  ```html
  <add-event-modal
    v-if="showModal"
    :date="date"
    :initial-time="modalInitialTime"
    @close="showModal = false"
  />
  ```

  New:
  ```html
  <add-task-modal
    v-if="showModal"
    :initial-date="date"
    :initial-time="modalInitialTime"
    @close="showModal = false"
  />
  ```

- [ ] **Commit**

  ```bash
  git add src/components/TimelinePanel.vue
  git commit -m "refactor: TimelinePanel uses tasks store and AddTaskModal"
  ```

---

## Task 11: Update QuickAdd.vue

**Files:**
- Modify: `src/components/QuickAdd.vue`

- [ ] **In the `submit` method, replace `addEvent`/`addTodo` dispatches with `addTask`**

  Old `submit` method:
  ```js
  submit() {
    const text = this.text.trim()
    if (!text) { this.error = '请填写内容'; return }
    if (this.showSchedule) {
      if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
      this.$store.dispatch('addEvent', {
        date: this.date, title: text,
        startTime: this.startTime, endTime: this.endTime,
      })
    } else {
      const ddl = this.ddlDate
        ? (this.ddlTime ? `${this.ddlDate} ${this.ddlTime}` : this.ddlDate)
        : null
      this.$store.dispatch('addTodo', { date: this.date, text, ddl })
    }
    this.cancel()
  },
  ```

  New `submit` method:
  ```js
  submit() {
    const text = this.text.trim()
    if (!text) { this.error = '请填写内容'; return }
    if (this.showSchedule) {
      if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
      this.$store.dispatch('addTask', {
        kind: 'event', date: this.date, text,
        startTime: this.startTime, endTime: this.endTime,
      })
    } else if (this.showDdl) {
      const ddl = this.ddlDate
        ? (this.ddlTime ? `${this.ddlDate} ${this.ddlTime}` : this.ddlDate)
        : this.date
      this.$store.dispatch('addTask', { kind: 'ddl', date: this.date, text, ddl })
    } else {
      this.$store.dispatch('addTask', { kind: 'day', date: this.date, text })
    }
    this.cancel()
  },
  ```

- [ ] **Commit**

  ```bash
  git add src/components/QuickAdd.vue
  git commit -m "refactor: QuickAdd dispatches addTask instead of addTodo/addEvent"
  ```

---

## Task 12: Update DayView.vue

**Files:**
- Modify: `src/components/DayView.vue`

- [ ] **Replace the `<script>` section**

  ```vue
  <script>
  import moment from 'moment'
  import TodoItem from './TodoItem.vue'
  import TimelinePanel from './TimelinePanel.vue'
  import QuickAdd from './QuickAdd.vue'

  export default {
    name: 'DayView',
    components: { TodoItem, TimelinePanel, QuickAdd },
    computed: {
      selectedDate() { return this.$store.getters.selectedDate },
      todos() {
        return this.$store.getters.tasksForDate(this.selectedDate)
          .filter(t => t.kind === 'day' || t.kind === 'ddl')
      },
      headerLabel() {
        return moment(this.selectedDate, 'YYYY-MM-DD').format('YYYY年M月D日 dddd')
      },
    },
    methods: {
      toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
      deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
    },
  }
  </script>
  ```

- [ ] **Commit**

  ```bash
  git add src/components/DayView.vue
  git commit -m "refactor: DayView uses tasks store"
  ```

---

## Task 13: Update WeekView.vue

**Files:**
- Modify: `src/components/WeekView.vue`

- [ ] **Replace the three methods that use old store and the computed getter**

  Old `todosFor`, `addTodo`, `toggleTodo`, `deleteTodo`:
  ```js
  todosFor(date) { return this.$store.getters.todosForDate(date) },
  addTodo(date) {
    const text = (this.addTexts[date] || '').trim()
    if (!text) return
    this.$store.dispatch('addTodo', { date, text })
    this.addTexts[date] = ''
  },
  toggleTodo(date, id) { this.$store.dispatch('toggleTodo', { date, id }) },
  deleteTodo(date, id) { this.$store.dispatch('deleteTodo', { date, id }) },
  ```

  New:
  ```js
  todosFor(date) {
    return this.$store.getters.tasksForDate(date)
      .filter(t => t.kind === 'day' || t.kind === 'ddl')
  },
  addTodo(date) {
    const text = (this.addTexts[date] || '').trim()
    if (!text) return
    this.$store.dispatch('addTask', { kind: 'day', date, text })
    this.addTexts[date] = ''
  },
  toggleTodo(date, id) { this.$store.dispatch('toggleTask', { id }) },
  deleteTodo(date, id) { this.$store.dispatch('deleteTask', { id }) },
  ```

- [ ] **Commit**

  ```bash
  git add src/components/WeekView.vue
  git commit -m "refactor: WeekView uses tasks store"
  ```

---

## Task 14: Update MonthView.vue

**Files:**
- Modify: `src/components/MonthView.vue`

- [ ] **Read the rest of MonthView.vue to find addTodo/toggleTodo/deleteTodo** (lines 99+), then replace all three store-accessor methods:

  Old:
  ```js
  todosFor(date) { return this.$store.getters.todosForDate(date) },
  addTodo() {
    const text = this.newText.trim()
    if (!text) return
    this.$store.dispatch('addTodo', { date: this.selectedDate, text })
    this.newText = ''
  },
  toggleTodo(id) { this.$store.dispatch('toggleTodo', { date: this.selectedDate, id }) },
  deleteTodo(id) { this.$store.dispatch('deleteTodo', { date: this.selectedDate, id }) },
  ```

  New:
  ```js
  todosFor(date) {
    return this.$store.getters.tasksForDate(date)
      .filter(t => t.kind === 'day' || t.kind === 'ddl')
  },
  addTodo() {
    const text = this.newText.trim()
    if (!text) return
    this.$store.dispatch('addTask', { kind: 'day', date: this.selectedDate, text })
    this.newText = ''
  },
  toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
  deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
  ```

- [ ] **Also update the `allTodos` computed getter**

  Old:
  ```js
  allTodos() {
    return this.$store.getters.todosForDate(this.selectedDate)
  },
  ```

  New:
  ```js
  allTodos() {
    return this.$store.getters.tasksForDate(this.selectedDate)
      .filter(t => t.kind === 'day' || t.kind === 'ddl')
  },
  ```

- [ ] **Commit**

  ```bash
  git add src/components/MonthView.vue
  git commit -m "refactor: MonthView uses tasks store"
  ```

---

## Task 15: Update WidgetView.vue

**Files:**
- Modify: `src/views/WidgetView.vue`

- [ ] **Update the `events` computed** (currently reads `eventsForDate`):

  Old:
  ```js
  events() {
    return (this.$store.getters.eventsForDate(this.widgetDate) || [])
      .slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
  },
  ```

  New:
  ```js
  events() {
    return this.$store.getters.tasksForDate(this.widgetDate)
      .filter(t => t.kind === 'event')
      .slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
  },
  ```

- [ ] **Update the `todos` computed**:

  Old:
  ```js
  todos() {
    return this.$store.getters.todosForDate(this.widgetDate) || []
  },
  ```

  New:
  ```js
  todos() {
    return this.$store.getters.tasksForDate(this.widgetDate)
      .filter(t => t.kind === 'day' || t.kind === 'ddl')
  },
  ```

- [ ] **Update `monthCells` and `weekCells` computed** (both use `todosForDate`):

  In `monthCells`, old:
  ```js
  count: (this.$store.getters.todosForDate(cell.date) || []).filter(t => !t.checked).length,
  ```
  New:
  ```js
  count: this.$store.getters.tasksForDate(cell.date).filter(t => !t.checked).length,
  ```

  In `weekCells`, old:
  ```js
  count: (this.$store.getters.todosForDate(date) || []).filter(t => !t.checked).length,
  ```
  New:
  ```js
  count: this.$store.getters.tasksForDate(date).filter(t => !t.checked).length,
  ```

- [ ] **Update `refresh` method**:

  Old:
  ```js
  refresh() {
    this.$store.dispatch('loadAllEvents')
    getIpc().invoke('todos:getAll').then(all => this.$store.commit('initTodos', all))
  },
  ```

  New:
  ```js
  refresh() { this.$store.dispatch('loadTasks') },
  ```

- [ ] **Update `toggleTodo`, `deleteTodo`, `deleteEvent` methods**:

  Old:
  ```js
  toggleTodo(id) { this.$store.dispatch('toggleTodo', { date: this.widgetDate, id }) },
  deleteTodo(id) { this.$store.dispatch('deleteTodo', { date: this.widgetDate, id }) },
  deleteEvent(id) { this.$store.dispatch('deleteEvent', { date: this.widgetDate, id }) },
  ```

  New:
  ```js
  toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
  deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
  deleteEvent(id) { this.$store.dispatch('deleteTask', { id }) },
  ```

- [ ] **Update `submitTodo` dispatch**:

  Old:
  ```js
  this.$store.dispatch('addTodo', { date: this.widgetDate, text, ddl })
  ```

  New:
  ```js
  const kind = ddl ? 'ddl' : 'day'
  this.$store.dispatch('addTask', { kind, date: this.widgetDate, text, ...(ddl ? { ddl } : {}) })
  ```

- [ ] **Update `submitEvent` dispatch**:

  Old:
  ```js
  this.$store.dispatch('addEvent', {
    date: this.widgetDate, title,
    startTime: this.newEventStart, endTime: this.newEventEnd,
  })
  ```

  New:
  ```js
  this.$store.dispatch('addTask', {
    kind: 'event', date: this.widgetDate, text: title,
    startTime: this.newEventStart, endTime: this.newEventEnd,
  })
  ```

- [ ] **Fix event title display in template** (line ~83):

  Old: `{{ e.title }}`
  New: `{{ e.text }}`

- [ ] **Commit**

  ```bash
  git add src/views/WidgetView.vue
  git commit -m "refactor: WidgetView uses tasks store"
  ```

---

## Task 16: Update App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Replace the entire file**

  ```vue
  <template>
    <widget-view v-if="isWidgetMode" />
    <div v-else id="app">
      <div class="app-topbar">
        <span class="app-title">TodoWidget</span>

        <template v-if="currentPage === 'calendar'">
          <div class="nav-arrows">
            <button @click="navigateBack"><i class="bi bi-chevron-left"></i></button>
            <button @click="navigateForward"><i class="bi bi-chevron-right"></i></button>
          </div>
          <span class="current-label">{{ currentLabel }}</span>
          <div class="view-switcher">
            <button :class="{ active: activeView === 'day' }" @click="setView('day')">日</button>
            <button :class="{ active: activeView === 'week' }" @click="setView('week')">周</button>
            <button :class="{ active: activeView === 'month' }" @click="setView('month')">月</button>
          </div>
        </template>
        <span v-else class="current-label">待办</span>

        <button class="topbar-icon-btn" @click="enterWidget" title="桌面挂件">
          <i class="bi bi-window-sidebar"></i>
        </button>
        <button class="add-btn" @click="showModal = true" title="添加任务">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>

      <div class="app-body">
        <side-bar />
        <div class="main-content">
          <template v-if="currentPage === 'calendar'">
            <day-view v-if="activeView === 'day'" />
            <week-view v-else-if="activeView === 'week'" />
            <month-view v-else />
          </template>
          <task-list-view v-else />
        </div>
      </div>

      <add-task-modal v-if="showModal" @close="showModal = false" />
    </div>
  </template>

  <script>
  import moment from 'moment'
  import DayView from './components/DayView.vue'
  import WeekView from './components/WeekView.vue'
  import MonthView from './components/MonthView.vue'
  import SideBar from './components/layout/SideBar.vue'
  import AddTaskModal from './views/AddTaskModal.vue'
  import TaskListView from './views/TaskListView.vue'
  import WidgetView from './views/WidgetView.vue'
  import { weekRange } from './helpers/dateHelper'

  let ipc = null
  function getIpc() {
    if (!ipc) ipc = window.require('electron').ipcRenderer
    return ipc
  }

  export default {
    name: 'App',
    components: { DayView, WeekView, MonthView, SideBar, AddTaskModal, TaskListView, WidgetView },
    data() { return { showModal: false } },
    computed: {
      isWidgetMode() { return window.location.hash === '#widget' },
      activeView()   { return this.$store.getters.activeView },
      currentPage()  { return this.$store.getters.currentPage },
      selectedDate() { return this.$store.getters.selectedDate },
      currentLabel() {
        const m = moment(this.selectedDate, 'YYYY-MM-DD')
        if (this.activeView === 'day') return m.format('YYYY年M月D日')
        if (this.activeView === 'week') {
          const dates = weekRange(this.selectedDate)
          const start = moment(dates[0], 'YYYY-MM-DD').format('M月D日')
          const end   = moment(dates[6], 'YYYY-MM-DD').format('M月D日')
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
      enterWidget() { getIpc().invoke('widget:show') },
    },
  }
  </script>
  ```

- [ ] **Commit**

  ```bash
  git add src/App.vue
  git commit -m "refactor: App.vue uses TaskListView and AddTaskModal, removes deadline page"
  ```

---

## Task 17: Delete old files

**Files to delete:**
```
src/views/BacklogView.vue
src/views/DeadlineView.vue
src/views/AddBacklogModal.vue
src/views/AddEventModal.vue
src/views/TodoModal.vue
src/store/modules/todolist.store.js
src/store/modules/events.store.js
src/store/modules/backlog.store.js
src/repositories/todoRepository.js
src/repositories/eventsRepository.js
src/repositories/backlogRepository.js
src/components/BacklogItem.vue
```

- [ ] **Delete all old files**

  ```bash
  rm src/views/BacklogView.vue \
     src/views/DeadlineView.vue \
     src/views/AddBacklogModal.vue \
     src/views/AddEventModal.vue \
     src/views/TodoModal.vue \
     src/store/modules/todolist.store.js \
     src/store/modules/events.store.js \
     src/store/modules/backlog.store.js \
     src/repositories/todoRepository.js \
     src/repositories/eventsRepository.js \
     src/repositories/backlogRepository.js \
     src/components/BacklogItem.vue
  ```

- [ ] **Commit**

  ```bash
  git add -A
  git commit -m "chore: delete old views, stores, and repositories"
  ```

---

## Task 18: Build and verify

- [ ] **Run the build**

  ```bash
  npm run electron:build 2>&1 | tail -20
  ```

  Expected: build completes with no errors, outputs to `dist_electron/`.

- [ ] **Run dev mode and verify**

  ```bash
  npm run electron:serve
  ```

  Check:
  1. App loads without console errors
  2. Sidebar shows 2 tabs: 日历 / 待办
  3. Existing todos/events/backlog appear after migration (check 待办 tab)
  4. Adding a task via + button works for all 4 kinds (event/ddl/day/free)
  5. Timeline shows event blocks and DDL markers
  6. Widget mode opens and shows events + todos

- [ ] **Bump version and commit**

  In `package.json`, change `"version"` to `"2.0.0"`.

  ```bash
  git add package.json
  git commit -m "feat(v2.0.0): unified task model, TaskListView, simplified navigation"
  ```
