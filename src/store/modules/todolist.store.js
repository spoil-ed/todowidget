import todoRepository from '../../repositories/todoRepository'
import uniqueId from 'lodash.uniqueid'

const state = {
  // { "2026-06-09": [ { id, text, checked, createdAt }, ... ] }
  todoLists: {},
}

const getters = {
  todoLists: s => s.todoLists,
  todosForDate: s => date => s.todoLists[date] || [],
}

const mutations = {
  initTodos(state, allTodos) {
    state.todoLists = allTodos || {}
  },
  setDateTodos(state, { date, todos }) {
    state.todoLists = { ...state.todoLists, [date]: todos }
  },
}

const actions = {
  addTodo({ commit, state }, { date, text }) {
    const todos = [...(state.todoLists[date] || [])]
    todos.push({ id: uniqueId('todo_'), text, checked: false, createdAt: Date.now() })
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  toggleTodo({ commit, state }, { date, id }) {
    const todos = (state.todoLists[date] || []).map(t =>
      t.id === id ? { ...t, checked: !t.checked } : t
    )
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  deleteTodo({ commit, state }, { date, id }) {
    const todos = (state.todoLists[date] || []).filter(t => t.id !== id)
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
