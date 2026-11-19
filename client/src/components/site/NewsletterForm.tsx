import { useState } from 'react'
import { CheckCircle2, Mail, Send } from 'lucide-react'
import { api, apiError } from '../../lib/api'
import { Button, Input } from '../ui'

export function NewsletterForm({ compact, source = 'website' }: { compact?: boolean; source?: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (!consent) {
      setError('Please confirm you want to receive the newsletter.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/newsletter/subscribe', { email, name, consent: true, source })
      setMessage(data.message || 'Subscribed!')
      setEmail('')
      setName('')
      setConsent(false)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (message) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3.5 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-[12px] font-medium text-emerald-200">{message}</p>
          <p className="mt-0.5 text-[10.5px] text-emerald-200/60">
            You can unsubscribe from any email. Your address is never sold or shared.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      {!compact && (
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-faint)]" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-9"
            required
            aria-label="Email address"
          />
        </div>
      )}
      {compact && (
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            aria-label="Email address"
          />
          <Button type="submit" size="md" loading={loading} icon={<Send className="h-3.5 w-3.5" />}>
            Join
          </Button>
        </div>
      )}
      {!compact && (
        <>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name (optional)" aria-label="First name" />
          <label className="flex items-start gap-2 text-[10.5px] leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-3 w-3 accent-[var(--accent)]"
            />
            I agree to receive occasional emails about new projects and articles. Unsubscribe anytime.
          </label>
          <Button type="submit" loading={loading} className="w-full" icon={<Send className="h-3.5 w-3.5" />}>
            Subscribe
          </Button>
        </>
      )}
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </form>
  )
}
