import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { fetchProfile, updateProfile as apiUpdateProfile } from '@/services/supabaseApi'
import { useAppStore } from '@/store/app'
import type { User } from '@/types'

// ============================================================
// Auth store — wraps Supabase Auth session + user profile
// ============================================================

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info'
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  toasts: Toast[]

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  updateProfile: (patch: { name?: string; avatarUrl?: string }) => Promise<void>
  refreshProfile: () => Promise<void>

  toast: (title: string, description?: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

let _toastCounter = 0
let _listenerUnsubscribe: (() => void) | null = null
let _authActionInProgress = false
let _realtimeUnsubscribes: (() => void)[] = []

const emptyDB = {
  users: [] as User[],
  reports: [] as any[],
  confirmations: [] as any[],
  history: [] as any[],
  notifications: [] as any[],
  communityReports: [] as any[],
}

async function fetchProfileWithRetry(userId: string, retries = 4, delay = 500): Promise<User | null> {
  for (let i = 0; i < retries; i++) {
    const profile = await fetchProfile(userId)
    if (profile) return profile
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  return null
}

function cleanupRealtime() {
  _realtimeUnsubscribes.forEach((unsub) => unsub())
  _realtimeUnsubscribes = []
}

async function setupRealtime(userId: string) {
  cleanupRealtime()

  const reportsChannel = supabase
    .channel(`reports:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'reports',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const updated = payload.new as any
        const reportId = updated.id
        const newStatus = updated.status
        useAppStore.setState((state) => ({
          ...state,
          db: {
            ...state.db,
            reports: state.db.reports.map((r: any) =>
              r.id === reportId
                ? { ...r, status: newStatus, updated_at: updated.updated_at, resolved_at: updated.resolved_at ?? r.resolved_at }
                : r,
            ),
          },
        }))
        useAppStore.getState().fetchNotifications()
      },
    )
    .subscribe()

  const notificationsChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        useAppStore.getState().fetchNotifications()
      },
    )
    .subscribe()

  _realtimeUnsubscribes = [
    () => supabase.removeChannel(reportsChannel),
    () => supabase.removeChannel(notificationsChannel),
  ]
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  toasts: [],

  initialize: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const profile = await fetchProfileWithRetry(session.user.id)
        set({ user: profile, initialized: true })
        await useAppStore.getState().refreshData()
        setupRealtime(session.user.id)
        set({ loading: false })
      } else {
        set({ user: null, loading: false, initialized: true })
      }

      if (!_listenerUnsubscribe) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            if (_authActionInProgress) return
            const profile = await fetchProfileWithRetry(session.user.id)
            set({ user: profile })
            await useAppStore.getState().refreshData()
            setupRealtime(session.user.id)
            set({ loading: false })
          } else if (event === 'SIGNED_OUT') {
            cleanupRealtime()
            set({ user: null })
            useAppStore.setState({ currentUserId: null, db: { ...emptyDB } })
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            const profile = await fetchProfileWithRetry(session.user.id)
            set({ user: profile })
          } else if (event === 'USER_UPDATED' && session?.user) {
            const profile = await fetchProfileWithRetry(session.user.id)
            set({ user: profile })
            await useAppStore.getState().refreshData()
            set({ loading: false })
          }
        })
        _listenerUnsubscribe = subscription.unsubscribe
      }
    } catch {
      set({ user: null, loading: false, initialized: true })
    }
  },

  login: async (email, password) => {
    _authActionInProgress = true
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        set({ loading: false })
        return { ok: false, error: error.message }
      }

      if (data.user) {
        const profile = await fetchProfileWithRetry(data.user.id)
        set({ user: profile })
        await useAppStore.getState().refreshData()
      }

      return { ok: true }
    } catch (e) {
      set({ loading: false })
      return { ok: false, error: 'Login failed.' }
    } finally {
      _authActionInProgress = false
      set({ loading: false })
    }
  },

  signup: async (name, email, password) => {
    _authActionInProgress = true
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() || email.split('@')[0] },
        },
      })

      if (error) {
        set({ loading: false })
        return { ok: false, error: error.message }
      }

      if (data.user && data.session) {
        const profile = await fetchProfileWithRetry(data.user.id)
        set({ user: profile })
        await useAppStore.getState().refreshData()
        set({ loading: false })
        return { ok: true }
      }

      set({ loading: false })
      return { ok: true, error: 'CHECK_EMAIL' }
    } catch (e) {
      set({ loading: false })
      return { ok: false, error: 'Signup failed.' }
    } finally {
      _authActionInProgress = false
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  },

  updateProfile: async (patch) => {
    const user = get().user
    if (!user) throw new Error('Not authenticated')
    await apiUpdateProfile(user.id, {
      full_name: patch.name,
      avatar_url: patch.avatarUrl,
    })
    set({
      user: {
        ...user,
        name: patch.name ?? user.name,
        avatarUrl: patch.avatarUrl ?? user.avatarUrl,
      },
    })
  },

  refreshProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: profile })
    }
  },

  toast: (title, description, type = 'success') => {
    const id = `toast-${++_toastCounter}`
    set((s) => ({ toasts: [...s.toasts, { id, title, description, type }] }))
    setTimeout(() => get().dismissToast(id), 4500)
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
