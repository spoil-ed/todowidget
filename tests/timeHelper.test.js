const { timeToMinutes, minutesToTime, calcTimelineRange } = require('../src/helpers/timeHelper')

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

test('calcTimelineRange returns default range when no events', () => {
  const { start, end } = calcTimelineRange([])
  expect(start).toBe(480)  // 08:00
  expect(end).toBe(1320)   // 22:00
})

test('calcTimelineRange pads 60min around events', () => {
  const events = [
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '14:00', endTime: '15:30' },
  ]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(540)  // 10:00 - 60min = 09:00
  expect(end).toBe(990)    // 15:30 + 60min = 16:30
})

test('calcTimelineRange clamps start to 0 and end to 1440', () => {
  const events = [{ startTime: '00:30', endTime: '23:45' }]
  const { start, end } = calcTimelineRange(events)
  expect(start).toBe(0)
  expect(end).toBe(1440)
})
