import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import * as api from '@/services/supabaseApi'
import { useAuthStore } from './auth'
import type {
  User,
  Report,
  ReportStatus,
  Severity,
  Notification,
  Confirmation,
  StatusHistoryEntry,
  DetectionResult,
  CategoryId,
  ReportWithRelations,
  AnalyticsData,
} from '@/types'
import { STATUS_FLOW, statusLabel, CATEGORY_MAP } from '@/lib/constants'

// ============================================================
// Supabase-backed application store
// Replaces the localStorage demo backend with real Supabase
// ============================================================

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info'
}

export interface SubmitReportInput {
  imageFile: File | null
  category: CategoryId
  description?: string
  severity: Severity
  confidence: number
  lat: number
  lng: number
  address?: string
  detection: DetectionResult | null
}

interface AppDB {
  users: User[]
  reports: ReportWithRelations[]
  confirmations: Confirmation[]
  history: StatusHistoryEntry[]
  notifications: Notification[]
  communityReports: Report[]
}

interface AppState {
  db: AppDB
  currentUserId: string | null
  toasts: Toast[]
  loading: boolean
  dataLoaded: boolean
  dataError: string | null

  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (patch: { name?: string; avatarUrl?: string }) => Promise<void>

  refreshData: () => Promise<void>
  fetchReports: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchCommunityReports: () => Promise<void>

  submitReport: (input: SubmitReportInput) => Promise<string>
  confirmReport: (reportId: string) => Promise<void>
  setReportStatus: (reportId: string, status: ReportStatus, note?: string) => Promise<void>
  assignReport: (reportId: string, assigneeId: string) => Promise<void>
  setReportSeverity: (reportId: string, severity: Severity) => Promise<void>
  addResolvedImage: (reportId: string, imageUrl: string) => Promise<void>

  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  computeAnalytics: () => AnalyticsData

