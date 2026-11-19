import { Suspense, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html, MeshDistortMaterial, OrbitControls, Stars } from '@react-three/drei'
import { DoubleSide, type Group, type Mesh } from 'three'
import {
  ArrowUpRight,
  Boxes,
  Eye,
  Info,
  Layers,
  MousePointer2,
  Orbit,
  Sparkles,
  Star,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { Badge, Button, EmptyState, Skeleton, StatCard } from '../components/ui'
import { useList } from '../hooks/useContent'
import { useUI } from '../store/ui'
import { cn, formatNumber } from '../lib/utils'
import type { Project, Skill } from '../types'

const NODE_COLORS = ['#7c5cff', '#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#60a5fa', '#a78bfa', '#f472b6']

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function Core({ reduceMotion }: { reduceMotion: boolean }) {
  const mesh = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (!mesh.current || reduceMotion) return
    mesh.current.rotation.y += delta * 0.12
    mesh.current.rotation.x += delta * 0.03
  })
  return (
    <group>
      <Float speed={reduceMotion ? 0 : 1.1} rotationIntensity={0.25} floatIntensity={0.5}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1.3, 4]} />
          <MeshDistortMaterial
            color="#7c5cff"
            emissive="#22d3ee"
            emissiveIntensity={0.18}
            roughness={0.18}
            metalness={0.75}
            distort={reduceMotion ? 0 : 0.34}
            speed={reduceMotion ? 0 : 1.4}
          />
        </mesh>
      </Float>
      <mesh scale={1.55}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.13} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={6} color="#7c5cff" distance={9} />
    </group>
  )
}

function OrbitRing({ radius, tilt }: { radius: number; tilt: number }) {
  return (
    <mesh rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <ringGeometry args={[radius - 0.006, radius + 0.006, 160]} />
      <meshBasicMaterial color="#7c5cff" transparent opacity={0.22} side={DoubleSide} />
    </mesh>
  )
}

function ProjectNode({
  project,
  index,
  total,
  onHover,
  onOpen,
}: {
  project: Project
  index: number
  total: number
  onHover: (project: Project | null) => void
  onOpen: (project: Project) => void
}) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2
  const radius = 3.15 + (index % 3) * 0.42
  const y = Math.sin(index * 1.7) * 0.85
  const color = NODE_COLORS[index % NODE_COLORS.length]
  const size = project.featured ? 0.24 : 0.17

  useFrame((state) => {
    if (!group.current) return
    const angle = baseAngle + state.clock.elapsedTime * 0.055
    group.current.position.set(
      Math.cos(angle) * radius,
      y + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.08,
      Math.sin(angle) * radius
    )
  })

  return (
    <group
      ref={group}
      position={[Math.cos(baseAngle) * radius, y, Math.sin(baseAngle) * radius]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        onHover(project)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover(null)
        document.body.style.cursor = 'auto'
      }}
      onClick={(event) => {
        event.stopPropagation()
        onOpen(project)
      }}
    >
      <mesh scale={hovered ? 1.45 : 1}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.1 : 0.45}
          roughness={0.25}
          metalness={0.5}
        />
      </mesh>
      <mesh scale={hovered ? 1.9 : 1.5}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.16 : 0.06} />
      </mesh>
      {(hovered || project.featured) && (
        <Html center distanceFactor={11} position={[0, size + 0.3, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={cn(
              'whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[9px] backdrop-blur',
              hovered
                ? 'border-white/30 bg-black/75 text-white'
                : 'border-white/10 bg-black/40 text-white/65'
            )}
          >
            {project.title}
          </div>
        </Html>
      )}
    </group>
  )
}

