<template>
  <widget-view v-if="isWidgetMode" />
  <div v-else id="app">
    <!-- Top bar -->
    <div class="app-topbar">
      <span class="app-title">TodoWidget</span>

      <template v-if="currentPage === 'calendar'">
        <div class="nav-arrows">
          <button @click="navigateBack"><i class="bi bi-chevron-left"></i></button>
          <button @click="navigateForward"><i class="bi bi-chevron-right"></i></button>
        </div>
        <span class="current-label">{{ currentLabel }}</span>
        <div class="view-switcher">
          <button :class="{ active: activeView === 'day' }" @click="setView('day')">日</button>
          <button :class="{ active: activeView === 'week' }" @click="setView('week')">周</button>
          <button :class="{ active: activeView === 'month' }" @click="setView('month')">月</button>
        </div>
      </template>
      <span v-else class="current-label">待办清单</span>

      <button class="topbar-icon-btn" @click="enterWidget" title="桌面挂件">
        <i class="bi bi-window-sidebar"></i>
      </button>
      <button class="add-btn" @click="showModal = true" title="添加待办">
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <!-- Main body -->
    <div class="app-body">
      <side-bar />
      <div class="main-content">
        <template v-if="currentPage === 'calendar'">
          <day-view v-if="activeView === 'day'" />
          <week-view v-else-if="activeView === 'week'" />
          <month-view v-else />
        </template>
        <backlog-view v-else-if="currentPage === 'backlog'" />
      </div>
    </div>

    <todo-modal v-if="showModal" @close="showModal = false" />
  </div>
</template>

<script>
import moment from 'moment'
import DayView from './components/DayView.vue'
import WeekView from './components/WeekView.vue'
import MonthView from './components/MonthView.vue'
import SideBar from './components/layout/SideBar.vue'
import TodoModal from './views/TodoModal.vue'
import BacklogView from './views/BacklogView.vue'
import WidgetView from './views/WidgetView.vue'
import { weekRange } from './helpers/dateHelper'

let ipc = null
function getIpc() {
  if (!ipc) ipc = window.require('electron').ipcRenderer
  return ipc
}

export default {
  name: 'App',
  components: { DayView, WeekView, MonthView, SideBar, TodoModal, BacklogView, WidgetView },
  data() { return { showModal: false } },
  computed: {
    isWidgetMode() { return window.location.hash === '#widget' },
    activeView()   { return this.$store.getters.activeView },
    currentPage()  { return this.$store.getters.currentPage },
    selectedDate() { return this.$store.getters.selectedDate },
    currentLabel() {
      const m = moment(this.selectedDate, 'YYYY-MM-DD')
      if (this.activeView === 'day') return m.format('YYYY年M月D日')
      if (this.activeView === 'week') {
        const dates = weekRange(this.selectedDate)
        const start = moment(dates[0], 'YYYY-MM-DD').format('M月D日')
        const end   = moment(dates[6], 'YYYY-MM-DD').format('M月D日')
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
    enterWidget() { getIpc().invoke('widget:show') },
  },
}
</script>
