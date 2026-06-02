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
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'

export {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, Timestamp,
}

// --- Generic helpers ---
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
}

export async function createDocument<T extends object>(
  collectionName: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export { db }
