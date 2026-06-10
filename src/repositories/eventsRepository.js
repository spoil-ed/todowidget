// src/repositories/eventsRepository.js
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  get(date) { return getIpc().invoke('events:get', date) },
  getAll() { return getIpc().invoke('events:getAll') },
  set(date, events) { return getIpc().invoke('events:set', date, events) },
  remove(date) { return getIpc().invoke('events:remove', date) },
}
