import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Circle,
  CornerDownLeft,
  Maximize2,
  RotateCcw,
  SquareTerminal,
  Trash2,
} from 'lucide-react'
import { Seo } from '../components/site/Seo'
import { Badge, Button } from '../components/ui'
import { api, streamChat } from '../lib/api'
import { useSite } from '../store/site'
import { useUI } from '../store/ui'
import { getVisitorId, applyTheme, cn } from '../lib/utils'
import type { BlogPost, Project, Service, Skill } from '../types'

type LineType = 'command' | 'output' | 'error' | 'success' | 'muted'

interface Line {
  id: number
  type: LineType
  text: string
}

const ASCII = String.raw`
 ██╗  ██╗███████╗██╗   ██╗██╗███╗   ██╗
 ██║ ██╔╝██╔════╝██║   ██║██║████╗  ██║
 █████╔╝ █████╗  ██║   ██║██║██╔██╗ ██║
 ██╔═██╗ ██╔══╝  ╚██╗ ██╔╝██║██║╚██╗██║
 ██║  ██╗███████╗ ╚████╔╝ ██║██║ ╚████║
 ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚═╝  ╚═══╝
`

const HELP = `Available commands
  help                 show this reference
  whoami / about       identity and current focus
  neofetch             system-style summary
  ls                   list portfolio sections
  cd <section>         change virtual directory
  open <path>          navigate to a page
  projects [filter]    list published projects
  skills [category]    list skills by category
  services             list offered services
  blog                 list published articles
  contact              contact details and availability
  socials              external profiles
  stats                published content counts
  github               live GitHub summary
  ask <question>       stream an answer from ARENA AI
  theme <dark|light>   switch appearance
  wallpaper <name>     aurora | nebula | grid | sunset
  music                toggle the music player
  resume               download the résumé
  date                 current date and time
  echo <text>          repeat text
  clear                clear the terminal
  exit                 close the session view`

const DIRECTORIES: Record<string, string[]> = {
  '~': ['about', 'projects', 'skills', 'services', 'blog', 'gallery', 'contact', 'github', 'arena-ai', 'universe'],
  '~/about': ['profile.txt', 'experience.log', 'education.log'],
  '~/projects': ['published/', 'featured/'],
  '~/skills': ['stack.txt', 'learning.txt'],
  '~/services': ['offerings.txt'],
  '~/blog': ['articles/'],
  '~/contact': ['details.txt', 'availability.txt'],
}

const COMMANDS = [
  'help',
  'whoami',
  'about',
  'neofetch',
  'ls',
  'cd',
  'open',
  'projects',
  'skills',
  'services',
  'blog',
  'contact',
  'socials',
  'stats',
  'github',
  'ask',
  'theme',
  'wallpaper',
  'music',
  'resume',
  'date',
  'echo',
  'clear',
  'exit',
]

const SUGGESTED = ['help', 'whoami', 'projects', 'neofetch', 'skills', 'ask which projects use React?']

