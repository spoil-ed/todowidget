// Config storage — IPC calls to main process (electron-store writes config.json)
function getIpc() {
  return require('electron').ipcRenderer
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
