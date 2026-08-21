import { useEffect, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'

const FRAME_SIZE = 220 // on-screen crop frame, in CSS px (square)
const OUTPUT_SIZE = 240 // exported image size, in px

// Two steps: crop/zoom the image, then (optionally) name it so it gets
// saved into the person's reusable icon library. `onConfirm(dataUrl, name)`
// is called once — `name` is null if they chose "just use once".
export default function IconCropEditor({ imageUrl, initialName, allowSkip = true, onCancel, onConfirm }) {
  const { t } = useLang()
  const imgElRef = useRef(null)
  const dragRef = useRef(null)
  const [natural, setNatural] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [step, setStep] = useState('crop')
  const [croppedDataUrl, setCroppedDataUrl] = useState(null)
  const [name, setName] = useState(initialName || '')

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) {
        setNatural({ w: img.naturalWidth, h: img.naturalHeight })
        setZoom(1)
        setOffset({ x: 0, y: 0 })
      }
    }
    img.src = imageUrl
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  if (step === 'crop' && !natural) return null

  const coverScale = natural ? Math.max(FRAME_SIZE / natural.w, FRAME_SIZE / natural.h) : 1
  const scale = coverScale * zoom
  const displayW = natural ? natural.w * scale : 0
  const displayH = natural ? natural.h * scale : 0

  function clamp(next, dW, dH) {
    const maxX = Math.max(0, (dW - FRAME_SIZE) / 2)
    const maxY = Math.max(0, (dH - FRAME_SIZE) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    }
  }

  function pointFromEvent(e) {
    return 'touches' in e ? e.touches[0] : e
  }

  function handleDragStart(e) {
    const p = pointFromEvent(e)
    dragRef.current = { startX: p.clientX, startY: p.clientY, origin: offset }
  }

  function handleDragMove(e) {
    if (!dragRef.current) return
    e.preventDefault()
    const p = pointFromEvent(e)
    const dx = p.clientX - dragRef.current.startX
    const dy = p.clientY - dragRef.current.startY
    setOffset(clamp({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }, displayW, displayH))
  }

  function handleDragEnd() {
    dragRef.current = null
  }

  function handleZoomChange(e) {
    const z = Number(e.target.value)
    setZoom(z)
    const newScale = coverScale * z
    setOffset((prev) => clamp(prev, natural.w * newScale, natural.h * newScale))
  }

  function handleCropNext() {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    const drawScale = OUTPUT_SIZE / FRAME_SIZE
    const imgLeft = FRAME_SIZE / 2 + offset.x - displayW / 2
    const imgTop = FRAME_SIZE / 2 + offset.y - displayH / 2
    ctx.drawImage(
      imgElRef.current,
      imgLeft * drawScale,
      imgTop * drawScale,
      displayW * drawScale,
      displayH * drawScale
    )
    setCroppedDataUrl(canvas.toDataURL('image/jpeg', 0.86))
    setStep('name')
  }

  if (step === 'name') {
    return (
      <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); onCancel() }}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">{t('nameIconTitle')}</h2>
          <img src={croppedDataUrl} alt="" className="crop-name-preview" />
          <div className="field">
            <label htmlFor="icon-name">{t('iconName')}</label>
            <input
              id="icon-name"
              type="text"
              placeholder={t('iconNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginBottom: 10 }}
            disabled={!name.trim()}
            onClick={() => onConfirm(croppedDataUrl, name.trim())}
          >
            {t('saveToLibrary')}
          </button>
          {allowSkip && (
            <button type="button" className="btn btn-outline" onClick={() => onConfirm(croppedDataUrl, null)}>
              {t('useOnce')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); onCancel() }}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t('editIconTitle')}</h2>
        <p className="crop-hint">{t('cropHint')}</p>

        <div
          className="crop-frame"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <img
            ref={imgElRef}
            src={imageUrl}
            alt=""
            draggable={false}
            className="crop-frame-img"
            style={{
              width: displayW,
              height: displayH,
              marginLeft: -displayW / 2,
              marginTop: -displayH / 2,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={handleZoomChange}
          className="crop-zoom-slider"
          aria-label={t('zoom')}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleCropNext}>
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  )
}
