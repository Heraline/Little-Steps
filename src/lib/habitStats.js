import { toDateKey, startOfWeek, addDays, daysInMonth, isFutureDay, MONTH_KEYS } from './dateUtils'

// Shared by AnalysisView (all-habits list) and HabitDetail (single habit)
// so both screens compute and color week/month dots identically.

export function getWeekDots(anchor, doneDates) {
  const start = startOfWeek(anchor)
  const dots = []
  let count = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i)
    const key = toDateKey(d)
    const done = doneDates.has(key)
    if (done) count++
    dots.push({ key, state: done ? 'done' : isFutureDay(d) ? 'future' : 'missed' })
  }
  return { dots, count, total: 7 }
}

export function getMonthDots(anchor, doneDates) {
  const total = daysInMonth(anchor.getFullYear(), anchor.getMonth())
  const dots = []
  let count = 0
  for (let day = 1; day <= total; day++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), day)
    const key = toDateKey(d)
    const done = doneDates.has(key)
    if (done) count++
    dots.push({ key, state: done ? 'done' : isFutureDay(d) ? 'future' : 'missed' })
  }
  return { dots, count, total }
}

export function getYearMonthDots(anchor, doneDates) {
  const dots = []
  let count = 0
  for (let m = 0; m < 12; m++) {
    const total = daysInMonth(anchor.getFullYear(), m)
    let monthDone = 0
    for (let day = 1; day <= total; day++) {
      const key = toDateKey(new Date(anchor.getFullYear(), m, day))
      if (doneDates.has(key)) monthDone++
    }
    count += monthDone
    const ratio = monthDone / total
    const state = ratio === 0 ? 'missed' : ratio < 0.6 ? 'future' : 'done'
    dots.push({ key: m, state, label: MONTH_KEYS[m] })
  }
  return { dots, count, total: 12 }
}
