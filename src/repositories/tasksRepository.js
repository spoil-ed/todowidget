let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  getAll() { return getIpc().invoke('tasks:getAll') },
  set(tasks) { return getIpc().invoke('tasks:set', tasks) },
}
