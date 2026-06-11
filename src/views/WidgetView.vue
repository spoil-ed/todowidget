<template>
  <div class="widget-root">

    <!-- ── Header ── -->
    <div class="w-header">
      <div class="w-nav">
        <button class="w-btn" @click="navPrev"><i class="bi bi-chevron-left"></i></button>
        <span class="w-date-label">{{ headerLabel }}</span>
        <button class="w-btn" @click="navNext"><i class="bi bi-chevron-right"></i></button>
      </div>
      <div class="w-tabs">
        <button :class="['w-tab', { active: view === 'day' }]"   @click="switchView('day')">日</button>
        <button :class="['w-tab', { active: view === 'week' }]"  @click="switchView('week')">周</button>
        <button :class="['w-tab', { active: view === 'month' }]" @click="switchView('month')">月</button>
      </div>
      <button class="w-btn" @click="exitWidget" title="完整模式">
        <i class="bi bi-arrows-angle-expand"></i>
      </button>
    </div>

    <!-- ══════════ MONTH VIEW ══════════ -->
    <div v-if="view === 'month'" class="w-month">
      <div class="w-month-dow-row">
        <span v-for="d in dowNames" :key="d" class="w-month-dow">{{ d }}</span>
      </div>
      <div class="w-month-grid">
        <div
          v-for="cell in monthCells"
          :key="cell.date"
          :class="['w-month-cell', {
            today: cell.isToday,
            selected: cell.date === widgetDate,
            'other-month': !cell.inMonth,
          }]"
          @click="pickDay(cell.date)"
        >
          <span class="w-mc-num">{{ cell.num }}</span>
          <div class="w-mc-items">
            <div
              v-for="item in cell.preview"
              :key="item.id"
              class="w-mc-item"
              :class="[item.type, { done: item.checked }]"
              :title="item.rangeLabel ? `${item.rangeLabel} ${item.displayText}` : item.displayText"
            >
              <span v-if="item.timeLabel" class="w-mc-time">{{ item.timeLabel }}</span>
              <span class="w-mc-text">{{ item.displayText }}</span>
            </div>
            <div v-if="cell.overflow" class="w-mc-more">+{{ cell.overflow }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ WEEK VIEW ══════════ -->
    <div
      v-else-if="view === 'week'"
      class="w-week-grid"
    >
      <div
        v-for="d in weekCells"
        :key="d.date"
        :class="['w-week-cell', { today: d.isToday, selected: d.date === widgetDate }]"
        @click="pickDay(d.date)"
      >
        <div class="w-week-head">
          <span class="w-wc-dow">{{ d.dow }}</span>
          <span class="w-wc-num">{{ d.num }}</span>
        </div>
        <div class="w-week-zone w-week-events">
          <div
            v-for="event in d.events"
            :key="event.id"
            class="w-week-item event"
            :title="event.rangeLabel ? `${event.rangeLabel} ${event.displayText}` : event.displayText"
          >
            <span class="w-week-time">{{ event.timeLabel }}</span>
            <span class="w-week-text">{{ event.displayText }}</span>
          </div>
          <span v-if="!d.events.length" class="w-week-empty">无日程</span>
        </div>
        <div class="w-week-zone w-week-todos">
          <div
            v-for="todo in d.todos"
            :key="todo.id"
            class="w-week-item"
            :class="[todo.type, { done: todo.checked }]"
            :title="todo.rangeLabel ? `${todo.rangeLabel} ${todo.displayText}` : todo.displayText"
          >
            <span v-if="todo.timeLabel" class="w-week-time">{{ todo.timeLabel }}</span>
            <span class="w-week-text">{{ todo.displayText }}</span>
          </div>
          <span v-if="!d.todos.length" class="w-week-empty">无待办</span>
        </div>
        <span v-if="d.overflow" class="w-week-more">+{{ d.overflow }}</span>
      </div>
    </div>

    <!-- ══════════ DAY VIEW ══════════ -->
    <div v-else class="w-body">

      <!-- Events -->
      <div class="w-section">
        <div class="w-section-hd">
          <span class="w-section-label">日程</span>
          <button class="w-add-btn" @click="addingEvent = !addingEvent">
            <i :class="addingEvent ? 'bi bi-x' : 'bi bi-plus'"></i>
          </button>
        </div>
        <div v-if="addingEvent" class="w-add-form">
          <input v-model="newEventTitle" class="w-input" placeholder="日程内容"
            @keydown.enter="submitEvent" @keydown.esc="addingEvent=false" />
          <div class="w-time-row">
            <input type="time" v-model="newEventStart" class="w-input w-time" />
            <span>—</span>
            <input type="time" v-model="newEventEnd" class="w-input w-time" />
            <button class="w-confirm-btn" @click="submitEvent"><i class="bi bi-check-lg"></i></button>
          </div>
          <p v-if="eventError" class="w-error">{{ eventError }}</p>
        </div>
        <div v-for="e in events" :key="e.id" class="w-event-row">
          <span class="w-event-dot"></span>
          <span class="w-event-time">{{ e.startTime }}-{{ e.endTime }}</span>
          <span class="w-event-title">{{ e.text }}</span>
          <button class="w-del-btn" @click="deleteEvent(e.id)"><i class="bi bi-x"></i></button>
        </div>
        <div v-if="!events.length && !addingEvent" class="w-empty-hint">无日程</div>
      </div>

      <!-- Todos -->
      <div class="w-section">
        <div class="w-section-hd">
          <span class="w-section-label">待办</span>
          <button class="w-add-btn" @click="addingTodo = !addingTodo">
            <i :class="addingTodo ? 'bi bi-x' : 'bi bi-plus'"></i>
          </button>
        </div>
        <div v-if="addingTodo" class="w-add-form">
          <div class="w-todo-add-row">
            <input ref="todoInput" v-model="newTodoText" class="w-input" placeholder="待办内容"
              @keydown.enter="submitTodo" @keydown.esc="addingTodo=false" />
            <button class="w-confirm-btn" @click="submitTodo"><i class="bi bi-check-lg"></i></button>
          </div>
          <div class="w-todo-add-row" style="gap:4px">
            <input type="date" v-model="newTodoDdlDate" class="w-input" />
            <input type="time" v-model="newTodoDdlTime" :disabled="!newTodoDdlDate" class="w-input w-time" />
          </div>
        </div>
        <div v-for="t in todos" :key="t.id" :class="['w-todo-row', { done: t.checked }]">
          <input type="checkbox" :checked="t.checked" @change="toggleTodo(t.id)" class="w-checkbox" />
          <span class="w-todo-text">{{ t.text }}</span>
          <span v-if="t.ddl" class="w-todo-ddl">{{ formatDdl(t.ddl) }}</span>
          <button class="w-del-btn" @click="deleteTodo(t.id)"><i class="bi bi-x"></i></button>
        </div>
        <div v-if="!todos.length && !addingTodo" class="w-empty-hint">无待办</div>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="w-footer" style="-webkit-app-region: no-drag">
      <button class="w-btn" @click="toggleClickThrough"
        :title="clickThrough ? '取消穿透' : '锁定穿透'">
        <i :class="clickThrough ? 'bi bi-lock-fill' : 'bi bi-unlock-fill'"></i>
      </button>
      <button class="w-btn" @click="refresh" title="刷新"><i class="bi bi-arrow-clockwise"></i></button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { today, monthGrid } from '../helpers/dateHelper'
import { calendarItemsForDate, previewCalendarItems } from '../helpers/calendarItemsHelper'

const SIZES = { day: [300, 440], week: [460, 360], month: [460, 470] }
const WIDGET_MONTH_PREVIEW_MAX = 2
const WIDGET_WEEK_EVENTS_MAX = 2
const WIDGET_WEEK_TODOS_MAX = 3

let ipc = null
function getIpc() {
  if (!ipc) ipc = window.require('electron').ipcRenderer
  return ipc
}

export default {
  name: 'WidgetView',
  data() {
    return {
      widgetDate: today(),
      view: 'day',
      clickThrough: false,
      addingTodo: false,
      addingEvent: false,
      newTodoText: '', newTodoDdlDate: '', newTodoDdlTime: '',
      newEventTitle: '', newEventStart: '09:00', newEventEnd: '10:00',
      eventError: '',
    }
  },
  created() {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    const app = document.getElementById('app')
    if (app) app.style.background = 'transparent'
  },
  watch: {
    addingTodo(val) {
      if (val) this.$nextTick(() => this.$refs.todoInput?.focus())
    },
  },
  computed: {
    headerLabel() {
      const m = moment(this.widgetDate, 'YYYY-MM-DD')
      if (this.view === 'month') return m.format('YYYY年M月')
      if (this.view === 'week') {
        const mon = m.clone().subtract(m.day() === 0 ? 6 : m.day() - 1, 'days')
        const sun = mon.clone().add(6, 'days')
        return `${mon.format('M/D')} — ${sun.format('M/D')}`
      }
      return m.format('M月D日 ddd')
    },
    dowNames() { return ['一','二','三','四','五','六','日'] },
    allTasks() { return this.$store.getters.tasks },
    monthCells() {
      return monthGrid(this.widgetDate).flat().map(cell => {
        const preview = previewCalendarItems(this.allTasks, cell.date, WIDGET_MONTH_PREVIEW_MAX)
        return {
          ...cell,
          inMonth: cell.isCurrentMonth,
          num: moment(cell.date, 'YYYY-MM-DD').date(),
          preview: preview.items,
          overflow: preview.overflowCount,
        }
      })
    },
    weekCells() {
      const m = moment(this.widgetDate, 'YYYY-MM-DD')
      const mon = m.clone().subtract(m.day() === 0 ? 6 : m.day() - 1, 'days')
      return Array.from({ length: 7 }, (_, i) => {
        const d = mon.clone().add(i, 'days')
        const date = d.format('YYYY-MM-DD')
        const items = calendarItemsForDate(this.allTasks, date)
        const events = items.filter(item => item.type === 'event')
        const todos = items.filter(item => item.type !== 'event')
        const visibleEvents = events.slice(0, WIDGET_WEEK_EVENTS_MAX)
        const visibleTodos = todos.slice(0, WIDGET_WEEK_TODOS_MAX)
        return {
          date,
          dow: d.format('dd').slice(0, 1),
          num: d.date(),
          isToday: date === today(),
          events: visibleEvents,
          todos: visibleTodos,
          overflow: Math.max(0, items.length - visibleEvents.length - visibleTodos.length),
        }
      })
    },
    events() {
      return this.$store.getters.tasksForDate(this.widgetDate)
        .filter(t => t.kind === 'event')
        .slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
    },
    todos() {
      return calendarItemsForDate(this.allTasks, this.widgetDate)
        .filter(item => item.type !== 'event')
        .map(item => item.task)
    },
  },
  methods: {
    switchView(v) {
      this.view = v
      const [w, h] = SIZES[v]
      getIpc().invoke('widget:resize', w, h)
    },
    navPrev() {
      const unit = this.view === 'month' ? 'month' : this.view === 'week' ? 'week' : 'day'
      this.widgetDate = moment(this.widgetDate, 'YYYY-MM-DD').subtract(1, unit).format('YYYY-MM-DD')
    },
    navNext() {
      const unit = this.view === 'month' ? 'month' : this.view === 'week' ? 'week' : 'day'
      this.widgetDate = moment(this.widgetDate, 'YYYY-MM-DD').add(1, unit).format('YYYY-MM-DD')
    },
    pickDay(date) {
      this.widgetDate = date
      this.switchView('day')
    },
    exitWidget() { getIpc().invoke('widget:hide') },
    toggleClickThrough() {
      this.clickThrough = !this.clickThrough
      getIpc().invoke('widget:setClickThrough', this.clickThrough)
    },
    refresh() { this.$store.dispatch('loadTasks') },
    toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
    deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
    deleteEvent(id) { this.$store.dispatch('deleteTask', { id }) },
    submitTodo() {
      const text = this.newTodoText.trim()
      if (!text) return
      const ddl = this.newTodoDdlDate
        ? (this.newTodoDdlTime ? `${this.newTodoDdlDate} ${this.newTodoDdlTime}` : this.newTodoDdlDate)
        : null
      const kind = ddl ? 'ddl' : 'day'
      this.$store.dispatch('addTask', { kind, date: this.widgetDate, text, ...(ddl ? { ddl } : {}) })
      this.newTodoText = ''; this.newTodoDdlDate = ''; this.newTodoDdlTime = ''
      this.addingTodo = false
    },
    submitEvent() {
      const title = this.newEventTitle.trim()
      if (!title) { this.eventError = '请填写内容'; return }
      if (this.newEventStart >= this.newEventEnd) { this.eventError = '结束需晚于开始'; return }
      this.$store.dispatch('addTask', {
        kind: 'event', date: this.widgetDate, text: title,
        startTime: this.newEventStart, endTime: this.newEventEnd,
      })
      this.newEventTitle = ''; this.newEventStart = '09:00'; this.newEventEnd = '10:00'
      this.eventError = ''; this.addingEvent = false
    },
    formatDdl(ddl) {
      return ddl.includes(' ')
        ? moment(ddl, 'YYYY-MM-DD HH:mm').format('M/D HH:mm')
        : moment(ddl, 'YYYY-MM-DD').format('M/D')
    },
  },
}
</script>

<style>
html, body, #app {
  background: transparent !important;
  margin: 0; padding: 0; height: 100%;
}
</style>

