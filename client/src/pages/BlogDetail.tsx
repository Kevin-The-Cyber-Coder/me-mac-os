import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Eye, Heart, Link2, Tag } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { CommentSection } from '../components/site/CommentSection'
import { PostCard } from '../components/site/cards'
import { Markdown } from '../components/site/Markdown'
import { Badge, Button, ErrorState, Skeleton } from '../components/ui'
import { api, apiError } from '../lib/api'
import { copyToClipboard, formatDate, formatNumber } from '../lib/utils'
import { toast } from '../lib/toast'
import { useWindowParam } from '../desktop/window-context'
import { useOS } from '../store/os'
import type { BlogPost } from '../types'

export default function BlogDetail({ windowId }: { windowId?: string }) {
  const slug = useWindowParam('slug')
  const setWindowTitle = useOS((state) => state.setWindowTitle)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    api
      .get(`/blog/${slug}`)
      .then(({ data }) => {
        if (!alive) return
        setPost(data.post)
        setRelated(data.related || [])
      })
      .catch((err) => alive && setError(apiError(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  // The URL slug only gives a readable guess; use the real title once loaded.
  useEffect(() => {
    if (windowId && post?.title) setWindowTitle(windowId, post.title)
  }, [windowId, post?.title, setWindowTitle])

  const appreciate = async () => {
    if (!post || liked) return
    try {
      const { data } = await api.post('/appreciate', { type: 'post', id: post.id })
      setPost({ ...post, likes: data.likes })
      setLiked(true)
      toast('Thanks for the appreciation')
    } catch {
      toast('Could not record that right now', 'error')
    }
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url })
        return
      } catch {}
    }
    const ok = await copyToClipboard(url)
    toast(ok ? 'Link copied to clipboard' : 'Could not copy the link', ok ? 'success' : 'error')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="py-10">
        <ErrorState message={error || 'Article not found'} onRetry={() => window.location.reload()} />
        <div className="mt-4 text-center">
          <Link to="/blog">
            <Button variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back to the journal
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo title={post.title} description={post.excerpt} image={post.coverImage} type="article" />

      <Link to="/blog" className="mb-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-fg">
        <ArrowLeft className="h-3 w-3" /> Journal
      </Link>

      <article className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{post.category}</Badge>
          {post.featured && <Badge tone="warning">Featured</Badge>}
          <span className="text-[10.5px] text-[var(--fg-faint)]">{formatDate(post.publishedAt)}</span>
        </div>

        <h1 className="mt-3 font-display text-[clamp(1.7rem,4.2vw,2.5rem)] font-semibold leading-[1.15] text-fg">{post.title}</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{post.excerpt}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--stroke)] py-2.5">
          <div className="flex items-center gap-3 text-[10.5px] text-[var(--fg-faint)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readingTime || 1} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {formatNumber(post.views)} views
            </span>
            <button onClick={appreciate} className="flex items-center gap-1 hover:text-rose-300">
              <Heart className={`h-3 w-3 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} /> {formatNumber(post.likes)}
            </button>
          </div>
          <button onClick={share} className="flex items-center gap-1 text-[10.5px] text-muted hover:text-fg">
            <Link2 className="h-3 w-3" /> Share
          </button>
        </div>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={`${post.title} cover`}
            className="mt-5 aspect-[16/8] w-full rounded-xl border border-[var(--stroke)] object-cover"
          />
        )}

        <Markdown content={post.content} className="prose-kcp mt-6" />

        {post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t border-[var(--stroke)] pt-4">
            <Tag className="h-3 w-3 text-[var(--fg-faint)]" />
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md border border-[var(--stroke)] px-1.5 py-0.5 text-[10px] text-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <CommentSection targetType="post" targetId={post.slug} targetTitle={post.title} title="Responses" />
      </article>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-fg">Keep reading</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
