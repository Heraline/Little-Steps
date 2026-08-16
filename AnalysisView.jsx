import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { fetchHabits, fetchLogsInRange } from '../lib/habitApi'
import {
  toDateKey,
  startOfWeek,
  addDays,
  getMonthDays,
  daysInMonth,
  isFutureDay,
  MONTH_KEYS,
  WEEKDAY_KEYS,
} from '../lib/dateUtils'
import PeriodTabs from './PeriodTabs'
import PeriodNav from './PeriodNav'

export default function AnalysisView({ userId, readOnly, onHabitClick }) {
  const { t, lang } = useLang()
  const [period, setPeriod] = useState('calendar')
  const [anchor, setAnchor] = useState(new Date())
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchHabits(userId).then(setHabits).catch(() => setHabits([]))
  }, [userId])

  const range = useMemo(() => {
    if (period === 'week') {
      const start = startOfWeek(anchor)
      return { start, end: addDays(start, 6) }
    }
    if (period === 'year') {
      return { start: new Date(anchor.getFullYear(), 0, 1), end: new Date(anchor.getFullYear(), 11, 31) }
    }
    // month + calendar
    return {
      start: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
      end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
    }
  }, [period, anchor])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchLogsInRange(userId, toDateKey(range.start), toDateKey(range.end))
      .then((logs) => {
        const map = {}
        for (const log of logs) {
          if (!map[log.habitId]) map[log.habitId] = new Set()
          map[log.habitId].add(log.logDate)
        }
        setLogsByHabit(map)
      })
      .finally(() => setLoading(false))
  }, [userId, range.start, range.end])

  function shift(delta) {
    if (period === 'week') setAnchor((a) => addDays(a, delta * 7))
    else if (period === 'year') setAnchor((a) => new Date(a.getFullYear() + delta, a.getMonth(), 1))
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }

  const label = useMemo(() => {
    if (period === 'week') {
      const s = range.start,
        e = range.end
      return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
    }
    if (period === 'year') return String(anchor.getFullYear())
    return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
  }, [period, anchor, range])

  const isFuturePeriod = useMemo(() => {
    const today = new Date()
    if (period === 'week') return range.start > today
    if (period === 'year') return anchor.getFullYear() > today.getFullYear()
    return anchor.getFullYear() > today.getFullYear() || (anchor.getFullYear() === today.getFullYear() && anchor.getMonth() > today.getMonth())
  }, [period, anchor, range])

  if (habits.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">📊</span>
        <h3>{t('noHabitsYet')}</h3>
      </div>
    )
  }

  return (
    <div>
      <PeriodTabs value={period} onChange={setPeriod} />
      <PeriodNav label={label} onPrev={() => shift(-1)} onNext={() => shift(1)} nextDisabled={isFuturePeriod} />

      {period === 'calendar' && (
        <CombinedCalendar anchor={anchor} habits={habits} logsByHabit={logsByHabit} t={t} />
      )}

      {period !== 'calendar' && (
        <div className="stat-card">
          {habits.map((h) => (
            <HabitSummaryRow
              key={h.id}
              habit={h}
              period={period}
              anchor={anchor}
              doneDates={logsByHabit[h.id] || new Set()}
              lang={lang}
              t={t}
              onClick={() => onHabitClick?.(h)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitSummaryRow({ habit, period, anchor, doneDates, lang, t, onClick }) {
  const name = lang === 'zh' ? habit.nameZh : habit.nameEn

  let dots = []
  let count = 0

  if (period === 'week') {
    const start = startOfWeek(anchor)
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i)
      const key = toDateKey(d)
      const done = doneDates.has(key)
      if (done) count++
      dots.push(
        <span key={key} className={`dot ${done ? 'done' : isFutureDay(d) ? 'future' : 'missed'}`} />
      )
    }
  } else if (period === 'month') {
    const total = daysInMonth(anchor.getFullYear(), anchor.getMonth())
    for (let day = 1; day <= total; day++) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth(), day)
      const key = toDateKey(d)
      const done = doneDates.has(key)
      if (done) count++
      dots.push(
        <span key={key} className={`dot ${done ? 'done' : isFutureDay(d) ? 'future' : 'missed'}`} />
      )
    }
  } else if (period === 'year') {
    for (let m = 0; m < 12; m++) {
      const total = daysInMonth(anchor.getFullYear(), m)
      let monthDone = 0
      for (let day = 1; day <= total; day++) {
        const key = toDateKey(new Date(anchor.getFullYear(), m, day))
        if (doneDates.has(key)) monthDone++
      }
      count += monthDone
      const ratio = monthDone / total
      const cls = ratio === 0 ? 'missed' : ratio < 0.6 ? 'future' : 'done'
      dots.push(<span key={m} className={`dot ${cls}`} title={t(MONTH_KEYS[m])} />)
    }
  }

  return (
    <div className="habit-row" role="button" tabIndex={0} onClick={onClick}>
      <span className="row-icon" style={{ background: habit.color + '33' }}>
        {habit.icon}
      </span>
      <div className="row-body">
        <div className="row-name">{name}</div>
        <div className="row-dots">{dots}</div>
      </div>
      <span className="row-count">{count}{t('days')}</span>
    </div>
  )
}

function CombinedCalendar({ anchor, habits, logsByHabit, t }) {
  const days = getMonthDays(anchor.getFullYear(), anchor.getMonth())
  const total = habits.length || 1

  function ratioForDay(date) {
    if (!date) return null
    const key = toDateKey(date)
    let done = 0
    for (const h of habits) {
      if (logsByHabit[h.id]?.has(key)) done++
    }
    return done / total
  }

  const today = new Date()

  return (
    <div className="stat-card">
      <div className="week-grid">
        {WEEKDAY_KEYS.map((k) => (
          <div key={k} className="weekday-label">
            {t(k)}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} className="day-cell empty" />
          const ratio = ratioForDay(d)
          const future = isFutureDay(d)
          const isToday = toDateKey(d) === toDateKey(today)
          let cls = 'day-cell'
          if (future) cls += ' future'
          else if (ratio >= 0.999) cls += ' done'
          else if (ratio > 0) cls += ' missed'
          if (isToday) cls += ' today'
          return (
            <div key={i} className={cls}>
              <span className="day-num">{d.getDate()}</span>
              {!future && habits.length > 0 && <span style={{ fontSize: '10px' }}>{Math.round(ratio * 100)}%</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
