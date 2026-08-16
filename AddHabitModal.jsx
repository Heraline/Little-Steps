import { useState } from 'react'
import { useLang } from '../contexts/LangContext'

const ICONS = ['💧', '🥛', '🏃', '☕', '🧘', '💰', '📖', '🎨', '🍎', '🥦', '💊', '⏰', '🛁', '😴', '📝', '🚭', '🚶', '🧹']
const COLORS = ['#6FA88F', '#FF7A6B', '#F2A65A', '#A8A4D9', '#5BA3D0', '#E27DBF', '#8FBF6F', '#D9534F']

export default function AddHabitModal({ onClose, onSave }) {
  const { t, lang } = useLang()
  const [nameZh, setNameZh] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [frequency, setFrequency] = useState('daily')
  const [timesPerWeek, setTimesPerWeek] = useState(3)
  const [saving, setSaving] = useState(false)

  const nameValue = lang === 'zh' ? nameZh : nameEn
  const canSave = nameValue.trim().length > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        nameZh: (nameZh || nameEn).trim(),
        nameEn: (nameEn || nameZh).trim(),
        icon,
        color,
        frequency,
        timesPerPeriod: frequency === 'weekly' ? timesPerWeek : 1,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t('addHabit')}</h2>

        <div className="field">
          <label htmlFor="habit-name">{t('addHabit')}</label>
          <input
            id="habit-name"
            type="text"
            placeholder={t('habitNamePlaceholder')}
            value={nameValue}
            onChange={(e) => (lang === 'zh' ? setNameZh(e.target.value) : setNameEn(e.target.value))}
            autoFocus
          />
        </div>

        <div className="field">
          <label>{t('chooseIcon')}</label>
          <div className="picker-grid">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={'picker-cell' + (icon === ic ? ' selected' : '')}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('chooseColor')}</label>
          <div className="picker-grid">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={'color-cell' + (color === c ? ' selected' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('frequency')}</label>
          <div className="segmented">
            <button className={frequency === 'daily' ? 'active' : ''} onClick={() => setFrequency('daily')}>
              {t('daily')}
            </button>
            <button className={frequency === 'weekly' ? 'active' : ''} onClick={() => setFrequency('weekly')}>
              {t('weekly')}
            </button>
          </div>
        </div>

        {frequency === 'weekly' && (
          <div className="field">
            <label htmlFor="times-week">{t('timesPerWeek')}</label>
            <input
              id="times-week"
              type="number"
              min="1"
              max="7"
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(Number(e.target.value))}
            />
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSave} disabled={!canSave} style={{ marginBottom: 10 }}>
          {saving ? t('loading') : t('save')}
        </button>
        <button className="btn btn-outline" onClick={onClose}>
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
