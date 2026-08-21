import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useLang } from './contexts/LangContext'
import { isFirebaseConfigured } from './firebaseClient'
import Login from './pages/Login'
import Home from './pages/Home'
import Analysis from './pages/Analysis'
import HabitDetail from './pages/HabitDetail'
import Friends from './pages/Friends'
import FriendDashboard from './pages/FriendDashboard'
import Profile from './pages/Profile'
import IconLibrary from './pages/IconLibrary'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const { t } = useLang()
  if (!isFirebaseConfigured) {
    return <div className="config-warning">{t('errorConfig')}</div>
  }
  if (loading) return <div className="center-loading">{t('loading')}</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/analysis"
        element={
          <RequireAuth>
            <Analysis />
          </RequireAuth>
        }
      />
      <Route
        path="/habit/:habitId"
        element={
          <RequireAuth>
            <HabitDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/friends"
        element={
          <RequireAuth>
            <Friends />
          </RequireAuth>
        }
      />
      <Route
        path="/friends/:friendId"
        element={
          <RequireAuth>
            <FriendDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/icons"
        element={
          <RequireAuth>
            <IconLibrary />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
