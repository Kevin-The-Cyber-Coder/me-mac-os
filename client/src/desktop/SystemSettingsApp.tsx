import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Accessibility,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Command,
  Cpu,
  Eye,
  Github,
  Hand,
  HardDrive,
  Image as ImageIcon,
  Info,
  Laptop,
  Layers,
  LayoutGrid,
  MemoryStick,
  Monitor,
  Moon,
  Music2,
  PanelTop,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { ACCENTS, applyTheme, cn } from '../lib/utils'
import { useDesktop, type IconSize } from '../store/desktop'
import { useOS } from '../store/os'
import { useUI, type Theme } from '../store/ui'
import { useMusic, useCurrentTrack } from '../store/music'
import { useSite } from '../store/site'
import { useAuth } from '../store/auth'
import { useNotifications } from '../store/notifications'
import { useLaunch } from './launch'
import { useWindowParam } from './window-context'
import { WALLPAPERS, getWallpaper } from './wallpapers'
import { api } from '../lib/api'

type SectionId =
  | 'appearance'
  | 'wallpaper'
  | 'dock'
  | 'desktop'
  | 'accessibility'
  | 'sound'
  | 'notifications'
  | 'network'
  | 'privacy'
  | 'gestures'
  | 'music'
  | 'ai'
  | 'github'
  | 'about'

const SECTIONS: {
  id: SectionId
  label: string
  icon: typeof Monitor
  group: string
  keywords: string
}[] = [
  { id: 'appearance', label: 'Appearance', icon: Sun, group: 'System', keywords: 'theme accent dark light motion' },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon, group: 'System', keywords: 'background desktop picture rays' },
  { id: 'dock', label: 'Dock & Menu Bar', icon: PanelTop, group: 'System', keywords: 'dock size magnification hide menu bar' },
  { id: 'desktop', label: 'Desktop & Icons', icon: Monitor, group: 'System', keywords: 'icons grid widgets focus brightness contrast' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, group: 'System', keywords: 'motion contrast size keyboard' },
  { id: 'sound', label: 'Sound', icon: Volume2, group: 'System', keywords: 'volume mute audio output' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'System', keywords: 'alerts banners focus do not disturb' },
  { id: 'network', label: 'Network', icon: Wifi, group: 'System', keywords: 'wifi internet latency connection' },
  { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck, group: 'System', keywords: 'analytics cookies local data reset' },
  { id: 'gestures', label: 'Gestures', icon: Hand, group: 'System', keywords: 'camera hand face navigation consent' },
  { id: 'music', label: 'ARENA Sound', icon: Music2, group: 'Apps', keywords: 'music synth playlist favourites' },
  { id: 'ai', label: 'ARENA AI', icon: Bot, group: 'Apps', keywords: 'assistant model provider knowledge base' },
  { id: 'github', label: 'GitHub', icon: Github, group: 'Apps', keywords: 'repositories contributions achievements' },
  { id: 'about', label: 'About This Mac', icon: Laptop, group: 'System', keywords: 'hardware memory browser version system report' },
]

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors',
        checked ? 'bg-[var(--accent)]' : 'bg-white/15',
        disabled && 'opacity-50'
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[16px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  )
}

function Slider({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  label,
  valueLabel,
  icon: Icon,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label: string
  valueLabel?: string
  icon?: typeof Sun
}) {
  return (
    <div className="flex min-w-[190px] items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--fg-faint)]" />}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent)]"
      />
      {valueLabel && <span className="w-9 text-right font-mono text-[9.5px] text-[var(--fg-faint)]">{valueLabel}</span>}
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)]">
      <div className="border-b border-[var(--stroke)] px-3.5 py-2.5">
        <h3 className="text-[12px] font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="divide-y divide-[var(--stroke)]">{children}</div>
    </section>
  )
}

function Row({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string
  description?: string
  children: ReactNode
  icon?: typeof Monitor
}) {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        {Icon && (
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.06] text-[var(--fg-muted)]">
            <Icon className="h-3 w-3" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-fg">{title}</p>
          {description && <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--fg-faint)]">{description}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">{children}</div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-[19px] font-semibold leading-tight text-fg">{title}</h2>
      <p className="mt-1 max-w-[560px] text-[11.5px] leading-relaxed text-muted">{description}</p>
    </div>
  )
}

