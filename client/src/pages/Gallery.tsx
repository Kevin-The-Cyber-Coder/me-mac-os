import { useMemo, useState } from 'react'
import { Image as ImageIcon, Layers, Search, Sparkles } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { GalleryGrid } from '../components/site/GalleryGrid'
import { Button, EmptyState, FilterPills, PageHeader, SearchInput, Skeleton, StatCard } from '../components/ui'
import { useDebounced, useList } from '../hooks/useContent'
import type { GalleryItem } from '../types'

export default function Gallery() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const debounced = useDebounced(search, 280)

  const { items, loading, error, refetch } = useList<GalleryItem>('/gallery', { limit: 200 })

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch =
        !q || `${item.title} ${item.category} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(q)
      const matchesCategory = category === 'All' || item.category === category
      return matchesSearch && matchesCategory
    })
  }, [items, debounced, category])

  const counts = useMemo(
    () => ({
      total: items.length,
      images: items.filter((item) => item.type !== 'video').length,
      videos: items.filter((item) => item.type === 'video').length,
      categories: new Set(items.map((item) => item.category)).size,
    }),
    [items]
  )

  return (
    <>
      <Seo
        title="Gallery"
        description="Screenshots, interface studies and product visuals from systems built by Mukeshimana Kevin."
      />
      <PageHeader
        eyebrow="Gallery"
        title={
          <>
            Visual evidence of <span className="text-gradient">shipped work</span>
          </>
        }
        description="Interface captures and product visuals stored in the content database. Every item is managed from the command center — nothing here is a decorative mockup."
        actions={
          <Button variant="secondary" onClick={refetch} icon={<Sparkles className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items" value={counts.total} hint="published visuals" icon={<ImageIcon className="h-4 w-4" />} />
        <StatCard label="Images" value={counts.images} hint="screens and studies" icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Video" value={counts.videos} hint="walkthroughs" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Collections" value={counts.categories} hint="categories" icon={<Layers className="h-4 w-4" />} />
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search the gallery…" className="sm:max-w-xs" />
        <FilterPills
          options={categories as readonly string[]}
          value={category}
          onChange={setCategory}
          className="sm:ml-auto"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-[11.5px] text-rose-200">
          {error}
          <button onClick={refetch} className="underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nothing in this collection yet"
          description="Try a different category or search term. Gallery items are added from the admin command center."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setCategory('All')
              }}
            >
              Reset filters
            </Button>
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && <GalleryGrid items={filtered} />}

      <p className="mt-6 text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
        {filtered.length} of {items.length} items · images open in an accessible lightbox
      </p>
    </>
  )
}