function SkillDust({ skills }: { skills: Skill[] }) {
  const group = useRef<Group>(null)
  const points = useMemo(
    () =>
      skills.slice(0, 46).map((skill, index) => {
        const theta = seeded(index, 1) * Math.PI * 2
        const phi = Math.acos(seeded(index, 2) * 2 - 1)
        const radius = 4.6 + seeded(index, 3) * 2.8
        return {
          id: skill.id,
          name: skill.name,
          position: [
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi) * 0.65,
            radius * Math.sin(phi) * Math.sin(theta),
          ] as [number, number, number],
        }
      }),
    [skills]
  )

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.02
  })

  return (
    <group ref={group}>
      {points.map((point, index) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.045 + seeded(index, 4) * 0.03, 8, 8]} />
          <meshBasicMaterial color={index % 4 === 0 ? '#22d3ee' : '#8b9bd6'} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}

function Scene({
  projects,
  skills,
  reduceMotion,
  onHover,
  onOpen,
}: {
  projects: Project[]
  skills: Skill[]
  reduceMotion: boolean
  onHover: (project: Project | null) => void
  onOpen: (project: Project) => void
}) {
  const shown = projects.slice(0, 14)
  return (
    <>
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', 10, 22]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 5, 6]} intensity={40} color="#22d3ee" distance={22} />
      <pointLight position={[-7, -4, -5]} intensity={30} color="#7c5cff" distance={20} />
      <Stars radius={70} depth={45} count={2600} factor={3.2} saturation={0} fade speed={reduceMotion ? 0 : 0.5} />
      <Core reduceMotion={reduceMotion} />
      <OrbitRing radius={3.15} tilt={0.18} />
      <OrbitRing radius={3.57} tilt={-0.12} />
      <OrbitRing radius={3.99} tilt={0.3} />
      <SkillDust skills={skills} />
      {shown.map((project, index) => (
        <ProjectNode
          key={project.id}
          project={project}
          index={index}
          total={shown.length}
          onHover={onHover}
          onOpen={onOpen}
        />
      ))}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={4.4}
        maxDistance={13}
        autoRotate={!reduceMotion}
        autoRotateSpeed={0.4}
      />
    </>
  )
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Universe() {
  const { items: projects, loading: projectsLoading, error } = useList<Project>('/projects', { limit: 100 })
  const { items: skills } = useList<Skill>('/skills', { limit: 200 })
  const reduceMotion = useUI((state) => state.reduceMotion)
  const [hovered, setHovered] = useState<Project | null>(null)
  const [supported] = useState(hasWebGL)
  const navigate = useNavigate()

  const featured = useMemo(() => projects.filter((project) => project.featured).length, [projects])
  const categories = useMemo(() => new Set(projects.map((project) => project.category)).size, [projects])

  return (
    <>
      <Seo
        title="3D Universe"
        description="An interactive three-dimensional map of Mukeshimana Kevin's projects and skills. Drag to orbit, scroll to zoom, select a node to open the project."
      />

      <header className="mb-5 flex flex-col gap-3 border-b border-[var(--stroke)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            3D Universe
          </div>
          <h1 className="font-display text-[clamp(1.5rem,3.2vw,2.1rem)] font-semibold leading-tight text-fg">
            The work, mapped in <span className="text-gradient">three dimensions</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            Each orbiting node is a published project pulled from the content database. Skills form the surrounding dust.
            Drag to orbit, scroll to zoom and select a node to open its case study.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">
              <Boxes className="h-2.5 w-2.5" /> React Three Fiber
            </Badge>
            <Badge tone="default">drag · zoom · select</Badge>
            {reduceMotion && <Badge tone="warning">reduced motion</Badge>}
          </div>
        </div>
        <Link to="/projects">
          <Button variant="secondary" size="sm" icon={<Layers className="h-3.5 w-3.5" />}>
            Browse as grid
          </Button>
        </Link>
      </header>

      <div className="mb-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Project nodes" value={projects.length} hint="published records" icon={<Orbit className="h-4 w-4" />} />
        <StatCard label="Featured" value={featured} hint="highlighted in the ring" icon={<Star className="h-4 w-4" />} />
        <StatCard label="Skill dust" value={skills.length} hint="catalogued skills" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Categories" value={categories} hint="project groups" icon={<Layers className="h-4 w-4" />} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <section
          className="relative h-[min(66vh,600px)] overflow-hidden rounded-2xl border border-[var(--stroke-strong)] bg-[#04050b] shadow-2xl"
          aria-label="Interactive 3D project universe"
        >
          {supported ? (
            <Canvas
              dpr={[1, 1.75]}
              camera={{ position: [0, 2.6, 7.6], fov: 52 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              onPointerMissed={() => setHovered(null)}
            >
              <Suspense fallback={null}>
                <Scene
                  projects={projects}
                  skills={skills}
                  reduceMotion={reduceMotion}
                  onHover={setHovered}
                  onOpen={(project) => navigate(`/projects/${project.slug}`)}
                />
              </Suspense>
            </Canvas>
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                icon={<Boxes className="h-5 w-5" />}
                title="WebGL is not available"
                description="This browser cannot render the 3D universe. Every project is still available in the standard grid."
                action={
                  <Link to="/projects">
                    <Button size="sm">Open project grid</Button>
                  </Link>
                }
              />
            </div>
          )}

          {supported && (
            <>
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 font-mono text-[9px] text-white/60 backdrop-blur">
                <MousePointer2 className="h-3 w-3" /> click a node to open the case study
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 font-mono text-[9px] text-white/45 backdrop-blur">
                {projects.length} nodes · {skills.length} skill particles
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 font-mono text-[9px] text-white/45 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> live scene
              </div>
            </>
          )}
        </section>

        <aside className="space-y-2.5">
          <div className="glass rounded-2xl p-3.5">
            <h2 className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
              <Eye className="h-3 w-3" /> Inspector
            </h2>
            {hovered ? (
              <div className="mt-2">
                <p className="font-display text-[13.5px] font-semibold leading-snug text-fg">{hovered.title}</p>
                <p className="mt-1 line-clamp-3 text-[10.5px] leading-relaxed text-muted">{hovered.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {hovered.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[8.5px] text-[var(--fg-faint)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[9.5px] text-[var(--fg-faint)]">
                  <span className="flex items-center gap-1">
                    <Eye className="h-2.5 w-2.5" /> {formatNumber(hovered.views || 0)}
                  </span>
                  <span className="capitalize">{hovered.stage.replace('-', ' ')}</span>
                </div>
                <Link
                  to={`/projects/${hovered.slug}`}
                  className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--stroke)] px-2.5 py-1.5 text-[10.5px] text-fg transition-colors hover:border-[var(--stroke-strong)]"
                >
                  Open case study <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-[var(--stroke)] bg-[var(--panel-soft)] p-2.5 text-[10.5px] leading-relaxed text-[var(--fg-faint)]">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Hover a node to inspect it here. Selecting it opens the full case study.
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-3.5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Orbit legend</h2>
            <div className="mt-2 space-y-1.5">
              {[
                { color: '#7c5cff', label: 'Core — the builder' },
                { color: '#22d3ee', label: 'Featured project node' },
                { color: '#8b9bd6', label: 'Skill particle' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
            <p className="mt-2 border-t border-[var(--stroke)] pt-2 text-[9px] leading-relaxed text-[var(--fg-faint)]">
              The scene is generated from database records at runtime — adding a project adds a node.
            </p>
          </div>

          <div className="glass rounded-2xl p-3.5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Featured nodes</h2>
            <div className="mt-2 space-y-1">
              {projects
                .filter((project) => project.featured)
                .slice(0, 5)
                .map((project, index) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.slug}`}
                    className="flex items-center gap-1.5 rounded px-1 py-1 text-[10.5px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[index % NODE_COLORS.length] }}
                    />
                    <span className="truncate">{project.title}</span>
                  </Link>
                ))}
              {featured === 0 && <p className="text-[10px] text-[var(--fg-faint)]">No featured projects marked yet.</p>}
            </div>
          </div>
        </aside>
      </div>

      {projectsLoading && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      )}

      {!projectsLoading && error && (
        <p className="mt-3 text-[11px] text-rose-300">
          The project feed could not be loaded ({error}). The 3D scene will populate when the API is available.
        </p>
      )}
    </>
  )
}
