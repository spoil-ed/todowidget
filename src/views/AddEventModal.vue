<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>添加日程</h3>
      <input
        ref="titleInput"
        v-model="title"
        placeholder="日程内容"
        @keydown.enter="confirm"
      />
      <div class="time-row">
        <label>开始</label>
        <input type="time" v-model="startTime" />
        <label>结束</label>
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
  name: 'AddEventModal',
  props: {
    date: { type: String, required: true },
    initialTime: { type: String, default: '09:00' },
  },
  emits: ['close'],
  data() {
    return {
      title: '',
      startTime: this.initialTime,
      endTime: this.addOneHour(this.initialTime),
      error: '',
    }
  },
  mounted() { this.$refs.titleInput.focus() },
  methods: {
    addOneHour(time) {
      const [h, m] = time.split(':').map(Number)
      const newH = Math.min(h + 1, 23)
      return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    },
    confirm() {
      const title = this.title.trim()
      if (!title) { this.error = '请填写日程内容'; return }
      if (this.startTime >= this.endTime) { this.error = '结束时间必须晚于开始时间'; return }
      this.$store.dispatch('addEvent', {
        date: this.date,
        title,
        startTime: this.startTime,
        endTime: this.endTime,
      })
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
.time-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.time-row label { font-size: 13px; color: var(--text-muted); }
.time-row input { flex: 1; }
.modal-error { color: #e74c3c; font-size: 12px; margin: 4px 0 0; }
</style>
