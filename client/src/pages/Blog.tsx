import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, Search } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { PostCard } from '../components/site/cards'
import { Button, EmptyState, FilterPills, PageHeader, SearchInput, Skeleton } from '../components/ui'
import { useDebounced, useList } from '../hooks/useContent'
import type { BlogCategory, BlogPost } from '../types'

export default function Blog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 300)

  const { data, items, loading } = useList<BlogPost>('/blog', {
    q: debounced || undefined,
    category: category === 'All' ? undefined : category,
    page,
    limit: 7,
  })
  const { items: categories } = useList<BlogCategory>('/blog-categories', { limit: 20 })

  const pills = useMemo(() => ['All', ...categories.map((c) => c.name)], [categories])
  const featured = page === 1 && !debounced && category === 'All' ? items.find((post) => post.featured) : null
  const rest = featured ? items.filter((post) => post.id !== featured.id) : items
  const pages = data?.pages || 1

  return (
    <>
      <Seo
        title="Journal"
        description="Engineering notes on architecture, applied AI, security and open-source practice by Mukeshimana Kevin."
      />
      <PageHeader
        eyebrow="Journal"
        title={
          <>
            Notes from the <span className="text-gradient">build</span>
          </>
        }
        description="Architecture decisions, failure modes and practical lessons from shipping software. No growth-hacking listicles."
      />

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Search articles…"
          className="sm:max-w-xs"
        />
        <div className="no-scrollbar flex gap-1 overflow-x-auto sm:ml-auto">
          {categories.slice(0, 4).map((cat) => (
            <span
              key={cat.id}
              className="shrink-0 rounded-full border border-[var(--stroke)] px-2 py-0.5 text-[9.5px] text-[var(--fg-faint)]"
              style={{ borderColor: `${cat.color}40`, color: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      <FilterPills
        options={pills as readonly string[]}
        value={category}
        onChange={(value) => {
          setCategory(value)
          setPage(1)
        }}
        className="mb-5"
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-56 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No articles found"
          description="Try a different search term or clear the category filter."
          action={
            <Button variant="secondary" onClick={() => { setSearch(''); setCategory('All') }}>
              Reset
            </Button>
          }
        />
      )}

      {!loading && featured && (
        <div className="mb-4">
          <PostCard post={featured} featured />
        </div>
      )}

      {!loading && rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!loading && pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Blog pages">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="px-2 font-mono text-[10.5px] text-muted">
            {page} / {pages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </nav>
      )}

      <div className="mt-8 flex items-center gap-2.5 rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] px-4 py-3">
        <PenLine className="h-4 w-4 shrink-0 text-[color-mix(in_srgb,var(--accent)_80%,white)]" />
        <p className="text-[11px] leading-relaxed text-muted">
          Articles are stored in MongoDB and managed from the admin command center — including drafts, scheduling, SEO fields
          and reading time. Nothing on this page is hardcoded.
        </p>
        <Link to="/admin" className="ml-auto hidden shrink-0 text-[10.5px] text-muted hover:text-fg sm:block">
          Manage →
        </Link>
      </div>
    </>
  )
}
