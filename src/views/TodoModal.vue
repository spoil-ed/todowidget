<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>添加待办</h3>
      <input
        ref="textInput"
        v-model="text"
        placeholder="待办内容"
        @keydown.enter="confirm"
      />
      <input type="date" v-model="date" />
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
    }
  },
  mounted() {
    this.$refs.textInput.focus()
  },
  methods: {
    confirm() {
      const text = this.text.trim()
      if (!text || !this.date) return
      this.$store.dispatch('addTodo', { date: this.date, text })
      this.$emit('close')
    },
  },
}
</script>
