import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, GraduationCap, Layers, Search, Sparkles } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { SkillCard } from '../components/site/cards'
import { Badge, Button, EmptyState, FilterPills, PageHeader, SearchInput, Skeleton, StatCard } from '../components/ui'
import { useDebounced, useList } from '../hooks/useContent'
import { cn } from '../lib/utils'
import type { Skill } from '../types'

const LEVELS = ['All levels', 'expert', 'advanced', 'intermediate', 'learning'] as const

const GROUPS = [
  { key: 'Languages', match: ['Programming'] },
  { key: 'Frontend', match: ['Frontend'] },
  { key: 'Backend', match: ['Backend'] },
  { key: 'Data', match: ['Databases'] },
  { key: 'Tooling', match: ['Tools'] },
  { key: 'Applied', match: ['Additional'] },
]

export default function Skills() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All levels')
  const [view, setView] = useState<'category' | 'all'>('category')
  const debounced = useDebounced(search, 280)

  const { items, loading, error, refetch } = useList<Skill>('/skills', { limit: 200 })
  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return items.filter((skill) => {
      const matchesSearch = !q || `${skill.name} ${skill.category} ${skill.description}`.toLowerCase().includes(q)
      const matchesLevel = level === 'All levels' || skill.level === level
      return matchesSearch && matchesLevel
    })
  }, [items, debounced, level])

  const categories = useMemo(() => {
    const map = new Map<string, Skill[]>()
    for (const skill of filtered) {
      const group = GROUPS.find((g) => g.match.includes(skill.category))
      const key = group?.key || skill.category
      map.set(key, [...(map.get(key) || []), skill])
    }
    return Array.from(map.entries()).sort((a, b) => {
      const order = GROUPS.map((g) => g.key)
      return order.indexOf(a[0]) - order.indexOf(b[0])
    })
  }, [filtered])

  const counts = useMemo(
    () => ({
      total: items.length,
      expert: items.filter((s) => s.level === 'expert').length,
      learning: items.filter((s) => s.learning).length,
      categories: new Set(items.map((s) => s.category)).size,
    }),
    [items]
  )

  return (
    <>
      <Seo
        title="Skills"
        description="The languages, frameworks, databases and tools Mukeshimana Kevin uses in production, with an honest proficiency scale."
      />
      <PageHeader
        eyebrow="Capabilities"
        title={
          <>
            A stack chosen for <span className="text-gradient">shipping</span>
          </>
        }
        description="Proficiency here is self-assessed and tied to shipped work, not certificate counts. Learning items are labelled honestly."
        actions={
          <Link to="/projects">
            <Button variant="secondary" icon={<Layers className="h-3.5 w-3.5" />}>
              See it applied
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracked skills" value={counts.total} hint="across the stack" icon={<Layers className="h-4 w-4" />} />
        <StatCard label="Expert" value={counts.expert} hint="daily production use" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Currently learning" value={counts.learning} hint="labelled transparently" icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="Categories" value={counts.categories} hint="from languages to applied AI" icon={<BrainCircuit className="h-4 w-4" />} />
      </div>

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search the stack…" className="sm:max-w-xs" />
        <FilterPills
          options={LEVELS}
          value={level}
          onChange={setLevel}
          className="sm:ml-auto"
        />
        <div className="flex shrink-0 gap-1 rounded-lg border border-[var(--stroke)] p-0.5">
          {(['category', 'all'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setView(option)}
              className={cn(
                'rounded-md px-2 py-1 text-[10.5px] capitalize transition-colors',
                view === option ? 'bg-[var(--accent-soft)] text-fg' : 'text-muted hover:text-fg'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nothing matches that filter"
          description="Try another term, or reset the proficiency filter."
          action={
            <Button variant="secondary" onClick={() => { setSearch(''); setLevel('All levels') }}>
              Reset filters
            </Button>
          }
        />
      )}

      {!loading && filtered.length > 0 && view === 'all' && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'category' && (
        <div className="space-y-6">
          {categories.map(([category, skills]) => (
            <section key={category}>
              <div className="mb-2.5 flex items-center gap-2">
                <h2 className="font-display text-[14px] font-semibold text-fg">{category}</h2>
                <span className="font-mono text-[9.5px] text-[var(--fg-faint)]">{skills.length}</span>
                <div className="h-px flex-1 bg-[var(--stroke)]" />
                <Badge tone="default">{skills.filter((s) => s.level === 'expert').length} expert</Badge>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-[11.5px] text-rose-200">
          {error}
          <button onClick={refetch} className="underline">
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-[14px] font-semibold text-fg">How to read the levels</h2>
          <div className="mt-2.5 space-y-2">
            {[
              ['Expert', 'Used daily in production; I can debug it under pressure and teach it.'],
              ['Advanced', 'Shipped multiple systems with it; comfortable with its sharp edges.'],
              ['Intermediate', 'Comfortable building features; still checking documentation for edge cases.'],
              ['Learning', 'Actively studying — listed so the map is honest, not padded.'],
            ].map(([label, description]) => (
              <div key={label} className="flex gap-2.5">
                <span className="w-20 shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-[var(--fg-faint)]">{label}</span>
                <p className="text-[11px] leading-relaxed text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-[14px] font-semibold text-fg">Currently going deeper</h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            Distributed systems, retrieval quality, edge computing and the security of AI-backed interfaces. The learning list
            above is public on purpose — a stack map without honest gaps is marketing.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Distributed systems', 'RAG evaluation', 'Edge compute', 'Threat modelling'].map((topic) => (
              <span key={topic} className="rounded-full border border-[var(--stroke)] px-2 py-0.5 text-[10px] text-muted">
                {topic}
              </span>
            ))}
          </div>
          <Link to="/arena-ai" className="mt-3 inline-flex items-center gap-1 text-[11px] text-[color-mix(in_srgb,var(--accent)_85%,white)] hover:underline">
            Ask ARENA AI which stack fits your project →
          </Link>
        </div>
      </div>
    </>
  )
}
