import { NavLink } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

const items = [
  { to: '/', icon: '🏠', key: 'home', end: true },
  { to: '/analysis', icon: '📊', key: 'analysis' },
  { to: '/friends', icon: '🧑‍🤝‍🧑', key: 'friends' },
  { to: '/profile', icon: '👤', key: 'profile' },
]

export default function BottomNav() {
  const { t } = useLang()
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end={item.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
