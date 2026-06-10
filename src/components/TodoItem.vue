<template>
  <div class="todo-item" :class="{ done: todo.checked }">
    <input
      type="checkbox"
      :checked="todo.checked"
      @change="$emit('toggle', todo.id)"
    />
    <div class="todo-main">
      <span class="todo-text">{{ todo.text }}</span>
      <span v-if="todo.ddl" class="todo-ddl" :class="{ overdue: isOverdue }">
        <i class="bi bi-clock"></i> {{ ddlLabel }}
      </span>
    </div>
    <button class="todo-delete" @click="$emit('delete', todo.id)" title="删除">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'TodoItem',
  props: {
    todo: { type: Object, required: true },
  },
  emits: ['toggle', 'delete'],
  computed: {
    ddlLabel() {
      if (!this.todo.ddl) return ''
      const hasTime = this.todo.ddl.includes(' ')
      return hasTime
        ? moment(this.todo.ddl, 'YYYY-MM-DD HH:mm').format('M月D日 HH:mm')
        : moment(this.todo.ddl, 'YYYY-MM-DD').format('M月D日')
    },
    isOverdue() {
      if (!this.todo.ddl || this.todo.checked) return false
      const hasTime = this.todo.ddl.includes(' ')
      const deadline = hasTime
        ? moment(this.todo.ddl, 'YYYY-MM-DD HH:mm')
        : moment(this.todo.ddl, 'YYYY-MM-DD').endOf('day')
      return deadline.isBefore(moment())
    },
  },
}
</script>

