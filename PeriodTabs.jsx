import { useLang } from '../contexts/LangContext'

const PERIODS = ['calendar', 'week', 'month', 'year']

export default function PeriodTabs({ value, onChange }) {
  const { t } = useLang()
  return (
    <div className="period-tabs">
      {PERIODS.map((p) => (
        <button key={p} className={value === p ? 'active' : ''} onClick={() => onChange(p)}>
          {t(p)}
        </button>
      ))}
    </div>
  )
}
