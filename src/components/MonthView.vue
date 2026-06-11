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
      return this.$store.getters.tasksForDate(this.selectedDate)
        .filter(t => t.kind === 'day' || t.kind === 'ddl')
    },
    detailHeader() {
      return moment(this.selectedDate, 'YYYY-MM-DD').format('M月D日 dddd')
    },
  },
  methods: {
    todosFor(date) {
      return this.$store.getters.tasksForDate(date)
        .filter(t => t.kind === 'day' || t.kind === 'ddl')
    },
    previewTodos(date) { return this.todosFor(date).slice(0, PREVIEW_MAX) },
    overflowCount(date) {
      const total = this.todosFor(date).length
      return total > PREVIEW_MAX ? total - PREVIEW_MAX : 0
    },
    selectDate(date) { this.$store.commit('setSelectedDate', date) },
    addTodo() {
      const text = this.newText.trim()
      if (!text) return
      this.$store.dispatch('addTask', { kind: 'day', date: this.selectedDate, text })
      this.newText = ''
    },
    toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
    deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
  },
}
</script>
