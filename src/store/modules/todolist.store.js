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
  addTodo({ commit, getters }, { date, text, ddl }) {
    const todos = [...getters.todosForDate(date)]
    const item = { id: uniqueId('todo_'), text, checked: false, createdAt: Date.now() }
    if (ddl) item.ddl = ddl
    todos.push(item)
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  toggleTodo({ commit, getters }, { date, id }) {
    const todos = getters.todosForDate(date).map(t =>
      t.id === id ? { ...t, checked: !t.checked } : t
    )
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
  deleteTodo({ commit, getters }, { date, id }) {
    const todos = getters.todosForDate(date).filter(t => t.id !== id)
    commit('setDateTodos', { date, todos })
    todoRepository.set(date, todos)
  },
}

export default { namespaced: false, state, getters, mutations, actions }
