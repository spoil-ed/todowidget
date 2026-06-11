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
        <quick-add :date="selectedDate" />
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
      </div>
    </div>
  </div>
</template>

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
</style>
