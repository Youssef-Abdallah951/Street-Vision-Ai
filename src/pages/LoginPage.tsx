import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, LogIn } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const toast = useAuthStore((s) => s.toast)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const doLogin = async (e?: React.FormEvent, prefill?: { email: string; password: string }) => {
    e?.preventDefault()
    const em = prefill?.email ?? email
    const pw = prefill?.password ?? password
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 500))
    const res = await login(em, pw)
    setLoading(false)
    if (res.ok) {
      toast('Welcome back', 'You have been signed in.')
      const deadline = Date.now() + 8000
      while (!useAuthStore.getState().user && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50))
      }
      const user = useAuthStore.getState().user
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } else {
      setError(res.error ?? 'Login failed.')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to report problems, confirm issues and track repairs."
      footer={
        <>
          <span className="text-surface-400">New to StreetVision AI?</span>{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={doLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            containerClassName=""
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <input type="checkbox" className="h-4 w-4 rounded border-surface-300 accent-brand-600" defaultChecked />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading} leftIcon={<LogIn className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
        <span className="text-xs font-medium uppercase tracking-wide text-surface-400">Demo access</span>
        <span className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-surface-400">
        <KeyRound className="h-3.5 w-3.5" />
        Contact your administrator for a demo account.
      </p>
    </AuthLayout>
  )
}
