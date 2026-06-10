<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h3>新建清单项</h3>
      <input
        ref="titleInput"
        v-model="title"
        placeholder="项目名称"
        @keydown.enter="confirm"
      />
      <div class="modal-actions">
        <button @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">添加</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddBacklogModal',
  emits: ['close'],
  data() { return { title: '' } },
  mounted() { this.$refs.titleInput.focus() },
  methods: {
    confirm() {
      const title = this.title.trim()
      if (!title) return
      this.$store.dispatch('addBacklogItem', { title })
      this.$emit('close')
    },
  },
}
</script>
