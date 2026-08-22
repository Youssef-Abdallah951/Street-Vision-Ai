import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppStore } from '@/store/app'
import { cn, timeAgo } from '@/lib/utils'
import type { Notification } from '@/types'

const TYPE_META: Record<Notification['type'], { label: string; tone: 'brand' | 'green' | 'amber' | 'violet' | 'cyan' | 'neutral' }> = {
  report_submitted: { label: 'Submitted', tone: 'brand' },
  ai_verified: { label: 'AI verified', tone: 'violet' },
  status_change: { label: 'Status', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
  confirmed: { label: 'Community', tone: 'cyan' },
  system: { label: 'System', tone: 'neutral' },
}

export function NotificationsPage() {
  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const markAll = useAppStore((s) => s.markAllNotificationsRead)

  const notifications = useMemo(
    () =>
      db.notifications
        .filter((n) => n.user_id === currentUserId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [db, currentUserId],
  )

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}.` : 'You are all caught up.'}
      >
        {notifications.length > 0 && (
          <Button variant="outline" onClick={markAll} leftIcon={<CheckCheck className="h-4 w-4" />}>
            Mark all as read
          </Button>
        )}
      </PageHeader>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No notifications yet"
            description="You'll be notified when your reports are verified, confirmed, or resolved."
          />
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type]
            return (
              <Card
                key={n.id}
                className={cn(
                  'flex items-start gap-4 p-4 transition-colors',
                  !n.is_read && 'border-brand-200 bg-brand-50/40 dark:border-brand-900 dark:bg-brand-950/20',
                )}
              >
                <div className={cn('mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', !n.is_read ? 'bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400' : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500')}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{n.title}</p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-surface-400">{timeAgo(n.created_at)}</span>
                    {n.report_id && (
                      <Link
                        to={`/reports/${n.report_id}`}
                        onClick={() => markRead(n.id)}
                        className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        View report →
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </PageContainer>
  )
}
