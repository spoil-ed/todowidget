// Todo storage — IPC calls to main process (electron-store writes todos.json)
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
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
