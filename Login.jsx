import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebaseClient'
import { useLang } from '../contexts/LangContext'

export default function Login() {
  const { t, lang, setLang } = useLang()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isFirebaseConfigured) {
    return (
      <div className="app-shell">
        <div className="config-warning">{t('errorConfig')}</div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const usernameLower = username.trim().toLowerCase()
        if (!usernameLower) throw new Error('username required')

        // Usernames are unique — the lowercase username IS the document id,
        // so this existence check also doubles as the uniqueness guard.
        const takenSnap = await getDoc(doc(db, 'usernames', usernameLower))
        if (takenSnap.exists()) {
          setError(t('signUpError'))
          setBusy(false)
          return
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password)
        const uid = cred.user.uid

        const batch = writeBatch(db)
        batch.set(doc(db, 'users', uid), {
          username: username.trim(),
          displayName: (displayName || username).trim(),
          emoji: '🌱',
          createdAt: serverTimestamp(),
        })
        batch.set(doc(db, 'usernames', usernameLower), { uid })
        await batch.commit()
      }
    } catch (err) {
      setError(mode === 'signin' ? t('signInError') : t('signUpError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="screen" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
          <div className="segmented" style={{ width: 140 }}>
            <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')}>
              中
            </button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
              EN
            </button>
          </div>
        </div>

        <div className="auth-hero">
          <span className="auth-emoji">👣</span>
          <h1>{t('appName')}</h1>
          <p>{t('tagline')}</p>
        </div>

        <div className="auth-card">
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="field">
                  <label htmlFor="username">{t('username')}</label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trim())}
                  />
                </div>
                <div className="field">
                  <label htmlFor="displayName">{t('displayName')}</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="email">{t('email')}</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">{t('password')}</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t('loading') : mode === 'signin' ? t('signIn') : t('signUp')}
            </button>
          </form>
          <button className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? t('noAccount') : t('haveAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}
