import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store/store'
import storageRepository from './repositories/storageRepository'
import moment from 'moment'
import 'moment/locale/zh-cn'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/style/globalVars.scss'
import './assets/style/main.scss'

moment.locale('zh-cn')

async function init() {
  const allConfig = await storageRepository.getAll()

  store.commit('initConfig', {
    activeView: allConfig.activeView || 'month',
    selectedDate: allConfig.selectedDate || moment().format('YYYY-MM-DD'),
  })

  if (!store.getters.selectedDate) {
    store.commit('setSelectedDate', moment().format('YYYY-MM-DD'))
  }

  await store.dispatch('loadTasks')

  createApp(App).use(store).mount('#app')
}

init()
