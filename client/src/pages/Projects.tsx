import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, FolderKanban, Search } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { ProjectCard } from '../components/site/cards'
import { Button, EmptyState, ErrorState, FilterPills, PageHeader, SearchInput, Skeleton } from '../components/ui'
import { useDebounced, useList } from '../hooks/useContent'
import type { Project } from '../types'

const SORTS = ['Featured', 'Newest', 'Oldest', 'A–Z', 'Popular'] as const
const SORT_MAP: Record<(typeof SORTS)[number], string> = {
  Featured: 'featured',
  Newest: 'newest',
  Oldest: 'oldest',
  'A–Z': 'title',
  Popular: 'popular',
}

export default function Projects() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || 'All')
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Featured')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 320)

  const { data, items, loading, error, refetch } = useList<Project>('/projects', {
    q: debounced || undefined,
    category: category === 'All' ? undefined : category,
    sort: SORT_MAP[sort],
    page,
    limit: 9,
  })

  // Fetch the unfiltered catalogue once to derive categories honestly from data.
  const { items: allProjects } = useList<Project>('/projects', { limit: 100 })
  const categories = useMemo(() => {
    const set = new Set(allProjects.map((p) => p.category).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [allProjects])

  const pages = data?.pages || 1

  return (
    <>
      <Seo
        title="Projects"
        description="Case studies of full-stack platforms, AI applications, IoT systems and automation tooling built by Mukeshimana Kevin."
      />
      <PageHeader
        eyebrow="Work"
        title={
          <>
            Things I've built, <span className="text-gradient">end to end</span>
          </>
        }
        description="Every project here ships with the real constraint, the design decision and the trade-off — not just a screenshot and a technology list."
        actions={
          <Link to="/contact">
            <Button variant="secondary">Discuss a build</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
            const next = new URLSearchParams(params)
            if (value) next.set('q', value)
            else next.delete('q')
            setParams(next, { replace: true })
          }}
          placeholder="Search projects, stacks, tags…"
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <Filter className="h-3.5 w-3.5 text-[var(--fg-faint)]" />
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {SORTS.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSort(option)
                  setPage(1)
                }}
                className={
                  sort === option
                    ? 'shrink-0 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-[10.5px] font-medium text-[color-mix(in_srgb,var(--accent)_85%,white)]'
                    : 'shrink-0 rounded-lg px-2.5 py-1 text-[10.5px] text-muted hover:bg-white/[0.05] hover:text-fg'
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FilterPills
        options={categories as readonly string[]}
        value={category}
        onChange={(value) => {
          setCategory(value)
          setPage(1)
          const next = new URLSearchParams(params)
          if (value === 'All') next.delete('category')
          else next.set('category', value)
          setParams(next, { replace: true })
        }}
        className="mb-5"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[330px]" />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="No projects match that filter"
          description="Try a broader search, or clear the category filter to see the full catalogue."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setCategory('All')
                setSort('Featured')
                setPage(1)
                setParams({}, { replace: true })
              }}
              icon={<Search className="h-3.5 w-3.5" />}
            >
              Reset filters
            </Button>
          }
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Project pages">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              {Array.from({ length: pages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  aria-current={page === index + 1 ? 'page' : undefined}
                  className={
                    page === index + 1
                      ? 'grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[11px] font-semibold text-[#05060c]'
                      : 'grid h-8 w-8 place-items-center rounded-lg text-[11px] text-muted hover:bg-white/[0.06] hover:text-fg'
                  }
                >
                  {index + 1}
                </button>
              ))}
              <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
