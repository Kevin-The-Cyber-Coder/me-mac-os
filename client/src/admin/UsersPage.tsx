import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  UserX,
  XCircle,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Toggle,
} from '../components/ui'
import { api, apiError } from '../lib/api'
import { confirmDialog, toast } from '../lib/toast'
import { useAuth } from '../store/auth'
import { cn, formatDate, timeAgo } from '../lib/utils'
import type { AdminUser } from '../types'

interface UserRow extends AdminUser {
  active: boolean
  createdAt?: string
  lastLoginAt?: string
}

interface FormState {
  name: string
  email: string
  role: 'admin' | 'editor'
  password: string
  active: boolean
}

const EMPTY_FORM: FormState = { name: '', email: '', role: 'editor', password: '', active: true }

export default function UsersPage() {
  const current = useAuth((state) => state.admin)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const isAdmin = current?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/admin/users')
      setUsers((data.users || []) as UserRow[])
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (user: UserRow) => {
    setEditing(user)
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role === 'admin' ? 'admin' : 'editor',
      password: '',
      active: user.active !== false,
    })
    setFormErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const setField = (key: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    if (!editing) {
      if (!form.email.trim()) errors.email = 'Email is required.'
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
      if (!form.password) errors.password = 'Password is required for a new account.'
    }
    if (form.password && form.password.length < 8) errors.password = 'Use at least 8 characters.'
    return errors
  }

  const save = async () => {
    const errors = validate()
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      setFormError('Please correct the highlighted fields.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          role: form.role,
          active: form.active,
        }
        if (form.password) payload.password = form.password
        await api.patch(`/admin/users/${editing.id}`, payload)
        toast('Administrator updated')
      } else {
        await api.post('/admin/users', {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          password: form.password,
        })
        toast('Administrator created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (user: UserRow) => {
    if (user.id === current?.id && user.active) {
      toast('You cannot deactivate your own account', 'error')
      return
    }
    setBusyId(user.id)
    try {
      await api.patch(`/admin/users/${user.id}`, { active: !user.active })
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, active: !user.active } : item)))
      toast(user.active ? 'Account deactivated' : 'Account reactivated')
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (user: UserRow) => {
    if (user.id === current?.id) {
      toast('You cannot delete your own account', 'error')
      return
    }
    const confirmed = await confirmDialog(
      'Delete administrator?',
      `${user.name} (${user.email}) will lose access immediately. This cannot be undone.`,
      'Delete account'
    )
    if (!confirmed) return
    setBusyId(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      toast('Administrator removed')
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      active: users.filter((user) => user.active !== false).length,
    }),
    [users]
  )

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            System
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Users &amp; security
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Administrator accounts and role-based access. Editors manage content; admins also manage users, backup and
            security settings.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="default">{counts.total} accounts</Badge>
            <Badge tone="accent">{counts.admins} admin{counts.admins === 1 ? '' : 's'}</Badge>
            <Badge tone={counts.active === counts.total ? 'success' : 'warning'}>{counts.active} active</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={load}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
              New administrator
            </Button>
          )}
        </div>
      </header>

      {!isAdmin && (
        <Alert tone="warning" title="Read-only access">
          Only administrators can create, edit or remove accounts. Ask an administrator for elevated permissions.
        </Alert>
      )}

      <Alert tone="info" title="Security policy">
        Passwords are hashed with bcrypt and never returned by the API. Sessions use short-lived access tokens with an
        httpOnly refresh cookie. Rotate the seeded administrator password before deploying.
      </Alert>

      {loading && users.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[72px]" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && users.length === 0 && (
        <div className="glass rounded-2xl">
          <EmptyState
            title="No administrator accounts"
            description="Create the first administrator account to manage this portfolio."
            icon={<UserCog className="h-5 w-5" />}
            action={
              isAdmin ? (
                <Button size="sm" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
                  New administrator
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="grid gap-2.5">
          {users.map((user) => {
            const isSelf = user.id === current?.id
            return (
              <div
                key={user.id}
                className={cn(
                  'glass flex flex-wrap items-center gap-3 rounded-2xl p-3.5 transition-opacity',
                  busyId === user.id && 'opacity-60'
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] font-display text-[12px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                  {(user.name || 'A')
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-[12.5px] font-medium text-fg">{user.name || 'Unnamed'}</p>
                    {isSelf && <Badge tone="accent">you</Badge>}
                    <Badge tone={user.role === 'admin' ? 'accent' : 'default'}>
                      {user.role === 'admin' ? <ShieldCheck className="h-2.5 w-2.5" /> : <UserCog className="h-2.5 w-2.5" />}
                      {user.role}
                    </Badge>
                    <Badge tone={user.active !== false ? 'success' : 'danger'}>
                      {user.active !== false ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5" />
                      )}
                      {user.active !== false ? 'active' : 'disabled'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--fg-faint)]">
                    <span className="flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5" /> {user.email}
                    </span>
                    <span>· created {formatDate(user.createdAt || '')}</span>
                    {user.lastLoginAt && <span>· last login {timeAgo(user.lastLoginAt)}</span>}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleActive(user)}
                      disabled={busyId === user.id || isSelf}
                      icon={user.active !== false ? <UserX className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    >
                      {user.active !== false ? 'Disable' : 'Enable'}
                    </Button>
                    <button
                      onClick={() => openEdit(user)}
                      className="rounded-md border border-[var(--stroke)] p-1.5 text-muted transition-colors hover:text-fg"
                      aria-label={`Edit ${user.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(user)}
                      disabled={busyId === user.id || isSelf}
                      className="rounded-md border border-[var(--stroke)] p-1.5 text-muted transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Access model
        </h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--stroke)] p-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" /> Administrator
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              Full access: content, users, AI provider configuration, backup and restore, and destructive actions.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--stroke)] p-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-fg">
              <UserCog className="h-3.5 w-3.5 text-[var(--accent)]" /> Editor
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              Manages content and moderation. Cannot create accounts, change roles, or restore backups.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit administrator' : 'New administrator'}
        description={
          editing
            ? 'Update profile, role or reset the password. Leave the password blank to keep the current one.'
            : 'Create an account with access to the command center.'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              loading={saving}
              icon={editing ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            >
              {editing ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <div className="space-y-3">
          <Field label="Full name" required error={formErrors.name}>
            <Input
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Jane Doe"
              aria-invalid={Boolean(formErrors.name)}
            />
          </Field>
          <Field label="Email" required error={formErrors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="jane@example.com"
              disabled={Boolean(editing)}
              aria-invalid={Boolean(formErrors.email)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Select value={form.role} onChange={(event) => setField('role', event.target.value)}>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
            <Field
              label={editing ? 'New password' : 'Password'}
              required={!editing}
              error={formErrors.password}
              hint={editing ? 'Leave blank to keep current.' : 'Minimum 8 characters.'}
            >
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                placeholder={editing ? '••••••••' : 'At least 8 characters'}
                autoComplete="new-password"
                aria-invalid={Boolean(formErrors.password)}
              />
            </Field>
          </div>
          {editing && (
            <div className="rounded-xl border border-[var(--stroke)] px-3 py-2.5">
              <Toggle
                checked={form.active}
                onChange={(next) => setField('active', next)}
                disabled={editing.id === current?.id}
                label="Account active"
                description={
                  editing.id === current?.id
                    ? 'You cannot disable your own account.'
                    : 'Disabled accounts cannot sign in until re-enabled.'
                }
              />
            </div>
          )}
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--fg-faint)]">
            <KeyRound className="mt-0.5 h-3 w-3 shrink-0" />
            Passwords are hashed server-side with bcrypt. This panel never displays or retrieves stored passwords.
          </p>
        </div>
      </Modal>
    </div>
  )
}
