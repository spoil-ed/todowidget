import storageRepository from '../../repositories/storageRepository'

const state = {
  activeView: 'month',       // 'day' | 'week' | 'month'
  selectedDate: '',          // YYYY-MM-DD, set on app init
  weekStartOnMonday: true,
}

const getters = {
  activeView: s => s.activeView,
  selectedDate: s => s.selectedDate,
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
}

export default { namespaced: false, state, getters, mutations }
