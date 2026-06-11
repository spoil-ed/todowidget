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
          v-for="item in previewItems(cell.date)"
          :key="item.id"
          class="cell-calendar-preview"
          :class="[item.type, { done: item.checked }]"
          :title="item.rangeLabel ? `${item.rangeLabel} ${item.displayText}` : item.displayText"
        >
          <span v-if="item.timeLabel" class="cell-item-time">{{ item.timeLabel }}</span>
          <span class="cell-item-text">{{ item.displayText }}</span>
        </div>
        <div v-if="overflowCount(cell.date) > 0" class="cell-overflow">
          +{{ overflowCount(cell.date) }} 项
        </div>
      </div>
    </div>

    <!-- Detail panel for selected date -->
    <div class="month-detail-panel" v-if="selectedDate">
      <div class="detail-header">
        {{ detailHeader }} ({{ allItems.length }} 项)
      </div>
      <template v-for="item in allItems" :key="item.id">
        <div v-if="item.type === 'event'" class="detail-event-row">
          <span class="detail-event-time">{{ item.rangeLabel }}</span>
          <span class="detail-event-title">{{ item.displayText }}</span>
          <button class="detail-event-delete" @click="deleteTodo(item.id)" title="删除">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <todo-item
          v-else
          :todo="item.task"
          @toggle="toggleTodo(item.id)"
          @delete="deleteTodo(item.id)"
        />
      </template>
      <div v-if="allItems.length === 0" class="month-empty-hint">这天还没有事项</div>
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
import { calendarItemsForDate, previewCalendarItems } from '../helpers/calendarItemsHelper'
import TodoItem from './TodoItem.vue'

const PREVIEW_MAX = 3

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
    allTasks() { return this.$store.getters.tasks },
    allItems() {
      return calendarItemsForDate(this.allTasks, this.selectedDate)
    },
    detailHeader() {
      return moment(this.selectedDate, 'YYYY-MM-DD').format('M月D日 dddd')
    },
  },
  methods: {
    previewItems(date) { return previewCalendarItems(this.allTasks, date, PREVIEW_MAX).items },
    overflowCount(date) {
      return previewCalendarItems(this.allTasks, date, PREVIEW_MAX).overflowCount
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
