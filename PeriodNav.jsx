export default function PeriodNav({ label, onPrev, onNext, nextDisabled }) {
  return (
    <div className="period-nav">
      <button onClick={onPrev} aria-label="previous">‹</button>
      <span className="period-label">{label}</span>
      <button onClick={onNext} disabled={nextDisabled} aria-label="next">›</button>
    </div>
  )
}
