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
      <div class="week-col-todos">
        <todo-item
          v-for="todo in todosFor(date)"
          :key="todo.id"
          :todo="todo"
          @toggle="toggleTodo(date, todo.id)"
          @delete="deleteTodo(date, todo.id)"
        />
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
import TodoItem from './TodoItem.vue'

export default {
  name: 'WeekView',
  components: { TodoItem },
  data() {
    return { addTexts: {} }
  },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    todayStr() { return today() },
    weekDates() { return weekRange(this.selectedDate) },
  },
  methods: {
    todosFor(date) { return this.$store.getters.todosForDate(date) },
    weekdayLabel(date) { return moment(date, 'YYYY-MM-DD').format('ddd') },
    dayLabel(date) { return moment(date, 'YYYY-MM-DD').format('D') },
    selectDate(date) { this.$store.commit('setSelectedDate', date) },
    addTodo(date) {
      const text = (this.addTexts[date] || '').trim()
      if (!text) return
      this.$store.dispatch('addTodo', { date, text })
      this.addTexts[date] = ''
    },
    toggleTodo(date, id) { this.$store.dispatch('toggleTodo', { date, id }) },
    deleteTodo(date, id) { this.$store.dispatch('deleteTodo', { date, id }) },
  },
}
</script>
