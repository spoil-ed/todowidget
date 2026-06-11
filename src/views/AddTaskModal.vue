<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>添加任务</h3>

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

      <div v-if="date && kind === 'ddl'" class="tm-extra">
        <label>截止时间</label>
        <input type="time" v-model="ddlTime" placeholder="不填则全天" />
      </div>

      <p v-if="error" class="modal-error">{{ error }}</p>

      <div class="modal-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">添加</button>
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
  },
  emits: ['close'],
  data() {
    const date = this.initialDate || this.$store.getters.selectedDate
    return {
      text: '',
      date,
      kind: date ? 'day' : 'free',
      startTime: this.initialTime || '09:00',
      endTime: this.initialTime ? this.addHour(this.initialTime) : '10:00',
      ddlTime: '',
      error: '',
    }
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
    confirm() {
      const text = this.text.trim()
      if (!text) { this.error = '请填写内容'; return }
      if (this.date && this.kind === 'event') {
        if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
        this.$store.dispatch('addTask', {
          text, kind: 'event', date: this.date,
          startTime: this.startTime, endTime: this.endTime,
        })
      } else if (this.date && this.kind === 'ddl') {
        const ddl = this.ddlTime ? `${this.date} ${this.ddlTime}` : this.date
        this.$store.dispatch('addTask', { text, kind: 'ddl', date: this.date, ddl })
      } else if (this.date) {
        this.$store.dispatch('addTask', { text, kind: 'day', date: this.date })
      } else {
        this.$store.dispatch('addTask', { text, kind: 'free', subtasks: [] })
      }
      this.$emit('close')
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
  label { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
  input { flex: 1; }
}
.tm-dash { color: var(--text-muted); font-size: 12px; }
.modal-error { color: var(--danger); font-size: 12px; margin: 0 0 8px; }
</style>
