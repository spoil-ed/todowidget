<template>
  <div class="quick-add" ref="root">
    <div v-if="!active" class="qa-trigger" @click="activate">
      <i class="bi bi-plus"></i>
      <span>添加待办</span>
    </div>
    <div v-else class="qa-form" @click.stop>
      <input
        ref="textInput"
        v-model="text"
        class="qa-text-input"
        placeholder="待办内容..."
        @keydown.enter="submit"
        @keydown.esc="cancel"
      />
      <div class="qa-toolbar">
        <button
          class="qa-icon-btn"
          :class="{ active: showDdl }"
          @click="toggleDdl"
          title="截止时间"
        ><i class="bi bi-clock"></i></button>
        <button
          class="qa-icon-btn"
          :class="{ active: showSchedule }"
          @click="toggleSchedule"
          title="定时日程"
        ><i class="bi bi-calendar-event"></i></button>
        <span class="qa-spacer"></span>
        <button class="qa-cancel" @click="cancel"><i class="bi bi-x-lg"></i></button>
        <button class="qa-submit" @click="submit"><i class="bi bi-check-lg"></i></button>
      </div>
      <div v-if="showDdl && !showSchedule" class="qa-extra qa-ddl-extra">
        <label>截止时间</label>
        <input type="time" v-model="ddlTime" placeholder="不填则全天截止" />
      </div>
      <div v-if="showSchedule" class="qa-extra">
        <input type="time" v-model="startTime" />
        <span class="qa-dash">—</span>
        <input type="time" v-model="endTime" />
      </div>
      <p v-if="error" class="qa-error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuickAdd',
  props: {
    date: { type: String, required: true },
  },
  data() {
    return {
      active: false,
      text: '',
      showDdl: false,
      showSchedule: false,
      ddlDate: '',
      ddlTime: '',
      startTime: '09:00',
      endTime: '10:00',
      error: '',
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutside)
  },
  methods: {
    activate() {
      this.active = true
      this.$nextTick(() => this.$refs.textInput?.focus())
    },
    cancel() {
      this.active = false
      this.text = ''
      this.showDdl = false
      this.showSchedule = false
      this.ddlDate = ''
      this.ddlTime = ''
      this.startTime = '09:00'
      this.endTime = '10:00'
      this.error = ''
    },
    handleOutside(e) {
      if (this.active && this.$refs.root && !this.$refs.root.contains(e.target)) {
        this.cancel()
      }
    },
    toggleDdl() {
      this.showDdl = !this.showDdl
      if (this.showDdl) { this.showSchedule = false; this.ddlDate = this.date }
    },
    toggleSchedule() {
      this.showSchedule = !this.showSchedule
      if (this.showSchedule) this.showDdl = false
    },
    async submit() {
      const text = this.text.trim()
      if (!text) { this.error = '请填写内容'; return }
      let payload
      if (this.showSchedule) {
        if (this.startTime >= this.endTime) { this.error = '结束时间需晚于开始'; return }
        payload = {
          kind: 'event', date: this.date, text,
          startTime: this.startTime, endTime: this.endTime,
        }
      } else if (this.showDdl) {
        const ddl = this.ddlDate
          ? (this.ddlTime ? `${this.ddlDate} ${this.ddlTime}` : this.ddlDate)
          : this.date
        payload = { kind: 'ddl', date: this.date, text, ddl }
      } else {
        payload = { kind: 'day', date: this.date, text }
      }
      try {
        this.error = ''
        await this.$store.dispatch('addTask', payload)
        this.cancel()
      } catch {
        this.error = '保存失败，请重试'
      }
    },
  },
}
</script>

<style scoped>
.quick-add { margin-bottom: 6px; }

.qa-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.qa-trigger:hover { background: var(--bg-hover); color: var(--primary); }
.qa-trigger i { font-size: 14px; }

.qa-form {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 10px;
  box-shadow: var(--shadow-sm);
}

.qa-text-input {
  width: 100%;
  border: none;
  outline: none;
  box-shadow: none;
  font-size: 13px;
  padding: 2px 0;
  margin-bottom: 6px;
  background: transparent;
  &:focus { border: none; box-shadow: none; }
}

.qa-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}
.qa-spacer { flex: 1; }

.qa-icon-btn {
  border: none;
  background: none;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  transition: background 0.1s, color 0.1s;
  &:hover { background: var(--bg-hover); color: var(--text); }
  &.active { background: var(--primary-light); color: var(--primary); }
}

.qa-cancel {
  border: none;
  background: none;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 12px;
  &:hover { background: var(--bg-hover); }
}

.qa-submit {
  border: none;
  background: var(--primary);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  &:hover { background: var(--primary-dark); }
}

.qa-extra {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border-light);
  label {
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
    white-space: nowrap;
  }
  input { flex: 1; min-width: 0; font-size: 12px; padding: 4px 8px; margin-bottom: 0; }
}
.qa-ddl-extra input[type="time"] {
  flex: 0 0 118px;
}
.qa-dash { color: var(--text-muted); font-size: 12px; }
.qa-error { font-size: 11px; color: var(--danger); margin: 4px 0 0; }
</style>
