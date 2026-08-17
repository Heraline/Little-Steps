import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import {
  fetchFriendships,
  findProfileByUsername,
  sendFriendRequest,
  respondToRequest,
  removeFriendship,
} from '../lib/friendApi'
import BottomNav from '../components/BottomNav'

export default function Friends() {
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [friendships, setFriendships] = useState([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const data = await fetchFriendships(user.uid)
    setFriendships(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Each edge is { id: otherUid, status, direction, otherProfile }
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const incoming = friendships.filter((f) => f.status === 'pending' && f.direction === 'incoming')
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.direction === 'outgoing')

  async function handleAdd() {
    setMessage('')
    if (!username.trim()) return
    setBusy(true)
    try {
      const profile = await findProfileByUsername(username)
      if (!profile) {
        setMessage(t('errorGeneric'))
        return
      }
      if (profile.id === user.uid) {
        setMessage(t('errorGeneric'))
        return
      }
      const already = friendships.some((f) => f.id === profile.id)
      if (already) {
        setMessage(t('errorGeneric'))
        return
      }
      await sendFriendRequest(user.uid, profile.id)
      setUsername('')
      load()
    } catch {
      setMessage(t('errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRespond(edge, accept) {
    await respondToRequest(user.uid, edge.id, accept)
    load()
  }

  async function handleRemove(edge) {
    await removeFriendship(user.uid, edge.id)
    load()
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar" style={{ padding: '0 0 12px' }}>
          <h1>{t('friends')}</h1>
        </div>

        <div className="stat-card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="add-friend">{t('addFriend')}</label>
            <input
              id="add-friend"
              type="text"
              placeholder={t('addFriendPlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {message && <div className="auth-error">{message}</div>}
          <button className="btn btn-primary" onClick={handleAdd} disabled={busy}>
            {t('sendRequest')}
          </button>
        </div>

        {incoming.length > 0 && (
          <>
            <div className="section-title">{t('pendingRequests')}</div>
            {incoming.map((f) => {
              const p = f.otherProfile
              return (
                <div className="friend-card" key={f.id}>
                  <span className="friend-avatar">{p?.emoji || '🙂'}</span>
                  <div className="friend-info">
                    <div className="friend-name">{p?.displayName || p?.username}</div>
                    <div className="friend-username">@{p?.username}</div>
                  </div>
                  <button className="chip-btn chip-accept" onClick={() => handleRespond(f, true)}>
                    {t('accept')}
                  </button>
                  <button className="chip-btn chip-decline" onClick={() => handleRespond(f, false)}>
                    {t('decline')}
                  </button>
                </div>
              )
            })}
          </>
        )}

        <div className="section-title">{t('myFriends')}</div>
        {!loading && accepted.length === 0 && outgoing.length === 0 && (
          <div className="empty-state">
            <span className="empty-emoji">🧑‍🤝‍🧑</span>
            <h3>{t('noFriendsYet')}</h3>
            <p>{t('noFriendsHint')}</p>
          </div>
        )}
        {accepted.map((f) => {
          const p = f.otherProfile
          return (
            <div
              className="friend-card"
              key={f.id}
              role="button"
              onClick={() =>
                navigate(`/friends/${f.id}`, { state: { name: p?.displayName || p?.username, emoji: p?.emoji } })
              }
            >
              <span className="friend-avatar">{p?.emoji || '🙂'}</span>
              <div className="friend-info">
                <div className="friend-name">{p?.displayName || p?.username}</div>
                <div className="friend-username">@{p?.username}</div>
              </div>
              <button
                className="chip-btn chip-decline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(f)
                }}
              >
                {t('remove')}
              </button>
            </div>
          )
        })}
        {outgoing.map((f) => {
          const p = f.otherProfile
          return (
            <div className="friend-card" key={f.id} style={{ opacity: 0.6 }}>
              <span className="friend-avatar">{p?.emoji || '🙂'}</span>
              <div className="friend-info">
                <div className="friend-name">{p?.displayName || p?.username}</div>
                <div className="friend-username">@{p?.username}</div>
              </div>
              <span className="friend-username">…</span>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
