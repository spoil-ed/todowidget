import { createStore } from 'vuex'
import todoLists from './modules/todolist.store'
import config from './modules/config.store'

export const store = createStore({
  modules: { config, todoLists },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
})
