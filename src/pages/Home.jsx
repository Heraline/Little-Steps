import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import {
  fetchHabits,
  fetchLogsInRange,
  toggleHabitOnDate,
  createHabit,
  updateHabit,
  deleteHabit,
  computeCurrentStreak,
} from '../lib/habitApi'
import { addDays, toDateKey, todayKey, startOfWeek, isFutureDay, MONTH_KEYS } from '../lib/dateUtils'
import { REMINDER_TIMES } from '../components/AddHabitModal'
import HabitGrid from '../components/HabitGrid'
import AddHabitModal from '../components/AddHabitModal'
import HabitActionSheet from '../components/HabitActionSheet'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const { user } = useAuth()
  const { t } = useLang()

  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [menuHabit, setMenuHabit] = useState(null)
  const [editHabit, setEditHabit] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const selectedKey = toDateKey(selectedDate)
  const isToday = selectedKey === todayKey()
  const canToggle = !isFutureDay(selectedDate)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const start = toDateKey(addDays(new Date(), -120))
      const end = toDateKey(addDays(new Date(), 7))
      const [habitsData, logsData] = await Promise.all([
        fetchHabits(user.uid),
        fetchLogsInRange(user.uid, start, end),
      ])
      setHabits(habitsData)
      setLogs(logsData)
    } catch (err) {
      // Most commonly this is a missing Firestore composite index — the
      // error message from Firebase includes a direct link that creates
      // it for you in one click. See firebase/firestore.indexes.json.
      console.error('Failed to load habits:', err)
      setLoadError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const doneMap = useMemo(() => {
    const map = {}
    for (const log of logs) {
      if (log.logDate === selectedKey) map[log.habitId] = true
    }
    return map
  }, [logs, selectedKey])

  const streakMap = useMemo(() => {
    const byHabit = {}
    for (const log of logs) {
      if (!byHabit[log.habitId]) byHabit[log.habitId] = new Set()
      byHabit[log.habitId].add(log.logDate)
    }
    const map = {}
    for (const h of habits) map[h.id] = computeCurrentStreak(byHabit[h.id] || new Set())
    return map
  }, [logs, habits])

  async function handleToggle(habit) {
    if (!canToggle) return
    const existing = logs.find((l) => l.habitId === habit.id && l.logDate === selectedKey)
    // optimistic update
    setLogs((prev) =>
      existing
        ? prev.filter((l) => l.id !== existing.id)
        : [...prev, { id: 'temp', habitId: habit.id, logDate: selectedKey }]
    )
    try {
      await toggleHabitOnDate(habit, user.uid, selectedKey, existing)
    } catch {
      load()
    }
  }

  async function handleSaveHabit(payload) {
    await createHabit(user.uid, payload)
    setShowAdd(false)
    load()
  }

  async function handleUpdateHabit(payload) {
    if (!editHabit) return
    await updateHabit(editHabit.id, payload)
    setEditHabit(null)
    load()
  }

  async function handleDeleteHabit(habit) {
    if (!window.confirm(t('deleteHabitConfirm'))) return
    setDeleting(true)
    try {
      await deleteHabit(habit.id, user.uid)
      setMenuHabit(null)
      load()
    } catch (err) {
      console.error('Failed to delete habit:', err)
      window.alert(err.message || String(err))
    } finally {
      setDeleting(false)
    }
  }

  // Group habits into time-of-day sections, in the fixed order defined by
  // REMINDER_TIMES. Habits saved before this field existed default to
  // 'anytime'.
  const groups = useMemo(() => {
    const byKey = {}
    for (const h of habits) {
      const key = REMINDER_TIMES.some((rt) => rt.key === h.reminderTime) ? h.reminderTime : 'anytime'
      if (!byKey[key]) byKey[key] = []
      byKey[key].push(h)
    }
    return REMINDER_TIMES.map((rt) => ({ ...rt, habits: byKey[rt.key] || [] })).filter((g) => g.habits.length > 0)
  }, [habits])

  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthAbbrev = t(MONTH_KEYS[selectedDate.getMonth()])

  return (
    <div className="app-shell">
      <div className="home-banner">
        <div className="home-banner-decor" aria-hidden="true">
          🌳🌲🌸🌴🌵
        </div>
        <div className="home-banner-top">
          <h1>{t('appName')}</h1>
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label={t('addHabit')}>
            ＋
          </button>
        </div>
        <div className="home-banner-tagline">{t('tagline')}</div>
      </div>

      <div className="day-strip">
        <button
          className="day-strip-nav"
          onClick={() => setSelectedDate((d) => addDays(d, -7))}
          aria-label={t('prev')}
        >
          ‹
        </button>
        <span className="day-strip-month">{monthAbbrev}</span>
        <div className="day-strip-days">
          {weekDays.map((d) => {
            const key = toDateKey(d)
            const active = key === selectedKey
            const today = key === todayKey()
            return (
              <button
                key={key}
                className={'day-strip-cell' + (active ? ' active' : '') + (today && !active ? ' is-today' : '')}
                onClick={() => setSelectedDate(d)}
              >
                <span className="day-strip-dow">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span className="day-strip-num">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
        <button
          className="day-strip-nav"
          onClick={() => setSelectedDate((d) => addDays(d, 7))}
          aria-label={t('next')}
        >
          ›
        </button>
      </div>

      <div className="screen" style={{ paddingTop: 4 }}>
        {!isToday && (
          <button className="chip-back-today" onClick={() => setSelectedDate(new Date())}>
            ← {t('today')}
          </button>
        )}

        {loadError && (
          <div role="alert" className="load-error-banner">
            <strong>Couldn't load your habits.</strong> {loadError}
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-outline" onClick={load}>
                {t('loading') === 'Loading…' ? 'Try again' : t('loading')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="center-loading">{t('loading')}</div>
        ) : habits.length === 0 ? (
          <HabitGrid
            habits={[]}
            doneMap={{}}
            streakMap={{}}
            readOnly={false}
            onToggle={handleToggle}
            onMenu={(habit) => setMenuHabit(habit)}
          />
        ) : (
          groups.map((g) => (
            <div key={g.key} className="habit-section">
              <div className="habit-section-header">
                <span className="habit-section-icon">{g.icon}</span>
                <h2>{t(g.key)}</h2>
              </div>
              <HabitGrid
                habits={g.habits}
                doneMap={doneMap}
                streakMap={streakMap}
                readOnly={false}
                onToggle={handleToggle}
                onMenu={(habit) => setMenuHabit(habit)}
              />
            </div>
          ))
        )}
      </div>

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onSave={handleSaveHabit} />}

      {editHabit && (
        <AddHabitModal habit={editHabit} onClose={() => setEditHabit(null)} onSave={handleUpdateHabit} />
      )}

      {menuHabit && (
        <HabitActionSheet
          habit={menuHabit}
          onClose={() => (deleting ? null : setMenuHabit(null))}
          onEdit={(habit) => {
            setMenuHabit(null)
            setEditHabit(habit)
          }}
          onDelete={handleDeleteHabit}
        />
      )}

      <BottomNav />
    </div>
  )
}
