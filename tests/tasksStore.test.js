/* eslint-env jest */

jest.mock('../src/repositories/tasksRepository', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    set: jest.fn(),
  },
}))

const tasksRepository = require('../src/repositories/tasksRepository').default
const tasksModule = require('../src/store/modules/tasks.store').default

beforeEach(() => {
  tasksRepository.set.mockClear()
  tasksRepository.set.mockResolvedValue(undefined)
})

test('addTask persists the full task list before committing the new task', async () => {
  const existing = [{ id: 'task_existing', kind: 'day', date: '2026-06-11', text: '已有任务', checked: false }]
  const state = { tasks: existing }
  const commit = jest.fn()
  const event = {
    kind: 'event',
    date: '2026-06-11',
    text: '真实添加的日程',
    startTime: '09:00',
    endTime: '10:00',
  }

  await tasksModule.actions.addTask({ commit, state }, event)

  const persistedTasks = tasksRepository.set.mock.calls[0][0]
  expect(commit).toHaveBeenCalledWith('setTasks', persistedTasks)
  expect(persistedTasks).toHaveLength(2)
  expect(persistedTasks[0]).toEqual(existing[0])
  expect(persistedTasks[0]).not.toBe(existing[0])
  expect(persistedTasks[1]).toEqual(expect.objectContaining({
    id: expect.stringMatching(/^task_/),
    checked: false,
    kind: 'event',
    date: '2026-06-11',
    text: '真实添加的日程',
    startTime: '09:00',
    endTime: '10:00',
  }))
})

test('addTask does not commit when persistence fails', async () => {
  tasksRepository.set.mockRejectedValue(new Error('disk unavailable'))
  const state = { tasks: [] }
  const commit = jest.fn()

  await expect(tasksModule.actions.addTask({ commit, state }, {
    kind: 'day',
    date: '2026-06-11',
    text: '不会假添加',
  })).rejects.toThrow('disk unavailable')

  expect(commit).not.toHaveBeenCalled()
})

test('updateTask persists plain snapshots for unchanged tasks too', async () => {
  const unchanged = { id: 'task_1', kind: 'day', date: '2026-06-11', text: '未修改', checked: false }
  const changed = { id: 'task_2', kind: 'event', date: '2026-06-11', text: '旧日程', checked: false, startTime: '09:00', endTime: '10:00' }
  const state = { tasks: [unchanged, changed] }
  const commit = jest.fn()

  await tasksModule.actions.updateTask({ commit, state }, {
    id: 'task_2',
    changes: { text: '新日程', kind: 'event', date: '2026-06-11', startTime: '10:00', endTime: '11:00' },
  })

  const persistedTasks = tasksRepository.set.mock.calls[0][0]
  expect(persistedTasks[0]).toEqual(unchanged)
  expect(persistedTasks[0]).not.toBe(unchanged)
  expect(persistedTasks[1]).toEqual(expect.objectContaining({
    id: 'task_2',
    text: '新日程',
    startTime: '10:00',
    endTime: '11:00',
  }))
})
