import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Twitter,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { NewsletterForm } from '../components/site/NewsletterForm'
import { Badge, Button, Field, Input, Select, Textarea } from '../components/ui'
import { useSite } from '../store/site'
import { api, apiError } from '../lib/api'
import { toast } from '../lib/toast'

const SERVICE_OPTIONS = [
  'Full-Stack Development',
  'AI Integration',
  'Business Systems',
  'API Development',
  'Automation',
  'Technical Consulting',
  'Other',
]

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Github,
  Linkedin,
  Twitter,
  Mail,
}

export default function Contact() {
  const [params] = useSearchParams()
  const { profile, settings } = useSite()
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    service: '',
    message: '',
    honeypot: '',
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const service = params.get('service')
    if (!service) return
    setForm((prev) => ({
      ...prev,
      service: SERVICE_OPTIONS.includes(service) ? service : 'Other',
      subject: prev.subject || service,
    }))
  }, [params])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSending(true)
    try {
      const { data } = await api.post('/contact', form)
      setSent(true)
      toast(data.message || 'Message sent')
      setForm({ name: '', email: '', subject: '', service: '', message: '', honeypot: '' })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSending(false)
    }
  }

  const email = settings?.general?.email || profile?.email || 'hello@kevinthecybercoder.dev'
  const socials = profile?.socials || []

  return (
    <>
      <Seo
        title="Contact"
        description="Start a conversation with Mukeshimana Kevin about a full-stack build, AI integration, business system or technical consultation."
      />
      <header className="mb-8 border-b border-[var(--stroke)] pb-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
          Contact
        </div>
        <h1 className="font-display text-[clamp(1.65rem,3.6vw,2.35rem)] font-semibold leading-tight text-fg">
          Tell me the constraint you're <span className="text-gradient">stuck on</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Serious inquiries get a clear next step — not a sales deck. Share the problem, the timeline and what success looks
          like. I reply personally.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={profile?.availability?.status === 'available' ? 'success' : 'warning'}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {profile?.availability?.label || 'Available for select projects'}
          </Badge>
          <Badge tone="default">
            <MapPin className="h-2.5 w-2.5" /> {profile?.location || 'Remote · Worldwide'}
          </Badge>
          <Badge tone="default">
            <CalendarClock className="h-2.5 w-2.5" /> Replies within 1–2 business days
          </Badge>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="mb-3 font-display text-[15px] font-semibold text-fg">
            Send a message
          </h2>

          {sent ? (
            <div className="glass rounded-2xl p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-fg">Message received</h3>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">
                A confirmation has been sent to your inbox and the message is now in the admin command center. If you don't see
                it within a few minutes, check your spam folder.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => setSent(false)}>
                  Send another message
                </Button>
                <a href={`mailto:${email}`}>
                  <Button variant="ghost" icon={<Mail className="h-3.5 w-3.5" />}>
                    Email directly
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="glass rounded-2xl p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Subject" required>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What is this about?"
                    required
                    minLength={3}
                    maxLength={140}
                  />
                </Field>
                <Field label="Service" hint="Optional — helps me route the request.">
                  <Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    <option value="">Not sure yet</option>
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="Message"
                className="mt-3"
                required
                hint="Include the problem, timeline, budget range and any constraints that matter."
              >
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe the system you want to build, or the constraint you're stuck on…"
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={7}
                />
              </Field>

              <input
                type="text"
                name="honeypot"
                value={form.honeypot}
                onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--fg-faint)]">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Your email is never published or sold. Rate limited against abuse.
                </p>
                <Button type="submit" loading={sending} icon={<Send className="h-3.5 w-3.5" />}>
                  Send message
                </Button>
              </div>
              {error && <p className="mt-2 text-[11.5px] text-rose-400">{error}</p>}
            </form>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              { label: 'Typical response', value: '1–2 days', hint: 'personally written' },
              { label: 'Engagements', value: '2–8 weeks', hint: 'focused scope' },
              { label: 'Handover', value: 'Included', hint: 'docs and tests' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">{item.label}</p>
                <p className="mt-0.5 font-display text-[13.5px] font-semibold text-fg">{item.value}</p>
                <p className="text-[10px] text-muted">{item.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Direct</h2>
            <a
              href={`mailto:${email}`}
              className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--stroke)] px-3 py-2.5 text-[12px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
            >
              <Mail className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" />
              <span className="min-w-0 flex-1 truncate">{email}</span>
              <ArrowUpRight className="h-3 w-3 text-muted" />
            </a>
            {profile?.phone && (
              <p className="mt-1.5 px-1 font-mono text-[10.5px] text-muted">{profile.phone}</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 px-1 text-[10.5px] text-muted">
              <MapPin className="h-3 w-3" /> {profile?.location || 'Remote · Worldwide'}
            </p>
          </div>

          {socials.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Elsewhere</h2>
              <div className="mt-2 space-y-1">
                {socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.icon || ''] || ArrowUpRight
                  return (
                    <a
                      key={social.label}
                      href={social.url}
                      target={social.url.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="flex-1">{social.label}</span>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
              <MessageSquare className="h-3 w-3" /> Before you write
            </h2>
            <ul className="mt-2 space-y-1.5">
              {[
                'Describe the outcome, not only the technology.',
                'Mention hard constraints: deadline, budget, compliance.',
                'If you need a quote, include scope and timeline.',
                'For bug reports, link the repository and steps to reproduce.',
              ].map((tip) => (
                <li key={tip} className="flex gap-1.5 text-[11px] leading-relaxed text-muted">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">
              <Sparkles className="h-3 w-3" /> Newsletter
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Occasional build notes and new work. No noise, unsubscribe anytime.
            </p>
            <div className="mt-2.5">
              <NewsletterForm compact source="contact" />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