function AppearanceSection() {
  const theme = useUI((state) => state.theme)
  const setTheme = useUI((state) => state.setTheme)
  const accent = useUI((state) => state.accent)
  const setAccent = useUI((state) => state.setAccent)
  const reduceMotion = useUI((state) => state.reduceMotion)
  const setReduceMotion = useUI((state) => state.setReduceMotion)

  const changeTheme = (next: Theme) => {
    setTheme(next)
    applyTheme(next, accent, reduceMotion)
  }

  const changeAccent = (next: string) => {
    setAccent(next)
    applyTheme(theme, next, reduceMotion)
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Appearance"
        description="Choose how ARENA OS looks. Preferences are stored in this browser and applied immediately."
      />
      <Card title="Theme" description="System follows your operating system's light or dark preference.">
        <div className="flex flex-wrap gap-2 px-3.5 py-2.5">
          {(['light', 'dark', 'system'] as Theme[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeTheme(mode)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors',
                theme === mode
                  ? 'border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--stroke)] hover:bg-white/[0.05]'
              )}
              aria-pressed={theme === mode}
            >
              <span
                className={cn(
                  'grid h-10 w-full place-items-center rounded-md border border-[var(--stroke)]',
                  mode === 'light'
                    ? 'bg-[#eef1fa] text-[#1c2440]'
                    : mode === 'dark'
                      ? 'bg-[#0a0d16] text-white'
                      : 'bg-[image:linear-gradient(90deg,#eef1fa_50%,#0a0d16_50%)] text-white'
                )}
              >
                {mode === 'light' ? <Sun className="h-4 w-4" /> : mode === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </span>
              <span className="text-[10.5px] capitalize text-fg">{mode}</span>
              {theme === mode && <Check className="h-3 w-3 text-[var(--accent)]" />}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Accent colour" description="Used for controls, selection, focus rings and highlights across the desktop.">
        <div className="flex flex-wrap gap-2 px-3.5 py-2.5">
          {Object.entries(ACCENTS).map(([name, color]) => (
            <button
              key={name}
              type="button"
              onClick={() => changeAccent(name)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] capitalize transition-colors',
                accent === name ? 'border-white/40 bg-white/[0.08] text-fg' : 'border-[var(--stroke)] text-[var(--fg-muted)] hover:bg-white/[0.05]'
              )}
              aria-pressed={accent === name}
            >
              <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ backgroundColor: color }} />
              {name}
              {accent === name && <Check className="h-2.5 w-2.5" />}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Motion">
        <Row
          title="Reduce motion"
          description="Removes window springs, dock magnification easing and background drift where possible."
          icon={Zap}
        >
          <Switch
            label="Reduce motion"
            checked={reduceMotion}
            onChange={(value) => {
              setReduceMotion(value)
              applyTheme(theme, accent, value)
            }}
          />
        </Row>
      </Card>
    </div>
  )
}

function WallpaperSection() {
  const wallpaper = useUI((state) => state.wallpaper)
  const setWallpaper = useUI((state) => state.setWallpaper)
  const current = getWallpaper(wallpaper)

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Wallpaper"
        description="Pick the desktop picture. The Rays wallpaper is the ARENA signature; every option is bundled with the site."
      />
      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
        {WALLPAPERS.map((item) => {
          const active = wallpaper === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWallpaper(item.id)}
              className={cn(
                'overflow-hidden rounded-xl border text-left transition-all',
                active
                  ? 'border-[color-mix(in_srgb,var(--accent)_70%,white)] ring-2 ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]'
                  : 'border-[var(--stroke)] hover:border-white/30'
              )}
              aria-pressed={active}
            >
              <span
                className={cn('block h-[96px] w-full bg-cover bg-center', item.className || '')}
                style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
              />
              <span className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-fg">{item.label}</span>
                  <span className="block truncate text-[9px] text-[var(--fg-faint)]">{item.description}</span>
                </span>
                {active && (
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <Card title="Current wallpaper">
        <Row title={current.label} description={current.description} icon={ImageIcon}>
          <span className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-faint)]">
            {current.image ? 'bundled image' : 'CSS gradient'}
          </span>
        </Row>
      </Card>
    </div>
  )
}

function DockSection() {
  const {
    dockSize,
    setDockSize,
    dockMagnify,
    setDockMagnify,
    dockAutohide,
    setDockAutohide,
    showIcons,
    setShowIcons,
    iconSize,
    setIconSize,
    autoArrange,
    setAutoArrange,
    arrangeIcons,
    clearIconPositions,
  } = useDesktop()

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Dock & Menu Bar"
        description="The dock magnifies based on pointer distance. Every setting here is saved for your next visit."
      />
      <Card title="Dock">
        <Row title="Size" description="Icon size from 40 to 68 pixels." icon={LayoutGrid}>
          <Slider
            value={dockSize}
            min={40}
            max={68}
            step={1}
            onChange={setDockSize}
            label="Dock size"
            valueLabel={`${dockSize}px`}
          />
        </Row>
        <Row title="Magnification" description="Enlarge nearby icons as the pointer moves across the dock.">
          <Switch label="Dock magnification" checked={dockMagnify} onChange={setDockMagnify} />
        </Row>
        <Row title="Automatically hide the dock" description="Slide the dock away until you move the pointer to the bottom edge.">
          <Switch label="Automatically hide dock" checked={dockAutohide} onChange={setDockAutohide} />
        </Row>
      </Card>

      <Card title="Desktop icons">
        <Row title="Show icons" description="Portfolio folders and app shortcuts on the desktop.">
          <Switch label="Show desktop icons" checked={showIcons} onChange={setShowIcons} />
        </Row>
        <Row title="Icon size" description="Small, medium or large labels and tiles.">
          <div className="flex overflow-hidden rounded-md border border-[var(--stroke)]">
            {(['small', 'medium', 'large'] as IconSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setIconSize(size)}
                className={cn(
                  'px-2 py-1 text-[10px] capitalize',
                  iconSize === size ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)] hover:bg-white/[0.06]'
                )}
                aria-pressed={iconSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Keep icons arranged" description="Snap icons to the right-hand grid. Turn off to keep dragged positions.">
          <Switch label="Auto arrange icons" checked={autoArrange} onChange={setAutoArrange} />
        </Row>
        <Row title="Reset layout" description="Clear saved icon positions and restore the automatic arrangement.">
          <button
            type="button"
            onClick={() => {
              clearIconPositions()
              arrangeIcons()
            }}
            className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
          >
            <RotateCcw className="h-3 w-3" /> Reset icons
          </button>
        </Row>
      </Card>
    </div>
  )
}

function DesktopSection() {
  const {
    showWidgets,
    setShowWidgets,
    focusMode,
    setFocusMode,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    showIcons,
    setShowIcons,
    iconSize,
    setIconSize,
  } = useDesktop()
  const minimizeAll = useOS((state) => state.minimizeAll)
  const closeAll = useOS((state) => state.closeAll)
  const windows = useOS((state) => state.windows)

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Desktop & Icons"
        description="Control the desktop surface, display tone and how many windows are on screen."
      />
      <Card title="Desktop">
        <Row title="Widgets" description="Clock, profile and music widgets on the left edge of the desktop.">
          <Switch label="Show widgets" checked={showWidgets} onChange={setShowWidgets} />
        </Row>
        <Row title="Show desktop icons" description="Toggle the right-hand icon column without deleting anything.">
          <Switch label="Show desktop icons" checked={showIcons} onChange={setShowIcons} />
        </Row>
        <Row title="Focus mode" description="Dims the wallpaper and hides widgets while you work.">
          <Switch label="Focus mode" checked={focusMode} onChange={setFocusMode} />
        </Row>
      </Card>

      <Card title="Display">
        <Row title="Brightness" description="A display-level dimmer rendered by the desktop." icon={Sun}>
          <Slider
            value={brightness}
            min={0.35}
            max={1.2}
            onChange={setBrightness}
            label="Brightness"
            valueLabel={`${Math.round(brightness * 100)}%`}
          />
        </Row>
        <Row title="Contrast" description="Adjusts the contrast of the desktop surface." icon={SlidersHorizontal}>
          <Slider
            value={contrast}
            min={0.8}
            max={1.3}
            onChange={setContrast}
            label="Contrast"
            valueLabel={`${Math.round(contrast * 100)}%`}
          />
        </Row>
      </Card>

      <Card title="Windows">
        <Row title="Open windows" description={`${windows.length} window${windows.length === 1 ? '' : 's'} currently open.`} icon={PanelTop}>
          <button
            type="button"
            onClick={minimizeAll}
            disabled={windows.length === 0}
            className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06] disabled:opacity-40"
          >
            Show desktop
          </button>
          <button
            type="button"
            onClick={closeAll}
            disabled={windows.length === 0}
            className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
          >
            Close all
          </button>
        </Row>
        <Row title="Icon size" description="Quick access to the desktop icon size.">
          <div className="flex overflow-hidden rounded-md border border-[var(--stroke)]">
            {(['small', 'medium', 'large'] as IconSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setIconSize(size)}
                className={cn(
                  'px-2 py-1 text-[10px] capitalize',
                  iconSize === size ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)] hover:bg-white/[0.06]'
                )}
                aria-pressed={iconSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </Row>
      </Card>
    </div>
  )
}

