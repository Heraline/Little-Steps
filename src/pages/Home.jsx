import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { fetchHabits, fetchLogsInRange, toggleHabitToday, createHabit, computeCurrentStreak } from '../lib/habitApi'
import { addDays, toDateKey, todayKey } from '../lib/dateUtils'
import HabitGrid from '../components/HabitGrid'
import AddHabitModal from '../components/AddHabitModal'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const { user } = useAuth()
  const { t } = useLang()

  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const start = toDateKey(addDays(new Date(), -60))
      const end = todayKey()
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
    const today = todayKey()
    const map = {}
    for (const log of logs) {
      if (log.logDate === today) map[log.habitId] = true
    }
    return map
  }, [logs])

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
    const today = todayKey()
    const existing = logs.find((l) => l.habitId === habit.id && l.logDate === today)
    // optimistic update
    setLogs((prev) =>
      existing ? prev.filter((l) => l.id !== existing.id) : [...prev, { id: 'temp', habitId: habit.id, logDate: today }]
    )
    try {
      await toggleHabitToday(habit, user.uid, existing)
    } catch {
      load()
    }
  }

  async function handleSaveHabit(payload) {
    await createHabit(user.uid, payload)
    setShowAdd(false)
    load()
  }

  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 4px' }}>
          <div>
            <h1>{t('appName')}</h1>
            <div style={{ color: 'var(--ink-soft)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>{dateStr}</div>
          </div>
          <button className="icon-btn" onClick={() => setShowAdd(true)} aria-label={t('addHabit')}>
            ＋
          </button>
        </div>

        {loadError && (
          <div
            role="alert"
            style={{
              background: '#FDEDEC',
              border: '1px solid #D9534F',
              color: '#8a2e28',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              margin: '8px 0',
              fontSize: 'var(--fs-sm)',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
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
        ) : (
          <HabitGrid
            habits={habits}
            doneMap={doneMap}
            streakMap={streakMap}
            readOnly={false}
            onToggle={handleToggle}
            onAdd={() => setShowAdd(true)}
          />
        )}
      </div>

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onSave={handleSaveHabit} />}

      <BottomNav />
    </div>
  )
}
