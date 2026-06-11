export function broadcastTasksUpdated(windows, items, logger = console) {
  for (const win of windows) {
    try {
      if (!win || (typeof win.isDestroyed === 'function' && win.isDestroyed())) continue
      const webContents = win.webContents
      if (!webContents || (typeof webContents.isDestroyed === 'function' && webContents.isDestroyed())) continue
      webContents.send('tasks:updated', items)
    } catch (error) {
      if (logger && typeof logger.warn === 'function') {
        logger.warn('Failed to broadcast task update', error)
      }
    }
  }
}
