<template>
  <div class="sidebar">
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
    <div class="sidebar-bottom">
      <button
        class="sidebar-backlog-btn"
        :class="{ active: currentPage === 'backlog' }"
        @click="$store.commit('setPage', 'backlog')"
      >
        <i class="bi bi-list-check"></i>
        <span>待办清单</span>
      </button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { monthGrid, today } from '../../helpers/dateHelper'

export default {
  name: 'SideBar',
  data() {
    return { cursorDate: this.$store.getters.selectedDate || today() }
  },
  watch: {
    selectedDate(val) {
      // sync cursor month when selected date changes to a different month
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
  },
  methods: {
    prevMonth() {
      this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').subtract(1, 'month').format('YYYY-MM-DD')
    },
    nextMonth() {
      this.cursorDate = moment(this.cursorDate, 'YYYY-MM-DD').add(1, 'month').format('YYYY-MM-DD')
    },
    selectDate(date) { this.$store.commit('setSelectedDate', date) },
  },
}
</script>

<style scoped>
.sidebar { display: flex; flex-direction: column; }
.sidebar-bottom { margin-top: auto; padding: 8px; border-top: 1px solid var(--border); }
.sidebar-backlog-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.sidebar-backlog-btn.active { background: var(--accent-light, #e8f0fe); color: var(--accent, #4a90d9); }
.sidebar-backlog-btn i { font-size: 16px; }
</style>
