export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcTimelineRange(events, extraMinutes = []) {
  const allPoints = [
    ...events.map(e => timeToMinutes(e.startTime)),
    ...events.map(e => timeToMinutes(e.endTime)),
    ...extraMinutes,
  ]
  if (!allPoints.length) return { start: 480, end: 1320 }
  const start = Math.max(0, Math.min(...allPoints) - 60)
  const end = Math.min(1440, Math.max(...allPoints) + 60)
  return { start, end }
}
