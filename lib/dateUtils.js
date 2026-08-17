// All dates are handled as local-time "YYYY-MM-DD" strings to avoid timezone drift.

export function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey() {
  return toDateKey(new Date())
}

// Monday-start week that contains `date`.
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function getWeekDays(anchorDate) {
  const start = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getMonthDays(year, monthIndex) {
  // monthIndex is 0-based. Returns array of Date objects, padded to full weeks (Mon-Sun).
  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)
  const days = []
  const startPad = (first.getDay() + 6) % 7 // days before the 1st to reach Monday
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, monthIndex, d))
  return days
}

export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b)
}

export function isFutureDay(d) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const check = new Date(d)
  check.setHours(0, 0, 0, 0)
  return check > today
}
