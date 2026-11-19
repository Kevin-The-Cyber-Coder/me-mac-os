import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileJson,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  FilterPills,
  Input,
  Modal,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
  Toggle,
} from '../components/ui'
import { COLLECTIONS, type CollectionConfig, type FieldDef } from './fieldRegistry'
import { api, apiError, uploadFiles } from '../lib/api'
import { confirmDialog, toast } from '../lib/toast'
import { cn, formatDate } from '../lib/utils'

type Row = Record<string, any>

interface ListResponse {
  items: Row[]
  total: number
  page: number
  pages: number
  limit: number
}

const statusTone = (value: string): 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' => {
  const key = String(value).toLowerCase()
  if (['published', 'approved', 'sent', 'sponsored', 'subscribed', 'replied', 'reviewed', 'completed'].includes(key))
    return 'success'
  if (['pending', 'scheduled', 'sending', 'new', 'unreviewed', 'in-progress', 'limited'].includes(key)) return 'warning'
  if (['rejected', 'spam', 'archived', 'unsubscribed', 'failed', 'danger'].includes(key)) return 'danger'
  if (['draft', 'read', 'concept'].includes(key)) return 'info'
  return 'default'
}

const humanize = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim()

function hydrate(config: CollectionConfig, item?: Row | null): Row {
  const record: Row = {}
  config.fields.forEach((field) => {
    const value = item ? item[field.key] : field.defaultValue
    if (field.type === 'tags') {
      record[field.key] = Array.isArray(value) ? value.join(', ') : value ? String(value) : ''
    } else if (field.type === 'json') {
      record[field.key] = value && typeof value === 'object' ? JSON.stringify(value, null, 2) : value ? String(value) : ''
    } else if (field.type === 'date') {
      record[field.key] = value ? String(value).slice(0, 10) : ''
    } else if (field.type === 'boolean') {
      record[field.key] = Boolean(value)
    } else if (field.type === 'number') {
      record[field.key] = value === undefined || value === null ? '' : value
    } else {
      record[field.key] = value ?? ''
    }
  })
  return record
}

function toPayload(config: CollectionConfig, record: Row): Row {
  const payload: Row = {}
  for (const field of config.fields) {
    const raw = record[field.key]
    if (field.type === 'tags') {
      payload[field.key] = String(raw || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
      continue
    }
    if (field.type === 'json') {
      const text = String(raw || '').trim()
      if (!text) continue
      try {
        payload[field.key] = JSON.parse(text)
      } catch {
        throw new Error(`${field.label} is not valid JSON.`)
      }
      continue
    }
    if (field.type === 'number') {
      if (raw === '' || raw === undefined || raw === null) continue
      payload[field.key] = Number(raw)
      continue
    }
    if (field.type === 'boolean') {
      payload[field.key] = Boolean(raw)
      continue
    }
    if (raw === '' || raw === undefined || raw === null) continue
    payload[field.key] = raw
  }
  return payload
}

function validate(config: CollectionConfig, record: Row): Record<string, string> {
  const errors: Record<string, string> = {}
  config.fields.forEach((field) => {
    if (!field.required) return
    const value = record[field.key]
    if (field.type === 'tags') {
      if (!String(value || '').trim()) errors[field.key] = `${field.label} is required.`
    } else if (value === '' || value === undefined || value === null) {
      errors[field.key] = `${field.label} is required.`
    }
  })
  return errors
}

function ImageField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const files = await uploadFiles([file])
      if (files[0]?.url) {
        onChange(files[0].url)
        toast('Image uploaded')
      }
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://… or upload a file"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
          icon={<Upload className="h-3.5 w-3.5" />}
        >
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
      </div>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] p-2">
          {/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(value) || value.startsWith('data:image') ? (
            <img src={value} alt="Preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded bg-white/[0.05] text-muted">
              <ImageIcon className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-[var(--fg-faint)]">{value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded p-1 text-muted hover:text-rose-300"
            aria-label="Clear image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-[10px] text-[var(--fg-faint)]">{field.hint || 'Paste a URL or upload an asset.'}</p>
      )}
    </div>
  )
}

