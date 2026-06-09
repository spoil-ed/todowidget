// Todo storage — IPC calls to main process (electron-store writes todos.json)
function getIpc() {
  return require('electron').ipcRenderer
}

export default {
  // Returns array of todos for a specific date string (YYYY-MM-DD)
  get(date) {
    return getIpc().invoke('todos:get', date)
  },
  // Returns full map: { "2026-06-09": [...], ... }
  getAll() {
    return getIpc().invoke('todos:getAll')
  },
  // Overwrites the full array for that date
  set(date, todos) {
    return getIpc().invoke('todos:set', date, todos)
  },
  remove(date) {
    return getIpc().invoke('todos:remove', date)
  },
}
