import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Globe2,
  Image as ImageIcon,
  Info,
  Layout,
  ListChecks,
  Palette,
  RefreshCw,
  Save,
  Search,
  ServerCog,
  User,
  Wrench,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  ErrorState,
  Field,
  Input,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  Toggle,
} from '../components/ui'
import { api, apiError, uploadFiles } from '../lib/api'
import { useSite } from '../store/site'
import { toast } from '../lib/toast'
import { ACCENTS, WALLPAPERS, cn } from '../lib/utils'

type TabKey = 'general' | 'appearance' | 'seo' | 'features' | 'profile' | 'maintenance'

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: 'general', label: 'General', icon: <Globe2 className="h-3.5 w-3.5" /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette className="h-3.5 w-3.5" /> },
  { key: 'seo', label: 'SEO', icon: <Search className="h-3.5 w-3.5" /> },
  { key: 'features', label: 'Features', icon: <ListChecks className="h-3.5 w-3.5" /> },
  { key: 'profile', label: 'Profile', icon: <User className="h-3.5 w-3.5" /> },
  { key: 'maintenance', label: 'Maintenance', icon: <ServerCog className="h-3.5 w-3.5" /> },
]

const FEATURE_LABELS: Record<string, string> = {
  music: 'Music player',
  gestures: 'Camera gestures',
  assistant: 'ARENA AI assistant',
  universe: '3D universe',
  terminal: 'Developer terminal',
  newsletter: 'Newsletter',
  comments: 'Visitor comments',
}

