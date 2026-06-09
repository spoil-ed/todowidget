const moment = require('moment')
require('moment/locale/zh-cn')
moment.locale('zh-cn')

// Always interpret "today" as the local system clock (Beijing UTC+8 on target machine).
// moment.js uses the system timezone by default.

function today() {
  return moment().format('YYYY-MM-DD')
}

function formatDate(m) {
  return m.format('YYYY-MM-DD')
}

function parseDate(dateStr) {
  return moment(dateStr, 'YYYY-MM-DD')
}

// Returns array of 7 date strings [Mon, Tue, ... Sun] for the week containing dateStr.
function weekRange(dateStr) {
  const m = moment(dateStr, 'YYYY-MM-DD')
  // isoWeekday: 1=Mon, 7=Sun
  const monday = m.clone().isoWeekday(1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    dates.push(monday.clone().add(i, 'days').format('YYYY-MM-DD'))
  }
  return dates
}

// Returns a 6×7 grid of cell objects for the month containing dateStr.
// Grid always starts on Monday.
function monthGrid(dateStr) {
  const m = moment(dateStr, 'YYYY-MM-DD')
  const todayStr = today()
  const year = m.year()
  const month = m.month() // 0-based

  // Start of grid: Monday of the week containing the 1st of the month
  const firstOfMonth = moment({ year, month, day: 1 })
  const gridStart = firstOfMonth.clone().isoWeekday(1)

  const grid = []
  let cursor = gridStart.clone()
  for (let week = 0; week < 6; week++) {
    const row = []
    for (let day = 0; day < 7; day++) {
      row.push({
        date: cursor.format('YYYY-MM-DD'),
        isCurrentMonth: cursor.month() === month,
        isToday: cursor.format('YYYY-MM-DD') === todayStr,
      })
      cursor.add(1, 'day')
    }
    grid.push(row)
  }
  return grid
}

module.exports = { today, formatDate, parseDate, weekRange, monthGrid }
