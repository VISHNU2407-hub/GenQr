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
  totalFavorites: number
  totalShares: number
  totalBatchQRs: number
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
      totalFavorites: 0,
      totalShares: 0,
      totalBatchQRs: 0,
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
  favorite?: boolean
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
  const { id: _id, createdAt: _createdAt, downloadCount: _downloadCount, scanCount: _scanCount, ...rest } = data

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

export async function toggleFavorite(qrId: string, userId: string, currentFavorite: boolean): Promise<boolean> {
  const qrRef = doc(db, 'generated_qrs', qrId)
  const userRef = doc(db, 'users', userId)

  await runTransaction(db, async (transaction) => {
    transaction.update(qrRef, {
      favorite: !currentFavorite,
    })
    transaction.update(userRef, {
      totalFavorites: increment(currentFavorite ? -1 : 1),
    })
  })

  return !currentFavorite
}

// ─── Activity Log Types & Functions ────────────────────

export type ActivityType =
  | 'generated'
  | 'downloaded'
  | 'shared'
  | 'batch_generated'
  | 'favorite_added'
  | 'favorite_removed'

export interface ActivityLogEntry {
  id?: string
  userId: string
  activityType: ActivityType
  qrType?: string
  qrContent?: string
  qrName?: string
  batchCount?: number
  timestamp: Timestamp
}

/**
 * Log a user activity event to their activity_log subcollection.
 */
export async function logActivity(
  userId: string,
  activity: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId'>
): Promise<void> {
  const activityRef = doc(collection(db, 'users', userId, 'activity_log'))
  await setDoc(activityRef, {
    ...activity,
    userId,
    timestamp: serverTimestamp(),
  })
}

/**
 * Fetch the most recent activity logs for a user.
 */
export async function getRecentActivities(
  userId: string,
  maxResults: number = 20
): Promise<ActivityLogEntry[]> {
  const activitiesRef = collection(db, 'users', userId, 'activity_log')
  const q = query(
    activitiesRef,
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ActivityLogEntry[]
}

/**
 * Get activity counts grouped by type for a given time period.
 * Counts items in the activity_log subcollection.
 */
export async function getActivityStats(
  userId: string,
  days: number = 30
): Promise<Record<ActivityType, number>> {
  const activitiesRef = collection(db, 'users', userId, 'activity_log')
  const cutoff = new Date(Date.now() - days * 86400000)
  const q = query(
    activitiesRef,
    where('timestamp', '>=', Timestamp.fromDate(cutoff)),
    orderBy('timestamp', 'desc')
  )
  const snapshot = await getDocs(q)
  const counts: Record<string, number> = {
    generated: 0,
    downloaded: 0,
    shared: 0,
    batch_generated: 0,
    favorite_added: 0,
    favorite_removed: 0,
  }
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as ActivityLogEntry
    if (counts[data.activityType] !== undefined) {
      counts[data.activityType]++
    }
  })
  return counts as Record<ActivityType, number>
}

/**
 * Get daily activity counts for charting.
 * Returns an array of { date: string, count: number } for the last N days.
 * Only counts 'generated' and 'batch_generated' activity types.
 */
export async function getDailyActivityCounts(
  userId: string,
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const activitiesRef = collection(db, 'users', userId, 'activity_log')
  const cutoff = new Date(Date.now() - days * 86400000)
  let snapshot
  try {
    const q = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(cutoff)),
      orderBy('timestamp', 'desc')
    )
    snapshot = await getDocs(q)
  } catch (err) {
    console.error('Failed to query activity logs (index may need creation):', err)
    // Fallback: try without the composite index
    try {
      const q = query(
        activitiesRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      )
      snapshot = await getDocs(q)
    } catch (fallbackErr) {
      console.error('Fallback activity query also failed:', fallbackErr)
      // Build empty day buckets
      const dayMap = new Map<string, number>()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dayMap.set(key, 0)
      }
      return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))
    }
  }

  // Build day buckets
  const dayMap = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dayMap.set(key, 0)
  }

  snapshot!.docs.forEach((doc) => {
    const data = doc.data()
    const ts = data.timestamp as Timestamp
    const activityType = data.activityType as string
    // Only count generation activities for the chart
    if (activityType !== 'generated' && activityType !== 'batch_generated') return
    if (ts?.toDate) {
      const key = ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + 1)
      }
    }
  })

  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
}

/**
 * Get QR type distribution counts.
 * Uses a limit to avoid expensive full collection scans.
 */
export async function getQRTypeDistribution(
  userId: string
): Promise<{ name: string; value: number }[]> {
  const qrsRef = collection(db, 'generated_qrs')
  const q = query(qrsRef, where('userId', '==', userId), limit(500))
  try {
    const snapshot = await getDocs(q)
    const typeCounts = new Map<string, number>()
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const type = (data.type as string) || 'unknown'
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)
    })
    return Array.from(typeCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  } catch (err) {
    console.error('Failed to get QR type distribution:', err)
    return []
  }
}

/**
 * Increment share count on a QR document and user profile.
 */
export async function incrementShareCount(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    totalShares: increment(1),
  })
}

/**
 * Increment batch QR count on user profile.
 */
export async function incrementBatchCount(userId: string, count: number): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    totalBatchQRs: increment(count),
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
