import { createStore } from 'vuex'
import todoLists from './modules/todolist.store'
import config from './modules/config.store'
import events from './modules/events.store'
import backlog from './modules/backlog.store'

export const store = createStore({
  modules: { config, todoLists, events, backlog },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
})
