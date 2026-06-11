<template>
  <div class="sidebar">
    <div class="sidebar-page-tabs">
      <button
        class="sidebar-tab"
        :class="{ active: currentPage === 'calendar' }"
        @click="$store.commit('setPage', 'calendar')"
      >
        <i class="bi bi-calendar3"></i>
        <span>日历</span>
      </button>
      <button
        class="sidebar-tab"
        :class="{ active: currentPage !== 'calendar' }"
        @click="$store.commit('setPage', 'tasks')"
      >
        <i class="bi bi-list-check"></i>
        <span>待办</span>
      </button>
    </div>
    <div class="sidebar-nav">
      <button @click="prevMonth"><i class="bi bi-chevron-left"></i></button>
      <span class="sidebar-month-label">{{ monthLabel }}</span>
      <button @click="nextMonth"><i class="bi bi-chevron-right"></i></button>
    </div>
    <div class="mini-grid">
      <div class="mini-weekday" v-for="d in weekdayNames" :key="d">{{ d }}</div>
      <div
        v-for="cell in flatGrid"
        :key="cell.date"
        class="mini-cell"
        :class="{
          today: cell.isToday,
          selected: cell.date === selectedDate,
          'other-month': !cell.isCurrentMonth,
        }"
        @click="selectDate(cell.date)"
      >{{ cell.dayNum }}</div>
    </div>
    <div v-if="dateTasks.length" class="sidebar-day-summary">
      <div class="sds-label">{{ summaryLabel }}</div>
      <div
        v-for="t in dateTasks"
        :key="t.id"
        class="sds-item"
        @click="goToDay"
      >
        <span v-if="t.kind === 'event'" class="sds-time">{{ t.startTime }}</span>
        <span v-else-if="t.kind === 'ddl'" class="sds-time">⏰</span>
        <span class="sds-text">{{ t.text }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { monthGrid, today } from '../../helpers/dateHelper'
import { calendarItemsForDate } from '../../helpers/calendarItemsHelper'

export default {
  name: 'SideBar',
  data() {
    return { cursorDate: this.$store.getters.selectedDate || today() }
  },
  watch: {
    selectedDate(val) {
      if (val && val.slice(0, 7) !== this.cursorDate.slice(0, 7)) {
        this.cursorDate = val
      }
    },
  },
  computed: {
    selectedDate() { return this.$store.getters.selectedDate },
    currentPage() { return this.$store.getters.currentPage },
    monthLabel() { return moment(this.cursorDate, 'YYYY-MM-DD').format('YYYY年M月') },
    weekdayNames() { return ['一', '二', '三', '四', '五', '六', '日'] },
    flatGrid() {
      return monthGrid(this.cursorDate).flat().map(cell => ({
        ...cell,
        dayNum: moment(cell.date, 'YYYY-MM-DD').date(),
      }))
    },
    dateTasks() {
      return calendarItemsForDate(this.$store.getters.tasks, this.selectedDate)
        .map(item => item.task)
        .slice(0, 5)
    },
    summaryLabel() {
      return moment(this.selectedDate, 'YYYY-MM-DD').format('M月D日')
    },
  },
  methods: {
    prevMonth() {
      this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').subtract(1, 'month').format('YYYY-MM-DD')
    },
    nextMonth() {
      this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').add(1, 'month').format('YYYY-MM-DD')
    },
    selectDate(date) {
      this.$store.commit('setSelectedDate', date)
      this.$store.commit('setPage', 'calendar')
    },
    goToDay() {
      this.$store.commit('setActiveView', 'day')
      this.$store.commit('setPage', 'calendar')
    },
  },
}
</script>

<style scoped>
.sidebar { display: flex; flex-direction: column; }
.sidebar-page-tabs {
  display: flex; padding: 8px 8px 0; gap: 4px;
  border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.sidebar-tab {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 5px; padding: 6px 4px; border: none;
  border-bottom: 2px solid transparent; background: none;
  cursor: pointer; color: var(--text-muted); font-size: 12px;
  border-radius: 4px 4px 0 0; transition: color 0.15s;
}
.sidebar-tab:hover { color: var(--accent, #4a90d9); }
.sidebar-tab.active { color: var(--accent, #4a90d9); border-bottom-color: var(--accent, #4a90d9); font-weight: 600; }
.sidebar-tab i { font-size: 14px; }
.sidebar-day-summary {
  padding: 8px 10px; border-top: 1px solid var(--border); margin-top: 4px;
}
.sds-label {
  font-size: 10px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
}
.sds-item {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 4px; border-radius: var(--radius-sm); cursor: pointer;
  &:hover { background: var(--bg-hover); }
}
.sds-time { font-size: 10px; color: var(--text-muted); width: 32px; flex-shrink: 0; }
.sds-text { font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
