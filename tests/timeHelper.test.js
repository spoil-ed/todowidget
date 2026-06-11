/* eslint-env jest */

const { timeToMinutes, minutesToTime, calcTimelineRange, FULL_DAY_RANGE } = require('../src/helpers/timeHelper')

test('timeToMinutes converts HH:MM to minutes', () => {
  expect(timeToMinutes('00:00')).toBe(0)
  expect(timeToMinutes('08:00')).toBe(480)
  expect(timeToMinutes('09:30')).toBe(570)
  expect(timeToMinutes('23:59')).toBe(1439)
})

test('minutesToTime converts minutes to HH:MM', () => {
  expect(minutesToTime(0)).toBe('00:00')
  expect(minutesToTime(480)).toBe('08:00')
  expect(minutesToTime(570)).toBe('09:30')
})

test('calcTimelineRange returns full day range when no events', () => {
  const { start, end } = calcTimelineRange([])
  expect(start).toBe(0)
  expect(end).toBe(1440)
})

test('calcTimelineRange keeps full day range around events', () => {
  const events = [
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '14:00', endTime: '15:30' },
  ]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(0)
  expect(end).toBe(1440)
})

test('calcTimelineRange clamps start to 0 and end to 1440', () => {
  const events = [{ startTime: '00:30', endTime: '23:45' }]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(0)
  expect(end).toBe(1440)
})

test('FULL_DAY_RANGE exposes the all-day timeline bounds', () => {
  expect(FULL_DAY_RANGE).toEqual({ start: 0, end: 1440 })
})
