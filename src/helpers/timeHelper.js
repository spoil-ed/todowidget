export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const FULL_DAY_RANGE = { start: 0, end: 1440 }

export function calcTimelineRange() {
  return { ...FULL_DAY_RANGE }
}
