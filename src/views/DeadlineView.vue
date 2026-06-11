<template>
  <div class="deadline-view">
    <div class="dv-header">
      <span class="dv-title">截止汇总</span>
      <div class="dv-filter">
        <button :class="['dv-filter-btn', { active: filter === 'all' }]"   @click="filter = 'all'">全部</button>
        <button :class="['dv-filter-btn', { active: filter === 'pending' }]" @click="filter = 'pending'">待完成</button>
        <button :class="['dv-filter-btn', { active: filter === 'done' }]"   @click="filter = 'done'">已完成</button>
      </div>
    </div>

    <div class="dv-body">
      <div v-if="!groups.length" class="dv-empty">暂无带截止时间的待办</div>

      <div v-for="group in groups" :key="group.label" class="dv-group">
        <div class="dv-group-header">
          <span :class="['dv-group-label', group.status]">{{ group.label }}</span>
          <span class="dv-group-count">{{ group.items.length }}</span>
        </div>
        <div
          v-for="t in group.items"
          :key="t.id"
          :class="['dv-item', { done: t.checked, overdue: isOverdue(t) }]"
        >
          <input
            type="checkbox"
            :checked="t.checked"
            @change="toggle(t)"
            class="dv-checkbox"
          />
          <div class="dv-item-body">
            <span class="dv-item-text">{{ t.text }}</span>
            <span class="dv-item-meta">
              <i class="bi bi-calendar3"></i> {{ formatTodoDate(t.date) }}
              <i class="bi bi-clock" style="margin-left:8px"></i> {{ formatDdl(t.ddl) }}
            </span>
          </div>
          <button class="dv-del-btn" @click="del(t)"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'DeadlineView',
  data() { return { filter: 'pending' } },
  computed: {
    all() { return this.$store.getters.todosWithDdl },
    filtered() {
      if (this.filter === 'pending') return this.all.filter(t => !t.checked)
      if (this.filter === 'done')    return this.all.filter(t => t.checked)
      return this.all
    },
    groups() {
      const today = moment().startOf('day')
      const overdue  = this.filtered.filter(t => this.isOverdue(t))
      const todayItems = this.filtered.filter(t => !this.isOverdue(t) && moment(t.ddl.split(' ')[0], 'YYYY-MM-DD').isSame(today, 'day'))
      const upcoming = this.filtered.filter(t => !this.isOverdue(t) && !moment(t.ddl.split(' ')[0], 'YYYY-MM-DD').isSame(today, 'day'))
      const result = []
      if (overdue.length)   result.push({ label: '已逾期', status: 'overdue', items: overdue })
      if (todayItems.length) result.push({ label: '今天截止', status: 'today', items: todayItems })
      if (upcoming.length)  result.push({ label: '即将到来', status: 'upcoming', items: upcoming })
      return result
    },
  },
  methods: {
    isOverdue(t) {
      if (t.checked) return false
      const ddlMoment = t.ddl.includes(' ')
        ? moment(t.ddl, 'YYYY-MM-DD HH:mm')
        : moment(t.ddl, 'YYYY-MM-DD').endOf('day')
      return ddlMoment.isBefore(moment())
    },
    formatTodoDate(date) {
      return moment(date, 'YYYY-MM-DD').format('M月D日')
    },
    formatDdl(ddl) {
      return ddl.includes(' ')
        ? moment(ddl, 'YYYY-MM-DD HH:mm').format('M月D日 HH:mm')
        : moment(ddl, 'YYYY-MM-DD').format('M月D日')
    },
    toggle(t) {
      this.$store.dispatch('toggleTodo', { date: t.date, id: t.id })
    },
    del(t) {
      this.$store.dispatch('deleteTodo', { date: t.date, id: t.id })
    },
  },
}
</script>

<style scoped>
.deadline-view { display: flex; flex-direction: column; height: 100%; }

.dv-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.dv-title { font-size: 15px; font-weight: 600; }
.dv-filter { display: flex; gap: 4px; }
.dv-filter-btn {
  border: 1px solid var(--border);
  background: none;
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.1s;
  &:hover { background: var(--bg-hover); color: var(--text); }
  &.active { background: var(--primary); color: white; border-color: var(--primary); }
}

.dv-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
.dv-empty { color: var(--text-muted); font-size: 13px; padding: 32px 0; text-align: center; }

.dv-group { margin-bottom: 20px; }
.dv-group-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.dv-group-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  &.overdue { color: var(--danger); }
  &.today   { color: #e6a817; }
  &.upcoming { color: var(--text-muted); }
}
.dv-group-count {
  font-size: 11px; background: var(--bg-subtle); color: var(--text-muted);
  border-radius: 10px; padding: 0 7px; border: 1px solid var(--border);
}

.dv-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg);
  margin-bottom: 6px;
  transition: background 0.1s;
  &:hover { background: var(--bg-hover); }
  &:hover .dv-del-btn { opacity: 1; }
  &.done { opacity: 0.55; }
  &.overdue { border-color: rgba(229,62,62,0.35); background: #fff8f8; }
}
.dv-checkbox { cursor: pointer; accent-color: var(--primary); flex-shrink: 0; }
.dv-item-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.dv-item-text {
  font-size: 13px; color: var(--text);
  .done & { text-decoration: line-through; }
}
.dv-item-meta {
  font-size: 11px; color: var(--text-muted);
  display: flex; align-items: center; gap: 4px;
}
.dv-del-btn {
  border: none; background: none; cursor: pointer;
  color: var(--text-muted); font-size: 13px; padding: 3px 5px;
  border-radius: var(--radius-sm); opacity: 0;
  transition: opacity 0.1s, color 0.1s;
  &:hover { color: var(--danger); }
}
</style>
