import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../firebaseClient'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import HabitIcon, { isCustomIconUrl } from './HabitIcon'

const ICON_CATEGORIES = [
  { key: 'catHealth', icons: ['💧', '🥛', '💊', '🛁', '😴', '🪥', '🧴', '🧠', '❤️'] },
  { key: 'catFitness', icons: ['🏃', '🧘', '🏋️', '🚴', '🏊', '⚽', '🚶', '🎯'] },
  { key: 'catDiet', icons: ['☕', '🍎', '🥦', '🍳', '🥗', '🍵'] },
  { key: 'catHobby', icons: ['📖', '🎨', '🎧', '🎹', '🎸', '📷', '✂️', '🎮', '🧵'] },
  { key: 'catWork', icons: ['💰', '📝', '💻', '📞', '🎓'] },
  { key: 'catHome', icons: ['🧹', '🚭', '🧦', '🧼', '🪴'] },
  { key: 'catOther', icons: ['⏰', '🌞', '🌳', '🐕', '🙏', '🚗', '✈️', '🌟'] },
]
const COLORS = ['#6FA88F', '#FF7A6B', '#F2A65A', '#A8A4D9', '#5BA3D0', '#E27DBF', '#8FBF6F', '#D9534F']

export const REMINDER_TIMES = [
  { key: 'anytime', icon: '🕐' },
  { key: 'morning', icon: '🌤️' },
  { key: 'noon', icon: '☀️' },
  { key: 'evening', icon: '🌆' },
  { key: 'night', icon: '🌙' },
]

const MAX_ICON_BYTES = 2 * 1024 * 1024

export default function AddHabitModal({ onClose, onSave, habit }) {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const isEdit = Boolean(habit)
  const [nameZh, setNameZh] = useState(habit?.nameZh || '')
  const [nameEn, setNameEn] = useState(habit?.nameEn || '')
  const [icon, setIcon] = useState(habit?.icon || ICON_CATEGORIES[0].icons[0])
  const [color, setColor] = useState(habit?.color || COLORS[0])
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily')
  const [timesPerWeek, setTimesPerWeek] = useState(
    habit?.frequency === 'weekly' ? habit.timesPerPeriod || 3 : 3
  )
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime || 'anytime')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const nameValue = lang === 'zh' ? nameZh : nameEn
  const canSave = nameValue.trim().length > 0 && !saving

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setUploadError(t('uploadInvalidType'))
      return
    }
    if (file.size > MAX_ICON_BYTES) {
      setUploadError(t('uploadTooLarge'))
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const path = `habitIcons/${user.uid}/${Date.now()}-${safeName}`
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      setIcon(url)
    } catch (err) {
      console.error('Icon upload failed:', err)
      setUploadError(err.message || String(err))
    } finally {
      setUploading(false)
    }
  }

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
        reminderTime,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEdit ? t('editHabit') : t('addHabit')}</h2>


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

          <div className="icon-upload-row">
            <label className={'reminder-cell upload-cell' + (isCustomIconUrl(icon) ? ' selected' : '')}>
              {uploading ? (
                <span className="reminder-cell-icon">⏳</span>
              ) : (
                <HabitIcon icon={isCustomIconUrl(icon) ? icon : '📤'} imgSize="70%" className="reminder-cell-icon" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <span className="icon-upload-hint">{t('uploadOwnIcon')}</span>
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}

          {ICON_CATEGORIES.map((cat) => (
            <div key={cat.key} className="icon-category">
              <div className="icon-category-label">{t(cat.key)}</div>
              <div className="picker-grid">
                {cat.icons.map((ic) => (
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
          ))}
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

        <div className="field">
          <label>{t('reminderTime')}</label>
          <div className="reminder-grid">
            {REMINDER_TIMES.map((rt) => (
              <button
                key={rt.key}
                type="button"
                className={'reminder-cell' + (reminderTime === rt.key ? ' selected' : '')}
                onClick={() => setReminderTime(rt.key)}
              >
                <span className="reminder-cell-icon">{rt.icon}</span>
                <span className="reminder-cell-label">{t(rt.key)}</span>
              </button>
            ))}
          </div>
        </div>

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
