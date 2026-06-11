<template>
  <div class="task-list-view">
    <div class="tlv-header">
      <div class="tlv-filter">
        <button :class="['tlv-btn', { active: filter === 'pending' }]" @click="filter = 'pending'">待完成</button>
        <button :class="['tlv-btn', { active: filter === 'all' }]" @click="filter = 'all'">全部</button>
      </div>
    </div>
    <div class="tlv-body">
      <div v-if="overdue.length" class="tlv-group">
        <div class="tlv-group-hd overdue">逾期 <span class="tlv-count">{{ overdue.length }}</span></div>
        <div v-for="t in overdue" :key="t.id" :class="['tlv-item', { done: t.checked }]">
          <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
          <div class="tlv-item-body">
            <span class="tlv-text">{{ t.text }}</span>
            <span class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
          </div>
          <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
        </div>
      </div>

      <div v-if="todayItems.length" class="tlv-group">
        <div class="tlv-group-hd today">今日 <span class="tlv-count">{{ todayItems.length }}</span></div>
        <div v-for="t in todayItems" :key="t.id" :class="['tlv-item', { done: t.checked }]">
          <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
          <div class="tlv-item-body">
            <span class="tlv-text">{{ t.text }}</span>
            <span v-if="t.kind === 'event'" class="tlv-meta"><i class="bi bi-calendar-event"></i> {{ t.startTime }}–{{ t.endTime }}</span>
            <span v-else-if="t.kind === 'ddl'" class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
          </div>
          <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
        </div>
      </div>

      <template v-for="group in upcomingGroups" :key="group.date">
        <div class="tlv-group">
          <div class="tlv-group-hd">{{ formatDate(group.date) }}</div>
          <div v-for="t in group.tasks" :key="t.id" :class="['tlv-item', { done: t.checked }]">
            <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
            <div class="tlv-item-body">
              <span class="tlv-text">{{ t.text }}</span>
              <span v-if="t.kind === 'event'" class="tlv-meta"><i class="bi bi-calendar-event"></i> {{ t.startTime }}–{{ t.endTime }}</span>
              <span v-else-if="t.kind === 'ddl'" class="tlv-meta"><i class="bi bi-clock"></i> {{ formatDdl(t.ddl) }}</span>
            </div>
            <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
          </div>
        </div>
      </template>

      <div v-if="freeItems.length" class="tlv-group">
        <div class="tlv-group-hd">自由任务</div>
        <div v-for="t in freeItems" :key="t.id" :class="['tlv-item', { done: t.checked }]">
          <input type="checkbox" :checked="t.checked" @change="toggle(t)" class="tlv-check" />
          <div class="tlv-item-body">
            <span class="tlv-text">{{ t.text }}</span>
          </div>
          <button class="tlv-del" @click="del(t)"><i class="bi bi-trash3"></i></button>
        </div>
      </div>

      <div v-if="isEmpty" class="tlv-empty">暂无任务</div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'TaskListView',
  data() { return { filter: 'pending' } },
  computed: {
    allTasks() {
      const all = this.$store.getters.tasks
      return this.filter === 'pending' ? all.filter(t => !t.checked) : all
    },
    today() { return moment().format('YYYY-MM-DD') },
    overdueIds() {
      return new Set(this.$store.getters.overdueTasks.map(t => t.id))
    },
    overdue() {
      return this.$store.getters.overdueTasks
    },
    todayItems() {
      return this.allTasks.filter(t =>
        t.date === this.today && !this.overdueIds.has(t.id)
      )
    },
    upcomingGroups() {
      const future = this.allTasks.filter(t =>
        t.date && t.date > this.today && !this.overdueIds.has(t.id)
      )
      const byDate = {}
      for (const t of future) {
        if (!byDate[t.date]) byDate[t.date] = []
        byDate[t.date].push(t)
      }
      return Object.keys(byDate).sort().map(date => ({ date, tasks: byDate[date] }))
    },
    freeItems() {
      return this.allTasks.filter(t => t.kind === 'free')
    },
    isEmpty() {
      return !this.overdue.length && !this.todayItems.length &&
             !this.upcomingGroups.length && !this.freeItems.length
    },
  },
  methods: {
    toggle(t) { this.$store.dispatch('toggleTask', { id: t.id }) },
    del(t) { this.$store.dispatch('deleteTask', { id: t.id }) },
    formatDate(date) { return moment(date, 'YYYY-MM-DD').format('M月D日 ddd') },
    formatDdl(ddl) {
      if (!ddl) return ''
      return ddl.includes(' ')
        ? moment(ddl, 'YYYY-MM-DD HH:mm').format('M月D日 HH:mm')
        : moment(ddl, 'YYYY-MM-DD').format('M月D日')
    },
  },
}
</script>

<style scoped>
.task-list-view { display: flex; flex-direction: column; height: 100%; }
.tlv-header {
  display: flex; align-items: center; justify-content: flex-end;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.tlv-filter { display: flex; gap: 4px; }
.tlv-btn {
  border: 1px solid var(--border); background: none;
  border-radius: var(--radius-sm); padding: 4px 10px;
  font-size: 12px; cursor: pointer; color: var(--text-muted);
  transition: all 0.1s;
  &:hover { background: var(--bg-hover); color: var(--text); }
  &.active { background: var(--primary); color: white; border-color: var(--primary); }
}
.tlv-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
.tlv-empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0; }
.tlv-group { margin-bottom: 20px; }
.tlv-group-hd {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  color: var(--text-muted); margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
  &.overdue { color: var(--danger); }
  &.today { color: #e6a817; }
}
.tlv-count {
  font-size: 11px; background: var(--bg-subtle); color: var(--text-muted);
  border-radius: 10px; padding: 0 7px; border: 1px solid var(--border);
  font-weight: 400;
}
.tlv-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--bg);
  margin-bottom: 6px; transition: background 0.1s;
  &:hover { background: var(--bg-hover); }
  &:hover .tlv-del { opacity: 1; }
  &.done { opacity: 0.55; }
}
.tlv-check { cursor: pointer; accent-color: var(--primary); flex-shrink: 0; }
.tlv-item-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.tlv-text {
  font-size: 13px; color: var(--text);
  .done & { text-decoration: line-through; }
}
.tlv-meta { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.tlv-del {
  border: none; background: none; cursor: pointer;
  color: var(--text-muted); font-size: 13px; padding: 3px 5px;
  border-radius: var(--radius-sm); opacity: 0;
  transition: opacity 0.1s, color 0.1s;
  &:hover { color: var(--danger); }
}
</style>
