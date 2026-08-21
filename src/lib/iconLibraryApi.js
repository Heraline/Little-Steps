import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseClient'

const libraryCol = collection(db, 'iconLibrary')

function toIcon(docSnap) {
  return { id: docSnap.id, ...docSnap.data() }
}

export async function fetchIconLibrary(userId) {
  const q = query(libraryCol, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(toIcon)
}

export async function createLibraryIcon(userId, { name, dataUrl }) {
  const payload = { userId, name: name.trim(), dataUrl, createdAt: serverTimestamp() }
  const ref = await addDoc(libraryCol, payload)
  return { id: ref.id, ...payload }
}

export async function updateLibraryIcon(iconId, updates) {
  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.dataUrl !== undefined) payload.dataUrl = updates.dataUrl
  await updateDoc(doc(db, 'iconLibrary', iconId), payload)
}

export async function deleteLibraryIcon(iconId) {
  await deleteDoc(doc(db, 'iconLibrary', iconId))
}
