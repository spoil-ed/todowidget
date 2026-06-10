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
