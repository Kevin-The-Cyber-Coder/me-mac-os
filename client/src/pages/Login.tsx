import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Wallpaper } from '../components/effects'
import { Seo } from '../components/site/Seo'
import { Alert, Badge, Button, Field, Input } from '../components/ui'
import { useAuth } from '../store/auth'
import { api, apiError } from '../lib/api'
import { toast } from '../lib/toast'

type Mode = 'login' | 'forgot' | 'reset'

export default function Login() {
  const { admin, login, loading, error } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const resetToken = params.get('reset') || ''
  const resetId = params.get('id') || ''
  const [mode, setMode] = useState<Mode>(resetToken && resetId ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (resetToken && resetId) setMode('reset')
  }, [resetToken, resetId])

  if (admin) return <Navigate to="/admin" replace />

  const from = (location.state as { from?: string } | null)?.from || '/admin'

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    const ok = await login(email.trim(), password)
    if (ok) navigate(from, { replace: true })
  }

  const submitForgot = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    setNotice(null)
    setBusy(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() })
      setNotice(data.message || 'If that account exists, a reset link has been sent.')
      toast('Reset request submitted')
    } catch (err) {
      setLocalError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post('/auth/reset-password', {
        token: resetToken,
        id: resetId,
        password,
      })
      toast(data.message || 'Password updated')
      setPassword('')
      setConfirm('')
      setNotice('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
      setMode('login')
    } catch (err) {
      setLocalError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const displayError = localError || (mode === 'login' ? error : null)

  return (
    <div className="relative flex min-h-screen items-center justify-center p-3 sm:p-6">
      <Seo title="Admin sign in" description="Secure access to the portfolio command center." noIndex />
      <Wallpaper />
      <div className="pointer-events-none absolute inset-0 bg-black/35 dark:bg-black/50" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="glass-strong window-shadow relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--stroke-strong)] md:grid-cols-[1.02fr_1fr]"
      >
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--stroke)] bg-[image:linear-gradient(150deg,rgba(124,92,255,0.22),rgba(34,211,238,0.08)_45%,transparent)] p-7 md:flex">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-[14px] font-semibold text-fg">Kevin The Cyber Coder</span>
            </Link>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--accent)_80%,white)]">
              Command Center
            </p>
            <h1 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight text-fg">
              One console for the whole portfolio.
            </h1>
            <p className="mt-2.5 max-w-sm text-[12.5px] leading-relaxed text-muted">
              Publish projects, moderate comments, inspect analytics, manage ARENA AI and verify GitHub data from a single
              secured workspace.
            </p>

            <ul className="mt-6 space-y-2">
              {[
                'JWT access tokens with rotating refresh cookies',
                'Role-based access for admins and editors',
                'Every mutation written to the activity log',
                'Secrets encrypted at rest and never sent to the browser',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--fg-muted)]">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <Badge tone="success">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> secured
            </Badge>
            <Badge tone="default">rate limited</Badge>
            <Badge tone="default">audit logged</Badge>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between md:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[image:linear-gradient(135deg,var(--accent),#22d3ee)] text-[#05060c]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-[13px] font-semibold text-fg">Kevin The Cyber Coder</span>
            </Link>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-fg">
                {mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Reset access' : 'Choose a new password'}
              </h2>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {mode === 'login'
                  ? 'Authorized administrators and editors only.'
                  : mode === 'forgot'
                    ? 'We will email a single-use reset link if the account exists.'
                    : 'Use at least 10 characters, including a letter and a number.'}
              </p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 rounded-lg border border-[var(--stroke)] px-2 py-1.5 text-[10.5px] text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="h-3 w-3" /> Site
            </Link>
          </div>

          {notice && (
            <div className="mb-3">
              <Alert tone="success">
                <span className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {notice}
                </span>
              </Alert>
            </div>
          )}

          {displayError && (
            <div className="mb-3">
              <Alert tone="danger">{displayError}</Alert>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={submitLogin} className="space-y-3">
              <Field label="Email" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-faint)]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="pl-9"
                    autoComplete="username"
                    required
                  />
                </div>
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-faint)]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setLocalError(null)
                    setNotice(null)
                  }}
                  className="text-[11px] text-muted underline-offset-2 hover:text-fg hover:underline"
                >
                  Forgot password?
                </button>
                <span className="flex items-center gap-1 text-[9.5px] text-[var(--fg-faint)]">
                  <KeyRound className="h-2.5 w-2.5" /> refresh cookie rotation
                </span>
              </div>

              <Button type="submit" className="w-full" loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
                Enter command center
              </Button>

              <p className="pt-1 text-center text-[9.5px] leading-relaxed text-[var(--fg-faint)]">
                Access is rate limited. Repeated failures are logged. Session data stays in this browser.
              </p>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={submitForgot} className="space-y-3">
              <Field label="Account email" required hint="A reset link is valid for 30 minutes and can be used once.">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-faint)]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="pl-9"
                    autoComplete="username"
                    required
                  />
                </div>
              </Field>
              <Button type="submit" className="w-full" loading={busy} icon={<ArrowRight className="h-4 w-4" />}>
                Send reset link
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setLocalError(null)
                }}
                className="flex w-full items-center justify-center gap-1 text-[11px] text-muted hover:text-fg"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={submitReset} className="space-y-3">
              <Field label="New password" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--fg-faint)]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 10 characters"
                    className="pl-9 pr-10"
                    autoComplete="new-password"
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" required>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                />
              </Field>
              <Button type="submit" className="w-full" loading={busy} icon={<KeyRound className="h-4 w-4" />}>
                Update password
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setLocalError(null)
                }}
                className="flex w-full items-center justify-center gap-1 text-[11px] text-muted hover:text-fg"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </form>
          )}

          <div className="mt-5 border-t border-[var(--stroke)] pt-3">
            <p className="text-[9px] leading-relaxed text-[var(--fg-faint)]">
              This area is protected by JWT access tokens, rotating refresh cookies and role checks. Unauthorized attempts
              are recorded with a hashed IP address.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