const PROFILE_JSON_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'socials', label: 'Social links', hint: 'Array of { label, url, icon }' },
  { key: 'values', label: 'Values', hint: 'Array of { title, description, icon }' },
  { key: 'education', label: 'Education', hint: 'Array of { institution, degree, field, start, end, description }' },
  {
    key: 'experience',
    label: 'Experience',
    hint: 'Array of { company, role, start, end, current, description, technologies }',
  },
  { key: 'timeline', label: 'Timeline', hint: 'Array of { year, title, description, type }' },
  { key: 'futureGoals', label: 'Future goals', hint: 'Array of strings' },
  { key: 'stats', label: 'Profile stats', hint: 'Array of { label, value, suffix }' },
]

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function parseJsonField(text: string, label: string) {
  const trimmed = text.trim()
  if (!trimmed) return []
  try {
    return JSON.parse(trimmed)
  } catch {
    throw new Error(`${label} is not valid JSON.`)
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general')
  const [settings, setSettings] = useState<Record<string, any> | null>(null)
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [interests, setInterests] = useState('')
  const [jsonText, setJsonText] = useState<Record<string, string>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const loadSite = useSite((state) => state.load)

  const hydrateProfile = useCallback((next: Record<string, any>) => {
    setProfile(next)
    setInterests(Array.isArray(next.interests) ? next.interests.join(', ') : '')
    const texts: Record<string, string> = {}
    PROFILE_JSON_FIELDS.forEach((field) => {
      texts[field.key] = next[field.key] ? JSON.stringify(next[field.key], null, 2) : ''
    })
    setJsonText(texts)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settingsRes, profileRes] = await Promise.all([
        api.get('/admin/settings/full'),
        api.get('/admin/profile/full'),
      ])
      setSettings(settingsRes.data.settings as Record<string, any>)
      hydrateProfile((profileRes.data.profile || {}) as Record<string, any>)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [hydrateProfile])

  useEffect(() => {
    load()
  }, [load])

  const setSection = (section: string, key: string, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [section]: { ...(prev[section] || {}), [key]: value } } : prev))
  }

  const setProfileField = (key: string, value: unknown) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const { general, appearance, seo, features, maintenance, github } = settings
      await api.put('/admin/settings', { general, appearance, seo, features, maintenance, github })
      toast('Site settings saved')
      await loadSite()
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return
    setProfileSaving(true)
    setProfileError(null)
    try {
      const payload: Record<string, any> = {
        ...profile,
        interests: interests
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      }
      PROFILE_JSON_FIELDS.forEach((field) => {
        payload[field.key] = parseJsonField(jsonText[field.key] || '', field.label)
      })
      await api.put('/admin/profile', payload)
      toast('Profile updated')
      await loadSite()
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : apiError(err))
    } finally {
      setProfileSaving(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const files = await uploadFiles([file])
      if (files[0]?.url) {
        setProfileField('avatar', files[0].url)
        toast('Avatar uploaded')
      }
    } catch (err) {
      toast(apiError(err), 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const keywordsText = useMemo(
    () => (Array.isArray(settings?.seo?.keywords) ? settings?.seo?.keywords.join(', ') : ''),
    [settings?.seo?.keywords]
  )

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-9 w-96 max-w-full" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error || !settings || !profile) {
    return <ErrorState message={error || 'Settings could not be loaded.'} onRetry={load} />
  }

  const availability = profile.availability || { status: 'available', label: '' }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-[var(--stroke)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            System
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.35rem,2.8vw,1.8rem)] font-semibold leading-tight text-fg">
            Site settings
          </h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Identity, appearance, SEO, feature flags and maintenance mode. Changes propagate to the public site on save.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Reload
          </Button>
          {tab === 'profile' ? (
            <Button size="sm" onClick={saveProfile} loading={profileSaving} icon={<Save className="h-3.5 w-3.5" />}>
              Save profile
            </Button>
          ) : (
            <Button size="sm" onClick={saveSettings} loading={saving} icon={<Save className="h-3.5 w-3.5" />}>
              Save settings
            </Button>
          )}
        </div>
      </header>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'general' && (
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-[var(--accent)]" />
            <h2 className="font-display text-[13.5px] font-semibold text-fg">General identity</h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Site name">
              <Input
                value={toText(settings.general?.siteName)}
                onChange={(event) => setSection('general', 'siteName', event.target.value)}
              />
            </Field>
            <Field label="Public email">
              <Input
                type="email"
                value={toText(settings.general?.email)}
                onChange={(event) => setSection('general', 'email', event.target.value)}
              />
            </Field>
            <Field label="Default title" className="sm:col-span-2">
              <Input
                value={toText(settings.general?.title)}
                onChange={(event) => setSection('general', 'title', event.target.value)}
              />
            </Field>
            <Field label="Meta description" className="sm:col-span-2">
              <Textarea
                value={toText(settings.general?.description)}
                onChange={(event) => setSection('general', 'description', event.target.value)}
                className="min-h-[90px]"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={toText(settings.general?.phone)}
                onChange={(event) => setSection('general', 'phone', event.target.value)}
              />
            </Field>
            <Field label="Location">
              <Input
                value={toText(settings.general?.location)}
                onChange={(event) => setSection('general', 'location', event.target.value)}
              />
            </Field>
            <Field label="Résumé URL" hint="Relative paths are served from the client public directory." className="sm:col-span-2">
              <Input
                value={toText(settings.general?.resumeUrl)}
                onChange={(event) => setSection('general', 'resumeUrl', event.target.value)}
              />
            </Field>
            <Field label="GitHub username" hint="Used for public links; the API token stays in the server environment.">
              <Input
                value={toText(settings.github?.username)}
                onChange={(event) => setSection('github', 'username', event.target.value)}
              />
            </Field>
            <Field label="GitHub cache TTL (seconds)" hint="How long verified API responses are cached.">
              <Input
                type="number"
                min={60}
                value={toText(settings.github?.cacheTtlSeconds)}
                onChange={(event) => setSection('github', 'cacheTtlSeconds', Number(event.target.value))}
              />
            </Field>
          </div>
        </section>
      )}

      {tab === 'appearance' && (
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Layout className="h-3.5 w-3.5 text-[var(--accent)]" />
            <h2 className="font-display text-[13.5px] font-semibold text-fg">Appearance defaults</h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Accent colour">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ACCENTS).map(([name, hex]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSection('appearance', 'accent', name)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] capitalize transition-colors',
                      settings.appearance?.accent === name
                        ? 'border-[var(--stroke-strong)] bg-white/[0.07] text-fg'
                        : 'border-[var(--stroke)] text-muted hover:text-fg'
                    )}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
                    {name}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Default theme">
              <Select
                value={toText(settings.appearance?.defaultTheme) || 'dark'}
                onChange={(event) => setSection('appearance', 'defaultTheme', event.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </Select>
            </Field>
            <Field label="Wallpaper">
              <Select
                value={toText(settings.appearance?.wallpaper) || 'aurora'}
                onChange={(event) => setSection('appearance', 'wallpaper', event.target.value)}
              >
                {WALLPAPERS.map((wallpaper) => (
                  <option key={wallpaper} value={wallpaper}>
                    {wallpaper}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Glass opacity" hint="0.3 – 1.0">
              <Input
                type="number"
                step="0.05"
                min={0.3}
                max={1}
                value={toText(settings.appearance?.glass)}
                onChange={(event) => setSection('appearance', 'glass', Number(event.target.value))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Toggle
                checked={Boolean(settings.appearance?.reduceMotion)}
                onChange={(next) => setSection('appearance', 'reduceMotion', next)}
                label="Reduce motion by default"
                description="Disables drifting wallpapers, 3D auto-rotation and non-essential animation for visitors who prefer it."
              />
            </div>
          </div>
        </section>
      )}

      {tab === 'seo' && (
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--accent)]" />
            <h2 className="font-display text-[13.5px] font-semibold text-fg">Search & social metadata</h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Canonical URL" className="sm:col-span-2">
              <Input
                value={toText(settings.seo?.canonical)}
                onChange={(event) => setSection('seo', 'canonical', event.target.value)}
                placeholder="https://kevinthecybercoder.dev"
              />
            </Field>
            <Field label="Open Graph image" className="sm:col-span-2">
              <Input
                value={toText(settings.seo?.ogImage)}
                onChange={(event) => setSection('seo', 'ogImage', event.target.value)}
                placeholder="https://…/og.png"
              />
            </Field>
            <Field label="Twitter handle">
              <Input
                value={toText(settings.seo?.twitterHandle)}
                onChange={(event) => setSection('seo', 'twitterHandle', event.target.value)}
                placeholder="@handle"
              />
            </Field>
            <Field label="Keywords" hint="Comma separated.">
              <Input
                value={keywordsText}
                onChange={(event) =>
                  setSection(
                    'seo',
                    'keywords',
                    event.target.value
                      .split(',')
                      .map((entry) => entry.trim())
                      .filter(Boolean)
                  )
                }
              />
            </Field>
          </div>
          <div className="mt-3">
            <Alert tone="info">
              <span className="flex items-start gap-1.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The client renders canonical, Open Graph and Twitter tags from these values through Helmet. No fabricated
                structured data is generated.
              </span>
            </Alert>
          </div>
        </section>
      )}

      {tab === 'features' && (
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-[var(--accent)]" />
            <h2 className="font-display text-[13.5px] font-semibold text-fg">Feature flags</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-xl border border-[var(--stroke)] px-3 py-2.5">
                <Toggle
                  checked={settings.features?.[key] !== false}
                  onChange={(next) => setSection('features', key, next)}
                  label={label}
                  description={`Controls whether the ${label.toLowerCase()} is exposed to visitors.`}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
            <Wrench className="h-3 w-3" /> Disabling a feature hides its entry points without deleting any data.
          </p>
        </section>
      )}

      {tab === 'profile' && (
        <section className="space-y-3">
          {profileError && <Alert tone="danger">{profileError}</Alert>}

          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[var(--accent)]" />
              <h2 className="font-display text-[13.5px] font-semibold text-fg">Identity</h2>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Official name" required>
                <Input value={toText(profile.name)} onChange={(event) => setProfileField('name', event.target.value)} />
              </Field>
              <Field label="Display name" required>
                <Input
                  value={toText(profile.displayName)}
                  onChange={(event) => setProfileField('displayName', event.target.value)}
                />
              </Field>
              <Field label="Professional title" className="sm:col-span-2">
                <Input value={toText(profile.title)} onChange={(event) => setProfileField('title', event.target.value)} />
              </Field>
              <Field label="Tagline" className="sm:col-span-2">
                <Input
                  value={toText(profile.tagline)}
                  onChange={(event) => setProfileField('tagline', event.target.value)}
                />
              </Field>
              <Field label="Short bio" className="sm:col-span-2">
                <Textarea
                  value={toText(profile.shortBio)}
                  onChange={(event) => setProfileField('shortBio', event.target.value)}
                  className="min-h-[80px]"
                />
              </Field>
              <Field label="Full bio" className="sm:col-span-2">
                <Textarea
                  value={toText(profile.bio)}
                  onChange={(event) => setProfileField('bio', event.target.value)}
                  className="min-h-[160px]"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={toText(profile.email)}
                  onChange={(event) => setProfileField('email', event.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input value={toText(profile.phone)} onChange={(event) => setProfileField('phone', event.target.value)} />
              </Field>
              <Field label="Location">
                <Input
                  value={toText(profile.location)}
                  onChange={(event) => setProfileField('location', event.target.value)}
                />
              </Field>
              <Field label="Résumé URL">
                <Input
                  value={toText(profile.resumeUrl)}
                  onChange={(event) => setProfileField('resumeUrl', event.target.value)}
                />
              </Field>
              <Field label="Availability status">
                <Select
                  value={availability.status || 'available'}
                  onChange={(event) =>
                    setProfileField('availability', { ...availability, status: event.target.value })
                  }
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                </Select>
              </Field>
              <Field label="Availability label">
                <Input
                  value={toText(availability.label)}
                  onChange={(event) => setProfileField('availability', { ...availability, label: event.target.value })}
                />
              </Field>
              <Field label="Interests" hint="Comma separated." className="sm:col-span-2">
                <Input value={interests} onChange={(event) => setInterests(event.target.value)} />
              </Field>
              <Field label="Mission" className="sm:col-span-2">
                <Textarea
                  value={toText(profile.mission)}
                  onChange={(event) => setProfileField('mission', event.target.value)}
                  className="min-h-[80px]"
                />
              </Field>
              <Field label="Vision" className="sm:col-span-2">
                <Textarea
                  value={toText(profile.vision)}
                  onChange={(event) => setProfileField('vision', event.target.value)}
                  className="min-h-[80px]"
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--stroke)] p-3">
              {profile.avatar ? (
                <img
                  src={toText(profile.avatar)}
                  alt="Avatar preview"
                  className="h-14 w-14 rounded-xl border border-[var(--stroke)] object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--panel-soft)] text-muted">
                  <ImageIcon className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-medium text-fg">Avatar</p>
                <p className="truncate font-mono text-[9.5px] text-[var(--fg-faint)]">{toText(profile.avatar) || '—'}</p>
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-muted hover:text-fg">
                  {uploadingAvatar ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                  Upload avatar
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadAvatar(file)
                  }}
                />
              </label>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-[var(--accent)]" />
              <h2 className="font-display text-[13.5px] font-semibold text-fg">Structured content</h2>
              <Badge tone="default" className="ml-auto">
                JSON
              </Badge>
            </div>
            <div className="grid gap-3.5">
              {PROFILE_JSON_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <Textarea
                    value={jsonText[field.key] || ''}
                    onChange={(event) => setJsonText((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    className="min-h-[110px] font-mono text-[11px]"
                    spellCheck={false}
                  />
                </Field>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--fg-faint)]">
              <Check className="h-3 w-3 text-emerald-400" /> JSON is validated before saving; invalid input is rejected
              without touching stored data.
            </p>
          </div>
        </section>
      )}

      {tab === 'maintenance' && (
        <section className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <ServerCog className="h-3.5 w-3.5 text-[var(--accent)]" />
              <h2 className="font-display text-[13.5px] font-semibold text-fg">Maintenance mode</h2>
            </div>
            <Toggle
              checked={Boolean(settings.maintenance?.enabled)}
              onChange={(next) => setSection('maintenance', 'enabled', next)}
              label="Enable maintenance mode"
              description="Public content endpoints return a maintenance notice while the admin panel stays available."
            />
            <div className="mt-3">
              <Field label="Maintenance message">
                <Textarea
                  value={toText(settings.maintenance?.message)}
                  onChange={(event) => setSection('maintenance', 'message', event.target.value)}
                  placeholder="Scheduled maintenance — back shortly."
                />
              </Field>
            </div>
          </div>

          {settings.maintenance?.enabled && (
            <Alert tone="warning" title="Visitors will see a maintenance notice">
              Disable maintenance mode once work is complete. The admin panel and API authentication remain reachable.
            </Alert>
          )}

          <div className="glass rounded-2xl p-4">
            <h3 className="font-display text-[13px] font-semibold text-fg">Operational checklist</h3>
            <ul className="mt-2 space-y-1.5">
              {[
                'Rotate the seeded administrator password before deployment.',
                'Set MONGODB_URI for persistent storage; otherwise data is process-local.',
                'Configure SMTP for password resets, contact alerts and newsletters.',
                'Add a read-only GITHUB_TOKEN to enable live GitHub data.',
                'Keep provider API keys server-side — they are encrypted at rest.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2 border-t border-[var(--stroke)] pt-3">
        {tab === 'profile' ? (
          <Button onClick={saveProfile} loading={profileSaving} icon={<Save className="h-3.5 w-3.5" />}>
            Save profile
          </Button>
        ) : (
          <Button onClick={saveSettings} loading={saving} icon={<Save className="h-3.5 w-3.5" />}>
            Save settings
          </Button>
        )}
      </div>
    </div>
  )
}
