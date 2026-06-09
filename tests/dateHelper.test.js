const { today, weekRange, monthGrid, formatDate, parseDate } = require('../src/helpers/dateHelper')

describe('today()', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDate()', () => {
  it('formats moment to YYYY-MM-DD', () => {
    const moment = require('moment')
    expect(formatDate(moment('2026-06-09'))).toBe('2026-06-09')
  })
})

describe('parseDate()', () => {
  it('parses YYYY-MM-DD string to moment', () => {
    const m = parseDate('2026-06-09')
    expect(m.format('YYYY-MM-DD')).toBe('2026-06-09')
  })
})

describe('weekRange()', () => {
  it('returns 7 dates starting Monday for given date', () => {
    const dates = weekRange('2026-06-09') // Tuesday
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-06-08') // Monday
    expect(dates[6]).toBe('2026-06-14') // Sunday
  })

  it('returns Mon-Sun for a Monday input', () => {
    const dates = weekRange('2026-06-08')
    expect(dates[0]).toBe('2026-06-08')
    expect(dates[6]).toBe('2026-06-14')
  })
})

describe('monthGrid()', () => {
  it('returns 6 weeks × 7 days for 2026-06', () => {
    const grid = monthGrid('2026-06-01')
    expect(grid).toHaveLength(6)
    grid.forEach(week => expect(week).toHaveLength(7))
  })

  it('each cell has date, isCurrentMonth, isToday fields', () => {
    const grid = monthGrid('2026-06-01')
    const cell = grid[0][0]
    expect(cell).toHaveProperty('date')
    expect(cell).toHaveProperty('isCurrentMonth')
    expect(cell).toHaveProperty('isToday')
    expect(cell.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('first cell of June 2026 grid is Monday 2026-06-01', () => {
    const grid = monthGrid('2026-06-01')
    expect(grid[0][0].date).toBe('2026-06-01')
  })
})