function AccessibilitySection() {
  const reduceMotion = useUI((state) => state.reduceMotion)
  const setReduceMotion = useUI((state) => state.setReduceMotion)
  const theme = useUI((state) => state.theme)
  const accent = useUI((state) => state.accent)
  const { contrast, setContrast, iconSize, setIconSize } = useDesktop()
  const launch = useLaunch()

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Accessibility"
        description="Preferences that make the desktop easier to read and use. They apply immediately and stay local."
      />
      <Card title="Motion & contrast">
        <Row title="Reduce motion" description="Turns off spring animation and drifting backgrounds." icon={Zap}>
          <Switch
            label="Reduce motion"
            checked={reduceMotion}
            onChange={(value) => {
              setReduceMotion(value)
              applyTheme(theme, accent, value)
            }}
          />
        </Row>
        <Row title="Contrast" description="Increases separation between panels and text." icon={SlidersHorizontal}>
          <Slider
            value={contrast}
            min={0.8}
            max={1.3}
            onChange={setContrast}
            label="Contrast"
            valueLabel={`${Math.round(contrast * 100)}%`}
          />
        </Row>
      </Card>
      <Card title="Size & navigation">
        <Row title="Desktop icon size" description="Larger tiles are easier to target on touch screens.">
          <div className="flex overflow-hidden rounded-md border border-[var(--stroke)]">
            {(['small', 'medium', 'large'] as IconSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setIconSize(size)}
                className={cn(
                  'px-2 py-1 text-[10px] capitalize',
                  iconSize === size ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)] hover:bg-white/[0.06]'
                )}
                aria-pressed={iconSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Keyboard shortcuts" description="Every window action has a shortcut. Open the reference sheet." icon={Command}>
          <button
            type="button"
            onClick={() => launch('shortcuts')}
            className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
          >
            Open <ArrowUpRight className="h-3 w-3" />
          </button>
        </Row>
      </Card>
    </div>
  )
}

