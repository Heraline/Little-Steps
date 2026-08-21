import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import { readFileAsDataUrl } from '../lib/imageUtils'
import { fetchIconLibrary, createLibraryIcon } from '../lib/iconLibraryApi'
import { isCustomIconUrl } from './HabitIcon'
import IconCropEditor from './IconCropEditor'

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

const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024 // original file, before client-side compression

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
  const [dragActive, setDragActive] = useState(false)
  const [cropSource, setCropSource] = useState(null) // raw image awaiting crop confirmation
  const [library, setLibrary] = useState([])
  const [iconSearch, setIconSearch] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchIconLibrary(user.uid).then((items) => {
      if (!cancelled) setLibrary(items)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const nameValue = lang === 'zh' ? nameZh : nameEn
  const canSave = nameValue.trim().length > 0 && !saving
  const filteredLibrary = library.filter((item) =>
    item.name.toLowerCase().includes(iconSearch.trim().toLowerCase())
  )

  async function processFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError(t('uploadInvalidType'))
      return
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setUploadError(t('uploadTooLarge'))
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropSource(dataUrl)
    } catch (err) {
      console.error('Icon read failed:', err)
      setUploadError(err.message || String(err))
    } finally {
      setUploading(false)
    }
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    processFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragActive(false)
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

  async function handleCropConfirm(dataUrl, name) {
    setIcon(dataUrl)
    setCropSource(null)
    if (name && user) {
      try {
        const saved = await createLibraryIcon(user.uid, { name, dataUrl })
        setLibrary((prev) => [saved, ...prev])
      } catch (err) {
        console.error('Failed to save icon to library:', err)
      }
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

          <div
            className={'icon-dropzone' + (dragActive ? ' drag-active' : '') + (isCustomIconUrl(icon) ? ' has-preview' : '')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isCustomIconUrl(icon) ? (
              <div className="icon-dropzone-preview">
                <img src={icon} alt="" className="icon-dropzone-thumb" />
                <div className="icon-dropzone-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setCropSource(icon)}>
                    ✏️ {t('editIcon')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIcon(ICON_CATEGORIES[0].icons[0])}
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ) : (
              <label className="icon-dropzone-empty">
                <span className="icon-dropzone-icon">{uploading ? '⏳' : '📤'}</span>
                <span className="icon-dropzone-text">{t('uploadOwnIcon')}</span>
                <span className="icon-dropzone-subtext">{t('dragDropHint')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}

          {library.length > 0 && (
            <div className="icon-category">
              <div className="icon-category-label">{t('myIcons')}</div>
              <input
                type="text"
                className="icon-search-input"
                placeholder={t('searchIcons')}
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
              {filteredLibrary.length === 0 ? (
                <p className="icon-search-empty">{t('noIconsFound')}</p>
              ) : (
                <div className="picker-grid">
                  {filteredLibrary.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={'picker-cell picker-cell-img' + (icon === item.dataUrl ? ' selected' : '')}
                      onClick={() => setIcon(item.dataUrl)}
                      title={item.name}
                    >
                      <img src={item.dataUrl} alt={item.name} className="picker-cell-thumb" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

      {cropSource && (
        <IconCropEditor imageUrl={cropSource} onCancel={() => setCropSource(null)} onConfirm={handleCropConfirm} />
      )}
    </div>
  )
}
