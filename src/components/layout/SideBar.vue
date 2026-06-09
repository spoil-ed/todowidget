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