function SoundSection() {
  const { volume, muted, setVolume, toggleMute, playing, toggle, next } = useMusic()
  const track = useCurrentTrack()
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const playTestTone = async () => {
    setError(null)
    setTesting(true)
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) throw new Error('This browser does not expose the Web Audio API.')
      const context = new Ctor()
      await context.resume()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 523.25
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.55)
      oscillator.onended = () => void context.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not play the test tone.')
    } finally {
      window.setTimeout(() => setTesting(false), 650)
    }
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Sound"
        description="Controls ARENA Sound playback in this browser. The operating system's hardware volume is not exposed to web apps."
      />
      <Card title="Output">
        <Row title="Output device" description="Browser default audio output." icon={Volume2}>
          <span className="rounded border border-[var(--stroke)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--fg-faint)]">
            system default
          </span>
        </Row>
        <Row title="Volume" description={muted ? 'Muted' : `${Math.round(volume * 100)}%`} icon={muted ? VolumeX : Volume2}>
          <button type="button" onClick={toggleMute} className="rounded p-1 text-[var(--fg-muted)] hover:text-fg" aria-label="Mute">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <Slider
            value={muted ? 0 : volume}
            min={0}
            max={1}
            onChange={(value) => setVolume(value)}
            label="Volume"
            valueLabel={`${Math.round((muted ? 0 : volume) * 100)}`}
          />
        </Row>
        <Row title="Test tone" description="Play a short locally-generated tone to confirm audio works." icon={Play}>
          <button
            type="button"
            onClick={() => void playTestTone()}
            disabled={testing}
            className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06] disabled:opacity-50"
          >
            {testing ? 'Playing…' : 'Play tone'}
          </button>
        </Row>
        {error && <p className="px-3.5 py-2 text-[10.5px] text-rose-300">{error}</p>}
      </Card>
      <Card title="Now playing">
        <Row title={track?.title || 'Nothing playing'} description={track ? `${track.artist} · ${track.album || 'ARENA Sound'}` : 'Open Music to start a track.'} icon={Music2}>
          <button type="button" onClick={toggle} className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]">
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={next} className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]">
            Next
          </button>
        </Row>
      </Card>
    </div>
  )
}

function NotificationsSection() {
  const {
    notificationBanners,
    setNotificationBanners,
    notificationSounds,
    setNotificationSounds,
    doNotDisturb,
    setDoNotDisturb,
  } = useDesktop()
  const toggleNotifications = useUI((state) => state.toggleNotifications)
  const unread = useNotifications((state) => state.unread)
  const admin = useAuth((state) => state.admin)

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Notifications"
        description="Notification Center shows system events from this session. Admin notifications are loaded only when signed in."
      />
      <Card title="Delivery">
        <Row title="Banners" description="Show transient alerts in the top-right corner.">
          <Switch label="Notification banners" checked={notificationBanners} onChange={setNotificationBanners} />
        </Row>
        <Row title="Sounds" description="Play a short generated chime with new alerts.">
          <Switch label="Notification sounds" checked={notificationSounds} onChange={setNotificationSounds} />
        </Row>
        <Row title="Do Not Disturb" description="Silences banners and sounds. Alerts still appear in Notification Center.">
          <Switch label="Do Not Disturb" checked={doNotDisturb} onChange={setDoNotDisturb} />
        </Row>
        <Row title="Notification Center" description={`${unread} unread · ${admin ? 'signed in as administrator' : 'visitor session'}`} icon={Bell}>
          <button
            type="button"
            onClick={() => toggleNotifications(true)}
            className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
          >
            Open
          </button>
        </Row>
      </Card>
    </div>
  )
}

