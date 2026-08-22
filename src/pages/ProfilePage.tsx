import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Save,
  FileStack,
  HandCoins,
  Bell,
  Database,
  LogOut,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatCard } from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/lib/utils'

export function ProfilePage() {
  const navigate = useNavigate()
  const db = useAppStore((s) => s.db)
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAppStore((s) => s.logout)
  const toast = useAppStore((s) => s.toast)

  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const myReports = db.reports.filter((r) => r.user_id === user.id)
  const myConfirmations = db.confirmations.filter((c) => c.user_id === user.id).length
  const unread = db.notifications.filter((n) => n.user_id === user.id && !n.is_read).length

  const save = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    await updateProfile({ name })
    setSaving(false)
    toast('Profile updated', 'Your changes were saved.')
  }

  return (
    <PageContainer>
      <PageHeader title="Profile" description="Manage your account and preferences." />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Avatar name={user.name} src={user.avatarUrl} size="lg" />
              <h2 className="mt-4 text-lg font-bold text-surface-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-surface-400">{user.email}</p>
              <span className="mt-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {user.role === 'admin' ? 'Administrator' : 'Citizen reporter'}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6 text-sm">
              <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
                <Mail className="h-4 w-4 text-brand-500" /> {user.email}
              </div>
              <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
                <Calendar className="h-4 w-4 text-brand-500" /> Joined {formatDate(user.createdAt)}
              </div>
              <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
                <Shield className="h-4 w-4 text-brand-500" /> {user.role === 'admin' ? 'Full admin access' : 'Standard account'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={FileStack} label="My reports" value={myReports.length} tone="brand" />
            <StatCard icon={HandCoins} label="Confirmations given" value={myConfirmations} tone="cyan" />
            <StatCard icon={Bell} label="Unread notifications" value={unread} tone="amber" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>Update the name shown on your reports.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} className="sm:max-w-xs" />
              <Button onClick={save} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Save changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>
                Sign out of this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
