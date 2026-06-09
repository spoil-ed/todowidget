<template>
  <div class="day-view">
    <div class="day-view-header">{{ headerLabel }}</div>
    <div class="day-todos">
      <todo-item
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo(todo.id)"
        @delete="deleteTodo(todo.id)"
      />
      <div v-if="todos.length === 0" style="color: var(--text-muted); font-size: 13px;">
        今天还没有待办事项
      </div>
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
</template>

<script>
import moment from 'moment'
import TodoItem from './TodoItem.vue'

export default {
  name: 'DayView',
  components: { TodoItem },
  data() {
    return { newText: '' }
  },
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
    toggleTodo(id) {
      this.$store.dispatch('toggleTodo', { date: this.selectedDate, id })
    },
    deleteTodo(id) {
      this.$store.dispatch('deleteTodo', { date: this.selectedDate, id })
    },
  },
}
</script>
