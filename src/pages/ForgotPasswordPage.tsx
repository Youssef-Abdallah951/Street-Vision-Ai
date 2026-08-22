import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, MailCheck } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Demo mode: password reset links are simulated. In production this
    // calls Supabase auth.resetPasswordForEmail(email).
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a secure reset link."
      footer={
        <>
          <span className="text-surface-400">Remembered it?</span>{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50/70 px-6 py-10 text-center dark:border-green-900 dark:bg-green-950/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-400">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">Check your inbox</h2>
          <p className="mt-1 max-w-xs text-sm text-surface-500 dark:text-surface-400">
            If an account exists for <span className="font-medium">{email}</span>, a reset link is on
            its way.
          </p>
          <Link to="/login" className="mt-6">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button type="submit" size="lg" className="w-full" loading={loading} leftIcon={<KeyRound className="h-4 w-4" />}>
            Send reset link
          </Button>
          <p className="text-center text-xs text-surface-400">
            Demo mode: no email is actually sent — the flow is simulated end-to-end.
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
