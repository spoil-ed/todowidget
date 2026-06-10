<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>添加待办</h3>

      <input
        ref="textInput"
        v-model="text"
        placeholder="待办内容..."
        @keydown.enter="confirm"
      />

      <div class="tm-row">
        <input type="date" v-model="date" />
        <button class="tm-icon-btn" :class="{ active: showDdl }" @click="toggleDdl" title="截止时间">
          <i class="bi bi-clock"></i>
        </button>
        <button class="tm-icon-btn" :class="{ active: showSchedule }" @click="toggleSchedule" title="定时日程">
          <i class="bi bi-calendar-event"></i>
        </button>
      </div>

      <div v-if="showDdl" class="tm-extra">
        <label>截止</label>
        <input type="date" v-model="ddlDate" />
        <input type="time" v-model="ddlTime" :disabled="!ddlDate" />
      </div>

      <div v-if="showSchedule" class="tm-extra">
        <input type="time" v-model="startTime" />
        <span class="tm-dash">—</span>
        <input type="time" v-model="endTime" />
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
  name: 'TodoModal',
  emits: ['close'],
  data() {
    return {
      text: '',
      date: this.$store.getters.selectedDate,
      showDdl: false,
      showSchedule: false,
      ddlDate: '',
      ddlTime: '',
      startTime: '09:00',
      endTime: '10:00',
      error: '',
    }
  },
  mounted() { this.$refs.textInput.focus() },
  methods: {
    toggleDdl() {
      this.showDdl = !this.showDdl
      if (this.showDdl) this.showSchedule = false
    },
    toggleSchedule() {
      this.showSchedule = !this.showSchedule
      if (this.showSchedule) this.showDdl = false
    },
    confirm() {
      const text = this.text.trim()
      if (!text) { this.error = '请填写内容'; return }
      if (!this.date) { this.error = '请选择日期'; return }
      if (this.showSchedule) {
        if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
        this.$store.dispatch('addEvent', {
          date: this.date, title: text,
          startTime: this.startTime, endTime: this.endTime,
        })
      } else {
        const ddl = this.ddlDate
          ? (this.ddlTime ? `${this.ddlDate} ${this.ddlTime}` : this.ddlDate)
          : null
        this.$store.dispatch('addTodo', { date: this.date, text, ddl })
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
