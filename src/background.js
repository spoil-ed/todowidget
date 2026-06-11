'use strict'

import { app, protocol, BrowserWindow, ipcMain, screen } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { widgetBottomRightBounds, widgetResizeBounds } from './helpers/windowBoundsHelper'

const Store = require('electron-store')
const todoStore = new Store({ name: 'todos' })
const configStore = new Store({ name: 'config' })
const eventsStore = new Store({ name: 'events' })
const backlogStore = new Store({ name: 'backlog' })
const tasksStore = new Store({ name: 'tasks' })

const isDevelopment = process.env.NODE_ENV !== 'production'
const gotTheLock = app.requestSingleInstanceLock()

let mainWindow = null
let widgetWin = null
let hoverInterval = null
const WIDGET_DEFAULT_SIZE = { width: 300, height: 440 }

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
  mainWindow.on('closed', () => {
    mainWindow = null
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.destroy()
      widgetWin = null
    }
    stopHoverDetection()
    app.quit()
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    mainWindow.loadURL('app://./index.html')
  }
}

function createWidgetWindow() {
  const initialBounds = widgetBottomRightBounds(
    screen.getPrimaryDisplay().workArea,
    WIDGET_DEFAULT_SIZE.width,
    WIDGET_DEFAULT_SIZE.height,
  )

  widgetWin = new BrowserWindow({
    ...initialBounds,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minWidth: 220,
    minHeight: 300,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
    },
  })

  widgetWin.setAlwaysOnTop(true, 'screen-saver')
  widgetWin.removeMenu()

  const url = process.env.WEBPACK_DEV_SERVER_URL
    ? process.env.WEBPACK_DEV_SERVER_URL + '#widget'
    : 'app://./index.html#widget'
  widgetWin.loadURL(url)

  widgetWin.on('closed', () => {
    widgetWin = null
    stopHoverDetection()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
    } else {
      app.quit()
    }
  })
}

function getWidgetWorkArea() {
  if (!widgetWin || widgetWin.isDestroyed()) return screen.getPrimaryDisplay().workArea
  return screen.getDisplayMatching(widgetWin.getBounds()).workArea
}

function keepWidgetVisible(width, height) {
  if (!widgetWin || widgetWin.isDestroyed()) return
  const bounds = widgetResizeBounds(widgetWin.getBounds(), getWidgetWorkArea(), width, height)
  widgetWin.setBounds(bounds)
}

function startHoverDetection() {
  if (hoverInterval) return
  hoverInterval = setInterval(() => {
    if (!widgetWin) { stopHoverDetection(); return }
    const cursor = screen.getCursorScreenPoint()
    const b = widgetWin.getBounds()
    const inside = cursor.x >= b.x && cursor.x <= b.x + b.width &&
                   cursor.y >= b.y && cursor.y <= b.y + b.height
    widgetWin.setIgnoreMouseEvents(!inside, { forward: true })
  }, 80)
}

function stopHoverDetection() {
  if (hoverInterval) { clearInterval(hoverInterval); hoverInterval = null }
}

// ── IPC: todos ──
ipcMain.handle('todos:getAll', () => todoStore.store)
ipcMain.handle('todos:get', (_, date) => todoStore.get(date, []))
ipcMain.handle('todos:set', (_, date, todos) => { todoStore.set(date, todos) })
ipcMain.handle('todos:remove', (_, date) => { todoStore.delete(date) })

// ── IPC: config ──
ipcMain.handle('config:getAll', () => configStore.store)
ipcMain.handle('config:get', (_, key, def) => configStore.get(key, def !== undefined ? def : null))
ipcMain.handle('config:set', (_, key, val) => { configStore.set(key, val) })

// ── IPC: events ──
ipcMain.handle('events:getAll', () => eventsStore.store)
ipcMain.handle('events:get', (_, date) => eventsStore.get(date, []))
ipcMain.handle('events:set', (_, date, events) => { eventsStore.set(date, events) })
ipcMain.handle('events:remove', (_, date) => { eventsStore.delete(date) })

// ── IPC: backlog ──
ipcMain.handle('backlog:getAll', () => backlogStore.get('items', []))
ipcMain.handle('backlog:set', (_, items) => { backlogStore.set('items', items) })

// ── IPC: tasks ──
ipcMain.handle('tasks:getAll', () => tasksStore.get('items', []))
ipcMain.handle('tasks:set', (_, items) => {
  tasksStore.set('items', items)
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send('tasks:updated', items)
  })
})

// ── IPC: widget ──
ipcMain.handle('widget:resize', (_, width, height) => {
  if (!widgetWin || widgetWin.isDestroyed()) return
  keepWidgetVisible(width, height)
})
ipcMain.handle('widget:show', () => {
  if (!widgetWin) createWidgetWindow()
  else {
    const { width, height } = widgetWin.getBounds()
    keepWidgetVisible(width, height)
    widgetWin.show()
  }
  if (mainWindow) mainWindow.hide()
})

ipcMain.handle('widget:hide', () => {
  if (widgetWin) widgetWin.hide()
  stopHoverDetection()
  if (mainWindow) mainWindow.show()
})

ipcMain.handle('widget:setClickThrough', (_, enable) => {
  if (!widgetWin) return
  if (enable) {
    startHoverDetection()
  } else {
    stopHoverDetection()
    widgetWin.setIgnoreMouseEvents(false)
  }
})

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
