/* eslint-env jest */

const {
  calendarItemsForDate,
  previewCalendarItems,
  overflowCalendarItemCount,
} = require('../src/helpers/calendarItemsHelper')

const tasks = [
  { id: 'todo_1', kind: 'day', date: '2026-06-11', text: '写报告', checked: false },
  { id: 'event_2', kind: 'event', date: '2026-06-11', text: '午会', startTime: '12:30', endTime: '13:00' },
  { id: 'event_1', kind: 'event', date: '2026-06-11', text: '晨会', startTime: '09:00', endTime: '09:30' },
  { id: 'ddl_1', kind: 'ddl', date: '2026-06-11', text: '提交发票', ddl: '2026-06-11 18:00', checked: false },
  { id: 'todo_2', kind: 'day', date: '2026-06-12', text: '其他日期', checked: false },
]

test('calendarItemsForDate returns events and todos for one date in display order', () => {
  const items = calendarItemsForDate(tasks, '2026-06-11')

  expect(items.map(item => item.id)).toEqual(['event_1', 'event_2', 'ddl_1', 'todo_1'])
  expect(items.map(item => item.timeLabel)).toEqual(['09:00', '12:30', '18:00', ''])
  expect(items.map(item => item.displayText)).toEqual(['晨会', '午会', '提交发票', '写报告'])
})

test('previewCalendarItems returns visible items and overflow count', () => {
  const preview = previewCalendarItems(tasks, '2026-06-11', 2)

  expect(preview.items.map(item => item.id)).toEqual(['event_1', 'event_2'])
  expect(preview.overflowCount).toBe(2)
})

test('overflowCalendarItemCount counts all hidden event and todo items', () => {
  expect(overflowCalendarItemCount(tasks, '2026-06-11', 3)).toBe(1)
  expect(overflowCalendarItemCount(tasks, '2026-06-12', 3)).toBe(0)
})