function NetworkSection() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [info, setInfo] = useState<{ effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }>({})
  const [latency, setLatency] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    const connection = (navigator as unknown as {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
    }).connection
    if (connection) {
      setInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      })
    }
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  const test = async () => {
    setTesting(true)
    setError(null)
    try {
      const samples: number[] = []
      for (let index = 0; index < 3; index += 1) {
        const started = performance.now()
        const response = await fetch('/api/health', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Health endpoint returned ${response.status}.`)
        samples.push(performance.now() - started)
      }
      setLatency(Math.round(samples.reduce((total, value) => total + value, 0) / samples.length))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the API.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Network"
        description="Status is measured from the browser. Wi-Fi radio control is owned by your operating system, not by web applications."
      />
      <Card title="Connection">
        <Row title={online ? 'Connected' : 'Offline'} description={online ? 'This browser reports an active network connection.' : 'The browser reports no network connection.'} icon={online ? Wifi : WifiOff}>
          <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-400' : 'bg-rose-400')} />
        </Row>
        <Row title="Effective type" description="Reported by the Network Information API when available.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.effectiveType || 'not reported'}</span>
        </Row>
        <Row title="Downlink / RTT" description="Browser estimates; not a speed test.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">
            {info.downlink != null ? `${info.downlink} Mb/s` : '—'} / {info.rtt != null ? `${info.rtt} ms` : '—'}
          </span>
        </Row>
        <Row title="Save-Data" description="Whether the browser requested reduced data usage.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.saveData ? 'on' : 'off'}</span>
        </Row>
      </Card>
      <Card title="This session">
        <Row title="Host" description="The origin serving the portfolio.">
          <span className="max-w-[220px] truncate font-mono text-[10px] text-[var(--fg-muted)]">{window.location.host}</span>
        </Row>
        <Row title="Protocol" description="Transport used by this tab.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{window.location.protocol.replace(':', '')}</span>
        </Row>
        <Row title="API latency" description="Average of three requests to the health endpoint." icon={Zap}>
          {latency != null && <span className="font-mono text-[10px] text-emerald-300">{latency} ms</span>}
          <button
            type="button"
            onClick={() => void test()}
            disabled={testing}
            className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06] disabled:opacity-50"
          >
            {testing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {testing ? 'Testing' : 'Test'}
          </button>
        </Row>
        {error && <p className="px-3.5 py-2 text-[10.5px] text-rose-300">{error}</p>}
      </Card>
    </div>
  )
}

function PrivacySection() {
  const { analyticsOptOut, setAnalyticsOptOut, arrangeIcons, restoreIcons } = useDesktop()
  const closeAll = useOS((state) => state.closeAll)
  const admin = useAuth((state) => state.admin)
  const [visitorId, setVisitorId] = useState('')
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    try {
      setVisitorId(localStorage.getItem('kcp_visitor') || '')
    } catch {
      setVisitorId('')
    }
  }, [])

  const clearPreferences = () => {
    const confirmed = window.confirm(
      'Reset ARENA OS preferences stored in this browser? Windows, wallpaper, dock, icon layout and music favourites will return to defaults. Content in the database is not affected.'
    )
    if (!confirmed) return
    try {
      ;['kcp-ui', 'kcp-desktop', 'kcp-os', 'kcp-music'].forEach((key) => localStorage.removeItem(key))
      setCleared(true)
      window.setTimeout(() => window.location.reload(), 650)
    } catch {
      setCleared(false)
    }
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Privacy & Security"
        description="The public portfolio stores preferences locally. Content, analytics and AI conversations are handled by the MongoDB-backed API."
      />
      <Card title="Analytics">
        <Row
          title="Opt out of analytics"
          description="Stops pageview tracking from this browser. Existing aggregate data is not altered."
          icon={Eye}
        >
          <Switch label="Opt out of analytics" checked={analyticsOptOut} onChange={setAnalyticsOptOut} />
        </Row>
        <Row title="Visitor identifier" description="A pseudonymous ID used for analytics and AI conversations. It contains no personal data.">
          <span className="max-w-[220px] truncate font-mono text-[9.5px] text-[var(--fg-muted)]">{visitorId || 'not assigned yet'}</span>
        </Row>
        <Row title="Administrator session" description={admin ? `${admin.email} · ${admin.role}` : 'No administrator signed in.'} icon={ShieldCheck}>
          <button
            type="button"
            onClick={() => window.location.assign(admin ? '/admin' : '/login')}
            className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
          >
            {admin ? 'Command Center' : 'Sign in'} <ArrowUpRight className="h-3 w-3" />
          </button>
        </Row>
      </Card>
      <Card title="Local data">
        <Row title="Window layout" description="Close every open window. No content is deleted." icon={PanelTop}>
          <button type="button" onClick={closeAll} className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]">
            Close windows
          </button>
        </Row>
        <Row title="Desktop icons" description="Restore hidden icons and clear dragged positions." icon={LayoutGrid}>
          <button
            type="button"
            onClick={() => {
              restoreIcons()
              arrangeIcons()
            }}
            className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
          >
            Reset
          </button>
        </Row>
        <Row title="Reset all preferences" description="Clears wallpaper, dock, icon, window and music preferences stored in this browser." icon={Trash2}>
          <button
            type="button"
            onClick={clearPreferences}
            className="rounded-md border border-rose-500/30 px-2 py-1 text-[10.5px] text-rose-300 hover:bg-rose-500/10"
          >
            {cleared ? 'Reloading…' : 'Reset'}
          </button>
        </Row>
      </Card>
      <p className="px-1 text-[10px] leading-relaxed text-[var(--fg-faint)]">
        Camera access is only requested when you start gesture navigation, and processing happens in your browser with
        MediaPipe. Nothing is recorded or uploaded by the portfolio.
      </p>
    </div>
  )
}

function GesturesSection() {
  const gestureOpen = useUI((state) => state.gestureOpen)
  const toggleGestures = useUI((state) => state.toggleGestures)
  const fromSettings = useSite((state) => state.settings?.features?.gestures)

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Gestures"
        description="Optional camera navigation. It is never required, never starts automatically, and stops the moment you turn it off."
      />
      <Card title="Camera control">
        <Row
          title="Gesture navigation"
          description={
            gestureOpen
              ? 'Tracking is active. The camera indicator stays visible until you stop.'
              : 'Off. Start it to grant camera access for hand or head tracking.'
          }
          icon={Hand}
        >
          <button
            type="button"
            onClick={() => toggleGestures(!gestureOpen)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10.5px] font-medium',
              gestureOpen ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' : 'bg-[var(--accent)] text-white hover:brightness-110'
            )}
          >
            {gestureOpen ? 'Stop tracking' : 'Start gesture control'}
          </button>
        </Row>
        <Row title="Feature availability" description="Administrators can enable or disable this feature site-wide.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{fromSettings === false ? 'disabled by site settings' : 'available'}</span>
        </Row>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          {
            title: 'Hand tracking',
            body: 'An open palm scrolls to the top. A left or right swipe moves to the previous or next portfolio area.',
          },
          {
            title: 'Head tracking',
            body: 'Turn your head left or right and hold briefly to move between portfolio areas without using your hands.',
          },
          {
            title: 'Consent first',
            body: 'The browser asks for camera permission every session. Denying it leaves the portfolio fully usable.',
          },
          {
            title: 'Local processing',
            body: 'Frames are analysed by MediaPipe in this tab. No images are sent to the API or stored anywhere.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-[var(--stroke)] bg-[var(--panel-soft)] p-3">
            <p className="text-[11.5px] font-medium text-fg">{item.title}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MusicSection() {
  const { tracks, favorites, volume, muted, setVolume, toggleMute, playing, toggle } = useMusic()
  const launch = useLaunch()
  const track = useCurrentTrack()

  return (
    <div className="space-y-3">
      <SectionHeader
        title="ARENA Sound"
        description="Tracks come from the portfolio's music collection. Seeded pieces are synthesised locally, so no copyrighted audio is streamed."
      />
      <Card title="Playback">
        <Row title={track?.title || 'Nothing selected'} description={track ? `${track.artist} · ${track.synth?.enabled || !track.src ? 'local synth' : 'audio file'}` : 'Open Music to choose a track.'} icon={Music2}>
          <button type="button" onClick={toggle} disabled={!tracks.length} className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06] disabled:opacity-40">
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => launch('music')} className="flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-[10.5px] text-white hover:brightness-110">
            Open Music <ArrowUpRight className="h-3 w-3" />
          </button>
        </Row>
        <Row title="Volume" description={muted ? 'Muted' : `${Math.round(volume * 100)}%`}>
          <button type="button" onClick={toggleMute} className="text-[var(--fg-muted)] hover:text-fg" aria-label="Mute">
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <Slider value={muted ? 0 : volume} min={0} max={1} onChange={setVolume} label="Music volume" valueLabel={`${Math.round((muted ? 0 : volume) * 100)}`} />
        </Row>
      </Card>
      <Card title="Library">
        <Row title="Tracks" description="Published tracks available to every visitor.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{tracks.length}</span>
        </Row>
        <Row title="Favourites" description="Saved in this browser only.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{favorites.length}</span>
        </Row>
      </Card>
    </div>
  )
}

interface AIStatus {
  enabled: boolean
  mode: string
  provider: string
  model: string
  configured: boolean
  dailyLimit: number
}

function AISection() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const launch = useLaunch()

  useEffect(() => {
    let alive = true
    api
      .get('/ai/status')
      .then(({ data }) => {
        if (alive) setStatus(data.status)
      })
      .catch(() => {
        if (alive) setError('ARENA AI status could not be loaded.')
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-3">
      <SectionHeader
        title="ARENA AI"
        description="The portfolio assistant answers with a configured provider when available and falls back to a curated knowledge base."
      />
      <Card title="Assistant status">
        <Row title="Available" description="Whether the assistant accepts new messages." icon={Bot}>
          <span className={cn('flex items-center gap-1.5 text-[10.5px]', status?.enabled ? 'text-emerald-300' : 'text-[var(--fg-muted)]')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status?.enabled ? 'bg-emerald-400' : 'bg-white/30')} />
            {status ? (status.enabled ? 'online' : 'disabled') : 'loading…'}
          </span>
        </Row>
        <Row title="Mode" description="Provider mode streams from the configured model; knowledge-base mode answers from portfolio data.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{status?.mode || '—'}</span>
        </Row>
        <Row title="Model" description="Configured by the administrator; no keys are exposed to the browser.">
          <span className="max-w-[240px] truncate font-mono text-[10px] text-[var(--fg-muted)]">
            {status ? `${status.provider} · ${status.model}` : '—'}
          </span>
        </Row>
        <Row title="Daily limit" description="Messages allowed per visitor each day.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{status?.dailyLimit ?? '—'}</span>
        </Row>
        {error && <p className="px-3.5 py-2 text-[10.5px] text-rose-300">{error}</p>}
      </Card>
      <button
        type="button"
        onClick={() => launch('arena')}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[image:linear-gradient(120deg,var(--accent),#22d3ee)] py-2 text-[11.5px] font-semibold text-[#05060c] hover:brightness-110"
      >
        <Bot className="h-3.5 w-3.5" /> Open ARENA AI
      </button>
      <p className="px-1 text-[10px] leading-relaxed text-[var(--fg-faint)]">
        Conversations are tied to a pseudonymous visitor identifier and stored by the API only when you use the assistant.
      </p>
    </div>
  )
}

function GithubSection() {
  const launch = useLaunch()
  const settings = useSite((state) => state.settings)
  const username = settings?.github?.username || ''

  return (
    <div className="space-y-3">
      <SectionHeader
        title="GitHub"
        description="Repository, contribution and achievement data is fetched server-side and cached by the API. Tokens never reach the browser."
      />
      <Card title="Connection">
        <Row title="Username" description="Configured in the admin GitHub settings." icon={Github}>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{username || 'not configured publicly'}</span>
        </Row>
        <Row title="Sync" description="Administrators can force a refresh from the GitHub Command Center or admin dashboard.">
          <button
            type="button"
            onClick={() => launch('github')}
            className="flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-[10.5px] text-white hover:brightness-110"
          >
            Open center <ArrowUpRight className="h-3 w-3" />
          </button>
        </Row>
      </Card>
      <Card title="Profile links">
        <Row title="Public profile" description={username ? `github.com/${username}` : 'Set a username in admin settings to link it here.'}>
          {username ? (
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]"
            >
              Visit <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : (
            <span className="font-mono text-[10px] text-[var(--fg-faint)]">—</span>
          )}
        </Row>
      </Card>
    </div>
  )
}

function detectBrowser(ua: string) {
  if (/Edg\//.test(ua)) return 'Microsoft Edge'
  if (/OPR\//.test(ua)) return 'Opera'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Unknown browser'
}

function detectPlatform(ua: string) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10 / 11'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Android/.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS / iPadOS'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown platform'
}

function AboutSection() {
  const profile = useSite((state) => state.profile)
  const [report, setReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [storage, setStorage] = useState<string>('—')

  const info = useMemo(() => {
    const ua = navigator.userAgent
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
    return {
      browser: detectBrowser(ua),
      platform: detectPlatform(ua),
      cores: navigator.hardwareConcurrency || 0,
      memory: nav.deviceMemory || 0,
      display: `${window.screen.width} × ${window.screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine,
      connection: nav.connection?.effectiveType || 'not reported',
      host: window.location.host,
    }
  }, [])

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((estimate) => {
        if (!estimate.quota) return
        const used = estimate.usage || 0
        setStorage(`${(used / 1024 / 1024).toFixed(1)} MB of ${(estimate.quota / 1024 / 1024 / 1024).toFixed(1)} GB used`)
      })
      .catch(() => setStorage('not reported'))
  }, [])

  const systemReport = useMemo(
    () =>
      [
        'ARENA OS — System Report',
        `Generated: ${new Date().toISOString()}`,
        '',
        `Platform: ${info.platform}`,
        `Browser: ${info.browser}`,
        `Logical cores: ${info.cores || 'not reported'}`,
        `Device memory: ${info.memory ? `${info.memory} GB` : 'not reported'}`,
        `Display: ${info.display} @ ${info.pixelRatio}x (${info.colorDepth}-bit)`,
        `Language: ${info.language}`,
        `Timezone: ${info.timezone}`,
        `Network: ${info.online ? 'online' : 'offline'} · ${info.connection}`,
        `Host: ${info.host}`,
        `Storage: ${storage}`,
        `User agent: ${navigator.userAgent}`,
      ].join('\n'),
    [info, storage]
  )

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(systemReport)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setReport(systemReport)
    }
  }

  const software = [
    { label: 'ARENA OS', value: '1.0 · desktop build' },
    { label: 'Portfolio owner', value: 'Mukeshimana Kevin' },
    { label: 'Display name', value: 'Kevin The Cyber Coder' },
    { label: 'Interface', value: 'React + TypeScript' },
    { label: 'API', value: 'Node.js + MongoDB' },
  ]

  return (
    <div className="space-y-3">
      <section className="flex flex-col items-center gap-2 rounded-xl border border-[var(--stroke)] bg-[image:linear-gradient(160deg,rgba(124,92,255,0.18),rgba(34,211,238,0.08))] px-4 py-5 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] font-display text-[22px] font-bold text-[#05060c] shadow-lg">
          K
        </span>
        <div>
          <p className="font-display text-[17px] font-semibold text-fg">ARENA OS</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-faint)]">Version 1.0 · desktop build</p>
        </div>
        <p className="max-w-[420px] text-[10.5px] leading-relaxed text-muted">
          The interactive desktop for {profile?.name || 'Mukeshimana Kevin'} — built to make the whole
          portfolio explorable as applications.
        </p>
      </section>

      <Card title="Hardware">
        <Row title="Chip" description="Logical processor cores reported by the browser." icon={Cpu}>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.cores ? `${info.cores} cores` : 'not reported'}</span>
        </Row>
        <Row title="Memory" description="Device memory is a coarse browser hint, not an exact amount." icon={MemoryStick}>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.memory ? `${info.memory} GB` : 'not reported'}</span>
        </Row>
        <Row title="Display" description="CSS pixels and device pixel ratio." icon={Monitor}>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">
            {info.display} · {info.pixelRatio}x
          </span>
        </Row>
        <Row title="Storage" description="Origin storage estimate reported by the browser." icon={HardDrive}>
          <span className="max-w-[240px] truncate font-mono text-[10px] text-[var(--fg-muted)]">{storage}</span>
        </Row>
        <Row title="Power" description="Battery Status API when the browser exposes it." icon={BatteryCharging}>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">see menu bar</span>
        </Row>
      </Card>

      <Card title="Software">
        {software.map((item) => (
          <Row key={item.label} title={item.label}>
            <span className="text-right font-mono text-[10px] text-[var(--fg-muted)]">{item.value}</span>
          </Row>
        ))}
        <Row title="Platform" description="Detected from the user agent.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.platform}</span>
        </Row>
        <Row title="Browser" description="Detected from the user agent.">
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">{info.browser}</span>
        </Row>
      </Card>

      <Card title="System report">
        <Row title="Copy report" description="Copies the values above and your user agent to the clipboard. Nothing is uploaded." icon={Info}>
          <button type="button" onClick={() => void copyReport()} className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]">
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={() => window.location.reload()} className="flex items-center gap-1 rounded-md border border-[var(--stroke)] px-2 py-1 text-[10.5px] text-fg hover:bg-white/[0.06]">
            <RefreshCw className="h-3 w-3" /> Restart
          </button>
        </Row>
        {report && (
          <pre className="max-h-[150px] overflow-auto px-3.5 py-2 font-mono text-[9.5px] leading-relaxed text-[var(--fg-muted)]">
            {report}
          </pre>
        )}
      </Card>
    </div>
  )
}

