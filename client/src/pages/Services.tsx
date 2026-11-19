import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Layers, Sparkles } from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { ServiceCard } from '../components/site/cards'
import { Badge, Button, Modal, PageHeader, Skeleton } from '../components/ui'
import { useList } from '../hooks/useContent'
import type { Service } from '../types'

const PROCESS = [
  { title: 'Discovery', description: 'Clarify the real constraint, users and success measure before proposing a build.' },
  { title: 'Design', description: 'Model the data, define API contracts and sketch the smallest coherent interface.' },
  { title: 'Build', description: 'Ship in vertical slices with tests, reviewable pull requests and working software each week.' },
  { title: 'Harden', description: 'Security review, performance budget, observability and documentation before handover.' },
]

export default function Services() {
  const { items, loading } = useList<Service>('/services', { limit: 50 })
  const [active, setActive] = useState<Service | null>(null)
  const navigate = useNavigate()

  return (
    <>
      <Seo
        title="Services"
        description="Full-stack development, AI integration, business systems, APIs, automation and technical consulting by Mukeshimana Kevin."
      />
      <PageHeader
        eyebrow="Services"
        title={
          <>
            Engineering help, <span className="text-gradient">without the theatre</span>
          </>
        }
        description="Engagements are scoped around a measurable outcome. You get working software, clear documentation and a system your team can maintain."
        actions={
          <Link to="/contact">
            <Button icon={<ArrowRight className="h-3.5 w-3.5" />}>Start a conversation</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-2.5 sm:grid-cols-3">
        {[
          { label: 'Typical engagement', value: '2–8 weeks', hint: 'focused scope, weekly demos' },
          { label: 'Working style', value: 'Async-first', hint: 'written updates and reviewable PRs' },
          { label: 'Handover', value: 'Always included', hint: 'docs, tests and a walkthrough' },
        ].map((item) => (
          <div key={item.label} className="glass rounded-2xl p-4">
            <p className="text-[9.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">{item.label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-fg">{item.value}</p>
            <p className="mt-0.5 text-[10.5px] text-muted">{item.hint}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={setActive} />
        ))}
      </div>

      <section className="mt-9">
        <h2 className="font-display text-lg font-semibold text-fg">How an engagement runs</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step, index) => (
            <div key={step.title} className="glass rounded-2xl p-4">
              <span className="font-mono text-[10px] text-[color-mix(in_srgb,var(--accent)_80%,white)]">0{index + 1}</span>
              <h3 className="mt-1.5 font-display text-[13px] font-semibold text-fg">{step.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-5">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-fg">Not sure which service fits?</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Describe the problem and get an honest recommendation — including “you don't need me”.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/arena-ai">
            <Button variant="secondary" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Ask ARENA AI
            </Button>
          </Link>
          <Link to="/contact">
            <Button>Describe the problem</Button>
          </Link>
        </div>
      </div>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title}
        description={active?.description}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                const service = active?.title || ''
                setActive(null)
                navigate(`/contact?service=${encodeURIComponent(service)}`)
              }}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Discuss this service
            </Button>
          </>
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="accent">
                <Layers className="h-2.5 w-2.5" /> {active.title}
              </Badge>
              {active.technologies.map((tech) => (
                <Badge key={tech} tone="default">
                  {tech}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Included</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {active.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-[11.5px] text-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Outcomes</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {active.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-1.5 text-[11.5px] text-muted">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-3">
              <p className="text-[11px] leading-relaxed text-muted">
                Scope, timeline and price are agreed in writing before work begins. No lock-in: you own the repository, the
                deployment and the documentation.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
