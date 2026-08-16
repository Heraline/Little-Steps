import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebaseClient'
import { todayKey } from './dateUtils'

const habitsCol = collection(db, 'habits')
const logsCol = collection(db, 'habitLogs')

function logDocId(habitId, logDate) {
  return `${habitId}_${logDate}`
}

function toHabit(d) {
  return { id: d.id, ...d.data() }
}

function toLog(d) {
  return { id: d.id, ...d.data() }
}

export async function fetchHabits(userId) {
  const q = query(
    habitsCol,
    where('userId', '==', userId),
    where('archived', '==', false),
    orderBy('createdAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(toHabit)
}

export async function fetchHabit(habitId) {
  const snap = await getDoc(doc(db, 'habits', habitId))
  return snap.exists() ? toHabit(snap) : null
}

export async function fetchLogsInRange(userId, startKey, endKey) {
  const q = query(
    logsCol,
    where('userId', '==', userId),
    where('logDate', '>=', startKey),
    where('logDate', '<=', endKey)
  )
  const snap = await getDocs(q)
  return snap.docs.map(toLog)
}

export async function fetchAllLogsForHabit(habitId) {
  const q = query(logsCol, where('habitId', '==', habitId), orderBy('logDate', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(toLog)
}

export async function toggleHabitToday(habit, userId, existingLog) {
  const id = logDocId(habit.id, todayKey())
  if (existingLog) {
    await deleteDoc(doc(db, 'habitLogs', id))
    return null
  }
  const payload = { habitId: habit.id, userId, logDate: todayKey(), completed: true, createdAt: serverTimestamp() }
  await setDoc(doc(db, 'habitLogs', id), payload)
  return { id, ...payload }
}

export async function createHabit(userId, habit) {
  const payload = {
    userId,
    archived: false,
    sortOrder: 0,
    createdAt: serverTimestamp(),
    ...habit,
  }
  const ref = await addDoc(habitsCol, payload)
  return { id: ref.id, ...payload }
}

export async function updateHabit(habitId, changes) {
  await updateDoc(doc(db, 'habits', habitId), changes)
  return fetchHabit(habitId)
}

export async function deleteHabit(habitId) {
  // Remove the habit and every log that belongs to it.
  const logsQuery = query(logsCol, where('habitId', '==', habitId))
  const logsSnap = await getDocs(logsQuery)
  const batch = writeBatch(db)
  logsSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'habits', habitId))
  await batch.commit()
}

export function computeCurrentStreak(logDatesSet) {
  let streak = 0
  const keyOf = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!logDatesSet.has(keyOf(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (logDatesSet.has(keyOf(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
