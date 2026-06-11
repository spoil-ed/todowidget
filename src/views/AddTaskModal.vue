<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>{{ modalTitle }}</h3>

      <input
        ref="textInput"
        v-model="text"
        placeholder="任务内容..."
        @keydown.enter="confirm"
      />

      <div class="tm-row">
        <input type="date" v-model="date" />
        <template v-if="date">
          <button class="tm-icon-btn" :class="{ active: kind === 'event' }" @click="kind = 'event'" title="日程">
            <i class="bi bi-calendar-event"></i>
          </button>
          <button class="tm-icon-btn" :class="{ active: kind === 'ddl' }" @click="kind = 'ddl'" title="截止">
            <i class="bi bi-clock"></i>
          </button>
          <button class="tm-icon-btn" :class="{ active: kind === 'day' }" @click="kind = 'day'" title="任务">
            <i class="bi bi-check2-square"></i>
          </button>
        </template>
      </div>

      <div v-if="date && kind === 'event'" class="tm-extra">
        <input type="time" v-model="startTime" />
        <span class="tm-dash">—</span>
        <input type="time" v-model="endTime" />
      </div>

      <div v-if="date && kind === 'ddl'" class="tm-extra tm-ddl-extra">
        <label>截止时间</label>
        <input type="time" v-model="ddlTime" placeholder="不填则全天" />
      </div>

      <p v-if="error" class="modal-error">{{ error }}</p>

      <div class="modal-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddTaskModal',
  props: {
    initialDate: { type: String, default: '' },
    initialTime: { type: String, default: '' },
    task: { type: Object, default: null },
  },
  emits: ['close'],
  data() {
    const task = this.task
    const date = task?.date || this.initialDate || this.$store.getters.selectedDate
    const taskDdlTime = task?.kind === 'ddl' && task.ddl?.includes(' ')
      ? task.ddl.split(' ')[1]
      : ''
    return {
      text: task?.text || '',
      date,
      kind: task?.kind || (date ? 'day' : 'free'),
      startTime: task?.startTime || this.initialTime || '09:00',
      endTime: task?.endTime || (this.initialTime ? this.addHour(this.initialTime) : '10:00'),
      ddlTime: taskDdlTime,
      error: '',
    }
  },
  computed: {
    isEditing() { return !!this.task },
    modalTitle() { return this.isEditing ? '修改任务' : '添加任务' },
    confirmLabel() { return this.isEditing ? '保存' : '添加' },
  },
  watch: {
    date(val) {
      if (!val) this.kind = 'free'
      else if (this.kind === 'free') this.kind = 'day'
    },
  },
  mounted() { this.$refs.textInput.focus() },
  methods: {
    addHour(time) {
      const [h, m] = time.split(':').map(Number)
      return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    },
    async confirm() {
      const text = this.text.trim()
      if (!text) { this.error = '请填写内容'; return }
      let payload
      if (this.date && this.kind === 'event') {
        if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
        payload = {
          text, kind: 'event', date: this.date,
          startTime: this.startTime, endTime: this.endTime,
        }
      } else if (this.date && this.kind === 'ddl') {
        const ddl = this.ddlTime ? `${this.date} ${this.ddlTime}` : this.date
        payload = { text, kind: 'ddl', date: this.date, ddl }
      } else if (this.date) {
        payload = { text, kind: 'day', date: this.date }
      } else {
        payload = { text, kind: 'free', subtasks: [] }
      }
      try {
        if (this.isEditing) {
          await this.$store.dispatch('updateTask', { id: this.task.id, changes: payload })
        } else {
          await this.$store.dispatch('addTask', payload)
        }
        this.$emit('close')
      } catch {
        this.error = '保存失败，请重试'
      }
    },
  },
}
</script>

<style scoped>
.tm-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.tm-row input[type="date"] { flex: 1; margin-bottom: 0; }
.tm-icon-btn {
  border: 1px solid var(--border);
  background: none;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  transition: background 0.1s, color 0.1s;
  &:hover { background: var(--bg-hover); color: var(--text); }
  &.active { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
}
.tm-extra {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  label {
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
    white-space: nowrap;
  }
  input { flex: 1; margin-bottom: 0; min-width: 0; }
}
.tm-ddl-extra input[type="time"] {
  flex: 0 0 118px;
}
.tm-dash { color: var(--text-muted); font-size: 12px; }
.modal-error { color: var(--danger); font-size: 12px; margin: 0 0 8px; }
</style>
