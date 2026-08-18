import { NavLink } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'

// Modern line-style icons (stroke-based, ~Feather/Lucide look) so they
// stay crisp at any size and inherit color via currentColor — no emoji
// font inconsistency across devices.
function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v8.5a1 1 0 0 0 1 1h3.5v-5a1.5 1.5 0 0 1 1.5-1.5v0a1.5 1.5 0 0 1 1.5 1.5v5H17a1 1 0 0 0 1-1V10"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  )
}

function AnalysisIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="13" width="3.6" height="7" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} />
      <rect x="10.2" y="8.5" width="3.6" height="11.5" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} />
      <rect x="16.4" y="4" width="3.6" height="16" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} />
    </svg>
  )
}

function FriendsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth={active ? 2.4 : 2} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path
        d="M3.5 19c0-3 2.46-5 5.5-5s5.5 2 5.5 5"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
      />
      <path
        d="M15.2 6.3a2.7 2.7 0 0 1 0 5.2"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
      />
      <path
        d="M15 14.3c2.5.3 4.5 2.1 4.5 4.7"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
      />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth={active ? 2.4 : 2} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path
        d="M5 19.2c0-3.4 3.13-5.7 7-5.7s7 2.3 7 5.7"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
      />
    </svg>
  )
}

const items = [
  { to: '/', Icon: HomeIcon, key: 'home', end: true },
  { to: '/analysis', Icon: AnalysisIcon, key: 'analysis' },
  { to: '/friends', Icon: FriendsIcon, key: 'friends' },
  { to: '/profile', Icon: ProfileIcon, key: 'profile' },
]

export default function BottomNav() {
  const { t } = useLang()
  return (
    <nav className="bottom-nav">
      {items.map(({ to, Icon, key, end }) => (
        <NavLink
          key={key}
          to={to}
          end={end}
          aria-label={t(key)}
          title={t(key)}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          {({ isActive }) => (
            <span className="nav-icon">
              <Icon active={isActive} />
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
