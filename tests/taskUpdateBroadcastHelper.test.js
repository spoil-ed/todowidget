/* eslint-env jest */

const { broadcastTasksUpdated } = require('../src/helpers/taskUpdateBroadcastHelper')

function makeWindow({ destroyed = false, webContentsDestroyed = false, send = jest.fn() } = {}) {
  return {
    isDestroyed: () => destroyed,
    webContents: {
      isDestroyed: () => webContentsDestroyed,
      send,
    },
  }
}

test('broadcastTasksUpdated skips unusable windows and does not throw if one send fails', () => {
  const logger = { warn: jest.fn() }
  const items = [{ id: 'task_1', text: 'saved' }]
  const failingSend = jest.fn(() => { throw new Error('webContents gone') })
  const workingSend = jest.fn()

  expect(() => broadcastTasksUpdated([
    makeWindow({ destroyed: true }),
    makeWindow({ webContentsDestroyed: true }),
    makeWindow({ send: failingSend }),
    makeWindow({ send: workingSend }),
  ], items, logger)).not.toThrow()

  expect(failingSend).toHaveBeenCalledWith('tasks:updated', items)
  expect(workingSend).toHaveBeenCalledWith('tasks:updated', items)
  expect(logger.warn).toHaveBeenCalled()
})
