// src/repositories/backlogRepository.js
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  getAll() { return getIpc().invoke('backlog:getAll') },
  set(items) { return getIpc().invoke('backlog:set', items) },
}
