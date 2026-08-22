import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((s) => s.signup)
  const toast = useAuthStore((s) => s.toast)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 600))
    const res = await signup(name, email, password)
    setLoading(false)
    if (res.ok) {
      toast('Account created', 'Welcome to StreetVision AI!')
      navigate('/dashboard', { replace: true })
    } else {
      setError(res.error ?? 'Could not create account.')
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your community and start reporting street problems in seconds."
      footer={
        <>
          <span className="text-surface-400">Already have an account?</span>{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          required
          placeholder="Jane Citizen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            hint="Use at least 8 characters."
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
        <Input
          label="Confirm password"
          type={showPw ? 'text' : 'password'}
          required
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading} leftIcon={<UserPlus className="h-4 w-4" />}>
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-surface-400">
          By creating an account you agree to the StreetVision AI terms. Your location is only used to
          pin reports you choose to submit.
        </p>
      </form>
    </AuthLayout>
  )
}
