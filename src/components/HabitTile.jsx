import { useLang } from '../contexts/LangContext'

export default function HabitTile({ habit, done, streak, readOnly, onToggle, onOpen, onMenu }) {
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
      {!readOnly && onMenu && (
        <span
          className="tile-menu-btn"
          role="button"
          tabIndex={0}
          aria-label="menu"
          onClick={(e) => {
            e.stopPropagation()
            onMenu(habit)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              e.preventDefault()
              onMenu(habit)
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="5.5" r="1.8" fill="currentColor" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            <circle cx="12" cy="18.5" r="1.8" fill="currentColor" />
          </svg>
        </span>
      )}
      {done && <span className="tile-check">✓</span>}
      <span className="tile-icon">{habit.icon}</span>
      <span className="tile-name">{name}</span>
      {streak > 0 && <span className="tile-streak">🔥{streak}</span>}
    </button>
  )
}
