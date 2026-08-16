import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import AnalysisView from '../components/AnalysisView'
import BottomNav from '../components/BottomNav'

export default function Analysis() {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 12px' }}>
          <h1>{t('analysis')}</h1>
        </div>
        {user && (
          <AnalysisView userId={user.uid} readOnly={false} onHabitClick={(h) => navigate(`/habit/${h.id}`)} />
        )}
      </div>
      <BottomNav />
    </div>
  )
}
