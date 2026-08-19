import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { fetchHabit, fetchAllLogsForHabit, deleteHabit, computeCurrentStreak } from '../lib/habitApi'
import { toDateKey, startOfWeek, addDays, getMonthDays, daysInMonth, isFutureDay, MONTH_KEYS, WEEKDAY_KEYS } from '../lib/dateUtils'
import { getWeekDots, getMonthDots, getYearMonthDots } from '../lib/habitStats'
import HabitIcon from '../components/HabitIcon'
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
    if (!user) return
    async function load() {
      setLoading(true)
      const habitRow = await fetchHabit(habitId)
      setHabit(habitRow)
      if (habitRow) {
        // Filter by the habit's actual owner, not the viewer — this page
        // is also used read-only to view a friend's habit, where those
        // are different people. The Firestore rule allows either the
        // owner or an accepted friend of the owner to read.
        const logs = await fetchAllLogsForHabit(habitId, habitRow.userId)
        setDoneDates(new Set(logs.map((l) => l.logDate)))
      }
      setLoading(false)
    }
    load()
  }, [habitId, user])

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
    await deleteHabit(habitId, user.uid)
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
        <span style={{ width: 40 }} />
        {isOwner ? (
          <button className="icon-btn" onClick={handleDelete} aria-label={t('delete')}>
            🗑️
          </button>
        ) : (
          <span style={{ width: 40 }} />
        )}
      </div>

      <div className="habit-detail-header">
        <div className="habit-detail-badge" style={{ background: habit.color + '26' }}>
          <HabitIcon icon={habit.icon} imgSize="70%" />
        </div>
        <h1 className="habit-detail-name">{name}</h1>
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

      {period === 'calendar' && <MonthCalendar anchor={anchor} doneDates={doneDates} t={t} />}
      {period === 'week' && <PeriodDotCard period="week" anchor={anchor} doneDates={doneDates} t={t} />}
      {period === 'month' && <PeriodDotCard period="month" anchor={anchor} doneDates={doneDates} t={t} />}
      {period === 'year' && <YearHeatmap anchor={anchor} doneDates={doneDates} t={t} />}
    </div>
  )
}

// Week / month view — identical dot-row logic and coloring to the
// all-habits Analysis list (see habitStats.js), just rendered full-size
// with a header stat block since this page covers a single habit.
function PeriodDotCard({ period, anchor, doneDates, t }) {
  const { dots, count, total } =
    period === 'week' ? getWeekDots(anchor, doneDates) : getMonthDots(anchor, doneDates)
  const pct = total ? Math.round((count / total) * 100) : 0
  const titleKey = period === 'week' ? 'weeklyCompletedDays' : 'monthlyCompletedDays'

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-header-title">
          <span className="stat-card-header-icon">{period === 'week' ? '📆' : '📅'}</span>
          {t(titleKey)}
        </span>
        <span className="stat-card-header-value">
          {count}
          {t('days')} - {pct}%
        </span>
      </div>

      <div className="dot-row-large">
        {dots.map((d) => (
          <span key={d.key} className={`dot dot-lg ${d.state}`} />
        ))}
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot done" />
          {t('done')}
        </span>
        <span className="legend-item">
          <span className="legend-dot missed" />
          {t('notDone')}
        </span>
        <span className="legend-item">
          <span className="legend-dot future" />
          {t('upcoming')}
        </span>
      </div>
    </div>
  )
}

function MonthCalendar({ anchor, doneDates, t }) {
  const days = getMonthDays(anchor.getFullYear(), anchor.getMonth())
  const today = new Date()

  const validDays = days.filter((d) => d && !isFutureDay(d))
  const doneCount = validDays.filter((d) => doneDates.has(toDateKey(d))).length
  const pct = validDays.length ? Math.round((doneCount / validDays.length) * 100) : 0

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-header-title">
          <span className="stat-card-header-icon">📅</span>
          {t('calendar')}
        </span>
        <span className="stat-card-header-value">
          {doneCount}
          {t('days')} - {pct}%
        </span>
      </div>

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
          const isToday = toDateKey(d) === toDateKey(today)
          let cls = 'day-pill'
          if (done) cls += ' done'
          else if (future) cls += ' future'
          else cls += ' missed'
          if (isToday) cls += ' today'
          return (
            <div key={i} className="day-cell-wrap">
              <span className={cls}>{isToday ? t('todayAbbrev') : d.getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot done" />
          {t('done')}
        </span>
        <span className="legend-item">
          <span className="legend-dot missed" />
          {t('notDone')}
        </span>
        <span className="legend-item">
          <span className="legend-dot future" />
          {t('upcoming')}
        </span>
      </div>
    </div>
  )
}

function YearHeatmap({ anchor, doneDates, t }) {
  const year = anchor.getFullYear()

  let yearDone = 0
  let yearValid = 0

  const rows = MONTH_KEYS.map((mk, m) => {
    const total = daysInMonth(year, m)
    const dots = []
    for (let day = 1; day <= total; day++) {
      const date = new Date(year, m, day)
      const key = toDateKey(date)
      const done = doneDates.has(key)
      const future = isFutureDay(date)
      if (!future) {
        yearValid += 1
        if (done) yearDone += 1
      }
      dots.push(<span key={key} className={`dot ${done ? 'done' : future ? 'future' : 'missed'}`} />)
    }
    return (
      <div key={mk} className="year-month-row">
        <span className="month-label">{t(mk)}</span>
        <div className="year-dots">{dots}</div>
      </div>
    )
  })

  const pct = yearValid ? Math.round((yearDone / yearValid) * 100) : 0

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-header-title">
          <span className="stat-card-header-icon">🗓️</span>
          {t('yearlyCompletedDays')}
        </span>
        <span className="stat-card-header-value">
          {yearDone}
          {t('days')} - {pct}%
        </span>
      </div>
      {rows}
    </div>
  )
}