<style scoped>
.widget-root {
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  background: rgba(18, 18, 24, 0.62);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border-radius: 14px;
  color: rgba(255,255,255,0.90);
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.10);
  user-select: none;
  font-size: 12px;
}

/* ── Header ── */
.w-header {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  -webkit-app-region: drag;
}
.w-nav { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.w-date-label {
  font-size: 12px; font-weight: 600; color: white;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.w-tabs { display: flex; gap: 2px; flex-shrink: 0; }
.w-tab {
  -webkit-app-region: no-drag;
  border: none; background: none;
  color: rgba(255,255,255,0.4); font-size: 11px;
  padding: 3px 7px; border-radius: 5px; cursor: pointer;
  &.active { background: rgba(255,255,255,0.15); color: white; }
  &:hover:not(.active) { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
}
.w-btn {
  -webkit-app-region: no-drag;
  border: none; background: none;
  color: rgba(255,255,255,0.4); cursor: pointer;
  padding: 3px 5px; border-radius: 5px; font-size: 11px; line-height: 1;
  &:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); }
}

/* ── Month view ── */
.w-month { flex: 1; padding: 8px 10px 4px; display: flex; flex-direction: column; gap: 4px; }
.w-month-dow-row {
  display: grid; grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}
.w-month-dow {
  text-align: center; font-size: 10px;
  color: rgba(255,255,255,0.3); font-weight: 600;
  padding: 2px 0;
}
.w-month-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, minmax(0, 1fr));
  gap: 2px; flex: 1; min-height: 0;
}
.w-month-cell {
  display: flex; flex-direction: column;
  align-items: stretch; justify-content: flex-start;
  padding: 4px 2px; border-radius: 6px;
  cursor: pointer; min-height: 0; overflow: hidden;
  transition: background 0.1s;
  &:hover { background: rgba(255,255,255,0.1); }
  &.today .w-mc-num { color: #4a9eff; font-weight: 700; }
  &.selected { background: rgba(74,158,255,0.25); }
  &.other-month .w-mc-num { color: rgba(255,255,255,0.2); }
}
.w-mc-num {
  font-size: 12px; color: rgba(255,255,255,0.82); line-height: 1;
  text-align: center; flex-shrink: 0; margin-bottom: 3px;
}
.w-mc-items { display: flex; flex-direction: column; gap: 1px; min-width: 0; overflow: hidden; }
.w-mc-item {
  display: flex; align-items: center; gap: 2px;
  min-width: 0; color: rgba(255,255,255,0.58);
  font-size: 9px; line-height: 1.25;
  &.event { color: rgba(97,177,255,0.95); }
  &.ddl { color: rgba(255,118,118,0.9); }
  &.done { opacity: 0.45; text-decoration: line-through; }
}
.w-mc-time { flex-shrink: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.w-mc-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.w-mc-more { font-size: 9px; color: rgba(255,255,255,0.32); line-height: 1.2; }

/* ── Week view ── */
.w-week-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 4px; padding: 10px 10px 8px;
  flex: 1; min-height: 0;
}
.w-week-cell {
  display: flex; flex-direction: column;
  align-items: stretch; gap: 3px;
  padding: 6px 4px; border-radius: 8px;
  cursor: pointer; min-width: 0; min-height: 0; overflow: hidden;
  &:hover { background: rgba(255,255,255,0.08); }
  &.today .w-wc-num { color: #4a9eff; }
  &.selected { background: rgba(255,255,255,0.14); }
}
.w-week-head { display: flex; align-items: baseline; justify-content: center; gap: 3px; flex-shrink: 0; }
.w-wc-dow { font-size: 10px; color: rgba(255,255,255,0.4); }
.w-wc-num { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); }
.w-week-zone {
  display: flex; flex-direction: column; gap: 2px;
  min-height: 0; overflow: hidden;
}
.w-week-events {
  flex: 0 0 43%;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 3px;
}
.w-week-todos { flex: 1; }
.w-week-item {
  display: flex; align-items: center; gap: 3px;
  min-width: 0; font-size: 10px; line-height: 1.25;
  color: rgba(255,255,255,0.62);
  &.event { color: rgba(97,177,255,0.95); }
  &.ddl { color: rgba(255,118,118,0.88); }
  &.done { opacity: 0.45; text-decoration: line-through; }
}
.w-week-time { flex-shrink: 0; font-size: 9px; font-weight: 700; font-variant-numeric: tabular-nums; }
.w-week-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.w-week-empty { font-size: 9px; color: rgba(255,255,255,0.20); line-height: 1.25; }
.w-week-more { font-size: 9px; color: rgba(255,255,255,0.28); flex-shrink: 0; }

/* ── Day body ── */
.w-body {
  flex: 1; overflow-y: auto;
  padding: 8px 12px 4px;
  display: flex; flex-direction: column; gap: 8px;
}
.w-body::-webkit-scrollbar { width: 3px; }
.w-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }

