import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { fetchHabits, fetchLogsInRange, computeCurrentStreak } from '../lib/habitApi'
import { addDays, toDateKey, todayKey } from '../lib/dateUtils'
import HabitGrid from '../components/HabitGrid'
import AnalysisView from '../components/AnalysisView'
import BottomNav from '../components/BottomNav'

export default function FriendDashboard() {
  const { friendId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLang()
  const friendMeta = location.state || {}

  const [tab, setTab] = useState('today')
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const start = toDateKey(addDays(new Date(), -60))
    const end = todayKey()
    const [habitsData, logsData] = await Promise.all([
      fetchHabits(friendId),
      fetchLogsInRange(friendId, start, end),
    ])
    setHabits(habitsData)
    setLogs(logsData)
    setLoading(false)
  }, [friendId])

  useEffect(() => {
    load()
  }, [load])

  const doneMap = useMemo(() => {
    const today = todayKey()
    const map = {}
    for (const log of logs) if (log.logDate === today) map[log.habitId] = true
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

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 12px' }}>
          <button className="icon-btn" onClick={() => navigate('/friends')} aria-label={t('back')}>
            ←
          </button>
          <h1 style={{ fontSize: 'var(--fs-lg)' }}>
            {friendMeta.emoji || '🙂'} {friendMeta.name || t('viewingAs')}
          </h1>
          <span style={{ width: 56 }} />
        </div>

        <div className="segmented" style={{ marginBottom: 16 }}>
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
            {t('today')}
          </button>
          <button className={tab === 'analysis' ? 'active' : ''} onClick={() => setTab('analysis')}>
            {t('analysis')}
          </button>
        </div>

        {tab === 'today' &&
          (loading ? (
            <div className="center-loading">{t('loading')}</div>
          ) : (
            <HabitGrid habits={habits} doneMap={doneMap} streakMap={streakMap} readOnly onOpenHabit={(h) => navigate(`/habit/${h.id}`, { state: { readOnly: true } })} />
          ))}

        {tab === 'analysis' && (
          <AnalysisView
            userId={friendId}
            readOnly
            onHabitClick={(h) => navigate(`/habit/${h.id}`, { state: { readOnly: true } })}
          />
        )}
      </div>
      <BottomNav />
    </div>
  )
}
