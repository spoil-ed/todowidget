// Config storage — IPC calls to main process (electron-store writes config.json)
let _ipc = null
function getIpc() {
  if (!_ipc) _ipc = window.require('electron').ipcRenderer
  return _ipc
}

export default {
  get(key, defaultVal = null) {
    return getIpc().invoke('config:get', key, defaultVal)
  },
  set(key, val) {
    return getIpc().invoke('config:set', key, val)
  },
  getAll() {
    return getIpc().invoke('config:getAll')
  },
}