function FieldControl({
  field,
  record,
  error,
  setValue,
}: {
  field: FieldDef
  record: Row
  error?: string
  setValue: (key: string, value: unknown) => void
}) {
  const value = record[field.key]

  if (field.type === 'boolean') {
    return (
      <div className="flex min-h-[42px] items-center rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-3.5">
        <Toggle checked={Boolean(value)} onChange={(next) => setValue(field.key, next)} label={field.label} />
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <Select value={String(value ?? '')} onChange={(event) => setValue(field.key, event.target.value)}>
        <option value="">Select…</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </Select>
    )
  }

  if (field.type === 'image') {
    return <ImageField field={field} value={String(value || '')} onChange={(next) => setValue(field.key, next)} />
  }

  if (field.type === 'textarea' || field.type === 'json') {
    return (
      <Textarea
        value={String(value ?? '')}
        onChange={(event) => setValue(field.key, event.target.value)}
        placeholder={field.placeholder}
        className={field.type === 'json' ? 'min-h-[130px] font-mono text-[11.5px]' : undefined}
        aria-invalid={Boolean(error)}
      />
    )
  }

  return (
    <Input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'password' ? 'password' : 'text'}
      value={String(value ?? '')}
      onChange={(event) => setValue(field.key, event.target.value)}
      placeholder={field.placeholder}
      aria-invalid={Boolean(error)}
    />
  )
}

