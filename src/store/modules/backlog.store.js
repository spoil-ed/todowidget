// src/store/modules/backlog.store.js
import backlogRepository from '../../repositories/backlogRepository'
import uniqueId from 'lodash.uniqueid'

const STATUS_CYCLE = { 'pending': 'in-progress', 'in-progress': 'done', 'done': 'pending' }

const state = {
  // [ { id, title, status, subtasks: [{ id, text, checked }], createdAt } ]
  backlogItems: [],
}

const getters = {
  backlogItems: s => s.backlogItems,
  backlogByStatus: s => status => s.backlogItems.filter(i => i.status === status),
}

const mutations = {
  initBacklog(state, items) {
    state.backlogItems = items || []
  },
  setBacklog(state, items) {
    state.backlogItems = items
  },
}

const actions = {
  async loadBacklog({ commit }) {
    const items = await backlogRepository.getAll()
    commit('initBacklog', items)
  },
  addBacklogItem({ commit, state }, { title }) {
    const items = [...state.backlogItems, {
      id: uniqueId('bl_'),
      title,
      status: 'pending',
      subtasks: [],
      createdAt: Date.now(),
    }]
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  cycleBacklogStatus({ commit, state }, { id }) {
    const items = state.backlogItems.map(item =>
      item.id === id ? { ...item, status: STATUS_CYCLE[item.status] } : item
    )
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  setBacklogStatus({ commit, state }, { id, status }) {
    const items = state.backlogItems.map(item =>
      item.id === id ? { ...item, status } : item
    )
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  deleteBacklogItem({ commit, state }, { id }) {
    const items = state.backlogItems.filter(i => i.id !== id)
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  addSubtask({ commit, state }, { itemId, text }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return {
        ...item,
        subtasks: [...item.subtasks, { id: uniqueId('st_'), text, checked: false }],
      }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  toggleSubtask({ commit, state }, { itemId, subtaskId }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return {
        ...item,
        subtasks: item.subtasks.map(st =>
          st.id === subtaskId ? { ...st, checked: !st.checked } : st
        ),
      }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
  deleteSubtask({ commit, state }, { itemId, subtaskId }) {
    const items = state.backlogItems.map(item => {
      if (item.id !== itemId) return item
      return { ...item, subtasks: item.subtasks.filter(st => st.id !== subtaskId) }
    })
    commit('setBacklog', items)
    backlogRepository.set(items)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
