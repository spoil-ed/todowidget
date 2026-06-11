import { timeToMinutes } from './timeHelper'

const END_OF_DAY_SORT = 24 * 60

function isCalendarTask(task) {
  return task && (task.kind === 'event' || task.kind === 'day' || task.kind === 'ddl')
}

function ddlTime(task) {
  if (!task.ddl || !task.ddl.includes(' ')) return ''
  return task.ddl.split(' ')[1]
}

function toCalendarItem(task) {
  if (task.kind === 'event') {
    return {
      id: task.id,
      type: 'event',
      task,
      displayText: task.text,
      timeLabel: task.startTime || '',
      rangeLabel: task.startTime && task.endTime ? `${task.startTime}-${task.endTime}` : '',
      checked: !!task.checked,
      sortMinutes: task.startTime ? timeToMinutes(task.startTime) : END_OF_DAY_SORT,
    }
  }

  if (task.kind === 'ddl') {
    const time = ddlTime(task)
    return {
      id: task.id,
      type: 'ddl',
      task,
      displayText: task.text,
      timeLabel: time,
      rangeLabel: time ? `截止 ${time}` : '截止',
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
