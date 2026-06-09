'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const Store = require('electron-store')
const todoStore = new Store({ name: 'todos' })
const configStore = new Store({ name: 'config' })

const isDevelopment = process.env.NODE_ENV !== 'production'
const gotTheLock = app.requestSingleInstanceLock()

let mainWindow = null

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, stream: true } },
])

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
    },
  })

  mainWindow.removeMenu()
  mainWindow.on('closed', () => { mainWindow = null })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    mainWindow.loadURL('app://./index.html')
  }
}

// IPC: todos
ipcMain.handle('todos:getAll', () => todoStore.store)
ipcMain.handle('todos:get', (_, date) => todoStore.get(date, []))
ipcMain.handle('todos:set', (_, date, todos) => { todoStore.set(date, todos) })
ipcMain.handle('todos:remove', (_, date) => { todoStore.delete(date) })

// IPC: config
ipcMain.handle('config:getAll', () => configStore.store)
ipcMain.handle('config:get', (_, key, def) => configStore.get(key, def !== undefined ? def : null))
ipcMain.handle('config:set', (_, key, val) => { configStore.set(key, val) })

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      try { await installExtension(VUEJS_DEVTOOLS) } catch (e) { /* ignore */ }
    }
    await createWindow()
  })

  if (isDevelopment) {
    if (process.platform === 'win32') {
      process.on('message', data => { if (data === 'graceful-exit') app.quit() })
    } else {
      process.on('SIGTERM', () => app.quit())
    }
  }
}