const SECTION_COMPONENTS: Record<SectionId, () => JSX.Element> = {
  appearance: AppearanceSection,
  wallpaper: WallpaperSection,
  dock: DockSection,
  desktop: DesktopSection,
  accessibility: AccessibilitySection,
  sound: SoundSection,
  notifications: NotificationsSection,
  network: NetworkSection,
  privacy: PrivacySection,
  gestures: GesturesSection,
  music: MusicSection,
  ai: AISection,
  github: GithubSection,
  about: AboutSection,
}

export default function SystemSettingsApp() {
  const sectionParam = useWindowParam('section')
  const initial = (SECTIONS.some((item) => item.id === sectionParam) ? sectionParam : 'appearance') as SectionId
  const [section, setSection] = useState<SectionId>(initial)
  const [query, setQuery] = useState('')
  const launch = useLaunch()
  const theme = useUI((state) => state.theme)
  const accent = useUI((state) => state.accent)
  const reduceMotion = useUI((state) => state.reduceMotion)

  useEffect(() => {
    if (sectionParam && SECTIONS.some((item) => item.id === sectionParam)) {
      setSection(sectionParam as SectionId)
    }
  }, [sectionParam])

  useEffect(() => {
    applyTheme(theme, accent, reduceMotion)
  }, [theme, accent, reduceMotion])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(q))
  }, [query])

  const groups = useMemo(() => {
    const map = new Map<string, typeof SECTIONS>()
    filtered.forEach((item) => {
      map.set(item.group, [...(map.get(item.group) || []), item])
    })
    return Array.from(map.entries())
  }, [filtered])

  const Active = SECTION_COMPONENTS[section]

  return (
    <div className="flex h-full min-h-0 text-fg">
      <aside className="flex w-[212px] shrink-0 flex-col border-r border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel-soft)_70%,black)] max-sm:hidden">
        <div className="border-b border-[var(--stroke)] p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--fg-faint)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search settings"
              aria-label="Search settings"
              className="h-7 w-full rounded-md border border-[var(--stroke)] bg-white/[0.05] pl-6 pr-2 text-[11px] text-fg outline-none placeholder:text-[var(--fg-faint)] focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--stroke))]"
            />
          </div>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-2 pb-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">{group}</p>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2 py-[5px] text-left text-[11.5px] transition-colors',
                    section === item.id
                      ? 'bg-white/[0.12] font-medium text-fg'
                      : 'text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-fg'
                  )}
                  aria-current={section === item.id ? 'page' : undefined}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-white/[0.07]">
                    <item.icon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {section === item.id && <ChevronRight className="h-3 w-3 text-[var(--fg-faint)]" />}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-[10.5px] text-muted">No settings match “{query}”.</p>
          )}
        </div>
        <div className="border-t border-[var(--stroke)] px-3 py-2">
          <button
            type="button"
            onClick={() => launch('about')}
            className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-white/[0.05]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[image:linear-gradient(140deg,var(--accent),#22d3ee)] text-[9px] font-bold text-[#05060c]">
              K
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10.5px] font-medium text-fg">Mukeshimana Kevin</span>
              <span className="block truncate text-[8.5px] text-[var(--fg-faint)]">Kevin The Cyber Coder</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-4 py-4">
          <div className="mb-3 flex items-center gap-2 sm:hidden">
            <select
              value={section}
              onChange={(event) => setSection(event.target.value as SectionId)}
              aria-label="Settings section"
              className="h-7 flex-1 rounded-md border border-[var(--stroke)] bg-[var(--panel-strong)] px-2 text-[11px] text-fg"
            >
              {SECTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <Active />
          <p className="mt-4 border-t border-[var(--stroke)] pt-2 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
            System Settings · preferences stored locally
          </p>
        </div>
      </div>
    </div>
  )
}
