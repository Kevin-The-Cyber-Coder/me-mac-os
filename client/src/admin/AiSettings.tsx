import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  ErrorState,
  Field,
  Input,
  Progress,
  Select,
  Skeleton,
  StatCard,
  Textarea,
  Toggle,
} from '../components/ui'
import { api, apiError } from '../lib/api'
import { confirmDialog, toast } from '../lib/toast'
import { formatNumber, timeAgo } from '../lib/utils'

interface AiSettings {
  enabled: boolean
  provider: string
  baseUrl: string
  model: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  dailyLimit: number
  retentionDays: number
}

interface KeyInfo {
  envKeyConfigured: boolean
  storedKey: 'set' | 'none'
  masked: string
}

interface Usage {
  conversations: number
  messages: number
  tokens: number
  avgLatencyMs: number
  recentConversations: { id: string; title: string; messageCount: number; lastMessageAt: string }[]
}

interface TestResult {
  ok: boolean
  status?: number
  mode: string
  reply?: string | null
  error?: string | null
  message?: string
}

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { id: 'together', label: 'Together AI', baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  { id: 'custom', label: 'Custom (OpenAI-compatible)', baseUrl: '', model: '' },
]

export default function AiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [purging, setPurging] = useState(false)
  const [retention, setRetention] = useState('30')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settingsRes, usageRes] = await Promise.all([
        api.get('/admin/ai/settings'),
        api.get('/admin/ai/usage'),
      ])
      setSettings(settingsRes.data.settings as AiSettings)
      setKeyInfo(settingsRes.data.key as KeyInfo)
      setUsage(usageRes.data.usage as Usage)
      setRetention(String(settingsRes.data.settings.retentionDays || 30))
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setField = (key: keyof AiSettings, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const applyPreset = (providerId: string) => {
    const preset = PROVIDERS.find((item) => item.id === providerId)
    if (!preset || !settings) return
    setSettings({
      ...settings,
      provider: preset.id,
      baseUrl: preset.baseUrl || settings.baseUrl,
      model: preset.model || settings.model,
    })
  }

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...settings }
      if (apiKey.trim()) payload.apiKey = apiKey.trim()
      await api.put('/admin/ai/settings', payload)
      setApiKey('')
      toast('ARENA AI settings saved')
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await api.post('/admin/ai/test')
      setTestResult(data.result as TestResult)
    } catch (err) {
      setTestResult({ ok: false, mode: 'error', error: apiError(err) })
    } finally {
      setTesting(false)
    }
  }

  const purge = async () => {
    const days = Math.max(1, Number(retention) || 30)
    const confirmed = await confirmDialog(
      'Purge AI conversations?',
      `Every conversation older than ${days} day${days === 1 ? '' : 's'} and all of its messages will be permanently deleted.`,
      'Purge'
    )
    if (!confirmed) return
    setPurging(true)
    try {
      const { data } = await api.delete('/admin/ai/conversations', { params: { olderThanDays: days } })
      toast(`${data.removed || 0} conversation(s) removed`)
      await load()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setPurging(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[88px]" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error || !settings) return <ErrorState message={error || 'AI settings could not be loaded.'} onRetry={load} />

  const keyConfigured = Boolean(keyInfo?.envKeyConfigured) || keyInfo?.storedKey === 'set'
  const mode = keyConfigured ? 'Provider streaming' : 'Verified portfolio mode'

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            Intelligence
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            ARENA AI configuration
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Provider, model, limits and retention. API keys are encrypted server-side and never returned to the browser.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={settings.enabled ? 'success' : 'danger'}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: settings.enabled ? '#34d399' : '#fb7185' }} />
              {settings.enabled ? 'enabled' : 'disabled'}
            </Badge>
            <Badge tone={keyConfigured ? 'accent' : 'warning'}>
              <KeyRound className="h-2.5 w-2.5" /> {keyConfigured ? 'key configured' : 'no provider key'}
            </Badge>
            <Badge tone="default">{mode}</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Reload
          </Button>
          <Button size="sm" onClick={save} loading={saving} icon={<Save className="h-3.5 w-3.5" />}>
            Save settings
          </Button>
        </div>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Conversations"
          value={formatNumber(usage?.conversations || 0)}
          hint="retained records"
          icon={<Bot className="h-4 w-4" />}
        />
        <StatCard
          label="Messages"
          value={formatNumber(usage?.messages || 0)}
          hint="all roles"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Assistant tokens"
          value={formatNumber(usage?.tokens || 0)}
          hint="reported by provider"
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="Avg latency"
          value={usage?.avgLatencyMs ? `${usage.avgLatencyMs} ms` : '—'}
          hint="assistant responses"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Plug className="h-3.5 w-3.5 text-[var(--accent)]" />
            <h2 className="font-display text-[13.5px] font-semibold text-fg">Provider</h2>
          </div>

          <div className="space-y-3.5">
            <div className="rounded-xl border border-[var(--stroke)] px-3 py-2.5">
              <Toggle
                checked={settings.enabled}
                onChange={(next) => setField('enabled', next)}
                label="Enable ARENA AI"
                description="When disabled, the public assistant returns a clear unavailable message."
              />
            </div>

            <Field label="Provider preset" hint="Presets fill a sensible base URL and model; every field stays editable.">
              <div className="flex flex-wrap gap-1.5">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => applyPreset(provider.id)}
                    className={
                      settings.provider === provider.id
                        ? 'rounded-lg border border-[var(--stroke-strong)] bg-white/[0.07] px-2 py-1 text-[10.5px] text-fg'
                        : 'rounded-lg border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-muted hover:text-fg'
                    }
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Provider ID" required>
                <Input value={settings.provider} onChange={(event) => setField('provider', event.target.value)} />
              </Field>
              <Field label="Model" required>
                <Input value={settings.model} onChange={(event) => setField('model', event.target.value)} />
              </Field>
              <Field label="Base URL" required hint="OpenAI-compatible /chat/completions endpoint." className="sm:col-span-2">
                <Input value={settings.baseUrl} onChange={(event) => setField('baseUrl', event.target.value)} />
              </Field>
            </div>

            <Field
              label="API key"
              hint={
                keyConfigured
                  ? `A key is already configured (${keyInfo?.masked || 'hidden'}). Leave blank to keep it.`
                  : 'Paste a provider key. It is encrypted at rest and never sent to the client again.'
              }
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={keyConfigured ? '•••••••• (unchanged)' : 'sk-…'}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <Button variant="secondary" size="sm" onClick={test} loading={testing} icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Test
                </Button>
              </div>
            </Field>

            {testResult && (
              <Alert tone={testResult.ok ? 'success' : 'warning'} title={testResult.ok ? 'Provider responded' : 'Test result'}>
                <div className="mt-1 space-y-1 text-[11.5px]">
                  <p className="flex items-center gap-1.5">
                    {testResult.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-amber-400" />
                    )}
                    mode · {testResult.mode}
                    {testResult.status ? ` · HTTP ${testResult.status}` : ''}
                  </p>
                  {testResult.reply && <p className="font-mono text-[10.5px]">reply · {testResult.reply}</p>}
                  {(testResult.error || testResult.message) && (
                    <p className="text-[10.5px]">{testResult.error || testResult.message}</p>
                  )}
                </div>
              </Alert>
            )}

            <Field label="System prompt" hint="Leave empty to use the built-in portfolio-grounded prompt.">
              <Textarea
                value={settings.systemPrompt}
                onChange={(event) => setField('systemPrompt', event.target.value)}
                className="min-h-[130px]"
                placeholder="You are ARENA AI…"
              />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Max tokens" hint="128 – 8000">
                <Input
                  type="number"
                  min={128}
                  max={8000}
                  value={settings.maxTokens}
                  onChange={(event) => setField('maxTokens', Number(event.target.value))}
                />
              </Field>
              <Field label="Temperature" hint="0 – 2">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={2}
                  value={settings.temperature}
                  onChange={(event) => setField('temperature', Number(event.target.value))}
                />
              </Field>
              <Field label="Daily message limit" hint="Per visitor, per day.">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={settings.dailyLimit}
                  onChange={(event) => setField('dailyLimit', Number(event.target.value))}
                />
              </Field>
              <Field label="Retention (days)" hint="Used by the purge tool below.">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.retentionDays}
                  onChange={(event) => setField('retentionDays', Number(event.target.value))}
                />
              </Field>
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Key isolation
            </h2>
            <ul className="mt-2 space-y-1.5">
              {[
                'Keys are encrypted at rest with AES-256-GCM',
                'The browser only ever receives a masked hint',
                'Requests stream through the server proxy',
                'Usage limits are enforced server-side',
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-2.5 space-y-1 rounded-lg border border-[var(--stroke)] px-2.5 py-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--fg-faint)]">Environment key</span>
                <span className="font-mono text-[var(--fg-muted)]">{keyInfo?.envKeyConfigured ? 'present' : 'absent'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--fg-faint)]">Stored key</span>
                <span className="font-mono text-[var(--fg-muted)]">{keyInfo?.storedKey || 'none'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--fg-faint)]">Masked</span>
                <span className="font-mono text-[9.5px] text-[var(--fg-faint)]">{keyInfo?.masked || '—'}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-fg">
              <Database className="h-3.5 w-3.5 text-[var(--accent)]" /> Retention
            </h2>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">
              Purge conversations older than the configured window. Messages are deleted with their conversation.
            </p>
            <div className="mt-2 flex items-end gap-2">
              <Field label="Older than (days)" className="flex-1">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={retention}
                  onChange={(event) => setRetention(event.target.value)}
                />
              </Field>
              <Button
                variant="danger"
                size="sm"
                loading={purging}
                onClick={purge}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Purge
              </Button>
            </div>
            <Progress
              value={usage && settings.dailyLimit ? Math.min(100, (usage.messages / (settings.dailyLimit * 30)) * 100) : 0}
              className="mt-2.5"
            />
            <p className="mt-1 text-[9px] text-[var(--fg-faint)]">
              Approx. monthly capacity · {formatNumber(settings.dailyLimit * 30)} messages
            </p>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[13px] font-semibold text-fg">Recent conversations</h2>
              <Link to="/admin/conversations" className="text-[10px] text-muted hover:text-fg">
                All
              </Link>
            </div>
            <div className="mt-2 space-y-1.5">
              {(usage?.recentConversations || []).slice(0, 6).map((conversation) => (
                <div key={conversation.id} className="rounded-lg border border-[var(--stroke)] px-2 py-1.5">
                  <p className="truncate text-[10.5px] text-fg">{conversation.title}</p>
                  <p className="text-[9px] text-[var(--fg-faint)]">
                    {conversation.messageCount || 0} messages · {timeAgo(conversation.lastMessageAt)}
                  </p>
                </div>
              ))}
              {(usage?.recentConversations || []).length === 0 && (
                <p className="text-[10.5px] text-[var(--fg-faint)]">No conversations yet.</p>
              )}
            </div>
            <Link
              to="/admin/conversations"
              className="mt-2 flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
            >
              Manage conversations <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>

      {!keyConfigured && (
        <Alert tone="info" title="Running in verified portfolio mode">
          Without a provider key, ARENA AI answers directly from published projects, skills, services and articles. It is
          clearly labelled and never invents statistics. Add a key above to enable provider streaming.
        </Alert>
      )}

      {!settings.enabled && (
        <Alert tone="warning" title="Assistant disabled">
          <span className="flex items-start gap-1.5">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Visitors will see a disabled notice in the assistant. Save with “Enable ARENA AI” switched on to restore it.
          </span>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-[var(--stroke)] pt-3">
        <p className="flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
          <Loader2 className="h-3 w-3" /> Changes take effect on the next request — no restart required.
        </p>
        <Button onClick={save} loading={saving} icon={<Save className="h-3.5 w-3.5" />}>
          Save settings
        </Button>
      </div>
    </div>
  )
}
