<template>
  <div id="app">
    <!-- Top bar -->
    <div class="app-topbar">
      <span class="app-title">TodoWidget</span>

      <div class="nav-arrows">
        <button @click="navigateBack" title="上一个">
          <i class="bi bi-chevron-left"></i>
        </button>
        <button @click="navigateForward" title="下一个">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <span class="current-label">{{ currentLabel }}</span>

      <div class="view-switcher">
        <button
          :class="{ active: activeView === 'day' }"
          @click="setView('day')"
        >日</button>
        <button
          :class="{ active: activeView === 'week' }"
          @click="setView('week')"
        >周</button>
        <button
          :class="{ active: activeView === 'month' }"
          @click="setView('month')"
        >月</button>
      </div>
    </div>

    <!-- Main body -->
    <div class="app-body">
      <day-view v-if="activeView === 'day'" />
      <week-view v-else-if="activeView === 'week'" />
      <month-view v-else />
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import DayView from './components/DayView.vue'
import WeekView from './components/WeekView.vue'
import MonthView from './components/MonthView.vue'
import { weekRange } from './helpers/dateHelper'

export default {
  name: 'App',
  components: { DayView, WeekView, MonthView },
  computed: {
    activeView() { return this.$store.getters.activeView },
    selectedDate() { return this.$store.getters.selectedDate },
    currentLabel() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      if (this.activeView === 'day') return m.format('YYYY年M月D日')
      if (this.activeView === 'week') {
        const dates = weekRange(this.selectedDate)
        const start = moment(dates[0], 'YYYY-MM-DD').format('M月D日')
        const end = moment(dates[6], 'YYYY-MM-DD').format('M月D日')
        return `${start} – ${end}`
      }
      return m.format('YYYY年M月')
    },
  },
  methods: {
    setView(view) { this.$store.commit('setActiveView', view) },
    navigateBack() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      const unit = this.activeView === 'day' ? 'day' : this.activeView === 'week' ? 'week' : 'month'
      this.$store.commit('setSelectedDate', m.subtract(1, unit).format('YYYY-MM-DD'))
    },
    navigateForward() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      const unit = this.activeView === 'day' ? 'day' : this.activeView === 'week' ? 'week' : 'month'
      this.$store.commit('setSelectedDate', m.add(1, unit).format('YYYY-MM-DD'))
    },
  },
}
</script>
