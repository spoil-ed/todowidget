// src/store/modules/events.store.js
import eventsRepository from '../../repositories/eventsRepository'
import uniqueId from 'lodash.uniqueid'

const state = {
  // { "2026-06-10": [ { id, title, startTime, endTime, createdAt } ] }
  eventLists: {},
}

const getters = {
  eventsForDate: s => date => s.eventLists[date] || [],
}

const mutations = {
  initEvents(state, allEvents) {
    state.eventLists = allEvents || {}
  },
  setDateEvents(state, { date, events }) {
    state.eventLists = { ...state.eventLists, [date]: events }
  },
}

const actions = {
  async loadAllEvents({ commit }) {
    const all = await eventsRepository.getAll()
    commit('initEvents', all)
  },
  addEvent({ commit, getters }, { date, title, startTime, endTime }) {
    const events = [...getters.eventsForDate(date)]
    events.push({ id: uniqueId('ev_'), title, startTime, endTime, createdAt: Date.now() })
    commit('setDateEvents', { date, events })
    eventsRepository.set(date, events)
  },
  deleteEvent({ commit, getters }, { date, id }) {
    const events = getters.eventsForDate(date).filter(e => e.id !== id)
    commit('setDateEvents', { date, events })
    eventsRepository.set(date, events)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
