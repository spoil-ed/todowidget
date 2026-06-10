import storageRepository from '../../repositories/storageRepository'

const state = {
  activeView: 'month',       // 'day' | 'week' | 'month'
  selectedDate: '',          // YYYY-MM-DD, set on app init
  weekStartOnMonday: true,
  currentPage: 'calendar',
}

const getters = {
  activeView: s => s.activeView,
  selectedDate: s => s.selectedDate,
  weekStartOnMonday: s => s.weekStartOnMonday,
  currentPage: s => s.currentPage,
}

const mutations = {
  setActiveView(state, view) {
    state.activeView = view
    storageRepository.set('activeView', view)
  },
  setSelectedDate(state, date) {
    state.selectedDate = date
    storageRepository.set('selectedDate', date)
  },
  initConfig(state, cfg) {
    if (cfg.activeView) state.activeView = cfg.activeView
    if (cfg.selectedDate) state.selectedDate = cfg.selectedDate
  },
  setPage(state, page) { state.currentPage = page },
}

export default { namespaced: false, state, getters, mutations }
