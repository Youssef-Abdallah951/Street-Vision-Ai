import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { cn, timeAgo } from '@/lib/utils'
import { statusLabel } from '@/lib/constants'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<Notification['type'], { dot: string; label: string }> = {
  report_submitted: { dot: 'bg-brand-500', label: 'Submitted' },
  ai_verified: { dot: 'bg-violet-500', label: 'AI verified' },
  status_change: { dot: 'bg-amber-500', label: 'Status' },
  resolved: { dot: 'bg-green-500', label: 'Resolved' },
  confirmed: { dot: 'bg-cyan-500', label: 'Community' },
  system: { dot: 'bg-surface-400', label: 'System' },
}

export function NotificationCenter() {
  const db = useAppStore((s) => s.db)
  const userId = useAppStore((s) => s.currentUserId)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const markAll = useAppStore((s) => s.markAllNotificationsRead)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const notifications = db.notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 9)
  const unread = db.notifications.filter((n) => n.user_id === userId && !n.is_read).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open) markAll()
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-lift animate-scale-in dark:border-surface-700 dark:bg-surface-800">
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-700">
            <p className="text-sm font-semibold text-surface-900 dark:text-white">Notifications</p>
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              View all
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-surface-400">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id)
                    if (n.report_id) navigate(`/reports/${n.report_id}`)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50',
                    !n.is_read && 'bg-brand-50/50 dark:bg-brand-950/20',
                  )}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TYPE_ICONS[n.type].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-surface-900 dark:text-white">
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-surface-500 dark:text-surface-400">
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-surface-400 dark:text-surface-500">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAll}
              className="flex w-full items-center justify-center gap-1.5 border-t border-surface-100 py-2.5 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-50 hover:text-surface-800 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-700/50 dark:hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { statusLabel }
