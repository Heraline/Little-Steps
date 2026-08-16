import { collection, doc, getDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseClient'

function usernameKey(username) {
  return username.trim().toLowerCase()
}

// Each user keeps a "friends" subcollection: users/{uid}/friends/{otherUid}.
// A request writes a mirrored doc on both sides at once, so reading "my"
// friends never needs to query anyone else's data.
export async function findProfileByUsername(username) {
  const key = usernameKey(username)
  if (!key) return null
  const nameSnap = await getDoc(doc(db, 'usernames', key))
  if (!nameSnap.exists()) return null
  const uid = nameSnap.data().uid
  const profileSnap = await getDoc(doc(db, 'users', uid))
  if (!profileSnap.exists()) return null
  return { id: uid, ...profileSnap.data() }
}

export async function fetchFriendships(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'friends'))
  const edges = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const profiles = await Promise.all(
    edges.map(async (edge) => {
      const pSnap = await getDoc(doc(db, 'users', edge.id))
      return pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } : { id: edge.id, username: '', displayName: '' }
    })
  )
  return edges.map((edge, i) => ({ ...edge, otherProfile: profiles[i] }))
}

export async function sendFriendRequest(myUid, otherUid) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', myUid, 'friends', otherUid), {
    status: 'pending',
    direction: 'outgoing',
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'users', otherUid, 'friends', myUid), {
    status: 'pending',
    direction: 'incoming',
    createdAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function respondToRequest(myUid, otherUid, accept) {
  const batch = writeBatch(db)
  const mine = doc(db, 'users', myUid, 'friends', otherUid)
  const theirs = doc(db, 'users', otherUid, 'friends', myUid)
  if (accept) {
    batch.update(mine, { status: 'accepted' })
    batch.update(theirs, { status: 'accepted' })
  } else {
    batch.delete(mine)
    batch.delete(theirs)
  }
  await batch.commit()
}

export async function removeFriendship(myUid, otherUid) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'users', myUid, 'friends', otherUid))
  batch.delete(doc(db, 'users', otherUid, 'friends', myUid))
  await batch.commit()
}
