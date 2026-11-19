import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  HardDriveDownload,
  HardDriveUpload,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Upload,
} from 'lucide-react'
import { Alert, Badge, Button, ErrorState, Skeleton, StatCard } from '../components/ui'
import { api, apiError } from '../lib/api'
import { confirmDialog, toast } from '../lib/toast'
import { useAuth } from '../store/auth'
import { formatDate, formatNumber } from '../lib/utils'

interface BackupMeta {
  app: string
  exportedAt: string
  dbMode: string
  version: number
}

interface BackupPayload {
  meta: BackupMeta
  collections: Record<string, unknown[]>
}

const EXCLUDED = ['admins', 'analytics', 'activity']

export default function BackupPage() {
  const isAdmin = useAuth((state) => state.admin?.role === 'admin')
  const [backup, setBackup] = useState<BackupPayload | null>(null)
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ name: string; collections: Record<string, unknown[]> } | null>(null)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [lastRestore, setLastRestore] = useState<Record<string, number> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadLast = useCallback(async () => {
    // The backup endpoint is the only source of a fresh manifest; avoid exporting on mount.
    setError(null)
  }, [])

  useEffect(() => {
    loadLast()
  }, [loadLast])

  const exportBackup = async (download = true) => {
    setExporting(true)
    setError(null)
    try {
      const { data } = await api.post('/admin/backup/export')
      const payload = data.backup as BackupPayload
      setBackup(payload)
      if (download) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `kevin-the-cyber-coder-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        toast('Backup exported')
      }
    } catch (err) {
      setError(apiError(err))
      toast(apiError(err), 'error')
    } finally {
      setExporting(false)
    }
  }

  const readFile = async (file: File) => {
    setPendingError(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const collections = parsed?.collections || parsed?.backup?.collections
      if (!collections || typeof collections !== 'object') {
        throw new Error('This file does not contain a backup "collections" object.')
      }
      const entries = Object.entries(collections).filter(([, docs]) => Array.isArray(docs))
      if (!entries.length) throw new Error('The backup contains no collection arrays.')
      setPending({ name: file.name, collections: Object.fromEntries(entries) as Record<string, unknown[]> })
    } catch (err) {
      setPending(null)
      setPendingError(err instanceof Error ? err.message : 'The selected file is not a valid backup.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const restore = async () => {
    if (!pending) return
    const confirmed = await confirmDialog(
      'Restore this backup?',
      'Every collection in the backup is cleared and replaced with the file contents. Administrator accounts, analytics and activity logs are never touched. This cannot be undone.',
      'Restore backup'
    )
    if (!confirmed) return
    setRestoring(true)
    try {
      const { data } = await api.post('/admin/backup/restore', { collections: pending.collections })
      setLastRestore((data.restored || {}) as Record<string, number>)
      toast('Backup restored')
      setPending(null)
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setRestoring(false)
    }
  }

  const collections = backup ? Object.entries(backup.collections) : []
  const totalDocs = collections.reduce((sum, [, docs]) => sum + docs.length, 0)

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            System
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Backup &amp; restore
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Export a portable JSON snapshot of every content collection, or restore from a previous snapshot. Excluded
            by design: administrator credentials, analytics and the activity log.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="default">
              <Database className="h-2.5 w-2.5" /> {backup?.meta.dbMode || 'repository'}
            </Badge>
            <Badge tone="default">version {backup?.meta.version || 1}</Badge>
            {backup && <Badge tone="accent">{collections.length} collections</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={() => exportBackup(true)}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Export JSON
          </Button>
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            icon={<Upload className="h-3.5 w-3.5" />}
          >
            Choose backup
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void readFile(file)
            }}
          />
        </div>
      </header>

      {!isAdmin && (
        <Alert tone="warning" title="Administrator access required">
          Backup export and restore are restricted to administrators. You can review the policy below but cannot run
          these operations.
        </Alert>
      )}

      <Alert tone="danger" title="Restore replaces content">
        <span className="flex items-start gap-1.5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Restoring clears each collection present in the file before inserting the backup documents. Always export a
          fresh snapshot before restoring an older one.
        </span>
      </Alert>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StatCard
          label="Collections in export"
          value={formatNumber(collections.length)}
          hint={backup ? 'from the latest export' : 'export to inspect'}
          icon={<FileJson className="h-4 w-4" />}
        />
        <StatCard
          label="Documents"
          value={formatNumber(totalDocs)}
          hint="across exported collections"
          icon={<HardDriveDownload className="h-4 w-4" />}
        />
        <StatCard
          label="Last export"
          value={backup ? formatDate(backup.meta.exportedAt, { hour: '2-digit', minute: '2-digit' }) : '—'}
          hint={backup ? backup.meta.app : 'not exported this session'}
          icon={<RefreshCw className="h-4 w-4" />}
        />
      </div>

      {error && <ErrorState message={error} onRetry={() => exportBackup(false)} />}

      {exporting && !backup && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      )}

      {backup && (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-[var(--stroke)] px-4 py-3">
            <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
              <Database className="h-3.5 w-3.5 text-[var(--accent)]" /> Export manifest
            </h2>
            <Button
              variant="secondary"
              size="sm"
              loading={exporting}
              onClick={() => exportBackup(false)}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--stroke)] bg-white/[0.03]">
                  <th className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fg-faint)]">
                    Collection
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fg-faint)]">
                    Documents
                  </th>
                </tr>
              </thead>
              <tbody>
                {collections
                  .slice()
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([name, docs]) => (
                    <tr key={name} className="border-b border-[var(--stroke)] last:border-0">
                      <td className="px-4 py-2 font-mono text-[11px] text-[var(--fg-muted)]">{name}</td>
                      <td className="px-4 py-2 text-right font-mono text-[11px] text-fg">{formatNumber(docs.length)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--stroke)] px-4 py-2.5">
            <p className="text-[10px] text-[var(--fg-faint)]">
              Excluded: {EXCLUDED.join(', ')}. These are never exported or overwritten by restore.
            </p>
          </div>
        </div>
      )}

      {!backup && !exporting && !error && (
        <div className="glass rounded-2xl p-5 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[color-mix(in_srgb,var(--accent)_85%,white)]">
            <ArchiveRestore className="h-5 w-5" />
          </span>
          <h2 className="mt-2 font-display text-[14px] font-semibold text-fg">No export in this session</h2>
          <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-relaxed text-muted">
            Export a snapshot to preview collection counts, or load an existing backup file to restore it.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              loading={exporting}
              onClick={() => exportBackup(true)}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              Export now
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              icon={<Upload className="h-3.5 w-3.5" />}
            >
              Load backup file
            </Button>
          </div>
        </div>
      )}

      {pending && (
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-fg">{pending.name}</p>
              <p className="text-[10px] text-[var(--fg-faint)]">
                {Object.keys(pending.collections).length} collections ·{' '}
                {formatNumber(Object.values(pending.collections).reduce((sum, docs) => sum + docs.length, 0))} documents
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Discard
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={restoring}
              disabled={!isAdmin}
              onClick={restore}
              icon={<HardDriveUpload className="h-3.5 w-3.5" />}
            >
              Restore backup
            </Button>
          </div>
          {pendingError && (
            <div className="mt-2">
              <Alert tone="danger">{pendingError}</Alert>
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {Object.entries(pending.collections).map(([name, docs]) => (
              <span
                key={name}
                className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-faint)]"
              >
                {name} · {docs.length}
              </span>
            ))}
          </div>
        </div>
      )}

      {pendingError && !pending && <Alert tone="danger">{pendingError}</Alert>}

      {lastRestore && (
        <div className="glass rounded-2xl p-4">
          <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Restore complete
          </h2>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(lastRestore).map(([name, count]) => (
              <span
                key={name}
                className="rounded border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-emerald-200"
              >
                {name} · {count}
              </span>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
            <Loader2 className="h-3 w-3" /> Reload the dashboard to see refreshed counts.
          </p>
        </div>
      )}
    </div>
  )
}
