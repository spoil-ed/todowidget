export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcTimelineRange(events) {
  if (!events.length) return { start: 480, end: 1320 }
  const starts = events.map(e => timeToMinutes(e.startTime))
  const ends = events.map(e => timeToMinutes(e.endTime))
  const start = Math.max(0, Math.min(...starts) - 60)
  const end = Math.min(1440, Math.max(...ends) + 60)
  return { start, end }
}
