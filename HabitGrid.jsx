import HabitTile from './HabitTile'
import { useLang } from '../contexts/LangContext'

export default function HabitGrid({ habits, doneMap, streakMap, readOnly, onToggle, onAdd, onOpenHabit }) {
  const { t } = useLang()

  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">🌱</span>
        <h3>{t('noHabitsYet')}</h3>
        {!readOnly && <p>{t('noHabitsHint')}</p>}
      </div>
    )
  }

  return (
    <div className="habit-grid">
      {habits.map((h) => (
        <HabitTile
          key={h.id}
          habit={h}
          done={Boolean(doneMap[h.id])}
          streak={streakMap[h.id] || 0}
          readOnly={readOnly}
          onToggle={onToggle}
          onOpen={onOpenHabit}
        />
      ))}
      {!readOnly && (
        <button type="button" className="habit-tile add-tile" onClick={onAdd} aria-label={t('addHabit')}>
          <span className="tile-icon">＋</span>
          <span className="tile-name">{t('addHabit')}</span>
        </button>
      )}
    </div>
  )
}
