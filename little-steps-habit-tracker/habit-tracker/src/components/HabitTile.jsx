import { useLang } from '../contexts/LangContext'

export default function HabitTile({ habit, done, streak, readOnly, onToggle, onOpen }) {
  const { lang } = useLang()
  const name = lang === 'zh' ? habit.nameZh : habit.nameEn

  return (
    <button
      type="button"
      className={'habit-tile' + (done ? ' done' : '')}
      style={{ borderColor: done ? undefined : habit.color + '55' }}
      onClick={() => (readOnly ? onOpen?.(habit) : onToggle?.(habit))}
      aria-pressed={done}
      aria-label={name}
    >
      {done && <span className="tile-check">✓</span>}
      <span className="tile-icon">{habit.icon}</span>
      <span className="tile-name">{name}</span>
      {streak > 0 && <span className="tile-streak">🔥{streak}</span>}
    </button>
  )
}
