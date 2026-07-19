import { db } from '../firebase'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
  lastLogin: Timestamp
  provider: string
  plan: string
  totalGeneratedQR: number
  totalDownloads: number
  totalScans: number
}

export async function createUserDocument(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      provider: user.providerData[0]?.providerId || 'google.com',
      plan: 'Free',
      totalGeneratedQR: 0,
      totalDownloads: 0,
      totalScans: 0,
    })
  } else {
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    })
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return null
  return userSnap.data() as UserProfile
}

export interface GeneratedQR {
  id?: string
  userId: string
  type: string
  content: string
  style: Record<string, unknown>
  colors: Record<string, unknown>
  frame: Record<string, unknown>
  logo: Record<string, unknown>
  createdAt: Timestamp
  downloadCount: number
  scanCount: number
}

export async function saveGeneratedQR(
  userId: string,
  qrData: Omit<GeneratedQR, 'id' | 'createdAt' | 'downloadCount' | 'scanCount'>
): Promise<string> {
  const qrRef = doc(collection(db, 'generated_qrs'))
  const userRef = doc(db, 'users', userId)

  await runTransaction(db, async (transaction) => {
    // Create the QR document
    transaction.set(qrRef, {
      ...qrData,
      downloadCount: 0,
      scanCount: 0,
      createdAt: serverTimestamp(),
    })

    // Atomically increment the user's QR count
    transaction.update(userRef, {
      totalGeneratedQR: increment(1),
    })
  })

  return qrRef.id
}

export interface QRFilters {
  pageSize?: number
  lastDoc?: DocumentData | null
  sortBy?: 'newest' | 'oldest'
  search?: string
}

export interface QRPaginatedResult {
  qrs: GeneratedQR[]
  lastDoc: DocumentData | null
  hasMore: boolean
}

export async function getUserQRCodes(
  userId: string,
  filters: QRFilters = {}
): Promise<QRPaginatedResult> {
  const { pageSize = 12, lastDoc, sortBy = 'newest', search } = filters

  const qrCollection = collection(db, 'generated_qrs')

  const constraints: QueryConstraint[] = [where('userId', '==', userId)]

  if (sortBy === 'newest') {
    constraints.push(orderBy('createdAt', 'desc'))
  } else {
    constraints.push(orderBy('createdAt', 'asc'))
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc))
  }

  constraints.push(limit(pageSize + 1))

  const q = query(qrCollection, ...constraints)
  const snapshot = await getDocs(q)

  let qrs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GeneratedQR[]

  const hasMore = qrs.length > pageSize
  if (hasMore) qrs = qrs.slice(0, pageSize)

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null

  if (search && search.trim()) {
    const term = search.toLowerCase()
    qrs = qrs.filter(
      (qr) =>
        qr.type?.toLowerCase().includes(term) ||
        qr.content?.toLowerCase().includes(term)
    )
  }

  return {
    qrs,
    lastDoc: hasMore ? newLastDoc : null,
    hasMore,
  }
}

export async function deleteQRCode(qrId: string, userId: string): Promise<void> {
  const qrRef = doc(db, 'generated_qrs', qrId)
  const userRef = doc(db, 'users', userId)

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists()) return

    const currentTotal = userSnap.data().totalGeneratedQR ?? 0
    transaction.delete(qrRef)
    transaction.update(userRef, {
      totalGeneratedQR: Math.max(0, currentTotal - 1),
    })
  })
}

export async function duplicateQRCode(qrId: string, userId: string): Promise<string | null> {
  const qrRef = doc(db, 'generated_qrs', qrId)
  const qrSnap = await getDoc(qrRef)

  if (!qrSnap.exists()) return null

  const data = qrSnap.data() as GeneratedQR
  const { id, createdAt, downloadCount, scanCount, ...rest } = data

  try {
    const newId = await saveGeneratedQR(userId, rest)
    return newId
  } catch (err) {
    console.error('Failed to duplicate QR code:', err)
    throw err
  }
}

export async function incrementDownloadCount(qrId: string, userId: string): Promise<void> {
  const qrRef = doc(db, 'generated_qrs', qrId)
  const userRef = doc(db, 'users', userId)

  await runTransaction(db, async (transaction) => {
    transaction.update(qrRef, {
      downloadCount: increment(1),
    })
    transaction.update(userRef, {
      totalDownloads: increment(1),
    })
  })
}

/**
 * Hook for future scan-count tracking.
 * Currently wired to the UI display (scanCount field on GeneratedQR)
 * and ready to connect to a scanning endpoint or scanner app integration.
 */
export async function incrementScanCount(qrId: string, userId: string): Promise<void> {
  const qrRef = doc(db, 'generated_qrs', qrId)
  const userRef = doc(db, 'users', userId)

  await runTransaction(db, async (transaction) => {
    transaction.update(qrRef, {
      scanCount: increment(1),
    })
    transaction.update(userRef, {
      totalScans: increment(1),
    })
  })
}

export function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts || !ts.toDate) return 'N/A'
  const date = ts.toDate()
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTimestampRelative(ts: Timestamp | null | undefined): string {
  if (!ts || !ts.toDate) return ''
  const date = ts.toDate()
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
