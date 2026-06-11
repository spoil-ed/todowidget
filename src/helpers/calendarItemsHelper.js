import { timeToMinutes } from './timeHelper'

const END_OF_DAY_SORT = 24 * 60

function formatAmPm(time) {
  if (!time) return ''
  const [hour, minute] = time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}

function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return startTime ? formatAmPm(startTime) : ''
  return `${formatAmPm(startTime)}-${formatAmPm(endTime)}`
}

function isCalendarTask(task) {
  return task && (task.kind === 'event' || task.kind === 'day' || task.kind === 'ddl')
}

function ddlTime(task) {
  if (!task.ddl || !task.ddl.includes(' ')) return ''
  return task.ddl.split(' ')[1]
}

function toCalendarItem(task) {
  if (task.kind === 'event') {
    const timeLabel = formatTimeRange(task.startTime, task.endTime)
    return {
      id: task.id,
      type: 'event',
      task,
      displayText: task.text,
      timeLabel,
      rangeLabel: timeLabel,
      checked: !!task.checked,
      sortMinutes: task.startTime ? timeToMinutes(task.startTime) : END_OF_DAY_SORT,
    }
  }

  if (task.kind === 'ddl') {
    const time = ddlTime(task)
    const timeLabel = formatAmPm(time)
    return {
      id: task.id,
      type: 'ddl',
      task,
      displayText: task.text,
      timeLabel,
      rangeLabel: timeLabel ? `截止 ${timeLabel}` : '截止',
      checked: !!task.checked,
      sortMinutes: time ? timeToMinutes(time) : END_OF_DAY_SORT + 1,
    }
  }

  return {
    id: task.id,
    type: 'todo',
    task,
    displayText: task.text,
    timeLabel: '',
    rangeLabel: '',
    checked: !!task.checked,
    sortMinutes: END_OF_DAY_SORT + 2,
  }
}

export function calendarItemsForDate(tasks, date) {
  return (tasks || [])
    .filter(task => task.date === date && isCalendarTask(task))
    .map(toCalendarItem)
    .sort((a, b) => {
      if (a.sortMinutes !== b.sortMinutes) return a.sortMinutes - b.sortMinutes
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      return a.displayText.localeCompare(b.displayText)
    })
}

export function previewCalendarItems(tasks, date, maxItems) {
  const items = calendarItemsForDate(tasks, date)
  const limit = Math.max(0, maxItems)
  return {
    items: items.slice(0, limit),
    overflowCount: Math.max(0, items.length - limit),
  }
}

export function overflowCalendarItemCount(tasks, date, maxItems) {
  return previewCalendarItems(tasks, date, maxItems).overflowCount
}
