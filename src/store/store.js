import { createStore } from 'vuex'
import tasks from './modules/tasks.store'
import config from './modules/config.store'

export const store = createStore({
  modules: { config, tasks },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
})