export default function Terminal() {
  const navigate = useNavigate()
  const { profile } = useSite()
  const setTheme = useUI((state) => state.setTheme)
  const setWallpaper = useUI((state) => state.setWallpaper)
  const toggleMusic = useUI((state) => state.toggleMusic)
  const theme = useUI((state) => state.theme)
  const accent = useUI((state) => state.accent)
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('~')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<{
    projects: Project[]
    skills: Skill[]
    services: Service[]
    posts: BlogPost[]
  }>({ projects: [], skills: [], services: [], posts: [] })
  const idRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const push = useCallback((type: LineType, text: string) => {
    idRef.current += 1
    const line: Line = { id: idRef.current, type, text }
    setLines((prev) => [...prev, line])
    return line.id
  }, [])

  const boot = useCallback(() => {
    idRef.current = 0
    setLines([])
    setCwd('~')
    push('muted', ASCII.trimEnd())
    push('success', 'ARENA OS 1.0 · portfolio terminal')
    push('muted', `Signed in as ${profile?.name || 'Mukeshimana Kevin'} — read-only shell, no simulated data.`)
    push('output', 'Type "help" for commands, or "neofetch" for a summary.')
  }, [profile?.name, push])

  useEffect(() => {
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/projects', { params: { limit: 100 } }).then((r) => (r.data.items || []) as Project[]).catch(() => []),
      api.get('/skills', { params: { limit: 200 } }).then((r) => (r.data.items || []) as Skill[]).catch(() => []),
      api.get('/services', { params: { limit: 50 } }).then((r) => (r.data.items || []) as Service[]).catch(() => []),
      api.get('/blog', { params: { limit: 50 } }).then((r) => (r.data.items || []) as BlogPost[]).catch(() => []),
    ]).then(([projects, skills, services, posts]) => setData({ projects, skills, services, posts }))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const directory = useMemo(() => DIRECTORIES[cwd] || [], [cwd])

  const runAsk = async (question: string) => {
    if (!question.trim()) {
      push('error', 'Usage: ask <question>')
      return
    }
    setBusy(true)
    const lineId = push('output', '…')
    let buffer = ''
    try {
      await streamChat(
        { message: question, visitorId: getVisitorId(), history: [] },
        (event) => {
          if (event.type === 'delta' && event.content) {
            buffer += event.content
            setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, text: buffer } : line)))
          }
          if (event.type === 'notice' && event.message) {
            buffer += (buffer ? '\n\n' : '') + event.message
            setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, text: buffer } : line)))
          }
          if (event.type === 'error' && event.message) {
            buffer += (buffer ? '\n\n' : '') + event.message
            setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, text: buffer } : line)))
          }
        }
      )
      setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, type: 'output' } : line)))
    } catch {
      setLines((prev) =>
        prev.map((line) =>
          line.id === lineId ? { ...line, type: 'error', text: 'ARENA AI is unreachable. Try again in a moment.' } : line
        )
      )
    } finally {
      setBusy(false)
    }
  }

  const runCommand = async (raw: string) => {
    const command = raw.trim()
    if (!command) return
    push('command', command)
    setHistory((prev) => [command, ...prev].slice(0, 80))
    setHistoryIndex(-1)

    const [name, ...rest] = command.split(/\s+/)
    const arg = rest.join(' ').trim()
    const key = name.toLowerCase()

    switch (key) {
      case 'help':
        push('output', HELP)
        break
      case 'whoami':
      case 'about':
        push(
          'output',
          [
            `${profile?.name || 'Mukeshimana Kevin'} — ${profile?.displayName || 'Kevin The Cyber Coder'}`,
            profile?.title || 'Full-Stack Developer · Software Engineer',
            '',
            profile?.shortBio || 'Full-stack developer building modern digital experiences and intelligent applications.',
            '',
            `location   ${profile?.location || 'Remote · Worldwide'}`,
            `focus      ${(profile?.interests || []).slice(0, 5).join(', ') || 'full-stack systems, AI integration, product engineering'}`,
            `status     ${profile?.availability?.label || 'Available for select projects'}`,
          ].join('\n')
        )
        break
      case 'neofetch':
        push(
          'output',
          [
            ASCII.trimEnd(),
            '',
            `${'user'.padEnd(10)} ${profile?.displayName || 'Kevin The Cyber Coder'}`,
            `${'host'.padEnd(10)} ARENA OS 1.0 (portfolio shell)`,
            `${'role'.padEnd(10)} ${profile?.title || 'Full-Stack Developer'}`,
            `${'uptime'.padEnd(10)} ${new Date().getFullYear() - 2021}+ years building`,
            `${'shell'.padEnd(10)} zsh · read-only`,
            `${'projects'.padEnd(10)} ${data.projects.length} published`,
            `${'articles'.padEnd(10)} ${data.posts.length} published`,
            `${'skills'.padEnd(10)} ${data.skills.length} catalogued`,
            `${'theme'.padEnd(10)} ${theme}`,
          ].join('\n')
        )
        break
      case 'ls':
        push(
          'output',
          directory.length ? directory.join('   ') : 'empty directory'
        )
        break
      case 'cd': {
        if (!arg || arg === '~' || arg === '/') {
          setCwd('~')
          break
        }
        const next = arg.startsWith('~') ? arg : `~/${arg.replace(/^\.?\//, '')}`
        if (DIRECTORIES[next]) {
          setCwd(next)
        } else if (['projects', 'skills', 'services', 'blog', 'contact', 'about', 'gallery', 'github', 'arena-ai'].includes(arg)) {
          setCwd(`~/${arg}`)
        } else {
          push('error', `cd: no such directory: ${arg}`)
        }
        break
      }
      case 'open': {
        if (!arg) {
          push('error', 'Usage: open <path>  e.g. open /projects')
          break
        }
        const path = arg.startsWith('/') ? arg : `/${arg}`
        push('success', `Navigating to ${path}…`)
        navigate(path)
        break
      }
      case 'projects': {
        const filter = arg.toLowerCase()
        const matches = data.projects.filter(
          (project) =>
            !filter ||
            `${project.title} ${project.category} ${project.technologies.join(' ')} ${project.tags.join(' ')}`
              .toLowerCase()
              .includes(filter)
        )
        if (!matches.length) {
          push('muted', filter ? `No published project matches "${arg}".` : 'No published projects yet.')
          break
        }
        push(
          'output',
          matches
            .map(
              (project) =>
                `${project.featured ? '★' : '·'} ${project.title} [${project.category}]\n  ${project.summary}\n  ${project.technologies.slice(0, 5).join(' · ')} · /projects/${project.slug}`
            )
            .join('\n\n')
        )
        break
      }
      case 'skills': {
        const filter = arg.toLowerCase()
        const matches = data.skills.filter(
          (skill) => !filter || `${skill.category} ${skill.name}`.toLowerCase().includes(filter)
        )
        if (!matches.length) {
          push('muted', 'No skills match that filter.')
          break
        }
        const groups = matches.reduce<Record<string, Skill[]>>((acc, skill) => {
          acc[skill.category] = acc[skill.category] || []
          acc[skill.category].push(skill)
          return acc
        }, {})
        push(
          'output',
          Object.entries(groups)
            .map(([category, skills]) => `${category}\n  ${skills.map((skill) => `${skill.name} (${skill.level})`).join(', ')}`)
            .join('\n\n')
        )
        break
      }
      case 'services':
        push(
          'output',
          data.services.length
            ? data.services
                .map((service) => `${service.title}\n  ${service.description}\n  ${service.features.slice(0, 3).join(' · ')}`)
                .join('\n\n')
            : 'No services published.'
        )
        break
      case 'blog':
        push(
          'output',
          data.posts.length
            ? data.posts
                .map((post) => `${post.title}\n  ${post.excerpt}\n  ${post.readingTime} min · /blog/${post.slug}`)
                .join('\n\n')
            : 'No articles published.'
        )
        break
      case 'contact':
        push(
          'output',
          [
            `email     ${profile?.email || 'hello@kevinthecybercoder.dev'}`,
            profile?.phone ? `phone     ${profile.phone}` : null,
            `location  ${profile?.location || 'Remote · Worldwide'}`,
            `status    ${profile?.availability?.label || 'Available for select projects'}`,
            'command   open /contact',
          ]
            .filter(Boolean)
            .join('\n')
        )
        break
      case 'socials':
        push(
          'output',
          profile?.socials?.length
            ? profile.socials.map((social) => `${social.label.padEnd(12)} ${social.url}`).join('\n')
            : 'No social links configured.'
        )
        break
      case 'stats':
        push(
          'output',
          [
            `projects   ${data.projects.length}`,
            `skills     ${data.skills.length}`,
            `services   ${data.services.length}`,
            `articles   ${data.posts.length}`,
          ].join('\n')
        )
        break
      case 'github': {
        push('muted', 'Fetching live GitHub summary…')
        try {
          const { data: payload } = await api.get('/github/summary')
          const summary = payload.summary
          if (!summary?.ok) {
            push('error', summary?.error || 'GitHub data is not configured. No estimates are generated.')
          } else {
            push(
              'output',
              [
                `user       @${summary.username}`,
                `repos      ${summary.publicRepos}`,
                `stars      ${summary.stars}`,
                `merged PRs ${summary.mergedPRs === null ? 'requires token' : summary.mergedPRs}`,
                `activity   ${summary.recentActivity?.[0]?.title || 'no recent public events'}`,
                'command    open /github',
              ].join('\n')
            )
          }
        } catch {
          push('error', 'Could not reach the GitHub endpoint.')
        }
        break
      }
      case 'ask':
        await runAsk(arg)
        break
      case 'theme': {
        if (arg !== 'dark' && arg !== 'light') {
          push('error', 'Usage: theme <dark|light>')
          break
        }
        setTheme(arg)
        applyTheme(arg, accent, useUI.getState().reduceMotion)
        push('success', `Theme set to ${arg}.`)
        break
      }
      case 'wallpaper': {
        if (!['aurora', 'nebula', 'grid', 'sunset'].includes(arg)) {
          push('error', 'Usage: wallpaper <aurora|nebula|grid|sunset>')
          break
        }
        setWallpaper(arg)
        push('success', `Wallpaper set to ${arg}.`)
        break
      }
      case 'music':
        toggleMusic(true)
        push('success', 'Music player toggled.')
        break
      case 'resume':
        push('success', 'Opening résumé…')
        window.open(profile?.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf', '_blank', 'noopener')
        break
      case 'date':
        push('output', new Date().toString())
        break
      case 'echo':
        push('output', arg || '')
        break
      case 'clear':
        setLines([])
        break
      case 'exit':
        push('muted', 'Session is read-only. Closing the view instead.')
        navigate('/')
        break
      case 'sudo':
        push('error', 'kevin is not in the sudoers file. This incident has been reported to nobody.')
        break
      default:
        push('error', `command not found: ${name}. Type "help" for available commands.`)
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = input
    setInput('')
    void runCommand(value)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next = Math.min(history.length - 1, historyIndex + 1)
      if (history[next] !== undefined) {
        setHistoryIndex(next)
        setInput(history[next])
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = historyIndex - 1
      if (next < 0) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        setHistoryIndex(next)
        setInput(history[next] || '')
      }
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const match = COMMANDS.find((command) => command.startsWith(input.trim().split(' ')[0]) && input.trim())
      if (match) setInput(match + ' ')
    }
  }

  const color: Record<LineType, string> = {
    command: 'text-emerald-300',
    output: 'text-[#c9d4f0]',
    error: 'text-rose-300',
    success: 'text-cyan-300',
    muted: 'text-[#66708f]',
  }

  return (
    <>
      <Seo
        title="Developer Terminal"
        description="A working terminal interface over the portfolio database — inspect projects, skills, services, GitHub data and ask ARENA AI."
        noIndex
      />

      <header className="mb-5 flex flex-col gap-3 border-b border-[var(--stroke)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--accent)_75%,white)]">
            Developer Terminal
          </div>
          <h1 className="font-display text-[clamp(1.5rem,3.2vw,2.1rem)] font-semibold leading-tight text-fg">
            The portfolio, <span className="text-gradient">from the command line</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            A real shell interface over the same published records the site uses. No fake commands, no canned output — data
            comes from the API on each request.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={boot} icon={<RotateCcw className="h-3.5 w-3.5" />}>
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLines([])} icon={<Trash2 className="h-3.5 w-3.5" />}>
            Clear
          </Button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <section className="terminal-surface overflow-hidden rounded-2xl border border-[var(--stroke-strong)] shadow-2xl" aria-label="Interactive terminal">
          <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="mx-auto flex items-center gap-1.5 font-mono text-[10px] text-white/55">
              <SquareTerminal className="h-3 w-3" /> kevin@arena — zsh
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-white/35">
              <Circle className={cn('h-2 w-2', busy ? 'fill-amber-400 text-amber-400' : 'fill-emerald-400 text-emerald-400')} />
              {busy ? 'busy' : 'ready'}
            </span>
          </div>

          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="h-[min(62vh,560px)] overflow-y-auto px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] sm:px-4 sm:text-[12px]"
          >
            {lines.map((line) => (
              <div key={line.id} className={cn('whitespace-pre-wrap break-words', color[line.type])}>
                {line.type === 'command' ? (
                  <>
                    <span className="text-[#7c5cff]">kevin@arena</span>
                    <span className="text-white/40">:</span>
                    <span className="text-cyan-300">{cwd}</span>
                    <span className="text-white/40">$ </span>
                    <span className="text-white/90">{line.text}</span>
                  </>
                ) : (
                  line.text
                )}
              </div>
            ))}
            <form onSubmit={submit} className="mt-1 flex items-center gap-0">
              <span className="shrink-0">
                <span className="text-[#7c5cff]">kevin@arena</span>
                <span className="text-white/40">:</span>
                <span className="text-cyan-300">{cwd}</span>
                <span className="text-white/40">$ </span>
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                className="min-w-0 flex-1 bg-transparent text-white/90 caret-emerald-300 outline-none"
                aria-label="Terminal command input"
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
                placeholder={busy ? 'waiting for response…' : ''}
              />
              {input && <CornerDownLeft className="h-3 w-3 shrink-0 text-white/30" />}
            </form>
          </div>
        </section>

        <aside className="space-y-2.5">
          <div className="glass rounded-2xl p-3.5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Quick commands</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED.map((command) => (
                <button
                  key={command}
                  onClick={() => void runCommand(command)}
                  disabled={busy}
                  className="rounded-lg border border-[var(--stroke)] px-2 py-1 font-mono text-[10px] text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg disabled:opacity-50"
                >
                  {command}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-3.5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Session</h2>
            <dl className="mt-2 space-y-1.5 text-[10.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--fg-faint)]">user</dt>
                <dd className="truncate font-mono text-fg">{profile?.name || 'Mukeshimana Kevin'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--fg-faint)]">cwd</dt>
                <dd className="font-mono text-fg">{cwd}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--fg-faint)]">mode</dt>
                <dd className="font-mono text-emerald-300">read-only</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--fg-faint)]">history</dt>
                <dd className="font-mono text-fg">{history.length}</dd>
              </div>
            </dl>
            <div className="mt-2.5 flex flex-wrap gap-1">
              <Badge tone="success">live API</Badge>
              <Badge tone="default">↑↓ history</Badge>
              <Badge tone="default">tab complete</Badge>
            </div>
          </div>

          <div className="glass rounded-2xl p-3.5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">Keyboard</h2>
            <ul className="mt-2 space-y-1 text-[10px] text-muted">
              <li className="flex justify-between gap-2"><span>History</span><kbd className="font-mono text-[9px] text-fg">↑ / ↓</kbd></li>
              <li className="flex justify-between gap-2"><span>Complete</span><kbd className="font-mono text-[9px] text-fg">Tab</kbd></li>
              <li className="flex justify-between gap-2"><span>Run</span><kbd className="font-mono text-[9px] text-fg">Enter</kbd></li>
              <li className="flex justify-between gap-2"><span>Palette</span><kbd className="font-mono text-[9px] text-fg">Ctrl K</kbd></li>
            </ul>
          </div>

          <a
            href={profile?.resumeUrl || '/resume/Mukeshimana-Kevin-CV.pdf'}
            download
            className="flex items-center justify-between rounded-xl border border-[var(--stroke)] px-3 py-2 text-[10.5px] text-muted transition-colors hover:border-[var(--stroke-strong)] hover:text-fg"
          >
            Download résumé <ArrowUpRight className="h-3 w-3" />
          </a>
          <p className="px-1 font-mono text-[8.5px] leading-relaxed text-[var(--fg-faint)]">
            <Maximize2 className="mr-1 inline h-2.5 w-2.5" />
            Every command queries the live API. There is no hidden admin access in this shell.
          </p>
        </aside>
      </div>
    </>
  )
}
