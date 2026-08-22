import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  FilterX,
  FileCheck2,
  UserPlus,
  Camera,
  Ban,
  ExternalLink,
  ImagePlus,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { SeverityBadge, StatusBadge, CategoryBadge, PriorityBadge } from '@/components/ui/badges'
import { EmptyState } from '@/components/ui/Feedback'
import { AdminNav } from '@/pages/admin/AdminNav'
import { SignedImage } from '@/components/ui/SignedImage'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { CATEGORIES, ALL_STATUSES, SEVERITIES, SEVERITY_META, statusLabel } from '@/lib/constants'
import { timeAgo, cn } from '@/lib/utils'
import type { ReportWithRelations, ReportStatus, Severity } from '@/types'

export function AdminReportsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])
  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)
  const setReportStatus = useAppStore((s) => s.setReportStatus)
  const setReportSeverity = useAppStore((s) => s.setReportSeverity)
  const assignReport = useAppStore((s) => s.assignReport)
  const addResolvedImage = useAppStore((s) => s.addResolvedImage)
  const toast = useAppStore((s) => s.toast)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')

  // Action modals
  const [statusTarget, setStatusTarget] = useState<ReportWithRelations | null>(null)
  const [newStatus, setNewStatus] = useState<ReportStatus>('reported')
  const [statusNote, setStatusNote] = useState('')

  const [assignTarget, setAssignTarget] = useState<ReportWithRelations | null>(null)
  const [assignee, setAssignee] = useState('')

  const [resolveTarget, setResolveTarget] = useState<ReportWithRelations | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [severityTarget, setSeverityTarget] = useState<ReportWithRelations | null>(null)
  const [newSeverity, setNewSeverity] = useState<Severity>('medium')

  const adminUsers = useMemo(() => db.users.filter((u) => u.role === 'admin'), [db])

  const all = useMemo(() => db.reports, [db])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((r) => {
      if (q && !`${r.category} ${r.address ?? ''} ${r.id}`.toLowerCase().includes(q)) return false
      if (category !== 'all' && r.category !== category) return false
      if (severity !== 'all' && r.severity !== severity) return false
      if (status !== 'all' && r.status !== status) return false
      return true
    })
  }, [all, query, category, severity, status])

  const openStatus = (r: ReportWithRelations) => {
    setStatusTarget(r)
    setNewStatus(r.status)
    setStatusNote('')
  }

  const applyStatus = async () => {
    if (!statusTarget) return
    try {
      await setReportStatus(statusTarget.id, newStatus, statusNote.trim() || undefined)
      toast('Status updated', `Report ${statusTarget.id.slice(-4)} → ${statusLabel(newStatus)}`)
    } catch (e: any) {
      toast('Update failed', e?.message ?? 'Could not update status.', 'error')
    } finally {
      setStatusTarget(null)
    }
  }

  const applyAssign = () => {
    if (!assignTarget || !assignee) return
    assignReport(assignTarget.id, assignee)
    const name = db.users.find((u) => u.id === assignee)?.name ?? 'a team'
    toast('Report assigned', `Assigned to ${name}.`)
    setAssignTarget(null)
  }

  const readResolutionImage = (file?: File | null) => {
    if (!file || !resolveTarget) return
    if (!file.type.startsWith('image/')) {
      toast('Invalid file', 'Please choose an image file.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      addResolvedImage(resolveTarget.id, reader.result as string)
      toast('Report resolved', 'Resolution photo uploaded and report marked as resolved.')
      setResolveTarget(null)
    }
    reader.readAsDataURL(file)
  }

  const hasFilters = query !== '' || category !== 'all' || severity !== 'all' || status !== 'all'

  return (
    <PageContainer className="max-w-7xl">
      <PageHeader title="Reports Management" description="Review, assign, resolve or reject community reports." />
      <div className="mt-5">
        <AdminNav />
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-5 dark:border-surface-800 dark:bg-surface-900">
        <div className="relative md:col-span-2 xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search report, street, district…"
            className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-9 pr-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-surface-700 dark:bg-surface-800 dark:text-white"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category filter">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity filter">
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_META[s].label}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            className="justify-self-start"
            onClick={() => { setQuery(''); setCategory('all'); setSeverity('all'); setStatus('all') }}
            leftIcon={<FilterX className="h-4 w-4" />}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="p-4 sm:p-5">
          {filtered.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No reports match" description="Adjust filters or wait for new community reports." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-left text-xs uppercase tracking-wide text-surface-400 dark:border-surface-800">
                    <th className="pb-3 pr-4 font-medium">Report</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Severity</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium">Confirmations</th>
                    <th className="pb-3 pr-4 font-medium">Age</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-surface-50 align-middle last:border-0 dark:border-surface-800/60">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                           {r.image_url ? (
                             <SignedImage path={r.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                           ) : (
                             <div className="h-11 w-11 shrink-0 rounded-lg bg-surface-100 dark:bg-surface-800" />
                           )}
                           <div className="min-w-0">
                             <Link to={`/reports/${r.id}`} className="flex items-center gap-1 font-medium text-surface-800 hover:text-brand-600 dark:text-surface-200 dark:hover:text-brand-400">
                               #{r.id.slice(-4)} <ExternalLink className="h-3 w-3" />
                             </Link>
                             <p className="truncate text-xs text-surface-400">{r.address || 'Pinned'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4"><CategoryBadge category={r.category} /></td>
                      <td className="py-3 pr-4"><SeverityBadge severity={r.severity} /></td>
                      <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 pr-4"><PriorityBadge score={r.priority_score} /></td>
                      <td className="py-3 pr-4 text-surface-600 dark:text-surface-300">{r.confirmations_count}</td>
                      <td className="py-3 pr-4 text-surface-400">{timeAgo(r.created_at)}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => openStatus(r)}
                            className="rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-surface-700 dark:text-surface-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => setAssignTarget(r)}
                            className="flex items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-surface-700 dark:text-surface-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
                          >
                            <UserPlus className="h-3 w-3" /> Assign
                          </button>
                          <button
                            onClick={() => {
                              setSeverityTarget(r)
                              setNewSeverity(r.severity)
                            }}
                            className="rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-surface-700 dark:text-surface-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
                          >
                            Severity
                          </button>
                          {r.status !== 'resolved' && (
                            <button
                              onClick={() => setResolveTarget(r)}
                              className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:border-green-300 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400"
                            >
                              <ImagePlus className="h-3 w-3" /> Resolve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setReportStatus(r.id, 'rejected', 'Rejected by administrator review.')
                                toast('Report rejected', `Report ${r.id.slice(-4)} was rejected.`)
                              }}
                              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:border-red-300 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
                            >
                              <Ban className="h-3 w-3" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status modal */}
      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={`Update status — #${statusTarget?.id.slice(-4)}`}
        description={statusTarget ? `${statusLabel(statusTarget.status)} → new state` : undefined}
      >
        <div className="space-y-4">
          <Select label="New status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as ReportStatus)}>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </Select>
          <Textarea
            label="Note (optional)"
            placeholder="e.g. Assigned to street maintenance crew #3"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStatusTarget(null)}>Cancel</Button>
            <Button onClick={applyStatus} leftIcon={<FileCheck2 className="h-4 w-4" />}>Apply status</Button>
          </div>
        </div>
      </Modal>

      {/* Severity modal */}
      <Modal
        open={Boolean(severityTarget)}
        onClose={() => setSeverityTarget(null)}
        title={`Adjust severity — #${severityTarget?.id.slice(-4)}`}
        description="Correct the severity if the AI assessment was off."
      >
        <div className="space-y-4">
          <Select
            label="New severity"
            value={newSeverity}
            onChange={(e) => setNewSeverity(e.target.value as Severity)}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{SEVERITY_META[s].label}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSeverityTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!severityTarget) return
                setReportSeverity(severityTarget.id, newSeverity)
                toast('Severity updated', `${severityTarget.id.slice(-4)} is now ${newSeverity}.`)
                setSeverityTarget(null)
              }}
            >
              Save severity
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        title={`Assign report — #${assignTarget?.id.slice(-4)}`}
        description="Assign this report to a maintenance team or admin."
      >
        <div className="space-y-4">
          <Select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Select a team…</option>
            {adminUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            {db.users.filter((u) => u.role === 'citizen').slice(0, 3).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button onClick={applyAssign} disabled={!assignee} leftIcon={<UserPlus className="h-4 w-4" />}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Resolve modal */}
      <Modal
        open={Boolean(resolveTarget)}
        onClose={() => setResolveTarget(null)}
        title={`Resolve report — #${resolveTarget?.id.slice(-4)}`}
        description="Upload a resolution photo to close this report."
      >
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50/60 text-center transition-colors hover:border-brand-400 dark:border-surface-700 dark:bg-surface-800/50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Camera className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">Upload resolution photo</p>
              <p className="mt-0.5 text-xs text-surface-400">The street fixed, after the work is done</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => readResolutionImage(e.target.files?.[0])}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setResolveTarget(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