.w-section { display: flex; flex-direction: column; gap: 3px; }
.w-section-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.w-section-label {
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.07em; color: rgba(255,255,255,0.30);
  text-transform: uppercase;
}
.w-add-btn {
  -webkit-app-region: no-drag;
  border: none; background: none;
  color: rgba(255,255,255,0.30); cursor: pointer;
  font-size: 13px; padding: 1px 4px; border-radius: 4px; line-height: 1;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
}
.w-add-form {
  background: rgba(255,255,255,0.06); border-radius: 8px;
  padding: 7px 8px; display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px;
}
.w-input {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: rgba(255,255,255,0.9);
  padding: 4px 7px; font-size: 11px; outline: none;
  flex: 1; font-family: inherit;
  &:focus { border-color: rgba(74,158,255,0.6); }
  &::placeholder { color: rgba(255,255,255,0.25); }
  &:disabled { opacity: 0.35; }
}
input[type="date"].w-input::-webkit-calendar-picker-indicator,
input[type="time"].w-input::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
.w-time { max-width: 80px; }
.w-time-row { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.4); }
.w-todo-add-row { display: flex; align-items: center; gap: 5px; }
.w-confirm-btn {
  -webkit-app-region: no-drag;
  border: none; background: rgba(74,158,255,0.7); color: white;
  border-radius: 5px; padding: 4px 7px; cursor: pointer; font-size: 11px;
  &:hover { background: #4a9eff; }
}
.w-error { font-size: 10px; color: #ff6b6b; margin: 2px 0 0; }

.w-event-row {
  display: flex; align-items: center; gap: 6px; padding: 2px 0;
  &:hover .w-del-btn { opacity: 1; }
}
.w-event-dot { width: 5px; height: 5px; border-radius: 50%; background: #4a9eff; flex-shrink: 0; }
.w-event-time { font-size: 10px; color: rgba(255,255,255,0.38); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.w-event-title { font-size: 12px; color: rgba(255,255,255,0.82); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.w-todo-row {
  display: flex; align-items: center; gap: 6px; padding: 2px 0;
  &.done .w-todo-text { text-decoration: line-through; opacity: 0.4; }
  &:hover .w-del-btn { opacity: 1; }
}
.w-checkbox { accent-color: #4a9eff; cursor: pointer; flex-shrink: 0; }
.w-todo-text { font-size: 12px; color: rgba(255,255,255,0.82); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-todo-ddl { font-size: 10px; color: rgba(255,255,255,0.30); flex-shrink: 0; }
.w-del-btn {
  -webkit-app-region: no-drag;
  border: none; background: none; color: rgba(255,255,255,0.3);
  cursor: pointer; padding: 1px 3px; border-radius: 3px;
  font-size: 11px; opacity: 0; transition: opacity 0.1s; flex-shrink: 0;
  &:hover { color: #ff6b6b; }
}
.w-empty-hint { font-size: 11px; color: rgba(255,255,255,0.22); padding: 2px 0 4px; }

/* ── Footer ── */
.w-footer {
  display: flex; justify-content: flex-end; gap: 2px;
  padding: 4px 10px 8px;
  border-top: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
</style>
