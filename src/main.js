import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store/store'
import todoRepository from './repositories/todoRepository'
import storageRepository from './repositories/storageRepository'
import moment from 'moment'
import 'moment/locale/zh-cn'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/style/globalVars.scss'
import './assets/style/main.scss'

// Always use Chinese locale and Beijing-compatible formatting.
// The system clock on a Beijing Windows machine is already UTC+8;
// moment.js reads from the system, so no manual offset is needed.
moment.locale('zh-cn')

async function init() {
  const [allTodos, allConfig] = await Promise.all([
    todoRepository.getAll(),
    storageRepository.getAll(),
  ])

  store.commit('initTodos', allTodos)
  store.commit('initConfig', {
    activeView: allConfig.activeView || 'month',
    selectedDate: allConfig.selectedDate || moment().format('YYYY-MM-DD'),
  })

  if (!store.getters.selectedDate) {
    store.commit('setSelectedDate', moment().format('YYYY-MM-DD'))
  }

  await store.dispatch('loadAllEvents')
  await store.dispatch('loadBacklog')

  createApp(App).use(store).mount('#app')
}

init()
