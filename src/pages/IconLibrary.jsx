import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { readFileAsDataUrl } from '../lib/imageUtils'
import { fetchIconLibrary, createLibraryIcon, updateLibraryIcon, deleteLibraryIcon } from '../lib/iconLibraryApi'
import IconCropEditor from '../components/IconCropEditor'

export default function IconLibrary() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLang()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Adding a brand new icon.
  const [cropSource, setCropSource] = useState(null)

  // Re-cropping / renaming an existing icon.
  const [editingItem, setEditingItem] = useState(null)

  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchIconLibrary(user.uid)
      setItems(data)
    } catch (err) {
      console.error('Failed to load icon library:', err)
      setLoadError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropSource(dataUrl)
    } catch (err) {
      console.error('Could not read file:', err)
    }
  }

  async function handleAddConfirm(dataUrl, name) {
    setCropSource(null)
    if (!name) return
    try {
      const saved = await createLibraryIcon(user.uid, { name, dataUrl })
      setItems((prev) => [saved, ...prev])
    } catch (err) {
      console.error('Failed to save icon:', err)
      window.alert(err.message || String(err))
    }
  }

  async function handleEditConfirm(dataUrl, name) {
    const target = editingItem
    setEditingItem(null)
    if (!target || !name) return
    try {
      await updateLibraryIcon(target.id, { name, dataUrl })
      setItems((prev) => prev.map((it) => (it.id === target.id ? { ...it, name, dataUrl } : it)))
    } catch (err) {
      console.error('Failed to update icon:', err)
      window.alert(err.message || String(err))
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(t('deleteIconConfirm'))) return
    try {
      await deleteLibraryIcon(item.id)
      setItems((prev) => prev.filter((it) => it.id !== item.id))
    } catch (err) {
      console.error('Failed to delete icon:', err)
      window.alert(err.message || String(err))
    }
  }

  function startRename(item) {
    setRenamingId(item.id)
    setRenameValue(item.name)
  }

  async function commitRename(item) {
    const trimmed = renameValue.trim()
    setRenamingId(null)
    if (!trimmed || trimmed === item.name) return
    try {
      await updateLibraryIcon(item.id, { name: trimmed })
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, name: trimmed } : it)))
    } catch (err) {
      console.error('Failed to rename icon:', err)
      window.alert(err.message || String(err))
    }
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 4px' }}>
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('back')}>
            ←
          </button>
          <h1 style={{ fontSize: 'var(--fs-lg)' }}>{t('iconLibrary')}</h1>
          <span style={{ width: 40 }} />
        </div>

        <label className="icon-dropzone icon-dropzone-add" style={{ marginTop: 12 }}>
          <span className="icon-dropzone-empty">
            <span className="icon-dropzone-icon">➕</span>
            <span className="icon-dropzone-text">{t('addIcon')}</span>
            <span className="icon-dropzone-subtext">{t('dragDropHint')}</span>
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>

        {loadError && (
          <div role="alert" className="load-error-banner">
            <strong>Couldn't load your icons.</strong> {loadError}
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-outline" onClick={load}>
                {t('loading')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="center-loading">{t('loading')}</div>
        ) : items.length === 0 ? (
          <p className="icon-search-empty" style={{ marginTop: 16 }}>
            {t('iconLibraryEmpty')}
          </p>
        ) : (
          <div className="icon-library-grid">
            {items.map((item) => (
              <div key={item.id} className="icon-library-card">
                <button
                  type="button"
                  className="icon-library-thumb-btn"
                  onClick={() => setEditingItem(item)}
                  aria-label={t('editIcon')}
                >
                  <img src={item.dataUrl} alt={item.name} className="icon-library-thumb" />
                </button>

                {renamingId === item.id ? (
                  <input
                    type="text"
                    className="icon-library-rename-input"
                    value={renameValue}
                    autoFocus
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                  />
                ) : (
                  <button type="button" className="icon-library-name" onClick={() => startRename(item)}>
                    {item.name}
                  </button>
                )}

                <div className="icon-library-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingItem(item)}>
                    ✏️ {t('editIcon')}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDelete(item)}>
                    🗑️ {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cropSource && (
        <IconCropEditor
          imageUrl={cropSource}
          allowSkip={false}
          onCancel={() => setCropSource(null)}
          onConfirm={handleAddConfirm}
        />
      )}

      {editingItem && (
        <IconCropEditor
          imageUrl={editingItem.dataUrl}
          initialName={editingItem.name}
          allowSkip={false}
          onCancel={() => setEditingItem(null)}
          onConfirm={handleEditConfirm}
        />
      )}
    </div>
  )
}