  toast: (title: string, description?: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

const emptyDB: AppDB = {
  users: [],
  reports: [],
  confirmations: [],
  history: [],
  notifications: [],
  communityReports: [],
}

function computeAnalyticsFromDB(db: AppDB): AnalyticsData {
  const reports = db.reports
  const resolved = reports.filter((r) => r.status === 'resolved')
  const totalConfirmations = db.confirmations.length

  const avgResolutionDays =
    resolved.length > 0
      ? resolved.reduce((acc, r) => {
          if (!r.resolved_at) return acc
          const days =
            (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 86400000
          return acc + Math.max(0, days)
        }, 0) / resolved.length
      : 0

  const days = 14
  const now = Date.now()
  const reportsOverTime: AnalyticsData['reportsOverTime'] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    reportsOverTime.push({
      date: label,
      count: reports.filter((r) => r.created_at.slice(0, 10) === key).length,
    })
  }

  const byCategoryMap = new Map<string, number>()
  reports.forEach((r) => byCategoryMap.set(r.category, byCategoryMap.get(r.category) ?? 0 + 1))
  const byCategory = [...byCategoryMap.entries()]
    .map(([category, count]) => ({
      category,
      count,
      label: (CATEGORY_MAP[category as CategoryId]?.label ?? category).replace('-', ' '),
    }))
    .sort((a, b) => b.count - a.count)

  const byDistrictMap = new Map<string, number>()
  reports.forEach((r) => {
    const d = r.address ? r.address.split(',').pop()?.trim() ?? 'Unknown' : 'Unknown'
    byDistrictMap.set(d, byDistrictMap.get(d) ?? 0 + 1)
  })
  const byDistrict = [...byDistrictMap.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const severityDist = (['critical', 'high', 'medium', 'low'] as const).map((s) => ({
    severity: s,
    count: reports.filter((r) => r.severity === s).length,
  }))

  const statusDist = STATUS_FLOW.map((s) => ({
    status: s,
    label: statusLabel(s),
    count: reports.filter((r) => r.status === s).length,
  })).concat({
    status: 'rejected',
    label: 'Rejected',
    count: reports.filter((r) => r.status === 'rejected').length,
  })

  const weeklyTrend: AnalyticsData['weeklyTrend'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    weeklyTrend.push({
      date: key,
      count: reports.filter((r) => r.created_at.slice(0, 10) === key).length,
      label,
    })
  }

  const activeUsers = db.users.filter((u: any) => u.role === 'citizen').length

  return {
    total: reports.length,
    totalConfirmations,
    openCount: reports.filter((r) => !['resolved', 'rejected'].includes(r.status)).length,
    pendingCount: reports.filter((r) =>
      ['reported', 'ai_verified', 'under_review'].includes(r.status),
    ).length,
    inProgressCount: reports.filter((r) => ['assigned', 'in_progress'].includes(r.status)).length,
    resolvedCount: resolved.length,
    rejectedCount: reports.filter((r) => r.status === 'rejected').length,
    resolutionRate: reports.length ? Math.round((resolved.length / reports.length) * 100) : 0,
    avgResolutionDays,
    activeUsers,
    reportsOverTime,
    byCategory,
    byDistrict,
    severityDist,
    statusDist,
    weeklyTrend,
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  db: { ...emptyDB },
  currentUserId: null,
  toasts: [],
  loading: false,
  dataLoaded: false,
  dataError: null,

  login: async (email, password) => {
    set({ loading: true, dataError: null })
    try {
      const result = await useAuthStore.getState().login(email, password)
      if (result.ok) {
        const user = useAuthStore.getState().user
        set({ currentUserId: user?.id ?? null })
        await get().refreshData()
        return { ok: true }
      }
      set({ loading: false })
      return result
    } catch (e) {
      set({ loading: false })
      return { ok: false, error: 'Login failed.' }
    }
  },

  signup: async (name, email, password) => {
    set({ loading: true, dataError: null })
    try {
      const result = await useAuthStore.getState().signup(name, email, password)
      if (result.ok && result.error === 'CHECK_EMAIL') {
        set({ loading: false })
        return { ok: true, error: 'CHECK_EMAIL' }
      }
      if (result.ok) {
        const user = useAuthStore.getState().user
        set({ currentUserId: user?.id ?? null })
        await get().refreshData()
        return { ok: true }
      }
      set({ loading: false })
      return result
    } catch (e) {
      set({ loading: false })
      return { ok: false, error: 'Signup failed.' }
    }
  },

  logout: async () => {
    await useAuthStore.getState().logout()
    set({ currentUserId: null, db: { ...emptyDB }, dataError: null, dataLoaded: false })
  },

  updateProfile: async (patch) => {
    const user = useAuthStore.getState().user
    if (!user) return
    await useAuthStore.getState().updateProfile(patch)
    await get().refreshData()
  },

  refreshData: async () => {
    const authUser = useAuthStore.getState().user
    set({
      currentUserId: authUser?.id ?? null,
      loading: true,
      dataLoaded: false,
      dataError: null,
    })
    try {
      const tasks = [get().fetchReports(), get().fetchNotifications()]
      if (authUser?.role === 'admin') {
        tasks.push(get().fetchUsers())
      }
      await Promise.all(tasks)
      set({ dataLoaded: true, dataError: null })
    } catch (e: any) {
      set({ dataLoaded: true, dataError: e?.message ?? 'Failed to load data.' })
    } finally {
      set({ loading: false })
    }
  },

  fetchReports: async () => {
    const userId = useAuthStore.getState().user?.id ?? null
    try {
      const reports = await api.fetchReports(userId, {})
      const usersMap = new Map<string, User>()
      for (const r of reports) {
        if (r.user && !usersMap.has(r.user.id)) {
          usersMap.set(r.user.id, r.user)
        }
      }

      const reportIds = reports.map((r) => r.id)
      let confirmations: Confirmation[] = []
      let history: StatusHistoryEntry[] = []

      if (reportIds.length > 0) {
        const [confRes, histRes] = await Promise.all([
          supabase.from('confirmations').select('*').in('report_id', reportIds),
          supabase.from('status_history').select('*').in('report_id', reportIds).order('created_at', { ascending: true }),
        ])
        if (confRes.error) throw confRes.error
        if (histRes.error) throw histRes.error
        confirmations = (confRes.data ?? []) as Confirmation[]
        history = (histRes.data ?? []) as StatusHistoryEntry[]
      }

      const users: User[] = Array.from(usersMap.values())

      const historyByReport = new Map<string, StatusHistoryEntry[]>()
      for (const h of history) {
        const arr = historyByReport.get(h.report_id) ?? []
        arr.push(h)
        historyByReport.set(h.report_id, arr)
      }

      const enrichedReports = reports.map((r) => ({
        ...r,
        history: historyByReport.get(r.id) ?? r.history,
      }))

      set((state) => ({
        ...state,
        db: {
          ...state.db,
          users: [...state.db.users, ...users].filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i),
          reports: enrichedReports,
          confirmations: [...state.db.confirmations, ...confirmations].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i),
          history: [...state.db.history, ...history].filter((h, i, arr) => arr.findIndex((x) => x.id === h.id) === i),
        },
      }))
    } catch (e: any) {
      console.error('Failed to fetch reports:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
      })
      throw e
    }
  },

  fetchNotifications: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    try {
      const notifications = await api.fetchNotifications(userId)
      set((state) => ({
        ...state,
        db: { ...state.db, notifications },
      }))
    } catch (e: any) {
      console.error('Failed to fetch notifications:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
      })
      throw e
    }
  },

  fetchUsers: async () => {
    try {
      const users = await api.fetchAdminUsers()
      set((state) => ({
        ...state,
        db: { ...state.db, users },
      }))
    } catch (e: any) {
      console.error('Failed to fetch users:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
      })
      throw e
    }
  },

  fetchCommunityReports: async () => {
    try {
      const reports = await api.fetchCommunityReports()
      set((state) => ({
        ...state,
        db: { ...state.db, communityReports: reports },
      }))
    } catch (e: any) {
      console.error('Failed to fetch community reports:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
      })
    }
  },

  submitReport: async (input) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) throw new Error('Not authenticated')

    let imagePath: string | null = null
    try {
      if (input.imageFile) {
        imagePath = await api.uploadReportImage(input.imageFile, userId)
      }

      const reportId = await api.insertReport({
        userId,
        imagePath,
        category: input.category,
        description: input.description?.trim() || undefined,
        severity: input.severity,
        confidence: input.confidence,
        lat: input.lat,
        lng: input.lng,
        address: input.address || undefined,
        aiClassified: input.detection !== null && input.detection !== undefined,
        detection: input.detection,
      })

      await get().refreshData()
      return reportId
    } catch (e) {
      if (imagePath) {
        await api.deleteStorageObject(imagePath)
      }
      throw e
    }
  },

  confirmReport: async (reportId) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    await api.confirmReport(reportId, userId)
    await get().fetchReports()
    await get().fetchNotifications()
  },

  setReportStatus: async (reportId, status, note) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    await api.updateReportStatus(reportId, status, note, userId)
    await get().fetchReports()
    await get().fetchNotifications()
  },

  assignReport: async (reportId, assigneeId) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    await api.assignReport(reportId, assigneeId, userId)
    await get().fetchReports()
    await get().fetchNotifications()
  },

  setReportSeverity: async (reportId, severity) => {
    await api.updateReportSeverity(reportId, severity)
    await get().fetchReports()
  },

  addResolvedImage: async (reportId, imageUrl) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    await api.addResolvedImage(reportId, imageUrl, userId)
    await get().fetchReports()
    await get().fetchNotifications()
  },

  markNotificationRead: async (id) => {
    await api.markNotificationRead(id)
    set((state) => ({
      ...state,
      db: {
        ...state.db,
        notifications: state.db.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
      },
    }))
  },

  markAllNotificationsRead: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    await api.markAllNotificationsRead(userId)
    set((state) => ({
      ...state,
      db: {
        ...state.db,
        notifications: state.db.notifications.map((n) =>
          n.user_id === userId ? { ...n, is_read: true } : n,
        ),
      },
    }))
  },

  computeAnalytics: () => computeAnalyticsFromDB(get().db),

  toast: (title, description, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({ toasts: [...s.toasts, { id, title, description, type }] }))
    setTimeout(() => get().dismissToast(id), 4500)
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

// Quick-access helpers used by components
export function useCurrentUser(): User | null {
  const userId = useAppStore.getState().currentUserId
  const db = useAppStore.getState().db
  return userId ? db.users.find((u) => u.id === userId) ?? null : null
}