export default function CollectionPage({ collection }: { collection: string }) {
  const config = COLLECTIONS[collection]
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState<Row | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Row>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const openedNew = useRef(false)

  const readOnly = Boolean(config?.readOnly)
  const statusField = config?.statusField
  const statusOptions = useMemo(() => {
    if (!config || !statusField) return []
    return config.fields.find((field) => field.key === statusField)?.options || []
  }, [config, statusField])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await api.get(`/admin/${collection}`, {
        params: {
          q: debouncedQuery || undefined,
          page,
          limit: 20,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      })
      setData(response as ListResponse)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [collection, config, debouncedQuery, page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setQuery('')
    setPage(1)
    setStatusFilter('all')
    setData(null)
  }, [collection])

  const openCreate = useCallback(() => {
    if (!config || readOnly) return
    setEditing(null)
    setForm(hydrate(config))
    setFormErrors({})
    setFormError(null)
    setModalOpen(true)
  }, [config, readOnly])

  useEffect(() => {
    if (openedNew.current) return
    if (searchParams.get('new') === '1' && config && !readOnly) {
      openedNew.current = true
      openCreate()
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, config, readOnly, openCreate])

  const openEdit = (item: Row) => {
    if (!config || readOnly) return
    setEditing(item)
    setForm(hydrate(config, item))
    setFormErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const setValue = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const save = async () => {
    if (!config) return
    const errors = validate(config, form)
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      setFormError('Please complete the required fields.')
      return
    }
    let payload: Row
    try {
      payload = toPayload(config, form)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invalid form data.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await api.patch(`/admin/${collection}/${editing.id}`, payload)
        toast(`${config.singular} updated`)
      } else {
        await api.post(`/admin/${collection}`, payload)
        toast(`${config.singular} created`)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: Row) => {
    if (!config) return
    const label = item[config.rowTitle] || config.singular
    const confirmed = await confirmDialog(`Delete ${config.singular}?`, `"${label}" will be permanently removed.`, 'Delete')
    if (!confirmed) return
    setBusyId(item.id)
    try {
      await api.delete(`/admin/${collection}/${item.id}`)
      toast(`${config.singular} deleted`)
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const patchStatus = async (item: Row, status: string) => {
    setBusyId(item.id)
    try {
      await api.patch(`/admin/${collection}/${item.id}`, { status })
      toast(`Marked as ${status}`)
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const sendCampaign = async (item: Row) => {
    const confirmed = await confirmDialog(
      'Send this campaign?',
      `This emails every confirmed subscriber. "${item.subject || 'Untitled campaign'}" cannot be unsent.`,
      'Send campaign'
    )
    if (!confirmed) return
    setBusyId(item.id)
    try {
      const { data: response } = await api.post(`/admin/campaigns/${item.id}/send`)
      toast(response.message || 'Campaign sent')
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const markNotification = async (item: Row) => {
    setBusyId(item.id)
    try {
      await api.patch(`/admin/notifications/${item.id}/read`)
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (!config) {
    return <ErrorState message={`Unknown collection "${collection}".`} />
  }

  const items = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || 1

  const renderCell = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return <span className="text-[var(--fg-faint)]">—</span>
    const field = config.fields.find((entry) => entry.key === key)
    if (typeof value === 'boolean') {
      return (
        <Badge tone={value ? 'success' : 'default'}>
          {value ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }
    if (key === 'status' || key.endsWith('Status')) {
      return <Badge tone={statusTone(String(value))}>{String(value)}</Badge>
    }
    if (Array.isArray(value)) {
      return (
        <span className="line-clamp-1 max-w-[240px] text-[var(--fg-muted)]" title={value.join(', ')}>
          {value.length ? value.join(', ') : '—'}
        </span>
      )
    }
    if (typeof value === 'object') {
      return <span className="font-mono text-[10px] text-[var(--fg-faint)]">{JSON.stringify(value).slice(0, 48)}…</span>
    }
    if (field?.type === 'date' || key.endsWith('At') || key === 'date') {
      return <span className="whitespace-nowrap text-[var(--fg-muted)]">{formatDate(String(value))}</span>
    }
    if (field?.type === 'number' || typeof value === 'number') {
      return <span className="font-mono text-[var(--fg-muted)]">{String(value)}</span>
    }
    const text = String(value)
    return (
      <span className="line-clamp-1 block max-w-[260px] text-[var(--fg-muted)]" title={text}>
        {text}
      </span>
    )
  }

  const rowActions = (item: Row) => {
    const actions: { label: string; icon: React.ReactNode; tone?: 'success' | 'danger' | 'default'; run: () => void }[] = []

    if (collection === 'comments') {
      if (item.status !== 'approved')
        actions.push({
          label: 'Approve',
          icon: <CheckCircle2 className="h-3 w-3" />,
          tone: 'success',
          run: () => patchStatus(item, 'approved'),
        })
      if (item.status !== 'rejected')
        actions.push({
          label: 'Reject',
          icon: <XCircle className="h-3 w-3" />,
          tone: 'danger',
          run: () => patchStatus(item, 'rejected'),
        })
    }

    if (collection === 'messages') {
      if (item.status === 'new')
        actions.push({
          label: 'Mark read',
          icon: <Check className="h-3 w-3" />,
          run: () => patchStatus(item, 'read'),
        })
      if (item.status !== 'replied' && item.status !== 'archived')
        actions.push({
          label: 'Replied',
          icon: <Send className="h-3 w-3" />,
          run: () => patchStatus(item, 'replied'),
        })
    }

    if (collection === 'feedback' && item.status === 'new')
      actions.push({
        label: 'Review',
        icon: <CheckCircle2 className="h-3 w-3" />,
        run: () => patchStatus(item, 'reviewed'),
      })

    if (collection === 'campaigns' && item.status !== 'sent')
      actions.push({
        label: 'Send',
        icon: <Send className="h-3 w-3" />,
        tone: 'success',
        run: () => sendCampaign(item),
      })

    if (collection === 'notifications' && !item.read)
      actions.push({
        label: 'Mark read',
        icon: <Check className="h-3 w-3" />,
        run: () => markNotification(item),
      })

    if (collection === 'subscribers')
      actions.push({
        label: item.status === 'unsubscribed' ? 'Resubscribe' : 'Unsubscribe',
        icon: item.status === 'unsubscribed' ? <Check className="h-3 w-3" /> : <XCircle className="h-3 w-3" />,
        run: () => patchStatus(item, item.status === 'unsubscribed' ? 'subscribed' : 'unsubscribed'),
      })

    return actions
  }

  return (
    <div className="space-y-3">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            {readOnly ? 'Read-only records' : 'Content management'}
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            {config.title}
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">{config.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            loading={loading}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
              New {config.singular}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Search ${config.title.toLowerCase()}…`}
          className="sm:max-w-xs"
        />
        {statusField && statusOptions.length > 0 && (
          <FilterPills
            options={['all', ...statusOptions] as const}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            className="sm:ml-auto"
          />
        )}
      </div>

      {readOnly && (
        <Alert tone="info">
          This collection is a system record set. Entries are written by the application and cannot be created or edited
          here.
        </Alert>
      )}

      {loading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && items.length === 0 && (
        <div className="glass rounded-2xl">
          <EmptyState
            title={debouncedQuery || statusFilter !== 'all' ? 'No matching records' : `No ${config.title.toLowerCase()} yet`}
            description={
              debouncedQuery || statusFilter !== 'all'
                ? 'Try a different search term or clear the status filter.'
                : readOnly
                  ? 'Records will appear here as the application writes them.'
                  : `Create the first ${config.singular} to populate this section.`
            }
            action={
              !readOnly && !debouncedQuery && statusFilter === 'all' ? (
                <Button size="sm" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
                  New {config.singular}
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--stroke)] bg-white/[0.03]">
                  {config.listFields.map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fg-faint)]"
                    >
                      {humanize(key)}
                    </th>
                  ))}
                  <th className="w-[1%] px-3 py-2.5 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fg-faint)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const actions = rowActions(item)
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-[var(--stroke)] transition-colors last:border-0 hover:bg-white/[0.03]',
                        busyId === item.id && 'opacity-60'
                      )}
                    >
                      {config.listFields.map((key) => (
                        <td key={key} className="px-3 py-2 align-middle text-[11.5px]">
                          {renderCell(key, item[key])}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {actions.map((action) => (
                            <button
                              key={action.label}
                              onClick={action.run}
                              disabled={busyId === item.id}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9.5px] font-medium transition-colors disabled:opacity-50',
                                action.tone === 'success'
                                  ? 'border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10'
                                  : action.tone === 'danger'
                                    ? 'border-rose-500/25 text-rose-300 hover:bg-rose-500/10'
                                    : 'border-[var(--stroke)] text-muted hover:text-fg'
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => openEdit(item)}
                                className="rounded-md border border-[var(--stroke)] p-1 text-muted transition-colors hover:text-fg"
                                aria-label={`Edit ${config.singular}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => remove(item)}
                                disabled={busyId === item.id}
                                className="rounded-md border border-[var(--stroke)] p-1 text-muted transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                                aria-label={`Delete ${config.singular}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--stroke)] px-3 py-2.5">
            <p className="text-[10.5px] text-[var(--fg-faint)]">
              {total} record{total === 1 ? '' : 's'} · page {data?.page || 1} of {pages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                icon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? 'Edit' : 'New'} ${config.singular}`}
        description={config.description}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon={<Check className="h-3.5 w-3.5" />}>
              {editing ? 'Save changes' : `Create ${config.singular}`}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert tone="danger">
              <span className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {formError}
              </span>
            </Alert>
          </div>
        )}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {config.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              required={field.required}
              hint={field.type === 'image' ? undefined : field.hint}
              error={formErrors[field.key]}
              className={field.span === 2 || field.type === 'textarea' || field.type === 'json' ? 'sm:col-span-2' : undefined}
            >
              <FieldControl field={field} record={form} error={formErrors[field.key]} setValue={setValue} />
            </Field>
          ))}
        </div>
        {config.fields.some((field) => field.type === 'json') && (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
            <FileJson className="h-3 w-3" /> JSON fields are validated before saving.
          </p>
        )}
      </Modal>
    </div>
  )
}
