<template>
  <div class="backlog-view">
    <div class="backlog-header">
      <h2>待办清单</h2>
      <button class="primary" @click="showModal = true">+ 新增</button>
    </div>

    <!-- 进行中 -->
    <section v-if="inProgress.length">
      <div class="bl-section-title">进行中</div>
      <backlog-item
        v-for="item in inProgress"
        :key="item.id"
        :item="item"
        @delete="deleteItem"
      />
    </section>

    <!-- 待做 -->
    <section v-if="pending.length">
      <div class="bl-section-title">待做</div>
      <backlog-item
        v-for="item in pending"
        :key="item.id"
        :item="item"
        @delete="deleteItem"
      />
    </section>

    <!-- 已完成（折叠） -->
    <section v-if="done.length">
      <div class="bl-section-title clickable" @click="showDone = !showDone">
        已完成 ({{ done.length }})
        <i :class="showDone ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
      </div>
      <template v-if="showDone">
        <backlog-item
          v-for="item in done"
          :key="item.id"
          :item="item"
          @delete="deleteItem"
        />
      </template>
    </section>

    <div v-if="!inProgress.length && !pending.length && !done.length" class="bl-empty">
      还没有清单项，点击右上角新增
    </div>

    <add-backlog-modal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script>
import BacklogItem from '../components/BacklogItem.vue'
import AddBacklogModal from './AddBacklogModal.vue'

export default {
  name: 'BacklogView',
  components: { BacklogItem, AddBacklogModal },
  data() { return { showModal: false, showDone: false } },
  computed: {
    inProgress() { return this.$store.getters.backlogByStatus('in-progress') },
    pending() { return this.$store.getters.backlogByStatus('pending') },
    done() { return this.$store.getters.backlogByStatus('done') },
  },
  methods: {
    deleteItem(id) { this.$store.dispatch('deleteBacklogItem', { id }) },
  },
}
</script>

<style scoped>
.backlog-view { padding: 20px 24px; overflow-y: auto; height: 100%; }
.backlog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.backlog-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
.bl-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0 8px;
}
.bl-section-title.clickable { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px; }
.bl-empty { color: var(--text-muted); font-size: 14px; text-align: center; margin-top: 60px; }
</style>
