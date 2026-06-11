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
      <div class="week-col-content">
        <div class="week-col-section week-col-events">
          <div class="week-section-title">日程</div>
          <div
            v-for="event in eventsFor(date)"
            :key="event.id"
            class="week-event-row"
            :title="event.rangeLabel ? `${event.rangeLabel} ${event.displayText}` : event.displayText"
          >
            <span class="week-event-time">{{ event.timeLabel }}</span>
            <span class="week-event-title">{{ event.displayText }}</span>
          </div>
          <div v-if="eventsFor(date).length === 0" class="week-empty-hint">无日程</div>
        </div>
        <div class="week-col-section week-col-todos">
          <div class="week-section-title">待办</div>
          <todo-item
            v-for="todo in todosFor(date)"
            :key="todo.id"
            :todo="todo.task"
            @toggle="toggleTodo(todo.id)"
            @delete="deleteTodo(todo.id)"
          />
          <div v-if="todosFor(date).length === 0" class="week-empty-hint">无待办</div>
        </div>
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
import { calendarItemsForDate } from '../helpers/calendarItemsHelper'
import TodoItem from './TodoItem.vue'

export default {
  name: 'WeekView',
  components: { TodoItem },
  data() {
    return {
      addTexts: {},
    }
  },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    todayStr() { return today() },
    weekDates() { return weekRange(this.selectedDate) },
    allTasks() { return this.$store.getters.tasks },
  },
  methods: {
    calendarItems(date) {
      return calendarItemsForDate(this.allTasks, date)
    },
    eventsFor(date) {
      return this.calendarItems(date).filter(item => item.type === 'event')
    },
    todosFor(date) {
      return this.calendarItems(date).filter(item => item.type !== 'event')
    },
    weekdayLabel(date) { return moment(date, 'YYYY-MM-DD').format('ddd') },
    dayLabel(date) { return moment(date, 'YYYY-MM-DD').format('D') },
    selectDate(date) {
      this.$store.commit('setSelectedDate', date)
    },
    addTodo(date) {
      const text = (this.addTexts[date] || '').trim()
      if (!text) return
      this.$store.dispatch('addTask', { kind: 'day', date, text })
      this.addTexts[date] = ''
    },
    toggleTodo(id) { this.$store.dispatch('toggleTask', { id }) },
    deleteTodo(id) { this.$store.dispatch('deleteTask', { id }) },
  },
}
</script>
