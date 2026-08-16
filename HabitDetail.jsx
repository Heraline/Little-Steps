import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { fetchHabit, fetchAllLogsForHabit, deleteHabit, computeCurrentStreak } from '../lib/habitApi'
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
import PeriodTabs from '../components/PeriodTabs'
import PeriodNav from '../components/PeriodNav'

export default function HabitDetail() {
  const { habitId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang } = useLang()
  const { user } = useAuth()
  const readOnly = location.state?.readOnly || false

  const [habit, setHabit] = useState(null)
  const [doneDates, setDoneDates] = useState(new Set())
  const [period, setPeriod] = useState('calendar')
  const [anchor, setAnchor] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const habitRow = await fetchHabit(habitId)
      setHabit(habitRow)
      const logs = await fetchAllLogsForHabit(habitId)
      setDoneDates(new Set(logs.map((l) => l.logDate)))
      setLoading(false)
    }
    load()
  }, [habitId])

  const streak = useMemo(() => computeCurrentStreak(doneDates), [doneDates])
  const totalCompleted = doneDates.size

  function shift(delta) {
    if (period === 'week') setAnchor((a) => addDays(a, delta * 7))
    else if (period === 'year') setAnchor((a) => new Date(a.getFullYear() + delta, a.getMonth(), 1))
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }

  const label = useMemo(() => {
    if (period === 'week') {
      const s = startOfWeek(anchor)
      const e = addDays(s, 6)
      return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
    }
    if (period === 'year') return String(anchor.getFullYear())
    return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
  }, [period, anchor])

  async function handleDelete() {
    if (!window.confirm(t('deleteHabitConfirm'))) return
    await deleteHabit(habitId)
    navigate('/analysis')
  }

  if (loading || !habit) {
    return <div className="center-loading">{t('loading')}</div>
  }

  const name = lang === 'zh' ? habit.nameZh : habit.nameEn
  const isOwner = !readOnly && user?.uid === habit.userId

  return (
    <div className="screen">
      <div className="topbar" style={{ padding: 0, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('back')}>
          ←
        </button>
        <h1 style={{ fontSize: 'var(--fs-lg)' }}>
          {habit.icon} {name}
        </h1>
        {isOwner ? (
          <button className="icon-btn" onClick={handleDelete} aria-label={t('delete')}>
            🗑️
          </button>
        ) : (
          <span style={{ width: 56 }} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>
            {totalCompleted}
          </div>
          <div>{t('completedDays')}</div>
        </div>
        <div className="stat-card" style={{ flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div className="stat-value" style={{ fontSize: 'var(--fs-xl)' }}>
            🔥{streak}
          </div>
          <div>{t('currentStreak')}</div>
        </div>
      </div>

      <PeriodTabs value={period} onChange={setPeriod} />
      <PeriodNav label={label} onPrev={() => shift(-1)} onNext={() => shift(1)} />

      {(period === 'calendar' || period === 'month') && (
        <MonthGrid anchor={anchor} doneDates={doneDates} t={t} />
      )}
      {period === 'week' && <WeekGrid anchor={anchor} doneDates={doneDates} t={t} />}
      {period === 'year' && <YearHeatmap anchor={anchor} doneDates={doneDates} t={t} />}
    </div>
  )
}

function WeekGrid({ anchor, doneDates, t }) {
  const start = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const today = new Date()
  return (
    <div className="stat-card">
      <div className="week-grid">
        {WEEKDAY_KEYS.map((k) => (
          <div key={k} className="weekday-label">
            {t(k)}
          </div>
        ))}
        {days.map((d) => {
          const key = toDateKey(d)
          const done = doneDates.has(key)
          const future = isFutureDay(d)
          let cls = 'day-cell'
          if (done) cls += ' done'
          else if (future) cls += ' future'
          else cls += ' missed'
          if (toDateKey(d) === toDateKey(today)) cls += ' today'
          return (
            <div key={key} className={cls}>
              <span className="day-num">{d.getDate()}</span>
              {done && <span>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthGrid({ anchor, doneDates, t }) {
  const days = getMonthDays(anchor.getFullYear(), anchor.getMonth())
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
          const key = toDateKey(d)
          const done = doneDates.has(key)
          const future = isFutureDay(d)
          let cls = 'day-cell'
          if (done) cls += ' done'
          else if (future) cls += ' future'
          else cls += ' missed'
          if (toDateKey(d) === toDateKey(today)) cls += ' today'
          return (
            <div key={i} className={cls}>
              <span className="day-num">{d.getDate()}</span>
              {done && <span style={{ fontSize: '11px' }}>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function YearHeatmap({ anchor, doneDates, t }) {
  const year = anchor.getFullYear()
  return (
    <div className="stat-card">
      {MONTH_KEYS.map((mk, m) => {
        const total = daysInMonth(year, m)
        const dots = []
        for (let day = 1; day <= total; day++) {
          const key = toDateKey(new Date(year, m, day))
          const done = doneDates.has(key)
          const future = isFutureDay(new Date(year, m, day))
          dots.push(<span key={key} className={`dot ${done ? 'done' : future ? 'future' : 'missed'}`} />)
        }
        return (
          <div key={mk} className="year-month-row">
            <span className="month-label">{t(mk)}</span>
            <div className="year-dots">{dots}</div>
          </div>
        )
      })}
    </div>
  )
}
