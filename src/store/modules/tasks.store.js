import tasksRepository from '../../repositories/tasksRepository'
import uniqueId from 'lodash.uniqueid'
import moment from 'moment'

function migrateTasks(oldTodos, oldEvents, oldBacklog) {
  const tasks = []
  if (oldTodos) {
    for (const [date, items] of Object.entries(oldTodos)) {
      for (const t of (items || [])) {
        tasks.push({
          id: t.id, text: t.text,
          kind: t.ddl ? 'ddl' : 'day',
          checked: !!t.checked, date,
          ...(t.ddl ? { ddl: t.ddl } : {}),
        })
      }
    }
  }
  if (oldEvents) {
    for (const [date, items] of Object.entries(oldEvents)) {
      for (const e of (items || [])) {
        tasks.push({
          id: e.id, text: e.title, kind: 'event',
          checked: false, date,
          startTime: e.startTime, endTime: e.endTime,
        })
      }
    }
  }
  if (Array.isArray(oldBacklog)) {
    for (const b of oldBacklog) {
      tasks.push({
        id: b.id, text: b.title, kind: 'free',
        checked: b.status === 'done',
        subtasks: b.subtasks || [],
      })
    }
  }
  return tasks
}

const state = { tasks: [] }
let subscribedToTaskUpdates = false

function normalizeTaskFields(task) {
  const normalized = { ...task }
  if (normalized.kind !== 'event') {
    delete normalized.startTime
    delete normalized.endTime
  }
  if (normalized.kind !== 'ddl') delete normalized.ddl
  if (normalized.kind !== 'free') delete normalized.subtasks
  if (normalized.kind === 'free') delete normalized.date
  return normalized
}

function snapshotTasks(tasks) {
  return tasks.map(task => normalizeTaskFields({ ...task }))
}

const getters = {
  tasks: s => s.tasks,
  tasksForDate: s => date => s.tasks.filter(t => t.date === date),
  overdueTasks: s => {
    const now = moment()
    return s.tasks.filter(t => {
      if (t.kind !== 'ddl' || t.checked || !t.ddl) return false
      const d = t.ddl.includes(' ')
        ? moment(t.ddl, 'YYYY-MM-DD HH:mm')
        : moment(t.ddl, 'YYYY-MM-DD').endOf('day')
      return d.isBefore(now)
    })
  },
  freeTasks: s => s.tasks.filter(t => t.kind === 'free'),
}

const mutations = {
  setTasks(state, tasks) { state.tasks = tasks },
}

const actions = {
  async loadTasks({ commit }) {
    const ipc = window.require('electron').ipcRenderer
    if (!subscribedToTaskUpdates) {
      ipc.on('tasks:updated', (_, tasks) => {
        commit('setTasks', Array.isArray(tasks) ? tasks : [])
      })
      subscribedToTaskUpdates = true
    }
    const migrated = await ipc.invoke('config:get', 'tasks_migrated', false)
    let tasks = await tasksRepository.getAll()
    if (!migrated) {
      const [oldTodos, oldEvents, oldBacklog] = await Promise.all([
        ipc.invoke('todos:getAll'),
        ipc.invoke('events:getAll'),
        ipc.invoke('backlog:getAll'),
      ])
      tasks = migrateTasks(oldTodos, oldEvents, oldBacklog)
      await tasksRepository.set(tasks)
      await ipc.invoke('config:set', 'tasks_migrated', true)
    }
    commit('setTasks', tasks)
  },
  async addTask({ commit, state }, task) {
    const newTask = normalizeTaskFields({ ...task, id: uniqueId('task_'), checked: false })
    const tasks = snapshotTasks([...state.tasks, newTask])
    await tasksRepository.set(tasks)
    commit('setTasks', tasks)
  },
  async updateTask({ commit, state }, { id, changes }) {
    const tasks = snapshotTasks(state.tasks.map(t => (
      t.id === id ? normalizeTaskFields({ ...t, ...changes, id }) : t
    )))
    await tasksRepository.set(tasks)
    commit('setTasks', tasks)
  },
  async toggleTask({ commit, state }, { id }) {
    const tasks = snapshotTasks(state.tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t))
    await tasksRepository.set(tasks)
    commit('setTasks', tasks)
  },
  async deleteTask({ commit, state }, { id }) {
    const tasks = snapshotTasks(state.tasks.filter(t => t.id !== id))
    await tasksRepository.set(tasks)
    commit('setTasks', tasks)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
