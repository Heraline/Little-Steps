import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { profile, signOut } = useAuth()
  const { lang, setLang, fontSize, setFontSize, t } = useLang()

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 4px' }}>
          <h1>{t('profile')}</h1>
        </div>

        <div className="profile-header">
          <span className="profile-avatar">{profile?.emoji || '🙂'}</span>
          <div>
            <div className="profile-name">{profile?.displayName || profile?.username}</div>
            <div className="profile-username">@{profile?.username}</div>
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">{t('language')}</span>
          <div className="segmented">
            <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')}>
              中文
            </button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">{t('fontSize')}</span>
          <div className="segmented">
            <button className={fontSize === 'small' ? 'active' : ''} onClick={() => setFontSize('small')}>
              {t('small')}
            </button>
            <button className={fontSize === 'medium' ? 'active' : ''} onClick={() => setFontSize('medium')}>
              {t('medium')}
            </button>
            <button className={fontSize === 'large' ? 'active' : ''} onClick={() => setFontSize('large')}>
              {t('large')}
            </button>
          </div>
        </div>

        <button className="btn btn-danger" onClick={signOut} style={{ marginTop: 20 }}>
          {t('signOut')}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
