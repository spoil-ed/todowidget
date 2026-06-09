<template>
  <div class="todo-item" :class="{ done: todo.checked }">
    <input
      type="checkbox"
      :checked="todo.checked"
      @change="$emit('toggle', todo.id)"
    />
    <span class="todo-text">{{ todo.text }}</span>
    <button class="todo-delete" @click="$emit('delete', todo.id)" title="删除">
      <i class="bi bi-x"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'TodoItem',
  props: {
    todo: { type: Object, required: true },
  },
  emits: ['toggle', 'delete'],
}
</script>
