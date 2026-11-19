import { useCallback, useEffect, useState } from 'react'
import { Heart, MessageSquare, Send, Star } from 'lucide-react'
import { api, apiError } from '../../lib/api'
import { toast } from '../../lib/toast'
import { Badge, Button, EmptyState, Field, Input, Textarea } from '../ui'
import { cn, formatDate, initials } from '../../lib/utils'
import type { CommentItem } from '../../types'

interface Props {
  targetType: 'project' | 'post' | 'portfolio'
  targetId: string
  targetTitle?: string
  title?: string
}

export function CommentSection({ targetType, targetId, targetTitle, title = 'Discussion' }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', content: '', rating: 5 })
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/comments', { params: { targetType, targetId } })
      setComments(data.comments || [])
      setTotal(data.total || 0)
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSending(true)
    try {
      const { data: response } = await api.post('/comments', {
        targetType,
        targetId,
        targetTitle,
        name: form.name,
        email: form.email,
        content: form.content,
        rating: form.rating,
        parentId: replyTo?.id || undefined,
      })
      setDone(true)
      setForm({ name: '', email: '', content: '', rating: 5 })
      setReplyTo(null)
      toast(response.message || 'Comment submitted for moderation')
      load()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSending(false)
    }
  }

  const like = async (comment: CommentItem) => {
    try {
      await api.post(`/comments/${comment.id}/like`)
      load()
    } catch {
      toast('Could not register that like right now', 'error')
    }
  }

  return (
    <section className="mt-10" aria-labelledby="discussion-title">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="discussion-title" className="flex items-center gap-2 font-display text-base font-semibold text-fg">
          <MessageSquare className="h-4 w-4 text-[color-mix(in_srgb,var(--accent)_80%,white)]" />
          {title}
          <span className="font-mono text-[10px] font-normal text-[var(--fg-faint)]">{total}</span>
        </h2>
        <span className="text-[10.5px] text-[var(--fg-faint)]">Moderated · no email is ever published</span>
      </div>

      <div className="space-y-2.5">
        {loading && <div className="h-20 animate-pulse rounded-xl bg-white/[0.05]" />}
        {!loading && comments.length === 0 && (
          <EmptyState
            title="No comments yet"
            description="Be the first to add a considered question or note. Comments appear after moderation."
            className="rounded-xl border border-dashed border-[var(--stroke)] py-8"
          />
        )}
        {comments.map((comment) => (
          <article key={comment.id} className="glass rounded-xl p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[9.5px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,white)]">
                {initials(comment.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-medium text-fg">{comment.name}</span>
                  <span className="text-[9.5px] text-[var(--fg-faint)]">{formatDate(comment.createdAt)}</span>
                  {comment.rating ? (
                    <span className="flex gap-0.5" aria-label={`${comment.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('h-2.5 w-2.5', i < comment.rating! ? 'fill-amber-400 text-amber-400' : 'text-white/15')} />
                      ))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--fg-muted)]">{comment.content}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => like(comment)}
                    className="flex items-center gap-1 text-[10px] text-[var(--fg-faint)] transition-colors hover:text-rose-300"
                  >
                    <Heart className="h-3 w-3" /> {comment.likes || 0}
                  </button>
                  <button
                    onClick={() => setReplyTo(comment)}
                    className="text-[10px] text-[var(--fg-faint)] transition-colors hover:text-fg"
                  >
                    Reply
                  </button>
                </div>

                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="mt-2.5 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-fg">{reply.name}</span>
                      <span className="text-[9px] text-[var(--fg-faint)]">{formatDate(reply.createdAt)}</span>
                      <Badge tone="accent" className="ml-auto text-[8.5px]">
                        reply
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted">{reply.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="glass mt-4 rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12.5px] font-semibold text-fg">
            {replyTo ? `Replying to ${replyTo.name}` : 'Join the discussion'}
          </h3>
          {replyTo && (
            <button type="button" onClick={() => setReplyTo(null)} className="text-[10.5px] text-muted hover:text-fg">
              Cancel reply
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              required
              minLength={2}
              maxLength={80}
            />
          </Field>
          <Field label="Email" hint="Private — used only for moderation, never displayed." required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </Field>
        </div>
        <Field label="Comment" className="mt-3" required>
          <Textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Share a question or a considered note…"
            required
            minLength={4}
            maxLength={2000}
            rows={3}
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] text-muted">Rating</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, rating: value })}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star className={cn('h-3.5 w-3.5', value <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-white/20')} />
              </button>
            ))}
          </div>
          <Button type="submit" size="sm" loading={sending} icon={<Send className="h-3.5 w-3.5" />}>
            Submit for moderation
          </Button>
        </div>
        {error && <p className="mt-2 text-[11px] text-rose-400">{error}</p>}
        {done && <p className="mt-2 text-[11px] text-emerald-400">Submitted — it will appear once approved.</p>}
      </form>
    </section>
  )
}
