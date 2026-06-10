<template>
  <div class="backlog-item" :class="item.status">
    <div class="bl-item-header">
      <button class="bl-status-badge" :class="item.status" @click="cycleStatus">
        {{ statusLabel }}
      </button>
      <span class="bl-item-title">{{ item.title }}</span>
      <button class="bl-delete-btn" @click="$emit('delete', item.id)" title="删除">
        <i class="bi bi-x"></i>
      </button>
    </div>
    <div class="bl-subtasks">
      <div v-for="st in item.subtasks" :key="st.id" class="bl-subtask">
        <input
          type="checkbox"
          :checked="st.checked"
          @change="toggleSubtask(st.id)"
        />
        <span :class="{ done: st.checked }">{{ st.text }}</span>
        <button class="bl-st-delete" @click="deleteSubtask(st.id)">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="bl-add-subtask">
        <input
          v-if="addingSubtask"
          ref="stInput"
          v-model="newSubtask"
          placeholder="子任务内容"
          @keydown.enter="confirmSubtask"
          @keydown.esc="addingSubtask = false"
          @blur="confirmSubtask"
        />
        <button v-else class="bl-add-st-btn" @click="startAddSubtask">
          <i class="bi bi-plus"></i> 添加子任务
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const STATUS_LABELS = { 'pending': '待做', 'in-progress': '进行中', 'done': '已完成' }

export default {
  name: 'BacklogItem',
  props: { item: { type: Object, required: true } },
  emits: ['delete'],
  data() { return { addingSubtask: false, newSubtask: '' } },
  computed: {
    statusLabel() { return STATUS_LABELS[this.item.status] },
  },
  methods: {
    cycleStatus() {
      this.$store.dispatch('cycleBacklogStatus', { id: this.item.id })
      const allChecked = this.item.subtasks.length > 0 && this.item.subtasks.every(s => s.checked)
      if (allChecked && this.item.status === 'in-progress') {
        if (confirm('所有子任务已完成，标记为已完成？')) {
          this.$store.dispatch('setBacklogStatus', { id: this.item.id, status: 'done' })
        }
      }
    },
    toggleSubtask(subtaskId) {
      this.$store.dispatch('toggleSubtask', { itemId: this.item.id, subtaskId })
      const updated = this.$store.getters.backlogItems.find(i => i.id === this.item.id)
      if (updated && updated.subtasks.length > 0 && updated.subtasks.every(s => s.checked)) {
        if (confirm('所有子任务已完成，标记为已完成？')) {
          this.$store.dispatch('setBacklogStatus', { id: this.item.id, status: 'done' })
        }
      }
    },
    deleteSubtask(subtaskId) {
      this.$store.dispatch('deleteSubtask', { itemId: this.item.id, subtaskId })
    },
    startAddSubtask() {
      this.addingSubtask = true
      this.$nextTick(() => this.$refs.stInput && this.$refs.stInput.focus())
    },
    confirmSubtask() {
      const text = this.newSubtask.trim()
      if (text) this.$store.dispatch('addSubtask', { itemId: this.item.id, text })
      this.newSubtask = ''
      this.addingSubtask = false
    },
  },
}
</script>

<style scoped>
.backlog-item {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
  transition: opacity 0.2s;
}
.backlog-item.done { opacity: 0.5; }
.bl-item-header { display: flex; align-items: center; gap: 8px; }
.bl-status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.bl-status-badge.pending { background: #e8e8e8; color: #555; }
.bl-status-badge.in-progress { background: #fff3cd; color: #856404; }
.bl-status-badge.done { background: #d1e7dd; color: #0f5132; }
.bl-item-title { flex: 1; font-size: 14px; font-weight: 500; }
.bl-delete-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; padding: 0; }
.bl-subtasks { margin-top: 8px; padding-left: 4px; }
.bl-subtask { display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 13px; }
.bl-subtask span.done { text-decoration: line-through; color: var(--text-muted); }
.bl-st-delete { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 13px; padding: 0; margin-left: auto; }
.bl-add-st-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 12px; padding: 4px 0; }
.bl-add-subtask input { font-size: 13px; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px; width: 100%; margin-top: 4px; }
</style>
